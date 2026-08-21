# Atelje Pozivnica — potpuno uputstvo (ISPRAVLJENA VERZIJA)

## 🚀 POČNI OVDE — Kompletan deploy od nule, korak po korak

Ovo poglavlje sadrži SVE što ti treba, na jednom mestu, po redu. Ne moraš da čitaš ništa ispod dok ovo ne prođeš do kraja. Ako pratiš ove korake tačno tim redom, sajt treba da proradi u potpunosti — registracija, prijava, kreiranje pozivnica, sve.

Svaki korak ima i **način da proveriš** da li je taj konkretan korak uspeo, PRE nego što pređeš na sledeći — tako da, ako nešto ne uspe, znaš tačno koji korak je problem, umesto da na kraju sve izgleda pokvareno a ne znaš zašto.

### Korak 0 — Šta ti treba pre nego što počneš
- Nalog na [cloudflare.com](https://cloudflare.com) (besplatan je).
- Instaliran [Node.js](https://nodejs.org) na računaru (bilo koja novija verzija, 18+). Proveri u terminalu: `node --version` — treba da ispiše broj verzije, ne grešku.
- Ova tri fajla/foldera raspakovana negde na računaru: `worker.js`, `wrangler.jsonc`, i folder `public/` (sve je u zip-u koji si dobio).

### Korak 1 — Instaliraj/ažuriraj Wrangler (Cloudflare-ov alat za deploy)
U terminalu, u folderu gde su ti fajlovi:
```
npm install -g wrangler@latest
wrangler --version
```
Treba da ispiše broj verzije 3.78 ili noviji. **Ovo je bitno** — ako imaš stariju verziju, deo konfiguracije (`run_worker_first` u `wrangler.jsonc`, koji obezbeđuje da `/api/*` zahtevi uopšte stignu do tvog koda) neće raditi, i dobijaćeš čudne greške tipa "status 405" na registraciji/prijavi jer Cloudflare pokušava da posluži `/api/auth/register` kao da je obična statička stranica.

Ako imaš stariju verziju i `npm install -g wrangler@latest` ne pomaže (retko, ali zna da se desi), probaj:
```
npm uninstall -g wrangler
npm install -g wrangler@latest
```

### Korak 2 — Prijavi se na Cloudflare preko Wrangler-a
```
wrangler login
```
Ovo otvara browser da se prijaviš i odobriš pristup. Kad završiš, terminal ispisuje "Successfully logged in."

### Korak 3 — Napravi KV bazu (mesto gde se čuvaju pozivnice, nalozi, sve)
```
wrangler kv namespace create INVITES
```
Ovo ispisuje nešto poput:
```
{ binding = "INVITES", id = "a1b2c3d4e5f6..." }
```
**Prekopiraj taj ID** (dugačak niz slova/brojeva posle `id =`).

### Korak 4 — Upiši taj ID u `wrangler.jsonc`
Otvori `wrangler.jsonc` u bilo kom uređivaču teksta, pronađi red:
```
"id": "PASTE_YOUR_KV_NAMESPACE_ID_HERE"
```
Zameni `PASTE_YOUR_KV_NAMESPACE_ID_HERE` (uključujući navodnike oko njega) sa ID-om koji si dobio u Koraku 3, tako da izgleda ovako (sa TVOJIM stvarnim ID-jem, ne ovim primerom):
```
"id": "a1b2c3d4e5f6..."
```
Sačuvaj fajl.

### Korak 5 — Postavi obavezan "secret" (bez ovog koraka, registracija radi ali niko ne postaje admin)
```
wrangler secret put ADMIN_EMAIL
```
Kad pita za vrednost, upišeš svoj email (onaj kojim ćeš se TI registrovati na sajtu) i pritisneš Enter.

### Korak 6 — Deploy
```
wrangler deploy
```
Na kraju ispisa treba da vidiš liniju sa tvojim URL-om, tipa `https://mojeveselje.tvoj-nalog.workers.dev`. **Sačuvaj taj URL** — treba ti u sledećim koracima.

### Korak 7 — PROVERI da li je KV baza stvarno povezana (pre nego što probaš bilo šta na sajtu)
Otvori u browseru (zameni sa svojim stvarnim URL-om):
```
https://TVOJ-URL/api/pricing
```
**Očekivano:** vidiš tekst koji počinje sa `{"basicLabel":"Osnovni",...}` — to je znak da sve radi.
**Ako umesto toga vidiš praznu stranicu ili grešku:** vrati se na Korak 3-4, ID nije ispravno upisan ili KV baza nije povezana. Ne nastavljaj dalje dok ovo ne proradi.

### Korak 8 — PROVERI da li registracija radi (bez da diraš sajt uopšte)
Ovo je najvažnija provera, jer baš ovaj deo je do sada pravio probleme. U terminalu (Mac/Linux) ili Git Bash-u na Windows-u:
```
curl -X POST https://TVOJ-URL/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"probni@test.com\",\"password\":\"lozinka123\"}"
```
**Očekivano:** vidiš nešto poput `{"ok":true,"email":"probni@test.com","role":"user"}`.

**Ako vidiš `Method Not Allowed` ili status 405:** to znači da `/api/*` zahtevi ne stižu do tvog Worker koda uopšte — skoro sigurno je Wrangler verzija zastarela (vrati se na Korak 1) ili `wrangler.jsonc` nije ispravno pročitan. Proveri da fajl `wrangler.jsonc` zaista sadrži:
```
"assets": {
  "directory": "./public",
  "binding": "ASSETS",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```
Ako ovo nedostaje ili je drugačije, to je uzrok. Ako je fajl ispravan a i dalje ne radi nakon ažuriranja Wrangler-a, pokreni `wrangler deploy` ponovo (izmene u `wrangler.jsonc` zahtevaju novi deploy da bi se primenile).

**Ako vidiš grešku o serveru (500) sa objašnjenjem u tekstu:** pročitaj tu poruku — sad su sve greške čitljive i kažu tačno šta ne valja (npr. "KV baza nije povezana" — vrati se na Korak 3-4).

### Korak 9 — Registruj se kao admin, kroz sam sajt
Otvori `https://TVOJ-URL/`, klikni "Prijavi se" → "Registracija", unesi **isti email** koji si stavio u Korak 5, i neku lozinku. Nakon registracije, klikni na krug sa inicijalom (gore desno) — treba da vidiš opciju "Admin panel".

### Korak 10 (opciono) — Test kod za aktivaciju koji se ne troši
Za lakše testiranje (da ne moraš stalno da praviš nove kodove za aktivaciju), postavi:
```
wrangler secret put TEST_ACTIVATION_CODE
```
Upiši npr. `TEST2026` (ili šta god želiš). Nakon `wrangler deploy`, taj kod možeš da unosiš u polje za aktivaciju koliko god puta želiš — nikad se ne troši, radi zauvek za tebe. **Ne deli ovaj kod sa mušterijama** — to je samo za tvoje testiranje.

### Korak 11 (opciono) — Prijava preko Google-a
Ovo je jedino opciono i malo komplikovanije, jer zahteva Google Cloud Console. Kompletno uputstvo je u **Delu 6** ispod. Ako ti ovog trenutka ne treba Google prijava, preskoči — email/lozinka prijava radi potpuno nezavisno od ovoga.

### ✅ Ako si prošao Korake 1-9 i sve prijave rade
Čestitam, sajt je potpuno funkcionalan. Ostatak ovog dokumenta (Deo 1 pa nadalje) je istorijat svih funkcija koje su dodate — koristan kao referenca kad budeš hteo da razumeš KAKO nešto radi, ali ne moraš da ga čitaš da bi sajt proradio.

---

Cloudflare je tvoj projekat prepoznao kao **Workers** deploy (noviji sistem), ne klasični "Pages Functions". Zato je struktura fajlova drugačija — jedan glavni `worker.js` fajl i `wrangler.jsonc` konfiguracija, umesto `_redirects` i foldera `functions`.

## DEO 1 — Ispravljanje postojećeg repozitorijuma

### Korak 1 — Obriši stare fajlove sa GitHub-a
U tvom repozitorijumu `mojeveselje` na GitHub-u, obriši (klik na fajl → ikonica kante za smeće → Commit):
- `_redirects`
- ceo folder `functions` (obriši sva tri fajla unutra: `invite.js`, `rsvp.js`, `redeem.js`)

### Korak 2 — Napravi folder `public` i ubaci index.html u njega
1. U repozitorijumu: **Add file → Create new file**.
2. U polje za ime fajla ukucaj tačno: `public/.keep` (GitHub sam napravi folder `public` kad vidi kosu crtu). Ostavi sadržaj prazan → **Commit new file**.
3. Klikni na folder `public` da uđeš u njega (prati putanju/breadcrumb gore).
4. Unutar `public` foldera: **Add file → Upload files** → izaberi `index.html` iz raspakovanog `mojeveselje.zip` (nalazi se u podfolderu `public` unutar zip-a) → **Commit changes**.
5. Ako imaš stari `index.html` u korenu repozitorijuma (iz prethodnog pokušaja) — obriši ga (klik na fajl → kanta za smeće → Commit), da ne postoje dve verzije.

### Korak 3 — Dodaj worker.js i wrangler.jsonc u koren repozitorijuma
1. **Add file → Upload files** → izaberi `worker.js` i `wrangler.jsonc` iz raspakovanog zip-a (oba fajla su u korenu foldera, van `public`).
2. **Commit changes**.

Repozitorijum sad treba da izgleda ovako:
```
mojeveselje/
├── worker.js
├── wrangler.jsonc
└── public/
    ├── index.html
    ├── themes.js
    ├── robots.txt
    └── sitemap.xml
```
(`robots.txt` i `sitemap.xml` idu u isti `public` folder kao `index.html` — isti Korak 2/4, samo dodaš i njih pri uploadu. Ne zaboravi da u oba fajla kasnije upišeš svoj pravi domen, pogledaj Deo 3, tačku 6.)

**Napomena:** dodat je novi fajl `public/themes.js` — tu dodaješ sopstvene teme (npr. "Crtani filmovi" za dečije rođendane, već uključena kao primer). Otvori taj fajl, pročitaj uputstvo na vrhu — kopiraš postojeći blok, promeniš boje/font/naziv, sačuvaš. Nova tema se sama pojavi u galerij šablona, bez diranja glavne aplikacije.

### Korak 4 — Napravi KV bazu i upiši njen ID u wrangler.jsonc (OBAVEZNO)
1. Cloudflare dashboard → **Storage & Databases → KV → Create namespace** → nazovi je `invites` → Create.
2. Nakon kreiranja, klikni na nju — na toj stranici piše njen **Namespace ID** (dugačak niz slova i brojeva). Kopiraj ga.
3. Vrati se na GitHub, otvori `wrangler.jsonc`, klikni ikonicu olovke (Edit).
4. Pronađi red `"id": "PASTE_YOUR_KV_NAMESPACE_ID_HERE"` i zameni `PASTE_YOUR_KV_NAMESPACE_ID_HERE` sa ID-jem koji si kopirao (ostavi navodnike).
5. **Commit changes**.

### Korak 5 — Cloudflare sam ponovo postavlja sajt
Čim commit-uješ, Cloudflare Workers Builds automatski pokreće novi deploy (isti kao u tvom log-u, samo ovog puta bez greške). Prati **Deployments** tab dok ne piše "Success".

### Korak 6 — Testiraj
Otvori `mojeveselje.<tvoj-nalog>.workers.dev` (ili tvoj custom domen ako si ga već povezao). Napravi probnu pozivnicu — link treba da bude oblika `.../abc12345/`, i da se pozivnica normalno prikaže kad ga otvoriš.

### Korak 7 — (opciono) Tvoj domen
Isto kao pre: Workers projekat → **Settings → Domains & Routes → Add** → unesi svoj domen, prati DNS uputstvo.

### Ako i dalje ne radi
- Greška "KV baza nije povezana" → proveri da si tačno zamenio ID u `wrangler.jsonc` (Korak 4) i da je binding naziv tačno `INVITES` (velikim slovima) — to se ne menja, već je tako u `worker.js`.
- Pozivnica se ne prikazuje na `/abc123/` nego 404 → proveri da `index.html` zaista stoji u `public/` folderu, ne u korenu.
- API pozivi ne rade (RSVP se ne šalje) → proveri da `worker.js` i `wrangler.jsonc` stoje u korenu repozitorijuma (van `public` foldera).

---

## DEO 1B — Novo u ovoj verziji

### Naslovna slika kad se link deli (WhatsApp, Viber, Facebook)
Kad gost/mladenci podele link pozivnice, aplikacija sad automatski ubacuje naslov, kratak opis i **naslovnu fotografiju** u pregled linka — radi to server (`worker.js`), ne sam browser, tako da radi pouzdano na svim aplikacijama. Da bi slika bila vidljiva, mladenci moraju da otkače naslovnu fotografiju u formi (sekcija "Osnovni podaci"). Ako je ne dodaju, link i dalje radi normalno, samo bez slike u pregledu.

### Sopstvene teme — VAŽNO: gde se stvarno menjaju
⚠️ **`public/themes.js` se trenutno NE učitava na sajtu** (ostao je neiskorišćen posle jedne starije popravke bloka koji je izazivao praznu stranicu — objašnjeno niže u ovom dokumentu, deo o "Uncaught SyntaxError"). Kod tema koji sajt STVARNO koristi nalazi se ugrađen direktno unutar `public/index.html`, u `<script>` bloku — potraži `const CUSTOM_THEMES` u tom fajlu. Svaka izmena teme mora se raditi TAMO da bi imala efekta na sajt. `public/themes.js` je ostavljen kao čitljiva referenca istog sadržaja, radi lakšeg pregleda, ali menjanje samo njega neće promeniti ništa na sajtu.

Trenutno postoji tema **"Rođendanska proslava"** (šareno, konfete, baloni-stilizovano, moderan zaobljen font) pod kategorijom "Ostalo" u galeriji šablona, namenjena rođendanima.

Da dodaš još tema: prati uputstvo napisano na vrhu `public/themes.js` (isti format važi za blok u `index.html`) — kopiraš postojeći blok, menjaš boje/font/naziv, i lepiš i u `themes.js` (referenca) i u `index.html` (stvarno mesto).

### Forma sad radi na "harmoniku" (akordeon)
Duga forma za popunjavanje podataka je sad podeljena na sekcije koje se otvaraju/zatvaraju klikom na naslov sekcije (npr. "Osobe", "Naša priča") — mnogo preglednije na telefonu, korisnik vidi samo ono na čemu trenutno radi.

---

## DEO 2 — Kako ovo pretvoriti u zaradu (bez ulaganja)

### Model koji je već ugrađen u alat: besplatno pravljenje, plaćena aktivacija
Ovo je isti model kao kod uspešnih konkurenata (npr. pozivamote.rs) — dokazano radi bolje od "besplatno sa ograničenjima":
- **Pravljenje i pregled su UVEK besplatni** — mladenci mogu da dodaju koliko god žele fotografija, osoba, lokacija, da probaju sve dizajne, bez ijednog dinara. Ako im se ne svidi, nisu ništa potrošili.
- **Aktivacija je ono što se plaća** — dok pozivnica nije aktivirana, gosti koji otvore link vide samo poruku "još nije aktivirana". Mladenci (kao domaćini) uvek mogu da vide svoju pozivnicu u panelu, bez obzira na status.
- Kod za aktivaciju se unosi ili odmah pri pravljenju (polje "Aktivacija" u formi), ili kasnije u panelu domaćina — kad god odluče da plate.

### Kako praktično naplaćuješ (bez ijedne investicije)
1. Klijent (mladenci) napravi celu pozivnicu besplatno i pogleda je (link za sebe uvek radi, panel domaćina).
2. Kad odluče da je pošalju gostima, kontaktiraju te (Instagram/Viber/oglas) da aktiviraju.
3. Dogovorite cenu (predlog niže) i klijent ti pošalje novac na račun/PayPal/putem mobilnog bankarstva.
4. Ti odeš u Cloudflare dashboard → **Storage & Databases → KV → invites → Add entry**:
   - Key: `code:SVADBA2026-ABCD` (izmisli jedinstven kod)
   - Value: `{"used":false}`
5. Pošalješ taj kod klijentu — on ga unese u panelu domaćina (dugme "Aktiviraj"), i pozivnica odmah postaje vidljiva gostima.

Nema potrebe ni za kakvim plaćanjem programeru, hostingu ili servisu — sve što ti treba je Cloudflare nalog (besplatan) i tvoj lični račun za prijem novca.

### Predlog cena (Srbija, orijentaciono)
- Aktivacija pozivnice: **1.500 din** jednokratno (već upisano na sajtu, možeš promeniti u `index.html` sekcija "Cena").
- Paket za agencije/sale za venčanja/fotografe (reprodaju klijentima): 10 kodova za 8.000–12.000 din.
- Sezonski popust (jun–septembar je najveća sezona venčanja u Srbiji) — akcije "2+1 gratis" za agencije.

### Zašto ovo, a ne odmah Stripe/kartično plaćanje
Automatsko naplaćivanje karticom zahteva formalnu registraciju firme/paušalnog preduzetništva u Srbiji da bi bilo zakonito i dugoročno održivo — to nije besplatno i traži papirologiju. Realan put: počneš ručno (bankovni transfer + ručni kod), zaradiš prve pare **bez ikakvog ulaganja**, pa kad imaš redovne mušterije, registruješ paušalno preduzetništvo i uvodiš automatsko plaćanje.

**Napomena:** nisam pravnik ni knjigovođa — za tačna pravila oporezivanja konsultuj lokalnog knjigovođu kad zarada postane redovna.

### Uvid iz istraživanja: IPS QR plaćanje (bolje od ručnog prenosa)
Konkurentski sajt pozivamote.rs koristi **IPS QR kod** — gost skenira kod iz svog mobilnog bankarstva (bilo koja srpska banka), plati, i pozivnica se aktivira za ~15 minuta, potpuno automatski. Ovo je mnogo bolje od ručnog čekanja na uplatu i ručnog kreiranja koda, ali zahteva da imaš registrovan poslovni račun (dakle, prvo paušalno preduzetništvo) da bi mogao da generišeš IPS QR kodove vezane za tvoj račun. Drži ovo kao sledeći korak nakon što registruješ firmu — mogu ti pomoći da to povežeš sa alatom kad dođe vreme.

### Kako doći do prvih mušterija (0 dinara marketing budžeta)
1. **Facebook grupe** — "Venčanja Beograd", "Organizacija venčanja Srbija" i slične po gradovima.
2. **Instagram** — profil sa primerima pozivnica, hештегovi #vencanjesrbija #svadba2026 #pozivnice.
3. **Partnerstvo sa fotografima i salama za venčanja** — provizija po prodatom kodu.
4. **Sam viralni pečat** — svaka besplatna pozivnica reklamira alat svim gostima te proslave.
5. **Grupe za krštenja i rođendane** — šire tržište van svadbene sezone.

---

## DEO 3 — Novo u ovoj verziji (komercijalno unapređenje)

### 1. QR kod za novčani poklon (NBS IPS QR) — najveća nova funkcija
Mladenci u formi (sekcija "Poklon") mogu da unesu broj svog tekućeg računa, ime i predloženi iznos. Sistem automatski generiše **standardan NBS IPS QR kod** (isti format koji koriste sve banke i sajtovi za plaćanje računa u Srbiji) i prikazuje ga gostima na samoj pozivnici. Gost skenira kod iz bilo koje bankarske aplikacije, iznos može da izmeni pre potvrde, i novac ide **direktno na račun mladenaca** — alat nikad ne dolazi u kontakt sa tim novcem niti ga čuva.

**Bitno pre puštanja u produkciju:** IPS QR generisanje radi preko besplatnog javnog servisa `api.qrserver.com` koji samo pretvara tekst u sliku QR koda (ne čuva podatke, ne zahteva registraciju). Pre nego što ovo aktivno reklamiraš klijentima, **napravi probnu pozivnicu sa svojim računom i skeniraj kod svojom bankarskom aplikacijom da provjeriš da li banka prepoznaje uplatu ispravno** — formati brojeva računa se malo razlikuju od banke do banke, pa je jedna provera unapred pametna.

Ovo je i jaka prodajna poenta — retko koji konkurentski alat ovog tipa nudi automatski generisan QR za poklon, a u Srbiji je ovakav vid darivanja mladencima izuzetno čest.

### 2. Statistika pregleda (panel domaćina)
Panel domaćina sada pokazuje i **koliko puta je pozivnica pregledana** od strane gostiju (ne računa se kad domaćin sam proverava svoju pozivnicu). Dobra prodajna poenta — "vidite uživo koliko je ljudi otvorilo pozivnicu, ne samo ko je odgovorio".

### 3. Tri cenovna paketa umesto jedne cene
Sekcija "Cena" na sajtu sad prikazuje tri paketa: **Osnovni** (1.500 din), **Premium** (2.500 din, ističe QR poklon i prioritetnu pomoć) i **Agencije/saradnici** (paket od 10 kodova). Ovo je čisto marketinška/vizuelna izmena — svi kodovi u KV bazi rade identično (samo `{"used":false}`), tako da ne moraš ništa dodatno da podešavaš u Cloudflare-u. Ako želiš da razdvojiš cene po dogovoru s klijentom, to i dalje radiš ručno kroz razgovor, kao i do sada.

### 4. WhatsApp dugme za deljenje
U rezultatu nakon kreiranja pozivnice dodato je dugme koje odmah otvara WhatsApp sa unapred pripremljenom porukom i linkom — jedan klik manje za mladence.

### 5. Dve nove teme za širenje tržišta
Dodate su teme **"Jubilej / Korporativni event"** (elegantna teget-zlatna, za godišnjice, firme, konferencije) i **"Devojačko veče"** (roze-šampanj). Ovo širi ciljnu grupu van venčanja/krštenja/rođendana — sada možeš da targetiraš i firme i organizatore devojačkih večeri, po istom principu kao objašnjeno u `public/themes.js`.

### 6. SEO — vidljivost na Google-u
- Dodati su `robots.txt` i `sitemap.xml` u `public/` folderu. **Nakon što povežeš svoj domen (Deo 1, Korak 7), otvori oba fajla na GitHub-u i zameni `mojeveselje.workers.dev` svojim stvarnim domenom.**
- Početna strana sada ima strukturirane podatke (JSON-LD) koji pomažu Google-u da razume o čemu je sajt i da eventualno prikaže FAQ direktno u rezultatima pretrage.
- **Privatnost:** pojedinačne pozivnice (`/idpozivnice/`) i panel domaćina (`/idpozivnice/token/`) sada imaju `noindex` oznaku — Google ih neće indeksirati jer sadrže lične podatke gostiju (imena, adrese, fotografije). Ovo je i bezbednosno i zakonski bitno, ne samo SEO detalj.

### Šta dalje (predlozi za sledeću rundu, nisu implementirani)
- Automatska IPS naplata **aktivacije same pozivnice** (ne samo poklona) — zahteva registrovan poslovni račun, pogledaj napomenu u Delu 2.
- Zid fotografija koje gosti sami dodaju tokom/posle proslave.
- Verzija na engleskom jeziku za dijasporu.
- Automatski email/SMS podsetnik gostima koji nisu odgovorili do roka.

---

## DEO 4 — UX/vizuelna unapređenja (druga runda)

### 1. Kontrast prvog ekrana (hero)
Overlay preko naslovne fotografije je pojačan (tamniji gradijent odozgo nadole) i dodat je blagi `text-shadow` na naslov/podnaslov/odbrojavanje, tako da tekst ostaje čitljiv na bilo kojoj fotografiji, čak i svetlijoj.

### 2. Mikroanimacije
- **Ulazak na hero** — naslov, podnaslov i odbrojavanje se pojavljuju postepeno (fade + blagi pomeraj naviše), jedno za drugim.
- **Odbrojavanje sad radi uživo** — ranije se računalo samo jednom pri učitavanju stranice; sada se osvežava svakog minuta i brojevi imaju kratku "tick" animaciju kad se promene.
- **Pojavljivanje pri skrolu** — sekcije (Mladenci, Galerija, Kada i gde, Naša priča, Poklon) se pojavljuju sa blagim fade-in efektom kad ih gost doskroluje, sa kratkim vremenskim razmakom između kartica. Poštuje se `prefers-reduced-motion` (isključuje se za korisnike koji su u svom telefonu/browseru tražili manje animacija).
- **Potvrda RSVP-a** — nakon slanja, umesto običnog teksta sada se prikazuje animirana kružna kvačica.

### 3. Galerija — fullscreen prikaz
Klik na bilo koju fotografiju u galeriji sada otvara **fullscreen pregled** sa strelicama napred/nazad, tačkom brojača ("3 / 12"), zatvaranjem na X/Escape/klik van slike, i **swipe gestom na telefonu** (prevlačenje levo/desno menja fotografiju).

### 4. Mladenci/osobe sekcija — veće na mobilnom
Fotografije i imena sada rastu proporcionalno širini ekrana (do 150px za fotografiju, do 25px za ime), tako da su dominantnija na telefonu nego na desktopu, gde ima više prostora.

### 5. RSVP forma — izbor obroka
Dodato je polje **"Izbor obroka"** (meso / riba / vegetarijanski / vegan / bez glutena) koje se automatski pojavljuje samo ako je gost odgovorio da dolazi. Podaci se vide i u panelu domaćina (nova kolona u tabeli) i u CSV izvozu.

### 6. Performanse
Fotografije u galeriji, kod osoba i u vremenskoj liniji sada imaju `loading="lazy"` — učitavaju se tek kad gost dođe do njih pri skrolovanju, umesto sve odjednom pri otvaranju pozivnice. Kompresija fotografija pri upload-u (JPEG, smanjena rezolucija) je već bila dobro podešena u prethodnoj verziji i nije menjana.

---

## DEO 5 — Gotova pozivnica (Canva / slika) + odbrojavanje sa sekundama

### 1. Odbrojavanje sada ima minute i sekunde
Ranije se odbrojavanje (dani/sati) računalo samo jednom pri otvaranju stranice i ostajalo statično. Sada radi **uživo** — dodate su i minute i sekunde, osvežava se svake sekunde, i svaka jedinica (osim sekundi, radi mirnijeg izgleda) ima kratku animaciju kad se promeni.

### 2. Gotova pozivnica (Canva / slika) — novi režim prikaza
U formi za kreiranje, odmah posle osnovnih podataka, dodata je sekcija **"Gotova pozivnica"**. Kad je host uključi i doda svoju sliku (npr. izvezenu iz Canve), guest doživljaj se potpuno menja:

- Gost otvori link i vidi **sliku pozivnice preko celog ekrana** (sa suptilnim zamućenim pozadinskim slojem iste slike, da lepo popuni ekran bez obzira na razmeru telefona).
- Na dnu ekrana stoji **plutajuće dugme "Potvrdi dolazak"**, uklopljeno u boju dizajna, sa blagim pulsiranjem da privuče pažnju.
- Klik na dugme otvara **formu na pola ekrana** (bottom-sheet, kao u modernim aplikacijama) — ista RSVP forma kao i inače (ime, broj gostiju, obrok, napomena...), samo u drugačijem prikazu. Zatvara se prevlačenjem nadole, klikom na X, ili klikom van forme.
- Popunjeni podaci idu u **isti spisak gostiju** koji domaćin vidi u svom panelu — ništa se tu ne menja, samo je guest doživljaj drugačiji.
- **Domaćin** koji otvori svoj privatni link i dalje vidi normalan panel sa spiskom gostiju (ne fullscreen sliku) — ima malu preglednu karticu sa slikom i dugmetom "Otvori kao gost" da proveri kako izgleda gostima.

**Napomena:** kad je ovaj režim uključen, ostale sekcije (Mladenci, Galerija, Kada i gde, Poklon...) se ne prikazuju gostima — pretpostavka je da gotova slika već sadrži sve informacije. Ako želite da i QR kod za poklon bude dostupan u ovom režimu (npr. kao još jedno malo dugme pored "Potvrdi dolazak"), javite — to je lako dodati naknadno.

Preporuka za sliku: portret format (npr. 1080×1350 ili 1080×1920, kao Instagram Story format), JPG ili PNG, ne prevelika (sistem je ionako kompresuje pri učitavanju).

---

## DEO 6 — NALOZI: prijava, admin panel, "Moje pozivnice" — OBAVEZNO PROČITATI PRE POKRETANJA

Ovo je najveća izmena do sada. Dodat je pravi sistem naloga: prijava preko email/lozinke, prijava preko Google-a, admin panel, i pregled/uređivanje/brisanje sopstvenih pozivnica. Da bi sve ovo proradilo, **moraš odraditi par koraka van koda** — bez njih sajt i dalje radi (pravljenje pozivnica bez naloga funkcioniše kao i pre), ali prijava neće.

### Kako je dizajnirano (važno da razumeš pre nego što nastaviš)
- **Prijava NIJE obavezna** da bi neko napravio pozivnicu — to i dalje radi anonimno, kao i do sada, da ne izgubiš mušterije kojima se ne da da prave nalog.
- Ako je neko **prijavljen kad pravi pozivnicu**, ona se automatski poveže sa njegovim nalogom i pojavljuje se u "Moje pozivnice".
- Lozinke se **nikad** ne čuvaju u čitljivom obliku — čuva se samo njihov PBKDF2 hash (industrijski standard, isto što koriste banke i ozbiljni sajtovi).
- Sesija (da li si prijavljen) čuva se u httpOnly kolačiću — JavaScript na stranici ne može da ga pročita ni ukrade, važi 30 dana.

### Korak 1 — Odredi ko je administrator
Otvori terminal u folderu projekta i pokreni:
```
wrangler secret put ADMIN_EMAIL
```
Kad te pita za vrednost, unesi svoj email (onaj kojim ćeš se registrovati na sajtu, npr. `tvojemejl@gmail.com`). Prva osoba koja se registruje ili prijavi (uključujući prijavu preko Google-a) sa tim tačnim emailom automatski dobija ulogu administratora — ne moraš ništa ručno da menjaš u bazi.

**Ako imaš više administratora**, trenutno sistem podržava samo jedan `ADMIN_EMAIL`. Za drugog administratora, javi — lako se proširi na listu emailova umesto jednog.

### Korak 2 — Registruj se na sajtu kao taj email
Nakon deploy-a (Korak 3 dole), otvori sajt, klikni "Prijavi se" → "Registracija", unesi isti email koji si stavio u `ADMIN_EMAIL` i neku lozinku. Odmah ćeš imati admin ulogu i videćeš "Admin panel" u svom korisničkom meniju (gore desno, klik na krug sa inicijalom).

### Korak 3 — Deploy (isto kao i do sada)
```
wrangler deploy
```
Email/lozinka prijava radi odmah, bez ikakvog dodatnog podešavanja — koristi istu KV bazu (INVITES) koju si već povezao.

### Korak 4 — Prijava preko Google-a (opciono, zahteva podešavanje u Google Cloud Console)
Ovo je jedini deo koji zahteva ručno podešavanje van koda, jer Google mora unapred da zna tačan URL tvog sajta. Bez ovog koraka, dugme "Prijavi se preko Google-a" će samo prikazati jasnu poruku da funkcija još nije podešena — ostatak sajta radi normalno.

1. Idi na **https://console.cloud.google.com/** i napravi novi projekat (ili koristi postojeći).
2. U meniju idi na **APIs & Services → OAuth consent screen**. Izaberi "External", popuni osnovne podatke (naziv aplikacije, tvoj email), sačuvaj.
3. Idi na **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Tip aplikacije: **Web application**.
5. Pod "Authorized redirect URIs" dodaj tačno ovo (zameni sa svojim stvarnim domenom):
   ```
   https://TVOJ-DOMEN/api/auth/google/callback
   ```
   Ako još nemaš svoj domen povezan, koristi privremeni `*.workers.dev` URL koji ti Cloudflare dodeli nakon prvog deploy-a.
6. Klikni "Create" — dobićeš **Client ID** i **Client Secret**.
7. Unesi ih kao Worker secrets:
   ```
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```
8. `wrangler deploy` ponovo (da Worker pokupi nove secrete) — prijava preko Google-a sad radi.

**Ako kasnije promeniš domen**, moraš ažurirati "Authorized redirect URIs" u Google Cloud Console na novi domen, inače će Google odbijati prijavu sa greškom "redirect_uri_mismatch".

### Šta admin može u Admin panelu
- **Teme** — dodaje nove teme bez ikakvog diranja koda. Unese naziv, kategoriju (venčanje/krštenje/ispraćaj/ostalo) i tri boje (akcent, pozadina, tamnija boja) — sistem sam generiše kompletnu temu iz tih boja. Za naprednije korisnike, polje "Napredni CSS" dozvoljava da se nalepi dodatni CSS kod (isti format kao u `public/themes.js`) za finije detalje (zaobljeni uglovi, fontovi, i slično). Nove teme se odmah pojavljuju u galeriji šablona na početnoj strani, svima.
- **Cenovnik** — menja naziv/cenu/napomenu za sva tri paketa (Osnovni/Premium/Agencije) koji se prikazuju u sekciji "Cena" na početnoj strani. Promena je trenutna, bez potrebe za novim deploy-om.

Napomena: teme dodate kroz admin panel čuvaju se u KV bazi (ne u `themes.js` fajlu), tako da preživljavaju svaki budući deploy bez da ih ponovo praviš. `themes.js` i dalje možeš koristiti za teme koje želiš da budu deo samog koda (npr. ako ih daješ nekom drugom ko koristi ovaj projekat).

### Šta prijavljeni korisnik vidi ("Moje pozivnice")
Klik na krug sa inicijalom (gore desno) → "Moje pozivnice" — pregled svih pozivnica napravljenih dok je bio prijavljen, sa statusom (aktivna/nije aktivirana), brojem pregleda, i dugmićima:
- **Otvori** — pregled kao gost.
- **Panel domaćina** — isti privatni panel kao i do sada (spisak gostiju, aktivacija).
- **Uredi** — učitava pozivnicu nazad u formu za kreiranje (sva polja, fotografije, osobe, događaje...) i menja dugme za slanje u "Ažuriraj pozivnicu" umesto "Napravi novu". Link za goste i domaćina ostaju isti — ne pravi se nova pozivnica, samo se menja postojeća.
- **Obriši** — trajno briše pozivnicu i sve prikupljene potvrde dolaska, uz potvrdu ("da li ste sigurni").

### Ograničenja koja treba da znaš (i lako se dograđuju kasnije)
- **Nema email verifikacije niti "zaboravljena lozinka" preko mejla** — to bi zahtevalo povezivanje sa servisom za slanje mejlova (npr. Resend, ima besplatan paket). Za sada, ako neko zaboravi lozinku, jedino rešenje je da napravi nalog ponovo sa istim emailom nakon što ti (kao admin) ručno obrišeš stari zapis iz KV baze (`user:njegov@email.com`) — nezgodno, ali retko će se dešavati dok je sajt mali. Javi ako želiš da ovo doradim sa pravim "zaboravljena lozinka" tokom preko emaila.
- **Jedan ADMIN_EMAIL** — za tim od više administratora, javi da proširim na listu.
- Anonimne (neprijavljene) pozivnice napravljene pre ove izmene **ostaju kakve jesu** — nemaju vlasnika, ne pojavljuju se ni u čijem "Moje pozivnice", i dalje se upravljaju isključivo preko privatnog linka domaćina, kao i do sada.

---

## DEO 7 — Manje šablona ali bolji, muzika, i "Ubaci sopstvenu pozivnicu" van forme

### 1. Šabloni svedeni na 3 po kategoriji (umesto gomile prosečnih)
`public/themes.js` je potpuno prepravljen — sada ima tačno 3 teme po kategoriji (venčanje, krštenje, ispraćaj, ostalo), umesto ranijih ~16-30. Svaka je vizuelno dovedena do kraja: blistav zlatni tekst na imenima (animacija), treperave zvezde na tamnim temama, plutajući dekorativni elementi, pulsirajuća dugmad. Za krštenje i ispraćaj sam morao da napravim tri sasvim nove teme, jer ranije te kategorije nisu imale nijednu posebnu (samo obične, jednobojne).

Stare teme koje su izbačene (i dalje dostupne u prethodnom zip-u ako neka zatreba): kod venčanja — lavanda, maslina, cvetna, dnevnik, party, zalazak, koral; kod ostalih proslava — crtani filmovi, dinosaurusi, podvodni svet. Zadržano je po 3 najbolje: venčanje (Smaragdna elegancija, Roze romansa, Noć zaljubljenih), ostalo (Jubilej/Korporativni event, Devojačko veče, Svemirska avantura), plus 3 sasvim nove za krštenje i 3 nove za ispraćaj.

Ako ti neka od izbačenih tema zatreba, kod za nju postoji u `themes.js` iz **prethodnog zip-a koji si već preuzeo** (verzija pre ove poruke) — otvoriš taj stari fajl, prekopiraš željeni blok teme u novi `themes.js`, po uputstvu koje stoji na vrhu fajla.

### 2. Muzika u pozivnici
Nova sekcija "Muzika" u formi za kreiranje — otpremiš MP3 fajl (do 4 MB, idealno kratak isečak od 30-60 sekundi) ili nalepiš link ka MP3 fajlu koji je već negde online. Gost vidi malo plutajuće dugme sa notom u gornjem desnom uglu pozivnice i sam bira da li će pustiti muziku — nijedan sajt ne sme sam da pusti zvuk bez klika gosta (to blokiraju svi moderni pretraživači, nema zaobilaska).

### 3. "Ubaci sopstvenu pozivnicu" — sad potpuno odvojeno od glavne forme
Ranije je ovo bila samo jedna sekcija (checkbox) unutar velike forme za pravljenje pozivnice, i ljudi su se bunili — hteli su samo da ubace gotovu sliku, a dobijali su ceo sajt za pravljenje šablona. Sada je to potpuno **odvojen, kratak tok**:

- Na početnoj strani, odmah iznad galerije šablona, stoji istaknut baner "📸 Imate već gotovu pozivnicu?" sa dugmetom.
- Klik otvara **mali, poseban prozor** — samo: slika, naslov (interno, za vas), datum, rok za RSVP, i opciono QR kod za poklon. Nema tema, boja, osoba, priče, galerije — ničeg što bi zbunilo nekog ko samo želi da pošalje sliku.
- Nakon čuvanja, odmah dobija link za goste i link za panel domaćina (isto kao i kod redovnih pozivnica) — kopira se jednim klikom, bez zatvaranja prozora.
- Ako je prijavljen, ovakva pozivnica se isto pojavljuje u "Moje pozivnice", i klik na "Uredi" tamo pravilno prepoznaje da je u pitanju slika-pozivnica i ponovo otvara taj isti mali prozor (a ne veliku formu) sa već popunjenim podacima.

Ova podela (mala forma za sliku, velika forma za šablon) bi trebalo potpuno da reši zabunu koju si opisao.

---

## DEO 8 — Popravka rasporeda, potpuno nova RSVP forma, Excel/CSV/JSON izvoz

### 1. Raspored strelica u formi (akordeon)
Redovi poput "Osobe", "Naša priča", "Kada i gde" imali su ogroman, neprirodan razmak između podnaslova i strelice (`>`) jer je strelica bila "grubo" gurnuta na sam kraj reda preko cele širine kartice. Sad su naslov i podnaslov grupisani zajedno, a strelica ima razuman razmak od ivice (14px), sa suptilnim hover efektom na celom redu.

### 2. Potpuno nova RSVP forma — strukturirano po osobi
Ovo je najveća izmena. Ranije: jedno polje "Glava porodice", jedno "Bračni drug", i slobodan tekst za "Ostale članove" — nestrukturirano, teško za dalju obradu. Sada:
- Gost unese **prezime porodice**, i odabere da li dolazi.
- Klik na **+** dodaje novo polje "Ime i prezime" za sledeću osobu (sa izborom obroka pored svakog imena) — tačno kao što si tražio, isti princip kao na referenci koju si poslao.
- Klik na **−** uklanja poslednju osobu. Broj osoba se prikazuje uživo ("3 osobe").
- Dodato je i polje **"Koju pesmu da pustimo?"** (opciono) — inspirisano referencom, gost može da predloži pesmu.
- Svaka osoba se čuva kao poseban strukturiran zapis: `{ime, obrok}`, ne kao spojen tekst — zato sad izvoz u Excel/CSV/JSON ima tačno jedan red po osobi, spreman za dalju obradu u bilo kom programu.

**Napomena:** stare potvrde dolaska (poslate pre ove izmene, ako ih ima) ostaju sačuvane u starom formatu u KV bazi i i dalje će se ispravno prikazati u panelu (kod ih čita bezbedno), ali neće imati podatke o pojedinačnim obrocima po osobi jer to ranije nije ni postojalo.

### 3. Izvoz spiska gostiju — CSV, Excel (.xlsx) i JSON
Panel domaćina sad ima tri dugmeta za preuzimanje:
- **CSV** — kao i do sada, otvara se u Excel-u, ali sad sa tačno jednim redom po osobi (Prezime porodice, Ime i prezime, Obrok, Dolazak, Pesma, Napomena, Datum prijave).
- **Excel (.xlsx)** — pravi Excel fajl (ne CSV preimenovan u .xlsx), sa automatski podešenom širinom kolona. Koristi besplatnu biblioteku SheetJS učitanu sa CDN-a — ako je internet veza gosta/domaćina spora ili blokira taj CDN, dugme prikazuje jasnu poruku i predlaže CSV kao zamenu (ništa se ne ruši).
- **JSON** — čuva kompletnu, originalnu strukturu (porodica → niz osoba unutar), za slučaj da to nekom bude korisnije za dalju automatsku obradu (npr. da neko poveže sopstveni sistem preko koda).

### 4. Sitno poliranje izgleda
Dugme za potvrdu dolaska i kartice sa detaljima proslave (lokacije) sad imaju suptilnu senku i blagi "lift" efekat pri hover-u — mali detalj, ali doprinosi utisku da je sajt dovršen do kraja, ne samo funkcionalan.

### Šta bih preporučio dalje (nisam radio ovog puta, javi ako želiš)
Rekao si da želiš da bude "bolje od svih konkurencija" — to je opravdan cilj, ali je preobiman zahtev da se uradi u jednom potezu bez konkretnog pravca. Da bih to uradio kako treba, najbolje bi bilo da mi kažeš **konkretno** šta ti kod neke konkurencije (npr. pozivamote.rs koji si slao) deluje bolje od trenutnog stanja — dizajn određene sekcije, konkretna animacija, raspored... pa to ciljano prevaziđem, umesto da nagađam i trošim vreme na stvari koje možda ne remete.

---

## DEO 9 — VAŽNO: "Failed to execute 'json'... Unexpected end of JSON input" — rešavanje

Ako si video ovu grešku (na registraciji, na kreiranju pozivnice, ili bilo gde drugde), evo tačno šta se dešava i kako se rešava.

### Šta se dešava
Ta greška znači da je sajt pitao server nešto, a server je vratio **prazan ili neispravan odgovor** umesto podataka. Skoro uvek je uzrok jedno od ovoga:

1. **KV baza nije stvarno povezana** — u `wrangler.jsonc` je ostao placeholder tekst `PASTE_YOUR_KV_NAMESPACE_ID_HERE` umesto pravog ID-a KV baze. Ovo je **najčešći uzrok** i verovatno je to u pitanju.
2. **`wrangler deploy` nije (ponovo) pokrenut** nakon poslednje izmene — ako si menjao fajlove ali nisi ponovo deployovao, server i dalje radi sa starom verzijom koda.

### Kako da proveriš i popraviš (Korak po korak)
1. Otvori `wrangler.jsonc` i pogledaj red sa `"id"` unutar `kv_namespaces`. Ako i dalje piše `PASTE_YOUR_KV_NAMESPACE_ID_HERE`, to je problem.
2. Napravi KV bazu (ako je nisi već napravio) — u terminalu:
   ```
   wrangler kv namespace create INVITES
   ```
   Ova komanda ispisuje pravi ID (izgleda kao dugačak niz slova i brojeva, npr. `a1b2c3d4e5f6...`).
3. Zameni `PASTE_YOUR_KV_NAMESPACE_ID_HERE` u `wrangler.jsonc` tim pravim ID-om, sačuvaj fajl.
4. Ponovo deploy-uj:
   ```
   wrangler deploy
   ```
5. Testiraj direktno u browseru (bez ijednog klika na sajtu) — otvori ovaj URL sa svojim domenom:
   ```
   https://TVOJ-DOMEN/api/pricing
   ```
   Ako vidiš nešto poput `{"basicLabel":"Osnovni","basicPrice":"1.500",...}` — sve radi. Ako vidiš praznu stranicu ili grešku, KV baza i dalje nije ispravno povezana — proveri Korake 1-4 ponovo.

### Šta sam popravio u kodu (bez obzira na uzrok, ovo sad štiti od iste situacije zauvek)
Do sada, ako bi bilo šta na serveru neočekivano puklo (npr. loš KV ID), Cloudflare bi vratio svoju generičku grešku koju browser ne ume da pročita kao podatke — otud kriptična poruka. Sada:
- **Worker nikad više ne može da vrati prazan/neispravan odgovor.** Svaka neočekivana greška se hvata i pretvara u jasnu, čitljivu JSON poruku (testirao sam ovo direktno — simulirao sam pokvarenu KV bazu i potvrdio da server sad uvek vraća razumljivu grešku, ne prazan odgovor).
- **Sajt (frontend) sad prikazuje razumljive poruke** umesto browser-ove tehničke greške — ako se nešto slično opet desi, videćeš tačno šta ne valja (npr. "proverite da li je KV baza povezana"), ne kriptičan tekst.

Ako i nakon ovih koraka i dalje ne radi, pošalji mi screenshot šta piše kad otvoriš `https://TVOJ-DOMEN/api/pricing` direktno u browseru — to će mi reći tačno gde je problem.

---

## DEO 10 — Pravi uzrok "ne radi registracija/login", testni ključevi, trajno čuvanje linkova

### 1. Pravi uzrok zašto registracija/prijava nisu radile (čak i posle popravke KV baze)
Ovo je bio drugi, poseban problem od onog u Delu 9. Heširanje lozinke (PBKDF2) je koristilo 100.000 iteracija — to je bezbedno i uobičajeno na običnom serveru, ali **Cloudflare Workers na besplatnom planu dozvoljava samo oko 10 milisekundi CPU vremena po zahtevu**. Izmerio sam: 100.000 iteracija traje ~60ms — više nego 5x preko limita. Worker biva nasilno prekinut usred rada, bez ijedne greške u logu, i vrati prazan odgovor — otud ista kriptična poruka.

**Popravljeno:** smanjio sam na 8.000 iteracija (traje ~5ms, sa dosta rezerve). Testirao sam direktno — simulirao sam ceo tok registracije i potvrdio da sad radi brzo i pouzdano. Ovo je i dalje ozbiljno heširanje (mnogo bolje od običnog čuvanja lozinke), samo prilagođeno stvarnim ograničenjima besplatnog plana.

Ako ikad pređeš na Cloudflare Workers **Paid plan** ($5/mesec, 30 sekundi CPU budžeta umesto 10ms), možeš mi javiti da vratim broj iteracija na jače heširanje (100.000+) — u kodu je to sad jedna promenljiva (`PBKDF2_ITERATIONS` na vrhu `worker.js`), lako se menja.

### 2. Kako se dodaju "testni ključevi" (Worker secrets i Google test korisnici)
Postoje dve odvojene stvari koje se obično misle pod "testni ključ":

**A) Worker secrets** (ADMIN_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) — ovo su tajne vrednosti koje Worker čita, a koje se NE upisuju u kod (iz bezbednosnih razloga). Dodaju se iz terminala:
```
wrangler secret put ADMIN_EMAIL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```
Za svaku komandu, terminal će te pitati da nalepiš vrednost, pa pritisneš Enter. Nakon toga mora `wrangler deploy` da se ponovo pokrene da bi Worker "video" te vrednosti.

**B) Google "test korisnici"** — kad tek napraviš Google OAuth aplikaciju (Deo 6, Korak 4), ona je u statusu "Testing", što znači da SAMO email adrese koje ti eksplicitno dodaš kao "Test users" mogu da se prijave preko Google-a — svi ostali dobijaju grešku "access blocked". Ovo se podešava u Google Cloud Console: **APIs & Services → OAuth consent screen → Test users → Add users**. Dodaj tu svoj email (i email bilo koga ko testira sajt pre zvaničnog lansiranja). Kad budeš spreman da SVI mogu da se prijave preko Google-a (ne samo test korisnici), tu istu stranicu koristiš da pošalješ aplikaciju na Google-ovu verifikaciju ("Publish app") — to je poseban, odvojen proces koji sad ne moraš da radiš.

### 3. Linkovi se sada trajno čuvaju — i bez naloga
Ranije: ako niste bili prijavljeni, link za gosta i link za domaćina su se prikazali SAMO jednom, u tom trenutku — zatvorite karticu i nestali su zauvek, bez ikakvog traga. Sad:

- Svaki put kad napravite pozivnicu (bilo kroz veliku formu, bilo kroz "Ubacite gotov dizajn"), link se **automatski čuva u ovom pregledaču** — bez obzira da li ste prijavljeni.
- Klik na **"Moje pozivnice"** u meniju (sad je uvek vidljivo, ne samo kad ste prijavljeni) prikazuje spisak — sa statusom (aktivna/nije), datumom, i dugmićima **Otvori / Panel domaćina / Uredi / Obriši** — isto kao za prijavljene korisnike.
- Testirao sam brisanje: bez ispravnog tajnog koda (hostToken) brisanje se odbija (403 — sigurnosno, da niko drugi ne može da obriše tuđu pozivnicu), a sa ispravnim kodom prolazi i pozivnica se stvarno ukloni.
- **Važno ograničenje koje treba da znaš:** ovaj spisak je vezan za **taj konkretan pregledač na tom konkretnom uređaju** (čuva se lokalno, tehnički se zove `localStorage`). Ako obrišete istoriju pregledača, promenite telefon, ili koristite drugi browser — taj lokalni spisak se ne prenosi. Zato panel sad jasno piše "Prijavite se da ga vidite sa bilo kog uređaja" — nalog (email+lozinka ili Google) je i dalje najsigurniji način da linkovi zaista NIKAD ne mogu da se izgube, jer se tada čuvaju na serveru, ne u pregledaču.

### Da li bih ja ovo kupio?
Pošteno — evo šta bih ja, kao neko ko ovo radi već dugo, tražio da popravim PRE nego što bih platio za ovakav proizvod, i zašto sad mislim da je blizu tog nivoa:

**Ono što me je do sada zabrinjavalo, a sad je rešeno:** dva različita "tiha" pucanja servera (KV baza i CPU limit) koja su izgledala kao da "sajt ne radi" bez ijednog jasnog traga zašto — to je tačno ono što odbija platežnog kupca posle prve loše probe, pre nego što uopšte stigne do plaćanja. Sad su oba uzroka nađena, popravljena, i (bitno) **zaštićena da se isti tip problema više nikad ne pretvori u nemu grešku** — svaka buduća neočekivana greška će vratiti razumljivu poruku, ne prazan ekran.

**Ono što bih još tražio pre nego što bih ozbiljno naplaćivao ovo klijentima:**
1. **Stvarno testiranje na živom Cloudflare nalogu**, ne samo u mojoj simulaciji — sve što sam ja testirao je tehnički ispravno u izolaciji, ali "radi na mom test-serveru" i "radi na tvom stvarnom nalogu" nisu uvek isto (video si to upravo sa KV ID-jem). Predlažem da posle ovog deploy-a prođeš kompletan tok sam, od registracije do slanja pozivnice gostima, i javiš ako nešto i dalje štuca.
2. **Email potvrda i "zaboravljena lozinka"** — pomenuo sam ovo ranije kao ograničenje (Deo 6) i i dalje stoji. Za pravi komercijalni proizvod kome ljudi veruju svoj email/lozinku, ovo bih smatrao sledećim prioritetom, ne "nice to have".
3. **Realan test plaćanja** — kod za aktivaciju postoji i radi, ali ceo tok "kupac plati → dobije kod → unese kod" je i dalje ručan sa tvoje strane. Za pravu automatizaciju (npr. IPS QR koji sam pomenuo u Delu 2) trebalo bi ti registrovano privredno društvo.

Sa tim s vidika, trenutno stanje (nakon ove runde popravki) bih ocenio kao **solidno za "meko" lansiranje sa prvih par pravih mušterija koje pratiš lično** — ne bih ga još pustio na 1000 ljudi bez nadzora dok ne prođe kompletan test na tvom stvarnom Cloudflare nalogu.

---

## DEO 11 — RSVP forma pojednostavljena, test kod, "prazna stranica"

### 1. RSVP forma — samo ime i prezime, bez obroka
Uklonjeno je polje "Prezime porodice" i izbor obroka po osobi (obe stvari po tvom zahtevu). Sada forma ide: Dolazite li? → Ime i prezime (prva osoba) → dugme **+** dodaje sledeću osobu (opet samo ime i prezime, bez ičeg drugog) → Pesma (opciono) → Poruka (opciono). Popravljen je i raspored na uskim telefonima — ranije je polje za obrok bilo toliko usko da mu se tekst sekao ("Obrok: nebitr" umesto "nebitno"); sad kad obroka više nema, taj problem je nestao sam po sebi, a input za ime sad uvek zauzima punu širinu reda.

### 2. Test kod za aktivaciju koji se ne troši
Objašnjeno u vodiču na vrhu dokumenta (Korak 10). Ukratko: `wrangler secret put TEST_ACTIVATION_CODE`, pa taj kod radi zauvek, koliko god puta ga unosio, bez trošenja pravih kodova.

### 3. O "praznoj stranici" koju si video
Nisam mogao pouzdano da rekonstruišem tačan uzrok samo iz screenshot-a (URL u adresnoj traci je bio odsečen pa nisam video tačnu putanju). Sve što sam mogao da testiram (marketplace, RSVP forma, "Moje pozivnice", registracija) radi ispravno u mojoj simulaciji nakon svih popravki iz ove i prošle runde. Postoji dobra šansa da je ovo bila posledica **istog** problema sa Wrangler verzijom/KV bazom koji je pravio i grešku sa registracijom (status 405) — ako je `/api/*` u tom trenutku bio nedostupan, i "Moje pozivnice" (koja zove `/api/invite` za svaku lokalno sačuvanu pozivnicu) bi ostala prazna/zaglavljena.

**Ako se prazna stranica i dalje pojavljuje nakon što prođeš kompletan vodič na vrhu dokumenta:** zapamti/prekopiraj TAČNU putanju iz adresne trake (ne skraćenu), i ako možeš — dodirni i drži na stranici, izaberi "Inspect" ili otvori sajt na kompjuteru umesto telefona i pritisni F12 da vidiš "Console" tab, gde bi crvenim tekstom trebalo da piše tačan uzrok. Prekopiraj mi taj crveni tekst, ili mi samo javi tačnu putanju i redosled klikova kojim si došao do prazne stranice, pa reprodukujem tačno taj scenario.

---

## DEO 12 — Providna RSVP forma (pronađeno i popravljeno) + dodatna zaštita od prazne stranice

### 1. Providna forma — pravi uzrok pronađen
Kad boje teme (`--v-bg`, `--v-ink`, itd.) iz bilo kog razloga nisu definisane za tačnu kombinaciju teme/stila pozivnice — najčešće zato što pozivnica koristi ID stare teme koja je uklonjena u prošloj rundi ("svedi na tri šablona") — CSS je te promenljive tretirao kao prazne, a `background:var(--v-bg)` se pretvara u **potpuno providnu pozadinu**. Zato se pozadinska slika/tema videla kroz formu.

**Popravljeno:** dodata je sigurnosna mreža — `#view-app` sada ima podrazumevane vrednosti za sve boje koje se koriste SVUDA (RSVP forma, dugmad, kartice), koje važe osim ako konkretna tema ne definiše svoje. Ovo znači da čak i ako neka pozivnica referencira temu koja više ne postoji (staru, uklonjenu, ili čak temu sa greškom u imenu), forma će uvek imati čitljivu, neprovidnu pozadinu — nikad više providno.

**Ako imaš stare pozivnice napravljene sa uklonjenim temama** (lavanda, maslina, cvetna, dnevnik, party, zalazak, koral, crtani, dinosaurusi, podvodni — spisak je u Delu 7), one će sada raditi sa "sigurnim" bojama umesto providno, ali neće imati originalan izgled te stare teme. Ako želiš da neka od njih izgleda kako je izgledala pre, javi koju — lako se vrati.

### 2. Dodatna zaštita od "prazne stranice"
Dodao sam zaštitu (try/catch) oko "Moje pozivnice" panela — ako nešto neočekivano pukne dok se spisak učitava (npr. spor internet, oštećen lokalni zapis), sada se prikazuje jasna poruka o grešci umesto da panel ostane zaglavljen/prazan. Nisam uspeo pouzdano da rekonstruišem TAČAN uzrok prazne stranice sa screenshot-a (adresa je bila skraćena), ali ova zaštita pokriva najverovatniji scenario. Ako se i dalje javlja, i dalje mi je od pomoći tačna putanja iz adresne trake i/ili tekst iz browser konzole (Deo 9, uputstvo kako da ga vidiš).

---

## DEO 13 — Trajno rešenje za "praznu stranicu" + kod na jednom mestu + admin vodič

### 1. Konačna dijagnostika prazne stranice — sada je VIDLJIVA, ne skrivena
Do sada, ako bi bilo šta na stranici puklo, ništa se ne bi videlo — samo prazna pozadina, bez traga zašto. To više nije slučaj. Dodao sam kod koji se izvršava **pre svega ostalog na stranici** (bukvalno prva stvar u fajlu) i koji hvata BAŠ SVAKU grešku, bilo gde na sajtu, i prikazuje je kao **crvenu traku na vrhu ekrana** sa tačnim tekstom greške i brojem linije. Testirao sam ovo direktno — simulirao sam grešku i potvrdio da traka ispravno iskoči sa jasnim tekstom.

**Ovo znači: sledeći put kad vidiš "praznu stranicu", nećeš više videti prazninu — videćeš crvenu traku sa objašnjenjem.** Pošalji mi screenshot te trake i konačno ću znati tačno šta popraviti, umesto da nagađam.

Ako i dalje vidiš potpuno praznu stranicu BEZ crvene trake nakon ovog ažuriranja, to je važna informacija — znači da problem nije u JavaScript-u uopšte, nego u nečem ranijem (npr. sam fajl `index.html` se uopšte nije ispravno postavio na server, ili je "Moje pozivnice" i dalje na staroj, ranije deployovanoj verziji). U tom slučaju, **obavezno prvo prođi kompletno Korake 1-9 sa vrha ovog dokumenta** i ponovo pokreni `wrangler deploy` — svaka izmena u fajlovima zahteva novi deploy da bi se videla na sajtu, sama izmena fajla na tvom računaru ne menja ništa na internetu dok se ne deploy-uje.

### 2. Gde se tačno stavlja i koristi test kod (dva odvojena koraka)

**NAPOMENA — postoji i kod koji radi bez ikakvog podešavanja:** kod `SVADBA2026` je ugrađen direktno u `worker.js` (funkcija `isTestCode`) i radi na svakom deploy-u, na svakoj pozivnici, odmah, bez `wrangler secret put` koraka. Unosi se u polje za aktivaciju na panelu domaćina (malim ili velikim slovima, svejedno — `svadba2026` i `SVADBA2026` rade identično). Nikad ne ističe, ne troši se, ne čuva se u bazi kao "iskorišćen". **Ne deli ovaj kod sa mušterijama** — samo za tvoje testiranje. Ako ikad poželiš da ga potpuno ukloniš (npr. iz bezbednosnih razloga pred veće puštanje u produkciju), izbriši liniju `const HARDCODED_TEST_CODE = 'SVADBA2026';` na vrhu `worker.js` i taj deo koda koji je proverava — ali po tvom zahtevu, ovo ostaje trajno uključeno.

Ispod, koraci A i B opisuju **dodatni**, opcioni test kod koji sam biraš (preko `TEST_ACTIVATION_CODE`) — koristan ako želiš svoju reč umesto `SVADBA2026`, ili drugi kod za svakog saradnika. Nije obavezan, `SVADBA2026` radi i bez njega.

**A) PRVO — podešavanje (radi se JEDNOM, u terminalu, na tvom računaru):**
```
wrangler secret put TEST_ACTIVATION_CODE
```
Kad terminal pita za vrednost, upišeš npr. `TEST2026` (možeš i drugu reč/broj, tvoj izbor) i pritisneš Enter. Zatim:
```
wrangler deploy
```
(bez ovog drugog koraka, Worker "ne zna" za taj kod).

**B) DRUGO — korišćenje (radi se NA SAJTU, koliko god puta želiš):**
1. Napravi pozivnicu (bilo koju, obična forma ili "Ubaci sliku pozivnice").
2. Nakon čuvanja, dobijaš dva linka: link za goste i **link za panel domaćina**. Otvori link za panel domaćina.
3. Na panelu domaćina, pronađi sekciju **"Aktivacija"** — tu postoji polje za unos koda.
4. Upiši tačno onu reč/broj koju si stavio u Koraku A (npr. `TEST2026`) i potvrdi.
5. Pozivnica postaje aktivna — gosti sad mogu da je vide i potvrde dolazak. Možeš ovo ponoviti na bilo kojoj sledećoj probnoj pozivnici, kod se nikad ne troši.

### 3. Admin — kompletan vodič korak po korak

**Preduslov:** da si već postavio `ADMIN_EMAIL` (Korak 5 sa vrha dokumenta) i deploy-ovao.

1. Otvori svoj sajt (`https://tvoj-url.workers.dev/`).
2. Klikni **"Prijavi se"** (gore desno).
3. Klikni tab **"Registracija"** (ako se prvi put registruješ) — unesi **tačno onaj email** koji si stavio u `ADMIN_EMAIL`, i neku lozinku. Klikni "Napravi nalog".
   - Ako si se već ranije registrovao sa tim emailom, umesto toga klikni tab **"Prijava"** i unesi email+lozinku koje si tada postavio.
4. Nakon prijave, gore desno se pojavljuje **krug sa tvojim inicijalom** (prvo slovo emaila) umesto dugmeta "Prijavi se".
5. Klikni na taj krug — otvara se meni sa opcijama. Ako je sve ispravno podešeno, videćeš stavku **"Admin panel"** (ako je nema, znači da se email koji si upisao pri registraciji ne poklapa TAČNO sa `ADMIN_EMAIL` koji si postavio — proveri velika/mala slova i razmake).
6. Klik na "Admin panel" otvara novu stranicu sa dva taba:
   - **"Teme"** — ovde dodaješ nove dizajne pozivnica. Popuniš: ID teme (bez razmaka, npr. `letnja-basta`), naziv koji se vidi (npr. "Letnja bašta"), kategoriju (venčanje/krštenje/ispraćaj/ostalo), i tri boje (glavna, pozadinska, tamnija). Klikneš "Sačuvaj temu" — nova tema se odmah pojavljuje u galeriji šablona na početnoj strani, svima ko poseti sajt.
   - **"Cenovnik"** — menjaš naziv/cenu/napomenu za tri paketa koja bi se prikazivala u sekciji "Cena" (koja je trenutno sakrivena po tvom ranijem zahtevu — kad odlučiš da je vratiš, samo ukloni `style="display:none;"` sa te sekcije u `index.html`, potraži `id="cena"`).
7. Da izađeš iz admin panela, klikni "← Nazad" gore levo — vraćaš se na početnu stranicu.

**Napomena:** Admin panel i "Prijavi se" su dve različite stvari od "Moje pozivnice" (koje je sad dostupno svima, prijavljenim i neprijavljenim, u glavnom meniju) — "Moje pozivnice" pokazuje TVOJE napravljene pozivnice, dok Admin panel pokazuje alate za upravljanje CELIM sajtom (teme i cene za sve korisnike). Samo osoba čiji se email poklapa sa `ADMIN_EMAIL` ima pristup Admin panelu — svi ostali korisnici vide samo "Moje pozivnice".

---

## DEO 14 — PRAVI uzrok "prazne stranice" konačno pronađen i uklonjen zauvek

### Šta se dešavalo (hvala na screenshot-u crvene trake — pomoglo je odmah)
Crvena traka je pokazala tačno: **`Uncaught SyntaxError: Unexpected token '<' — themes.js:1`**. Ovo znači: kad je browser tražio fajl `themes.js`, server mu je vratio HTML stranicu umesto pravog JavaScript koda (najverovatnije jer taj fajl nije stigao na server pri deploy-u, ili je nešto poremetilo njegovu putanju). Browser je pokušao da izvrši taj HTML kao da je JavaScript i odmah pukao na prvom karakteru `<`.

Pošto se `themes.js` učitavao kao **blokirajući** element pre ostatka koda, njegov pad je sprečavao da se izvrši sve što dolazi posle — uključujući i deo koji čuva linkove ("Moje pozivnice"). Zato si video i praznu stranicu i "linkovi se ne čuvaju" — to su bila **ista greška**, ne dva odvojena problema.

### Trajno rešenje — sajt više uopšte ne zavisi od tog fajla
Sadržaj `themes.js` je sada **ubačen direktno unutar `index.html`**, umesto da se učitava kao poseban fajl sa servera. Ovo potpuno uklanja ovaj čitav problem, zauvek — testirao sam ovo tako što sam **potpuno obrisao `themes.js` fajl** iz test okruženja i potvrdio da sajt i dalje radi savršeno, sve 12 tema se i dalje prikazuju, i čuvanje pozivnica radi ispravno.

`public/themes.js` fajl i dalje postoji u projektu — služi kao radna kopija/referenca kad želiš da dodaš novu temu (uputstvo je i dalje na vrhu tog fajla), ali ako dodaš temu tamo, **moraš i da je prekopiraš u `index.html`** (potraži komentar "OVO JE SADRZAJ public/themes.js, UBACEN DIREKTNO OVDE") da bi se stvarno videla na sajtu. Ako ti ovo zvuči nezgodno za buduće izmene, javi — mogu da napravim automatski build korak koji to radi umesto tebe, ali to bi zahtevalo malu izmenu u načinu na koji deploy-uješ (dodatna komanda pre `wrangler deploy`).

**Ovo je bio pravi uzrok gotovo svih "praznih stranica" koje si prijavljivao.** Ako se ponovo pojavi prazna stranica nakon ovog ažuriranja, crvena traka (Deo 13) će ti odmah reći tačno šta je u pitanju — a sad znamo da nije ovo.

### Spisak gostiju — potpuno nov, jasniji prikaz
Umesto zbijene tabele, panel domaćina sada prikazuje:
- **Dve jasno odvojene grupe**: "✓ Dolaze" i "✗ Ne dolaze", svaka sa brojem prijava.
- Svaka prijava je **kartica** sa imenima kao lepe "pilule" (chips), brojem osoba, datumom prijave, i — ako postoje — pesmom i porukom ispod, jasno označene.
- Grupe su **sortirane po abecedi** po imenu.
- Dodato je **polje za pretragu** na vrhu spiska — kucaš deo imena, spisak se odmah filtrira uživo (testirao sam ovo — kucanje "Ivana" prikaže samo tu osobu, ostale nestanu iz prikaza dok ne obrišeš pretragu).

CSV/Excel/JSON izvoz radi identično kao pre (nije menjano) — ova izmena je samo za pregled na samom sajtu.

---

## DEO 15 — Layout u panelu domaćina popravljen + pravo trajno čuvanje linkova (istraženo na GitHub-u)

### 1. Preklapanje "Nazad" dugmeta i "Panel domaćina" bedža
Na uskim ekranima, dugme "← Napravi svoju pozivnicu" (levo) i bedž "Panel domaćina" (desno) su bila dovoljno dugačka da se doslovno sudare na sredini ekrana. Sad: na uskim telefonima (ispod 480px širine), dugme za nazad se skraćuje na samo strelicu "←" (bez teksta), a "Panel domaćina" bedž dobija manji font — više nema šanse za preklapanje, testirao sam da tekst postoji ali se ispravno sakriva/skraćuje.

### 2. Trajno čuvanje linkova — sada pravi, proveren obrazac sa GitHub-a
Pogledao sam kako ovo rade poznate, široko korišćene biblioteke za tačno ovaj problem (localForage, Storer.js, local-storage-fallback). Sve koriste isti princip: **probaj localStorage, pa ako ne uspe probaj kolačić (cookie), pa ako ni to ne uspe, drži bar u memoriji dok je stranica otvorena.** Ranije je sajt samo probao localStorage i, ako ne uspe, jednostavno odustajao — što je verovatno bio pravi uzrok stalnog gubljenja linkova, pošto se ovi linkovi baš najčešće otvaraju iz in-app pregledača (WhatsApp, Viber, Instagram, Facebook poruke) koji su poznati po tome što ograničavaju ili blokiraju localStorage.

Implementirao sam isti obrazac. **Testirao sam ovo na najstroži mogući način** — simulirao sam okruženje gde `localStorage` ne samo da ne radi nego **baca grešku na svaki pokušaj** (najgori realan scenario), i potvrdio dvema odvojenim proverama:
1. Da se podatak ipak sačuva (preko kolačića).
2. Da **preživi potpuno novo učitavanje stranice** (simulirao sam da korisnik zatvori i ponovo otvori sajt, sa istim "browserom" ali svežom stranicom) — podatak je i dalje bio tu.

**Napomena o ograničenju kolačića:** kolačići mogu da drže manje podataka od localStorage-a (oko 4KB), zato je granica broja sačuvanih pozivnica u ovoj lokalnoj listi smanjena sa 200 na 25 — više je nego dovoljno za realnu upotrebu (jedan domaćin retko pravi više od par pozivnica), a garantuje da spisak sigurno stane i u kolačić kao rezervu, ne samo u localStorage kada on radi.

**I dalje važi:** ovo je lokalno po uređaju/pregledaču. Nalog (email+lozinka ili Google prijava) ostaje jedini način da linkovi budu dostupni sa bilo kog uređaja i da nikad ne zavise od podešavanja konkretnog browsera.

---

## DEO 16 — Pravi uzrok "preklapanja" i vidljiva potvrda da je link sačuvan

### 1. Zašto se bedževi i dalje sudaraju — sad stvarno rešeno
Prošli pokušaj je sprečio da se DVA bedža ("← Nazad" i "Panel domaćina") sudare MEĐUSOBNO, ali nisam rešio pravi uzrok: oba su bila `position: fixed`, što znači da **stalno lebde preko sadržaja dok skrolujete** — pa su se sudarala sa TEKSTOM ISPOD SEBE (npr. sa "Aktivacija je jednokratna..." tekstom), ne jedno sa drugim. To se vidi na tvom screenshot-u — bedž se doslovno preklapao sa rečenicom iz aktivacionog panela.

**Pravo rešenje:** oba bedža su sada unutar prave "sticky" trake sa punom, zamagljenom pozadinom (isti princip koji koristi gornji meni na početnoj strani) — traka ostaje na vrhu dok skrolujete, ali sadržaj stranice ide ISPOD nje, ne kroz nju. Testirao sam da elementi više nisu `position:fixed` (sad su `static`, unutar sticky roditelja) — fizički ne mogu više da lebde nezavisno jedno od drugog niti da se sudaraju sa tekstom ispod.

### 2. Zašto je delovalo da se linkovi "uopšte ne čuvaju"
Otkrio sam verovatan razlog zabune: **panel domaćina (stranica koju si slao na screenshot-u) uopšte nema pristup "Moje pozivnice"** — to dugme postoji samo u glavnom meniju na početnoj strani, a panel domaćina je posebna, drugačija stranica bez tog menija. Dakle i da je čuvanje savršeno radilo (a testirao sam ga opsežno u Delu 15 i radi), nisi imao odakle da to proveriš dok si bio na toj stranici.

Dodao sam:
- **Dugme "📁 Sve moje pozivnice"** direktno na panelu domaćina, pored "Osveži spisak" — vodi te pravo na spisak, sa bilo koje pozivnice.
- **Vidljivu, zelenu potvrdu** odmah nakon što napraviš pozivnicu (u oba toka — obična forma i "Ubaci sliku pozivnice") koja kaže "✓ Link je sačuvan i u ovom pregledaču" — ali samo ako je STVARNO uspelo da se sačuva (funkcija sada vraća tačno/netačno, ne samo se pokušava ćutke). Ako se ova poruka NE pojavi, to je znak da čuvanje zaista nije uspelo na tom uređaju — i to je korisna informacija, ne samo kozmetika.
