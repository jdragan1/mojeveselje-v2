// Glavni Worker fajl. Rutira /api/* zahteve na logiku ispod,
// a sve ostalo prosledjuje statickim fajlovima iz /public (index.html, SPA fallback).
//
// DEO — NALOZI (registracija, prijava, Google prijava, admin panel, "moje pozivnice")
// je dokumentovan detaljno u UPUTSTVO.md (Deo 6). Ukratko:
//  - Lozinke se cuvaju kao PBKDF2 hash (nikad u citljivom obliku).
//  - Sesija je httpOnly kolacic koji upucuje na zapis u KV (session:<token>).
//  - Prva osoba koja se registruje/prijavi sa email adresom koja se poklapa sa
//    Worker "secret"-om ADMIN_EMAIL automatski dobija ulogu administratora.
//  - Google prijava zahteva GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET (Worker secrets) —
//    bez njih dugme "Prijavi se preko Google-a" prikazuje jasnu gresku, ostatak sajta radi normalno.

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function json(obj, status, extraHeaders) {
  const headers = Object.assign({ 'content-type': 'application/json' }, extraHeaders || {});
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}

function genId(n) {
  n = n || 8;
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < n; i++) s += chars[arr[i] % chars.length];
  return s;
}

/* ============================================================ NALOZI — kriptografija i sesije ============================================================ */

// PBKDF2 iteracije za heširanje lozinki. Ovo je namerno niže od "idealnog" broja
// (npr. OWASP danas preporučuje 600.000+ za PBKDF2-SHA256) zato što Cloudflare
// Workers na BESPLATNOM planu dozvoljava samo ~10ms CPU vremena po zahtevu —
// 100.000 iteracija zna da potraje 50-60ms i Worker biva NASILNO prekinut usred
// rada (bez ijedne greške u logu, samo prazan odgovor — otud "Unexpected end of
// JSON input" na frontend-u). 8.000 iteracija traje ~5ms, sa dosta rezerve za
// ostatak obrade. Ako pređeš na Workers Paid plan (30s CPU budžet, $5/mesec),
// slobodno podigni ovaj broj za jače heširanje — vrednosti do 100.000+ su tada bezbedne.
const PBKDF2_ITERATIONS = 8000;

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}
async function hashPassword(password, existingSaltHex) {
  const enc = new TextEncoder();
  const salt = existingSaltHex ? hexToBytes(existingSaltHex) : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = existingSaltHex || bufToHex(salt);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, 256);
  return { hash: bufToHex(bits), salt: saltHex };
}
async function verifyPassword(password, saltHex, hashHex) {
  if (!saltHex || !hashHex) return false;
  const { hash } = await hashPassword(password, saltHex);
  return hash === hashHex;
}
function genSessionToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return bufToHex(arr);
}
function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}
function sessionCookieHeader(token, maxAgeSec) {
  return 'session=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + maxAgeSec;
}
function clearCookieHeader() {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
// GOST ID (gid): resava fundamentalni problem — bez naloga, server nema NACINA da zna
// "ovi ID-jevi pripadaju ovom posetiocu" osim ako mu MI to ne obezbedimo. localStorage
// sam po sebi NIJE dovoljno pouzdan (Safari ITP ga brise posle ~7 dana, "obrisi podatke
// o pregledanju" ga takodje brise). Zato server, PRI PRVOM POSETU, sam postavlja
// dugovecni kolacic (400 dana — maksimum koji Chrome/Safari dozvoljavaju za Set-Cookie)
// i pamti koje je pozivnice taj gid napravio, potpuno nezavisno od localStorage-a.
// Nije HttpOnly namerno — ako je server ikad nedostupan a treba dijagnostika, korisnik
// (ili mi) mozemo procitati vrednost iz DevTools; ne sadrzi nikakvu osetljivu informaciju,
// samo je slucajan identifikator.
const GUEST_ID_TTL = 60 * 60 * 24 * 400;
function guestCookieHeader(gid) {
  return 'gid=' + gid + '; Path=/; Secure; SameSite=Lax; Max-Age=' + GUEST_ID_TTL;
}
function getOrCreateGuestId(request) {
  const existing = getCookie(request, 'gid');
  if (existing) return { guestId: existing, isNew: false };
  return { guestId: genId(24), isNew: true };
}
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 dana

async function createSession(env, email, role) {
  const token = genSessionToken();
  await env.INVITES.put('session:' + token, JSON.stringify({ email, role, createdAt: Date.now() }), { expirationTtl: SESSION_TTL });
  return token;
}
async function getSession(request, env) {
  if (!env.INVITES) return null;
  const token = getCookie(request, 'session');
  if (!token) return null;
  const raw = await env.INVITES.get('session:' + token);
  if (!raw) return null;
  try { return Object.assign({ token }, JSON.parse(raw)); } catch (e) { return null; }
}
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ''); }
function isConfiguredAdmin(env, email) {
  return !!(env.ADMIN_EMAIL && email && email === env.ADMIN_EMAIL.trim().toLowerCase());
}

/* ============================================================ RATE LIMITING (brute-force zastita) ============================================================
   Fiksni vremenski prozor (fixed window) po IP adresi + naziv "kante" (bucket).
   Nema potrebu za dodatnom KV bazom — koristi istu env.INVITES bazu, sa kratkim TTL-om,
   tako da se stari zapisi sami brisu i ne gomilaju. Namerno jednostavno (fail-open ako
   KV nije dostupan) — svrha je da uspori/onemoguci masovno pogadjanje lozinki/kodova
   sa jedne IP adrese, ne da bude nepogresiv anti-bot sistem. */
function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}
async function checkRateLimit(env, bucket, request, maxAttempts, windowSec) {
  if (!env.INVITES) return { limited: false }; // fail-open — ne blokiramo funkcionalnost zbog KV-a
  const ip = getClientIp(request);
  const key = 'ratelimit:' + bucket + ':' + ip;
  let count = 0;
  try {
    const raw = await env.INVITES.get(key);
    count = raw ? (parseInt(raw, 10) || 0) : 0;
  } catch (e) { return { limited: false }; }
  if (count >= maxAttempts) return { limited: true };
  try { await env.INVITES.put(key, String(count + 1), { expirationTtl: windowSec }); } catch (e) {}
  return { limited: false };
}
function rateLimitResponse() {
  return json({ error: 'Previše pokušaja u kratkom periodu. Sačekajte par minuta i pokušajte ponovo.' }, 429);
}

/* ============================================================ NALOZI — registracija / prijava / odjava / "ko sam ja" ============================================================ */

async function handleRegister(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const rl = await checkRateLimit(env, 'register', request, 6, 600);
  if (rl.limited) return rateLimitResponse();
  let body; try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!validEmail(email)) return json({ error: 'Unesite ispravnu email adresu.' }, 400);
  if (password.length < 6) return json({ error: 'Lozinka mora imati bar 6 karaktera.' }, 400);
  const existing = await env.INVITES.get('user:' + email);
  if (existing) return json({ error: 'Nalog sa ovim emailom već postoji — prijavite se.' }, 409);
  const { hash, salt } = await hashPassword(password);
  const role = isConfiguredAdmin(env, email) ? 'admin' : 'user';
  const user = { email, passwordHash: hash, salt, role, createdAt: Date.now(), provider: 'password' };
  await env.INVITES.put('user:' + email, JSON.stringify(user));
  const token = await createSession(env, email, role);
  return json({ ok: true, email, role }, 200, { 'Set-Cookie': sessionCookieHeader(token, SESSION_TTL) });
}

async function handleLogin(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const rl = await checkRateLimit(env, 'login', request, 8, 300);
  if (rl.limited) return rateLimitResponse();
  let body; try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const raw = await env.INVITES.get('user:' + email);
  if (!raw) return json({ error: 'Pogrešan email ili lozinka.' }, 401);
  const user = JSON.parse(raw);
  if (!user.passwordHash) return json({ error: 'Ovaj nalog je napravljen preko Google prijave. Koristite dugme "Prijavi se preko Google-a".' }, 400);
  const ok = await verifyPassword(password, user.salt, user.passwordHash);
  if (!ok) return json({ error: 'Pogrešan email ili lozinka.' }, 401);
  if (isConfiguredAdmin(env, email) && user.role !== 'admin') {
    user.role = 'admin';
    await env.INVITES.put('user:' + email, JSON.stringify(user));
  }
  const token = await createSession(env, email, user.role);
  return json({ ok: true, email, role: user.role }, 200, { 'Set-Cookie': sessionCookieHeader(token, SESSION_TTL) });
}

async function handleLogout(request, env) {
  const token = getCookie(request, 'session');
  if (token && env.INVITES) await env.INVITES.delete('session:' + token);
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookieHeader() });
}

async function handleMe(request, env) {
  const session = await getSession(request, env);
  if (!session) return json({ loggedIn: false });
  return json({ loggedIn: true, email: session.email, role: session.role });
}

/* ============================================================ NALOZI — prijava preko Google-a (OAuth 2.0) ============================================================
   Zahteva Worker secrets GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET — postavlja se u
   Google Cloud Console (OAuth Client ID, tip "Web application"). Tacan postupak je
   u UPUTSTVO.md, Deo 6. Redirect URI koji treba upisati u Google Cloud Console je:
   https://VAS-DOMEN/api/auth/google/callback (racuna se automatski iz stvarnog domena). */

async function handleGoogleStart(request, env) {
  if (!env.INVITES) return new Response('KV baza nije povezana.', { status: 500 });
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response('Prijava preko Google-a još nije podešena na serveru (nedostaje GOOGLE_CLIENT_ID). Pogledajte UPUTSTVO.md, Deo 6.', { status: 500 });
  }
  const url = new URL(request.url);
  const redirectUri = url.origin + '/api/auth/google/callback';
  const state = genSessionToken();
  await env.INVITES.put('oauth-state:' + state, '1', { expirationTtl: 600 });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  return Response.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString(), 302);
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  if (!env.INVITES) return new Response('KV baza nije povezana.', { status: 500 });
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errParam = url.searchParams.get('error');
  if (errParam) return Response.redirect(url.origin + '/?prijava=otkazana', 302);
  if (!code || !state) return new Response('Nedostaju parametri iz Google odgovora.', { status: 400 });
  const stateOk = await env.INVITES.get('oauth-state:' + state);
  if (!stateOk) return new Response('Zahtev je istekao ili je nevažeći, pokušajte prijavu ponovo.', { status: 400 });
  await env.INVITES.delete('oauth-state:' + state);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response('Prijava preko Google-a nije podešena na serveru.', { status: 500 });
  }
  const redirectUri = url.origin + '/api/auth/google/callback';
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri, grant_type: 'authorization_code'
    })
  });
  if (!tokenResp.ok) return new Response('Google prijava nije uspela (razmena koda za token).', { status: 400 });
  const tokenData = await tokenResp.json();
  const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: 'Bearer ' + tokenData.access_token }
  });
  if (!userResp.ok) return new Response('Google prijava nije uspela (učitavanje profila).', { status: 400 });
  const profile = await userResp.json();
  const email = (profile.email || '').trim().toLowerCase();
  if (!email) return new Response('Vaš Google nalog nema dostupan email.', { status: 400 });

  const raw = await env.INVITES.get('user:' + email);
  let user;
  const shouldBeAdmin = isConfiguredAdmin(env, email);
  if (raw) {
    user = JSON.parse(raw);
    if (shouldBeAdmin) user.role = 'admin';
    user.googleId = profile.sub;
    user.provider = user.provider || 'google';
  } else {
    user = { email, role: shouldBeAdmin ? 'admin' : 'user', createdAt: Date.now(), provider: 'google', googleId: profile.sub };
  }
  await env.INVITES.put('user:' + email, JSON.stringify(user));
  const token = await createSession(env, email, user.role);
  return new Response(null, {
    status: 302,
    headers: { 'Location': url.origin + '/?prijavljen=1', 'Set-Cookie': sessionCookieHeader(token, SESSION_TTL) }
  });
}

/* ============================================================ POZIVNICE — indeks po korisniku (za "Moje pozivnice") ============================================================ */

async function addToUserIndex(env, email, id) {
  const key = 'user-invites:' + email;
  const raw = await env.INVITES.get(key);
  let list = [];
  try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
  if (!list.includes(id)) list.push(id);
  await env.INVITES.put(key, JSON.stringify(list));
}
async function removeFromUserIndex(env, email, id) {
  const key = 'user-invites:' + email;
  const raw = await env.INVITES.get(key);
  if (!raw) return;
  let list = [];
  try { list = JSON.parse(raw); } catch (e) { return; }
  list = list.filter(x => x !== id);
  await env.INVITES.put(key, JSON.stringify(list));
}
async function addToGuestIndex(env, guestId, id) {
  const key = 'guest-invites:' + guestId;
  const raw = await env.INVITES.get(key);
  let list = [];
  try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
  if (!list.includes(id)) list.push(id);
  await env.INVITES.put(key, JSON.stringify(list));
}
async function removeFromGuestIndex(env, guestId, id) {
  const key = 'guest-invites:' + guestId;
  const raw = await env.INVITES.get(key);
  if (!raw) return;
  let list = [];
  try { list = JSON.parse(raw); } catch (e) { return; }
  list = list.filter(x => x !== id);
  await env.INVITES.put(key, JSON.stringify(list));
}

async function handleInvitePost(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana. Pogledaj UPUTSTVO.md.' }, 500);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 6000000) return json({ error: 'Pozivnica je prevelika (preko 6 MB). Smanjite broj fotografija (galerija, osobe, prica) ili koristite link ka pesmi umesto MP3 upload-a.' }, 413);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const session = await getSession(request, env);
  const { guestId, isNew: isNewGuestId } = getOrCreateGuestId(request);
  const id = genId(8);
  const hostToken = genId(10);
  const invite = Object.assign({}, body, {
    hostToken, active: !!body.active, createdAt: Date.now(),
    ownerEmail: session ? session.email : null,
    // Cuvamo i gid vlasnistva za neprijavljene korisnike — isti princip kao ownerEmail,
    // omogucava da server kasnije zna cija je ovo pozivnica bez oslanjanja na localStorage.
    ownerGuestId: session ? null : guestId
  });
  await env.INVITES.put('invite:' + id, JSON.stringify(invite));

  // OBAVEZNA PROVERA UPISA: procitamo nazad ono sto smo upravo upisali. Ako iz bilo kog
  // razloga upis nije stigao do baze (retko, ali moguce kod privremenih problema sa KV),
  // NE prijavljujemo korisniku "uspesno napravljeno" — to bi ga lagalo da je link
  // sacuvan kad zapravo nije. Umesto toga vracamo jasnu gresku da moze da pokusa ponovo.
  const verify = await env.INVITES.get('invite:' + id);
  if (!verify) {
    return json({ error: 'Čuvanje na serveru nije uspelo (privremen problem sa bazom). Ništa nije izgubljeno — pokušajte ponovo za par sekundi.' }, 503);
  }

  if (session) {
    await addToUserIndex(env, session.email, id);
  } else {
    await addToGuestIndex(env, guestId, id);
  }
  // Provera da je zaista dodato u indeks (ne samo da je poziv "prosao") — ako ovo
  // ne uspe, pozivnica i dalje postoji (gore proverено) i domacin i dalje ima linkove
  // sa ekrana, samo nece odmah biti u "Moje pozivnice" — zato javljamo upozorenje,
  // ne potpunu gresku (link i dalje radi).
  const indexKey = session ? ('user-invites:' + session.email) : ('guest-invites:' + guestId);
  const indexRaw = await env.INVITES.get(indexKey);
  const indexOk = !!(indexRaw && JSON.parse(indexRaw).includes(id));

  const origin = new URL(request.url).origin;
  const respBody = {
    id, hostToken, active: invite.active,
    guestUrl: origin + '/' + id + '/',
    hostUrl: origin + '/' + id + '/' + hostToken + '/',
    indexed: indexOk
  };
  const headers = {};
  if (isNewGuestId) headers['Set-Cookie'] = guestCookieHeader(guestId);
  return json(respBody, 200, headers);
}

async function handleInvitePut(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 6000000) return json({ error: 'Pozivnica je prevelika (preko 6 MB). Smanjite broj fotografija (galerija, osobe, prica) ili koristite link ka pesmi umesto MP3 upload-a.' }, 413);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const id = body.id;
  if (!id) return json({ error: 'Nedostaje id pozivnice.' }, 400);
  const raw = await env.INVITES.get('invite:' + id);
  if (!raw) return json({ error: 'Pozivnica ne postoji.' }, 404);
  const existing = JSON.parse(raw);
  const session = await getSession(request, env);
  const isOwner = !!(session && existing.ownerEmail && session.email === existing.ownerEmail);
  const isAdmin = !!(session && session.role === 'admin');
  const isHostToken = !!(body.hostToken && body.hostToken === existing.hostToken);
  if (!isOwner && !isAdmin && !isHostToken) return json({ error: 'Nemate dozvolu da izmenite ovu pozivnicu.' }, 403);
  const updated = Object.assign({}, existing, body, {
    hostToken: existing.hostToken,
    ownerEmail: existing.ownerEmail,
    active: existing.active,
    createdAt: existing.createdAt,
    updatedAt: Date.now()
  });
  await env.INVITES.put('invite:' + id, JSON.stringify(updated));
  return json({ ok: true, id, hostToken: existing.hostToken });
}

async function handleInviteDelete(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const hostParam = url.searchParams.get('host');
  if (!id) return json({ error: 'Nedostaje id.' }, 400);
  const raw = await env.INVITES.get('invite:' + id);
  if (!raw) return json({ error: 'Pozivnica ne postoji ili je već obrisana.' }, 404);
  const invite = JSON.parse(raw);
  const session = await getSession(request, env);
  const isOwner = !!(session && invite.ownerEmail && session.email === invite.ownerEmail);
  const isAdmin = !!(session && session.role === 'admin');
  // Neprijavljeni korisnici (ownerEmail je null) dokazuju vlasnistvo tajnim
  // hostToken-om iz svog linka za domacina — isti princip kao kod izmene (PUT).
  const isHostToken = !!(hostParam && hostParam === invite.hostToken);
  if (!isOwner && !isAdmin && !isHostToken) return json({ error: 'Nemate dozvolu da obrišete ovu pozivnicu.' }, 403);
  await env.INVITES.delete('invite:' + id);
  await env.INVITES.delete('views:' + id);
  const list = await env.INVITES.list({ prefix: 'rsvp:' + id + ':' });
  for (const k of list.keys) await env.INVITES.delete(k.name);
  if (invite.ownerEmail) await removeFromUserIndex(env, invite.ownerEmail, id);
  if (invite.ownerGuestId) await removeFromGuestIndex(env, invite.ownerGuestId, id);
  return json({ ok: true });
}

async function countRsvps(env, id) {
  try {
    const list = await env.INVITES.list({ prefix: 'rsvp:' + id + ':' });
    let responses = list.keys.length;
    let confirmedGuests = 0;
    // Ogranicavamo detaljno prebrojavanje na razuman broj da ne pravimo stotine
    // KV citanja za jednu pozivnicu sa hiljadama odgovora (nerealno za ovu vrstu sajta,
    // ali cuvamo se za svaki slucaj).
    const toRead = list.keys.slice(0, 300);
    for (const k of toRead) {
      try {
        const raw = await env.INVITES.get(k.name);
        const r = JSON.parse(raw);
        if (String(r.dolazak || '').startsWith('Da')) confirmedGuests += (r.brojOsoba || 1);
      } catch (e) { /* preskoci ostecen zapis */ }
    }
    return { responses, confirmedGuests };
  } catch (e) {
    return { responses: 0, confirmedGuests: 0 };
  }
}

async function handleMyInvites(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const session = await getSession(request, env);
  const { guestId, isNew: isNewGuestId } = getOrCreateGuestId(request);
  const indexKey = session ? ('user-invites:' + session.email) : ('guest-invites:' + guestId);
  const raw = await env.INVITES.get(indexKey);
  let ids = [];
  try { ids = raw ? JSON.parse(raw) : []; } catch (e) { ids = []; }
  const origin = new URL(request.url).origin;
  const items = [];
  for (const id of ids) {
    const inviteRaw = await env.INVITES.get('invite:' + id);
    if (!inviteRaw) continue;
    const invite = JSON.parse(inviteRaw);
    const views = parseInt(await env.INVITES.get('views:' + id), 10) || 0;
    const { responses, confirmedGuests } = await countRsvps(env, id);
    items.push({
      id, title: invite.title || '(bez naslova)', template: invite.tpl, tpl: invite.tpl, style: invite.style,
      active: !!invite.active, hostToken: invite.hostToken,
      guestUrl: origin + '/' + id + '/',
      hostUrl: origin + '/' + id + '/' + invite.hostToken + '/',
      createdAt: invite.createdAt || 0, updatedAt: invite.updatedAt || 0,
      hasCover: !!(invite.cover && invite.cover.startsWith('data:')),
      thumbnail: (invite.cover && invite.cover.startsWith('data:')) ? invite.cover
        : ((invite.canva && invite.canva.image && invite.canva.image.startsWith('data:')) ? invite.canva.image : null),
      isCanva: !!(invite.canva && invite.canva.enabled),
      owner: session ? session.email : null,
      views, rsvpResponses: responses, confirmedGuests
    });
  }
  items.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  const headers = {};
  if (!session && isNewGuestId) headers['Set-Cookie'] = guestCookieHeader(guestId);
  return json({ items }, 200, headers);
}

/* ============================================================ ADMIN — teme i cene ============================================================ */

async function requireAdmin(request, env) {
  const session = await getSession(request, env);
  if (!session || session.role !== 'admin') return null;
  return session;
}

async function handleAdminThemesGet(env) {
  if (!env.INVITES) return json({ themes: [] });
  const raw = await env.INVITES.get('admin-themes');
  let themes = [];
  try { themes = raw ? JSON.parse(raw) : []; } catch (e) { themes = []; }
  return json({ themes });
}

async function handleAdminThemesPost(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Samo administrator može dodavati teme.' }, 403);
  let body; try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  if (!body.id || !body.label || !body.tpl || !body.css) return json({ error: 'Nedostaju obavezni podaci o temi (id, naziv, kategorija, CSS).' }, 400);
  const raw = await env.INVITES.get('admin-themes');
  let themes = [];
  try { themes = raw ? JSON.parse(raw) : []; } catch (e) { themes = []; }
  themes = themes.filter(t => t.id !== body.id);
  themes.push({
    id: String(body.id).slice(0, 40), tpl: body.tpl, label: String(body.label).slice(0, 60),
    swatch: body.swatch || 'linear-gradient(135deg,#999,#ccc)', css: body.css, fontLinks: Array.isArray(body.fontLinks) ? body.fontLinks : []
  });
  await env.INVITES.put('admin-themes', JSON.stringify(themes));
  return json({ ok: true, themes });
}

async function handleAdminThemesDelete(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Samo administrator može brisati teme.' }, 403);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const raw = await env.INVITES.get('admin-themes');
  let themes = [];
  try { themes = raw ? JSON.parse(raw) : []; } catch (e) { themes = []; }
  themes = themes.filter(t => t.id !== id);
  await env.INVITES.put('admin-themes', JSON.stringify(themes));
  return json({ ok: true, themes });
}

const PRICING_DEFAULTS = {
  basicLabel: 'Osnovni', basicPrice: '1.500', basicNote: 'jednokratno',
  premiumLabel: 'Premium', premiumPrice: '2.500', premiumNote: 'jednokratno',
  agencyLabel: 'Agencije i saradnici', agencyPrice: 'od 8.000', agencyNote: 'za 10 kodova'
};

async function handlePricingGet(env) {
  if (!env.INVITES) return json(PRICING_DEFAULTS);
  const raw = await env.INVITES.get('pricing-config');
  let cfg = PRICING_DEFAULTS;
  if (raw) { try { cfg = Object.assign({}, PRICING_DEFAULTS, JSON.parse(raw)); } catch (e) {} }
  return json(cfg);
}

async function handlePricingPost(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Samo administrator može menjati cenovnik.' }, 403);
  let body; try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const cfg = Object.assign({}, PRICING_DEFAULTS, body);
  await env.INVITES.put('pricing-config', JSON.stringify(cfg));
  return json({ ok: true, cfg });
}

/* ============================================================ POSTOJEĆE FUNKCIJE (RSVP, aktivacija, kodovi, naslovna slika) ============================================================ */

async function incrementViews(env, id) {
  try {
    const key = 'views:' + id;
    const current = await env.INVITES.get(key);
    const n = (parseInt(current, 10) || 0) + 1;
    await env.INVITES.put(key, String(n));
  } catch (e) { /* najbolji pokusaj — brojac pregleda nije kriticna funkcija */ }
}

async function handleInviteGet(url, env, ctx) {
  const id = url.searchParams.get('id');
  const host = url.searchParams.get('host');
  if (!id) return json({ error: 'Nedostaje id.' }, 400);
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const raw = await env.INVITES.get('invite:' + id);
  if (!raw) return json({ error: 'Pozivnica nije pronadjena.' }, 404);
  const invite = JSON.parse(raw);
  const isHost = host && host === invite.hostToken;
  if (!invite.active && !isHost) {
    return json({ notActivated: true, title: invite.title || '' }, 200);
  }
  if (!isHost && ctx && ctx.waitUntil) ctx.waitUntil(incrementViews(env, id));
  delete invite.hostToken; // nikad ne saljemo tajni token gostima
  return json(invite);
}

// Test kod koji se moze koristiti neograniceno mnogo puta (ne trosi se, ne istice) —
// koristan za testiranje aktivacije bez trosenja pravih kodova za kupce. Postavlja se
// kao Worker secret: wrangler secret put TEST_ACTIVATION_CODE (npr. vrednost "TEST2026").
// Ako ovaj secret nije postavljen, ova funkcija uvek vraca false i sve ostaje kao pre.
//
// TRAJNO: "SVADBA2026" je namerno hardkodovan ovde kao stalni univerzalni test kod
// (po zahtevu vlasnika sajta), nezavisan od Worker secret-a TEST_ACTIVATION_CODE —
// radi uvek, na svakoj pozivnici, bez ikakvog dodatnog podesavanja. Ne cuva se u
// KV bazi, ne trosi se, ne istice, ne racuna se u statistiku prodatih kodova.
// Unosi se malim ili velikim slovima (npr. "svadba2026" ili "SVADBA2026") — svejedno je.
const HARDCODED_TEST_CODE = 'SVADBA2026';
function isTestCode(env, code) {
  const normalized = code ? String(code).trim().toUpperCase() : '';
  if (normalized && normalized === HARDCODED_TEST_CODE) return true;
  return !!(env.TEST_ACTIVATION_CODE && normalized === env.TEST_ACTIVATION_CODE.trim().toUpperCase());
}

async function handleActivate(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const rl = await checkRateLimit(env, 'activate', request, 20, 600);
  if (rl.limited) return rateLimitResponse();
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const { id, code } = body;
  if (!id || !code) return json({ error: 'Nedostaju podaci.' }, 400);
  const inviteRaw = await env.INVITES.get('invite:' + id);
  if (!inviteRaw) return json({ error: 'Pozivnica ne postoji.' }, 404);

  if (isTestCode(env, code)) {
    const invite = JSON.parse(inviteRaw);
    invite.active = true;
    await env.INVITES.put('invite:' + id, JSON.stringify(invite));
    return json({ ok: true, test: true });
  }

  const codeKey = 'code:' + code.trim().toUpperCase();
  const codeRaw = await env.INVITES.get(codeKey);
  if (!codeRaw) return json({ error: 'Kod nije validan.' }, 404);
  let codeData;
  try { codeData = JSON.parse(codeRaw); } catch (e) { codeData = { used: false }; }
  if (codeData.used) return json({ error: 'Ovaj kod je već iskorišćen.' }, 409);

  codeData.used = true; codeData.usedAt = Date.now();
  await env.INVITES.put(codeKey, JSON.stringify(codeData));

  const invite = JSON.parse(inviteRaw);
  invite.active = true;
  await env.INVITES.put('invite:' + id, JSON.stringify(invite));

  return json({ ok: true });
}

async function handleRsvpPost(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const rl = await checkRateLimit(env, 'rsvp', request, 15, 600);
  if (rl.limited) return rateLimitResponse();
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const { id } = body;
  if (!id) return json({ error: 'Nedostaje id pozivnice.' }, 400);
  const inviteRaw = await env.INVITES.get('invite:' + id);
  if (!inviteRaw) return json({ error: 'Pozivnica ne postoji.' }, 404);
  // Strukturirani zapis: clanovi je niz {ime} objekata — po jedna osoba po stavci.
  // Ovo omogucava tacan izvoz u CSV/Excel/JSON bez gubitka podataka (za razliku od
  // ranije verzije koja je sve clanove cuvala kao jedan spojen tekst).
  const clanovi = Array.isArray(body.clanovi)
    ? body.clanovi.map(c => ({ ime: String((c && c.ime) || '').slice(0, 100) })).filter(c => c.ime).slice(0, 30)
    : [];
  const rsvp = {
    prezimePorodice: String(body.prezimePorodice || '').slice(0, 100),
    dolazak: String(body.dolazak || '').slice(0, 40),
    clanovi,
    brojOsoba: clanovi.length,
    pesma: String(body.pesma || '').slice(0, 150),
    napomena: String(body.napomena || '').slice(0, 500),
    ts: Date.now()
  };
  const rid = genId(6);
  await env.INVITES.put('rsvp:' + id + ':' + rid, JSON.stringify(rsvp));
  return json({ ok: true });
}

async function handleRsvpGet(url, env) {
  const id = url.searchParams.get('id');
  const host = url.searchParams.get('host');
  if (!id || !host) return json({ error: 'Nedostaju parametri.' }, 400);
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const inviteRaw = await env.INVITES.get('invite:' + id);
  if (!inviteRaw) return json({ error: 'Pozivnica ne postoji.' }, 404);
  const invite = JSON.parse(inviteRaw);
  if (invite.hostToken !== host) return json({ error: 'Nemate pristup ovom panelu.' }, 403);
  const list = await env.INVITES.list({ prefix: 'rsvp:' + id + ':' });
  const rows = [];
  for (const k of list.keys) {
    const v = await env.INVITES.get(k.name);
    if (v) rows.push(JSON.parse(v));
  }
  const views = parseInt(await env.INVITES.get('views:' + id), 10) || 0;
  return json({ rows, views });
}

async function handleRedeem(request, env) {
  if (!env.INVITES) return json({ error: 'KV baza (INVITES) nije povezana.' }, 500);
  const rl = await checkRateLimit(env, 'redeem', request, 20, 600);
  if (rl.limited) return rateLimitResponse();
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Neispravan zahtev.' }, 400); }
  const code = (body.code || '').trim().toUpperCase();
  if (!code) return json({ error: 'Unesite kod.' }, 400);
  if (isTestCode(env, code)) return json({ ok: true, test: true });
  const key = 'code:' + code;
  const raw = await env.INVITES.get(key);
  if (!raw) return json({ error: 'Kod nije validan.' }, 404);
  let data;
  try { data = JSON.parse(raw); } catch (e) { data = { used: false }; }
  if (data.used) return json({ error: 'Ovaj kod je već iskorišćen.' }, 409);
  data.used = true;
  data.usedAt = Date.now();
  await env.INVITES.put(key, JSON.stringify(data));
  return json({ ok: true });
}

async function handleCoverGet(url, env) {
  const id = url.searchParams.get('id');
  const src = url.searchParams.get('src'); // 'cover' | 'canva' | (prazno = automatski)
  if (!id) return new Response('Nedostaje id.', { status: 400 });
  if (!env.INVITES) return new Response('KV nije povezan.', { status: 500 });
  const raw = await env.INVITES.get('invite:' + id);
  if (!raw) return new Response('Nije pronadjeno.', { status: 404 });
  const invite = JSON.parse(raw);
  // Podrzavamo oba moguca izvora fotografije: obicno "cover" polje (sajt-stil
  // pozivnice), i canva.image (Canva/gotova-slika tok). Ako trazeni izvor nije
  // dostupan, probamo drugi kao rezervu — bolje prikazati BILO KOJU dostupnu
  // sliku u pregledu linka nego nijednu.
  let cover = null;
  if (src === 'canva') cover = (invite.canva && invite.canva.image) || invite.cover;
  else if (src === 'cover') cover = invite.cover || (invite.canva && invite.canva.image);
  else cover = invite.cover || (invite.canva && invite.canva.image);
  if (!cover || !cover.startsWith('data:')) return new Response('Nema fotografije.', { status: 404 });
  const match = cover.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return new Response('Neispravan format slike.', { status: 400 });
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Response(bytes, { headers: { 'content-type': mime, 'cache-control': 'public, max-age=86400' } });
}

// Pozivnice sadrze licne podatke gostiju/domacina (imena, adrese, fotografije) i NIKAD
// ne smeju zavrsiti indeksirane na Google-u. Zato uvek ubacujemo "noindex" za ove stranice,
// dok pocetna strana (landing page) ostaje normalno indeksirana (podeseno u samom index.html).
const NOINDEX_TAG = '<meta name="robots" content="noindex, nofollow">\n';

// ============================================================
// SISTEM TEMA PO FAJLU (public/theme/*.html) — po zahtevu vlasnika sajta.
// NAMERNO se ovo radi OVDE, na serveru, a ne u browseru gosta preko fetch()-a:
// ako fajl teme ne postoji, ne moze da se ucita, ili sadrzi gresku, funkcija
// vraca null i pozivalac (renderGuestHTML) se tiho vraca na proveren, postojeci
// sistem tema — gost NIKAD ne vidi praznu stranicu zbog ovoga. To je ista vrsta
// greske koja je ranije izazvala veliki bag (dokumentovano u UPUTSTVU), pa je
// ovde svaki korak omotan tako da ne moze da probije do gosta.
function fmtEventDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return dateStr; }
}
async function renderFileThemeHTML(request, env, id, invite) {
  if (!invite.themeFile) return null; // ova pozivnica ne koristi novi sistem, preskoci
  // VAZNO (ispravljen bezbednosni/poslovni propust): ako pozivnica JOS NIJE
  // aktivirana (domacin nije platio/uneo kod), NE smemo da posluzimo kompletan
  // sadrzaj preko fajl-teme — to bi zaobislo isti taj gate koji CSS-teme
  // ispravno postuju (preko /api/invite -> notActivated:true). Vracamo null,
  // sto znaci "nemoj koristiti fajl-temu ovde", i pozivalac (renderGuestHTML)
  // se vraca na standardni tok koji ispravno prikazuje poruku "nije aktivirana".
  if (!invite.active) return null;
  try {
    const origin = new URL(request.url).origin;
    // Bezbednosna provera: dozvoljavamo samo imena fajlova bez putanje (bez / ili ..)
    // da neko slucajno/namerno ne pokusa da ucita nesto van public/theme/ foldera.
    if (!/^[a-zA-Z0-9_-]+\.html$/.test(invite.themeFile)) return null;
    const fileResp = await env.ASSETS.fetch(new URL('/theme/' + invite.themeFile, origin));
    if (!fileResp.ok) return null;
    let html = await fileResp.text();

    const people = Array.isArray(invite.people) ? invite.people : [];
    const personsHtml = people.map(p =>
      '<div class="person"><div class="ph">' +
      (p.photo ? '<img src="' + escAttr(p.photo) + '" alt="">' : '') +
      '</div><div class="role">' + escAttr(p.role || '') + '</div><div class="name">' + escAttr(p.name || '') + '</div></div>'
    ).join('');

    const events = Array.isArray(invite.events) ? invite.events : [];
    const locationsHtml = events.map(ev => {
      const mapUrl = ev.addr ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.addr) : '';
      return '<div class="card"><h3>' + escAttr(ev.name || '') + '</h3>'
        + (ev.addr ? '<p>' + escAttr(ev.addr) + '</p>' : '')
        + (ev.time ? '<div class="time">' + escAttr(ev.time) + '</div>' : '')
        + (mapUrl ? '<a class="map-link" href="' + escAttr(mapUrl) + '" target="_blank" rel="noopener">Otvori mapu</a>' : '')
        + '</div>';
    }).join('');

    const gallery = Array.isArray(invite.gallery) ? invite.gallery : [];
    const galleryHtml = gallery.map(src => '<img src="' + escAttr(src) + '" alt="" loading="lazy">').join('');

    const dateFormatted = fmtEventDate(invite.date);
    const countdownTarget = (invite.date) ? (invite.date + 'T' + (invite.time || '00:00') + ':00') : '';

    const values = {
      // KRITICNO: title/message/cover_image MORAJU proci kroz escAttr() — ovo su
      // polja koja domacin sam unosi, i bez ovoga bi neko mogao da upise
      // zlonameran <script> u naslov ili poruku pozivnice, koji bi se onda
      // izvrsio kod SVAKOG GOSTA koji otvori taj link (stored XSS). Otkriveno
      // i ispravljeno tokom bezbednosne provere.
      title: escAttr(invite.title || 'Pozivnica'),
      date: dateFormatted,
      date_label: dateFormatted ? '' : '',
      time_suffix: invite.time ? (' u ' + escAttr(invite.time) + 'h') : '',
      message: escAttr(invite.message || ''),
      cover_image: invite.cover ? escAttr(invite.cover.startsWith('data:') ? origin + '/api/cover?id=' + id + '&src=cover' : invite.cover) : '',
      cover_display: invite.cover ? 'block' : 'none',
      hero_text_color: invite.cover ? '#ffffff' : '#2E2620',
      persons_html: personsHtml,
      persons_section_display: people.length ? 'block' : 'none',
      locations_html: locationsHtml,
      gallery_html: galleryHtml,
      gallery_section_display: gallery.length ? 'block' : 'none',
      countdown_target: countdownTarget,
      countdown_display: countdownTarget ? 'block' : 'none',
      rsvp_url: origin + '/' + id + '/#rsvp'
    };
    for (const key in values) {
      html = html.split('{{' + key + '}}').join(values[key]);
    }
    return html;
  } catch (err) {
    console.error('renderFileThemeHTML greska (vracamo se na stari sistem):', err.message);
    return null;
  }
}

async function renderGuestHTML(request, env, id) {

  if (!env.INVITES) return null;
  const raw = await env.INVITES.get('invite:' + id);
  if (!raw) return null;
  const invite = JSON.parse(raw);

  const assetResp = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  if (!assetResp.ok) return null;
  let html = await assetResp.text();

  const url = new URL(request.url);
  const title = escAttr((invite.title || 'Pozivnica') + ' — Pozivnica');
  // Smisleniji, konkretniji opisi po tipu događaja — koriste se kao pregled teksta
  // kad se link podeli na Viber/WhatsApp/Facebook/Instagram, ako domaćin nije upisao
  // svoju poruku. Cilj: da poruka odmah bude jasna primaocu, ne generička fraza.
  const kickers = {
    vencanje: 'Pozivamo vas da nam se pridružite na venčanju — pogledajte detalje i potvrdite dolazak.',
    rodjendan: 'Pozivamo vas na proslavu rođendana — pogledajte detalje i potvrdite dolazak.',
    krstenje: 'Pozivamo vas na krštenje — pogledajte detalje i potvrdite dolazak.',
    ispracaj: 'Obaveštenje o ispraćaju — svi detalji na linku.',
    ostalo: 'Pozivamo vas na proslavu — pogledajte detalje i potvrdite dolazak.'
  };
  const desc = escAttr((invite.message || kickers[invite.tpl] || kickers.ostalo).slice(0, 180));
  const pageUrl = escAttr(url.origin + '/' + id + '/');
  // VAZNO: pokrivamo OBA moguca izvora slike — "cover" (sajt-stil pozivnica sa
  // sopstvenom fotografijom) I "canva.image" (Canva/gotova-slika tok). Ranije se
  // gledao SAMO cover, pa pozivnice napravljene kroz Canva tok nikad nisu imale
  // sliku u pregledu linka na Viber/WhatsApp/FB/Instagram, cak i kad su imale sliku.
  const coverSource = (invite.cover && invite.cover.startsWith('data:')) ? 'cover'
    : ((invite.canva && invite.canva.image && invite.canva.image.startsWith('data:')) ? 'canva' : null);
  const hasCover = !!coverSource;
  const imageUrl = hasCover ? escAttr(url.origin + '/api/cover?id=' + id + '&src=' + coverSource) : '';

  let metaTags = NOINDEX_TAG
    + '<meta property="og:type" content="website">\n'
    + '<meta property="og:site_name" content="Atelje Pozivnica">\n'
    + '<meta property="og:title" content="' + title + '">\n'
    + '<meta property="og:description" content="' + desc + '">\n'
    + '<meta property="og:url" content="' + pageUrl + '">\n'
    + '<meta name="twitter:title" content="' + title + '">\n'
    + '<meta name="twitter:description" content="' + desc + '">\n';

  if (hasCover) {
    metaTags += '<meta property="og:image" content="' + imageUrl + '">\n'
      + '<meta property="og:image:width" content="1200">\n'
      + '<meta property="og:image:height" content="630">\n'
      + '<meta name="twitter:card" content="summary_large_image">\n'
      + '<meta name="twitter:image" content="' + imageUrl + '">\n';
  } else {
    metaTags += '<meta name="twitter:card" content="summary">\n';
  }

  // Prvo probamo NOVI sistem tema po fajlu (public/theme/*.html), ako je ova
  // pozivnica napravljena sa njim. Ako iz BILO KOG razloga ne uspe, tiho
  // nastavljamo dole na proveren, postojeci sistem — gost nikad ne primeti razliku
  // osim sto vidi (verovatno) malo drugaciju temu nego sto je domacin izabrao.
  const fileThemeHtml = await renderFileThemeHTML(request, env, id, invite);
  if (fileThemeHtml !== null) {
    let themedHtml = fileThemeHtml.replace(/<title>[\s\S]*?<\/title>/, '<title>' + title + '</title>');
    if (themedHtml.includes('</head>')) {
      themedHtml = themedHtml.replace('</head>', metaTags + '</head>');
    }
    return new Response(themedHtml, { headers: { 'content-type': 'text/html;charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
  }

  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + title + '</title>');
  html = html.replace(/<!--OG_START-->[\s\S]*?<!--OG_END-->/, metaTags);

  return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
}

// Panel domacina (link sa tajnim tokenom) — nema potrebe za OG podacima, samo mora
// biti noindex, jer je to privatan link koji ne sme da zavrsi u pretrazivacima.
async function renderHostHTML(request, env) {
  const assetResp = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  if (!assetResp.ok) return null;
  let html = await assetResp.text();
  const metaTags = NOINDEX_TAG
    + '<meta name="twitter:card" content="summary">\n';
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Panel domaćina — Atelje Pozivnica</title>');
  html = html.replace(/<!--OG_START-->[\s\S]*?<!--OG_END-->/, metaTags);
  return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
}

// DIJAGNOSTIKA (ne izlaže nikakve tajne/secrets — bezbedno je da ova ruta bude javna):
// Radi PRAVI test čuvanja/čitanja u INVITES KV bazi, isto ono što se dešava kad neko
// napravi pozivnicu. Ako ovo javi grešku, to je 100% dokaz da je problem u vezi
// Worker-a i KV baze (pogrešan ID u wrangler.jsonc, baza nije bindovana, itd.),
// a NE u frontend kodu koji čuva linkove u pregledaču.
async function handleDebug(env) {
  const result = {
    timestamp: new Date().toISOString(),
    hasInvitesBinding: false,
    kvWriteOk: false,
    kvReadOk: false,
    kvReadValueMatches: false,
    kvDeleteOk: false,
    error: null
  };
  try {
    if (!env.INVITES) {
      result.error = 'env.INVITES ne postoji — KV baza uopšte nije povezana (binding se zove "INVITES" u wrangler.jsonc, proverite da li je tačno taj naziv i da li je "kv_namespaces" sekcija ispravno napisana).';
      return json(result, 200);
    }
    result.hasInvitesBinding = true;
    const testKey = '__debug_healthcheck__';
    const testVal = 'ok-' + Date.now();
    await env.INVITES.put(testKey, testVal, { expirationTtl: 120 });
    result.kvWriteOk = true;
    const readBack = await env.INVITES.get(testKey);
    result.kvReadOk = (readBack !== null && readBack !== undefined);
    result.kvReadValueMatches = (readBack === testVal);
    await env.INVITES.delete(testKey);
    result.kvDeleteOk = true;
    return json(result, 200);
  } catch (err) {
    result.error = (err && err.message) ? err.message : String(err);
    return json(result, 200);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // KRITIČNA ZAŠTITA: ako BILO KOJI handler ispod baci neočekivanu grešku
    // (npr. KV baza nije ispravno povezana — pogrešan/placeholder ID u
    // wrangler.jsonc — ili bilo koja druga runtime greška), Cloudflare bi
    // inače vratio svoju generičku HTML/praznu error stranicu. Frontend onda
    // pokuša da tu stranicu pročita kao JSON i dobije kriptičnu grešku
    // "Unexpected end of JSON input" koja nikom ne govori šta je stvarno
    // pošlo po zlu. Ovde hvatamo SVE što može da pukne za /api/* rute i uvek
    // vraćamo ispravan, čitljiv JSON — nikad prazan/HTML odgovor.
    try {
      return await routeRequest(request, env, ctx, url, pathname, method);
    } catch (err) {
      if (pathname.startsWith('/api/')) {
        return json({
          error: 'Neočekivana greška na serveru: ' + (err && err.message ? err.message : String(err)) +
            '. Ako se ovo ponavlja, proverite da li je KV baza (INVITES) ispravno povezana u wrangler.jsonc (pravi ID, ne "PASTE_YOUR_KV_NAMESPACE_ID_HERE") i da je "wrangler deploy" prošao bez grešaka.'
        }, 500);
      }
      throw err; // za ne-API rute (statički fajlovi) pustimo Cloudflare da odradi svoje uobičajeno rukovanje
    }
  }
};

async function routeRequest(request, env, ctx, url, pathname, method) {
    // ---- NALOZI ----
    if (pathname === '/api/debug' && method === 'GET') return handleDebug(env);
    if (pathname === '/api/auth/register' && method === 'POST') return handleRegister(request, env);
    if (pathname === '/api/auth/login' && method === 'POST') return handleLogin(request, env);
    if (pathname === '/api/auth/logout' && method === 'POST') return handleLogout(request, env);
    if (pathname === '/api/auth/me' && method === 'GET') return handleMe(request, env);
    if (pathname === '/api/auth/google/start' && method === 'GET') return handleGoogleStart(request, env);
    if (pathname === '/api/auth/google/callback' && method === 'GET') return handleGoogleCallback(request, env);

    // ---- MOJE POZIVNICE ----
    if (pathname === '/api/my-invites' && method === 'GET') return handleMyInvites(request, env);

    // ---- ADMIN ----
    if (pathname === '/api/admin/themes') {
      if (method === 'GET') return handleAdminThemesGet(env);
      if (method === 'POST') return handleAdminThemesPost(request, env);
      if (method === 'DELETE') return handleAdminThemesDelete(request, env);
    }
    if (pathname === '/api/admin/pricing') {
      if (method === 'GET') return handlePricingGet(env);
      if (method === 'POST') return handlePricingPost(request, env);
    }
    if (pathname === '/api/pricing' && method === 'GET') return handlePricingGet(env);

    // ---- POZIVNICE / RSVP / AKTIVACIJA ----
    if (pathname === '/api/invite') {
      if (method === 'POST') return handleInvitePost(request, env);
      if (method === 'GET') return handleInviteGet(url, env, ctx);
      if (method === 'PUT') return handleInvitePut(request, env);
      if (method === 'DELETE') return handleInviteDelete(request, env);
    }
    if (pathname === '/api/rsvp') {
      if (method === 'POST') return handleRsvpPost(request, env);
      if (method === 'GET') return handleRsvpGet(url, env);
    }
    if (pathname === '/api/redeem' && method === 'POST') {
      return handleRedeem(request, env);
    }
    if (pathname === '/api/activate' && method === 'POST') {
      return handleActivate(request, env);
    }
    if (pathname === '/api/cover' && method === 'GET') {
      return handleCoverGet(url, env);
    }

    // Ako je putanja pod /api/ ali se ne poklapa ni sa jednom rutom iznad
    // (npr. pogresna metoda, ili tipfeler u putanji) — vratimo jasan JSON
    // 404 umesto da padne kroz na staticke fajlove i vrati prazan/HTML odgovor.
    if (pathname.startsWith('/api/')) {
      return json({ error: 'Nepoznata API ruta: ' + method + ' ' + pathname }, 404);
    }

    // Link za panel domacina (npr. /abc123def/hosttoken123/) -> mora biti noindex,
    // to je privatan link sa tajnim tokenom, ne sme zavrsiti u pretrazivacima.
    const hostMatch = pathname.match(/^\/[a-z0-9]{6,10}\/[a-z0-9]{6,14}\/?$/i);
    if (hostMatch && method === 'GET') {
      const rendered = await renderHostHTML(request, env);
      if (rendered) return rendered;
    }

    // Link za goste (npr. /abc123def/) -> ubacujemo naslovnu sliku i naslov
    // u meta tagove, da se lepo prikaze kad se link podeli (WhatsApp/Viber/FB),
    // i uvek dodajemo noindex jer sadrzi licne podatke gostiju/domacina.
    const guestMatch = pathname.match(/^\/([a-z0-9]{6,10})\/?$/i);
    if (guestMatch && method === 'GET') {
      const rendered = await renderGuestHTML(request, env, guestMatch[1]);
      if (rendered) return rendered;
    }

    // Sve ostalo (pocetna strana, i sve sto nije pronadjeno) -> staticki fajlovi.
    // "not_found_handling": "single-page-application" u wrangler.jsonc automatski
    // vraca public/index.html za svaku putanju koja ne odgovara pravom fajlu.
    //
    // VAZNO: eksplicitno gasimo keširanje za HTML odgovore. Bez ovoga, browser
    // (ili Cloudflare-ov edge keš) moze da zadrzi STARU verziju sajta i posle
    // novog "wrangler deploy"-a, pa vlasnik sajta vidi zastarelu/pokvarenu
    // verziju i misli da je ispravka koju smo napravili "i dalje ne radi" —
    // iako je server odavno azuriran. Ovo pravilo garantuje da svaki ucitavanje
    // stranice uvek trazi najnoviju verziju sa servera.
    const assetResp = await env.ASSETS.fetch(request);
    const ct = assetResp.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      let bodyText = await assetResp.text();
      // og:image (i twitter:image) MORAJU biti puna adresa (https://...), ne
      // relativna putanja (/images/...) — Facebook/WhatsApp/Viber/Instagram
      // botovi po specifikaciji cutke ignorisu relativne putanje za slike, pa se
      // slika naprosto nikad nije prikazivala kad se deli sam link ka pocetnoj
      // strani (bez konkretne pozivnice). Ovde se to ispravlja automatski, za
      // koji god domen sajt trenutno koristi (radi i na *.workers.dev i na
      // eventualnom sopstvenom domenu kasnije, bez rucnog podesavanja).
      const origin = new URL(request.url).origin;
      bodyText = bodyText.replace(/(property="og:image"\s+content=")\/(images\/[^"]+)"/g, '$1' + origin + '/$2"');
      bodyText = bodyText.replace(/(name="twitter:image"\s+content=")\/(images\/[^"]+)"/g, '$1' + origin + '/$2"');
      const noCacheResp = new Response(bodyText, assetResp);
      noCacheResp.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      noCacheResp.headers.set('Pragma', 'no-cache');
      noCacheResp.headers.set('Expires', '0');
      return noCacheResp;
    }
    return assetResp;
}
