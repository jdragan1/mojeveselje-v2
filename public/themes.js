/* ============================================================
   ⚠️ OVAJ FAJL SE TRENUTNO NE UČITAVA NA SAJTU — NIJE "UŽIVO".
   Zbog jednog ranijeg bag-a (prazna stranica kad spoljni script ne uspe da
   se učita), sadržaj ovog fajla je u jednom trenutku RUČNO prekopiran
   direktno unutar <script> taga u public/index.html, i taj ugrađeni primerak
   je ono što sajt STVARNO koristi — ne ovaj fajl.

   AKO DODAJEŠ/MENJAŠ TEMU: moraš istu izmenu uraditi i u public/index.html
   (potraži "const CUSTOM_THEMES" unutar <script> tagova, blizu vrha glavnog
   JS bloka) — ili izmena neće imati nikakav efekat na sajt. Ovaj fajl je
   ostavljen samo kao čitljiva referenca/kopija sadržaja, radi lakšeg
   pregleda van ogromnog index.html fajla.
============================================================ */

/* ============================================================
   SOPSTVENE TEME — ovde dodaješ nove stilove pozivnica.
   Ovaj fajl možeš slobodno menjati bez diranja glavne aplikacije.

   Namerno je svedeno na TAČNO 3 teme po kategoriji (venčanje, krštenje,
   ispraćaj, ostalo) — manje izbora, ali svaka je vizuelno dovedena do kraja
   (suptilne animacije, sjaj, tekstura) umesto da imamo 15 prosečnih tema.

   Kako se dodaje nova tema:
   1. Kopiraj ceo jedan blok iz CUSTOM_THEMES niza ispod (od { do },).
   2. Promeni "id" u nešto jedinstveno (npr. "rodjendan-svemir").
   3. Promeni "tpl" na kategoriju kojoj tema pripada: "vencanje", "krstenje", "ispracaj" ili "ostalo"
      (ovo određuje koje se sekcije/nazivi koriste — npr. "Mladenci" za venčanje).
   4. Promeni "label" (ime koje se vidi) i "swatch" (boje kružića za izbor).
   5. U "css" nalepi svoj CSS — možeš menjati boje, fontove, pozadinu, dekoracije, sve.
      Selektor #view-app[data-theme="TPL"][data-style="ID"] mora ostati isti kao "tpl" i "id" koje si izabrao.
   6. Sačuvaj fajl — nova tema se automatski pojavljuje u galeriji šablona.

   Svaka tema MORA definisati bar ove CSS promenljive (--v-bg, --v-ink, --v-accent,
   --v-accent2, --v-deep, --v-card, --v-display, --v-body) da bi ostatak aplikacije
   (dugmad, RSVP forma, kartice) izgledao ispravno. Sve ostalo (pozadine, ivice,
   fontovi, animacije) je slobodno za dodavanje.
============================================================ */

const CUSTOM_THEMES = [

  /* ============================== VENČANJE — 3 teme ============================== */
  {
    id: 'smaragd',
    tpl: 'vencanje',
    label: 'Smaragdna elegancija',
    swatch: 'linear-gradient(135deg,#1F3B32,#C9A24B,#0F241E)',
    badge: 'NAJPOPULARNIJE',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Jost:wght@300;400;500&display=swap'],
    css: `
      #view-app[data-theme="vencanje"][data-style="smaragd"]{
        --v-bg:#1B332B; --v-ink:#F2EFE4; --v-accent:#C9A24B; --v-accent2:#8FA98F;
        --v-deep:#102019; --v-card:#233F35;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-hero{ background:radial-gradient(circle at 50% 20%,#254539,#152922 70%); position:relative; overflow:hidden; }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-hero:after{
        content:''; position:absolute; inset:0; pointer-events:none; opacity:.5;
        background-image:radial-gradient(circle at 15% 25%, rgba(201,162,75,.5) 0 1.5px, transparent 2px),
          radial-gradient(circle at 82% 18%, rgba(201,162,75,.4) 0 1px, transparent 2px),
          radial-gradient(circle at 70% 75%, rgba(201,162,75,.45) 0 1.5px, transparent 2px),
          radial-gradient(circle at 25% 82%, rgba(201,162,75,.35) 0 1px, transparent 2px),
          radial-gradient(circle at 92% 55%, rgba(201,162,75,.4) 0 1px, transparent 2px);
        animation: smShimmerDust 5s ease-in-out infinite;
      }
      @keyframes smShimmerDust{ 0%,100%{opacity:.25;} 50%{opacity:.65;} }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-names{
        font-weight:500; letter-spacing:.02em; position:relative; z-index:1;
        background:linear-gradient(100deg,#C9A24B 20%,#F3E2B3 42%,#C9A24B 65%);
        background-size:220% auto; -webkit-background-clip:text; background-clip:text; color:transparent;
        animation: smGoldShine 4.5s linear infinite;
      }
      @keyframes smGoldShine{ 0%{background-position:0% 0;} 100%{background-position:-220% 0;} }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-kicker{ color:var(--v-accent); letter-spacing:.28em; position:relative; z-index:1; }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-sub{ position:relative; z-index:1; }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-person img{ border:2px solid var(--v-accent); box-shadow:0 0 0 5px rgba(201,162,75,.15); transition:box-shadow .4s; }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-person:hover img{ box-shadow:0 0 0 8px rgba(201,162,75,.22); }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-event-card,
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-detail-card,
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-gift-card{ border:1px solid rgba(201,162,75,.3); position:relative; }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-event-card:before{
        content:''; position:absolute; top:8px; left:8px; right:8px; bottom:8px; border:1px solid rgba(201,162,75,.18); pointer-events:none;
      }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-submit{ background:linear-gradient(100deg,#C9A24B,#E4C878,#C9A24B); background-size:220% auto; transition:background-position .5s; }
      #view-app[data-theme="vencanje"][data-style="smaragd"] .v-submit:hover{ background-position:-100% 0; }
    `
  },
  {
    id: 'terakota',
    tpl: 'vencanje',
    label: 'Terakota & kadulja',
    badge: 'MODERNO',
    swatch: 'linear-gradient(135deg,#C1694F,#8A9A7E,#FBF3EA)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Jost:wght@300;400;500&display=swap'],
    css: `
      /* Namerno mirna, "prizemljena" paleta (terakota + kadulja zelena na kremu) —
         ovo je trenutno dominantan pravac kod modernih svadbenih poziva: puno
         praznog prostora, tanak serif, bez kurziva/srca/preteranih ukrasa. */
      #view-app[data-theme="vencanje"][data-style="terakota"]{
        --v-bg:#FBF3EA; --v-ink:#3A2E24; --v-accent:#C1694F; --v-accent2:#8A9A7E;
        --v-deep:#2E241C; --v-card:#FFFFFF;
        --v-display:'Fraunces',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-hero{ background:#FBF3EA; position:relative; }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-kicker{
        color:var(--v-accent2); letter-spacing:.32em; font-weight:500; text-transform:uppercase; font-size:11.5px;
      }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-names{
        font-weight:400; letter-spacing:.01em; color:var(--v-deep); position:relative;
      }
      /* Potpisni element: tanka linija koja se "iscrtava" ispod imena kad se
         stranica učita — jedini pokret na inače potpuno mirnoj, disciplinovanoj
         strani (isti princip kao u demo pregledu ove teme). */
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-names:after{
        content:''; display:block; width:46px; height:1px; background:var(--v-accent);
        margin:18px auto 0; transform:scaleX(0); animation:terakotaDraw 1.1s cubic-bezier(.4,0,.2,1) .5s forwards;
      }
      @keyframes terakotaDraw{ to{ transform:scaleX(1); } }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-section h2{ font-weight:400; color:var(--v-deep); }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-person img{ border-radius:50%; border:1px solid rgba(138,154,126,.4); }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-event-card,
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-detail-card,
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-gift-card{
        border:1px solid rgba(138,154,126,.3); border-radius:2px; box-shadow:none;
      }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-gallery img{ border-radius:2px; }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-submit{
        background:var(--v-accent); border-radius:2px; letter-spacing:.05em; font-weight:500;
        transition:background .3s;
      }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-submit:hover{ background:#A6563F; }
      #view-app[data-theme="vencanje"][data-style="terakota"] .v-count .box{ border:1px solid rgba(138,154,126,.35); border-radius:2px; }
    `
  },
  {
    id: 'noc',
    demoPhoto: '/images/silueta-prosidba.jpg',
    tpl: 'vencanje',
    label: 'Noć zaljubljenih',
    badge: 'NOVO',
    swatch: 'linear-gradient(135deg,#0B1330,#E8B84B,#060A1C)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,500&display=swap'],
    css: `
      #view-app[data-theme="vencanje"][data-style="noc"]{
        --v-bg:#0B1330; --v-ink:#EFEFF5; --v-accent:#E8B84B; --v-accent2:#8C6BAE;
        --v-deep:#060A1C; --v-card:#141B3D;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-hero-overlay{ background:linear-gradient(185deg,rgba(6,10,28,.25),rgba(6,10,28,.55) 45%,rgba(6,10,28,.88)); }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-hero:after{
        content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
        background-image:radial-gradient(circle at 12% 18%, #fff 0 1.5px, transparent 2px),
          radial-gradient(circle at 78% 12%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 55% 28%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 30% 40%, #fff 0 1.5px, transparent 2px),
          radial-gradient(circle at 88% 40%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 18% 55%, #fff 0 1px, transparent 2px);
        animation: nocTwinkle 3.2s ease-in-out infinite;
      }
      @keyframes nocTwinkle{ 0%,100%{opacity:.35;} 50%{opacity:1;} }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-kicker{ color:var(--v-accent); position:relative; z-index:2; }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-names{ color:#fff; text-shadow:0 4px 24px rgba(0,0,0,.55); position:relative; z-index:2; }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-sub{ color:#fff; position:relative; z-index:2; }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-count{ position:relative; z-index:2; }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-count .box b{ color:#fff; }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-count .box span{ color:#fff; }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-event-card,
      #view-app[data-theme="vencanje"][data-style="noc"] .v-person,
      #view-app[data-theme="vencanje"][data-style="noc"] .v-detail-card,
      #view-app[data-theme="vencanje"][data-style="noc"] .v-gift-card{ border:1px solid rgba(232,184,75,.25); }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-rsvp{ background:var(--v-deep); }
      #view-app[data-theme="vencanje"][data-style="noc"] .v-submit{ box-shadow:0 0 0 0 rgba(232,184,75,.5); animation: nocPulse 2.6s ease-in-out infinite; }
      @keyframes nocPulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(232,184,75,.35); } 50%{ box-shadow:0 0 0 8px rgba(232,184,75,0); } }
    `
  },

  /* ============================== KRŠTENJE — 3 teme (nove, ranije nije bilo posebnih) ============================== */
  {
    id: 'nebo',
    tpl: 'krstenje',
    label: 'Nebesko plavetnilo',
    badge: 'NOVO',
    swatch: 'linear-gradient(135deg,#DCEEF7,#8FB6C7,#C7A85E)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Jost:wght@400;500&display=swap'],
    css: `
      #view-app[data-theme="krstenje"][data-style="nebo"]{
        --v-bg:#F3F9FC; --v-ink:#24343F; --v-accent:#7DAFC4; --v-accent2:#C7A85E;
        --v-deep:#3E5C6E; --v-card:#FFFFFF;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-hero{ background:linear-gradient(180deg,#EAF5FA,#D8ECF4); position:relative; overflow:hidden; }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-hero:before,
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-hero:after{
        content:''; position:absolute; width:120px; height:44px; border-radius:50px; background:rgba(255,255,255,.75);
        box-shadow:-24px 8px 0 -6px rgba(255,255,255,.6), 26px 4px 0 -8px rgba(255,255,255,.55);
        animation: nebDrift 22s linear infinite;
      }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-hero:before{ top:14%; left:-140px; animation-delay:0s; }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-hero:after{ top:32%; left:-140px; animation-delay:-11s; transform:scale(.7); }
      @keyframes nebDrift{ from{ transform:translateX(0); } to{ transform:translateX(160vw); } }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-names{ font-weight:500; position:relative; z-index:1; color:var(--v-deep); }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-kicker{ color:var(--v-accent2); letter-spacing:.26em; position:relative; z-index:1; }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-kicker:before{ content:'✦ '; }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-kicker:after{ content:' ✦'; }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-event-card,
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-person,
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-gift-card{ border-radius:16px; border:1px solid rgba(125,175,196,.3); }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-rsvp{ background:var(--v-deep); border-radius:16px; }
      #view-app[data-theme="krstenje"][data-style="nebo"] .v-submit{ border-radius:30px; }
    `
  },
  {
    id: 'zvezdano',
    tpl: 'krstenje',
    label: 'Zvezdano krštenje',
    swatch: 'linear-gradient(135deg,#0F1B33,#C7A85E,#080D1C)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500&display=swap'],
    css: `
      #view-app[data-theme="krstenje"][data-style="zvezdano"]{
        --v-bg:#0F1B33; --v-ink:#EDEFF6; --v-accent:#C7A85E; --v-accent2:#8FB6C7;
        --v-deep:#080D1C; --v-card:#182545;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-hero{ background:radial-gradient(circle at 50% 15%,#1C2D52,#0F1B33 75%); position:relative; overflow:hidden; }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-hero:after{
        content:''; position:absolute; inset:0; pointer-events:none;
        background-image:radial-gradient(circle at 15% 20%, #fff 0 1.5px, transparent 2px),
          radial-gradient(circle at 80% 15%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 55% 30%, #C7A85E 0 2px, transparent 3px),
          radial-gradient(circle at 30% 50%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 90% 55%, #fff 0 1.5px, transparent 2px);
        animation: zvTwinkle 3.4s ease-in-out infinite;
      }
      @keyframes zvTwinkle{ 0%,100%{opacity:.4;} 50%{opacity:1;} }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-names{ color:#fff; font-weight:600; position:relative; z-index:1; }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-kicker{ color:var(--v-accent); letter-spacing:.28em; position:relative; z-index:1; }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-sub{ color:#fff; opacity:.85; position:relative; z-index:1; }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-event-card,
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-person,
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-gift-card{ border:1px solid rgba(199,168,94,.3); }
      #view-app[data-theme="krstenje"][data-style="zvezdano"] .v-rsvp{ background:var(--v-deep); }
    `
  },
  {
    id: 'puder',
    tpl: 'krstenje',
    label: 'Puder nežnost',
    swatch: 'linear-gradient(135deg,#FCF3F5,#E8A9BB,#C9A24B)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,500&family=Jost:wght@400;500&display=swap'],
    css: `
      #view-app[data-theme="krstenje"][data-style="puder"]{
        --v-bg:#FDF5F7; --v-ink:#3A2A30; --v-accent:#E8A9BB; --v-accent2:#C9A24B;
        --v-deep:#7A3E52; --v-card:#FFFFFF;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-names{ font-style:italic; font-weight:500; }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-kicker{ color:var(--v-deep); }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-kicker:before,
      #view-app[data-theme="krstenje"][data-style="puder"] .v-kicker:after{ content:'❀'; color:var(--v-accent); margin:0 8px; display:inline-block; animation: pudSpin 6s linear infinite; }
      @keyframes pudSpin{ from{transform:rotate(0);} to{transform:rotate(360deg);} }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-person img{ border:3px solid var(--v-accent); }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-event-card,
      #view-app[data-theme="krstenje"][data-style="puder"] .v-gift-card{ border-radius:22px; box-shadow:0 14px 30px -18px rgba(122,62,82,.35); }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-submit{ border-radius:30px; }
      #view-app[data-theme="krstenje"][data-style="puder"] .v-gallery img{ border-radius:18px; }
    `
  },

  /* ============================== ISPRAĆAJ — 3 teme (nove, dostojanstvene) ============================== */
  {
    id: 'tihaelegancija',
    tpl: 'ispracaj',
    label: 'Tiha elegancija',
    badge: 'NOVO',
    swatch: 'linear-gradient(135deg,#2A2A28,#8C8577,#F2F0EC)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap'],
    css: `
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"]{
        --v-bg:#F4F2ED; --v-ink:#2A2A28; --v-accent:#7A7466; --v-accent2:#4C5E48;
        --v-deep:#33322E; --v-card:#FFFFFF;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-hero{ background:linear-gradient(180deg,#F7F5F0,#EDEAE2); }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-kicker{ letter-spacing:.34em; font-size:10.5px; color:var(--v-accent); }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-names{ font-weight:400; font-style:italic; opacity:0; animation: tiFadeIn 1.6s ease .2s forwards; }
      @keyframes tiFadeIn{ to{ opacity:1; } }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-sub{ opacity:.75; }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-event-card{ border:1px solid rgba(122,116,102,.25); box-shadow:none; }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-section h2{ font-weight:400; letter-spacing:.02em; }
      #view-app[data-theme="ispracaj"][data-style="tihaelegancija"] .v-submit{ letter-spacing:.14em; text-transform:uppercase; font-size:12px; border-radius:2px; }
    `
  },
  {
    id: 'plavispokoj',
    tpl: 'ispracaj',
    label: 'Plavi spokoj',
    swatch: 'linear-gradient(135deg,#0E1420,#6E85A6,#B7A16B)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap'],
    css: `
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"]{
        --v-bg:#121826; --v-ink:#E7E9ED; --v-accent:#8CA3C4; --v-accent2:#B7A16B;
        --v-deep:#0A0D14; --v-card:#1A2233;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-hero{ background:radial-gradient(circle at 50% 30%,#1B2436,#121826 75%); position:relative; overflow:hidden; }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-hero:after{
        content:''; position:absolute; inset:0; pointer-events:none; opacity:.4;
        background-image:radial-gradient(circle at 20% 25%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 75% 20%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 50% 45%, #B7A16B 0 1.5px, transparent 2.5px),
          radial-gradient(circle at 85% 60%, #fff 0 1px, transparent 2px);
        animation: psTwinkle 5s ease-in-out infinite;
      }
      @keyframes psTwinkle{ 0%,100%{opacity:.25;} 50%{opacity:.55;} }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-names{ color:#fff; font-weight:400; position:relative; z-index:1; }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-kicker{ color:var(--v-accent2); letter-spacing:.3em; position:relative; z-index:1; }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-sub{ color:#fff; opacity:.7; position:relative; z-index:1; }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-event-card{ border:1px solid rgba(183,161,107,.25); }
      #view-app[data-theme="ispracaj"][data-style="plavispokoj"] .v-rsvp{ background:var(--v-deep); }
    `
  },
  {
    id: 'belimir',
    tpl: 'ispracaj',
    label: 'Beli mir',
    swatch: 'linear-gradient(135deg,#FFFFFF,#D9D4C7,#A98F6E)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap'],
    css: `
      #view-app[data-theme="ispracaj"][data-style="belimir"]{
        --v-bg:#FDFCFA; --v-ink:#33291F; --v-accent:#A98F6E; --v-accent2:#7A6A57;
        --v-deep:#4A3E30; --v-card:#FFFFFF;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="ispracaj"][data-style="belimir"] .v-names{ font-weight:400; letter-spacing:.01em; }
      #view-app[data-theme="ispracaj"][data-style="belimir"] .v-kicker{ color:var(--v-accent); letter-spacing:.3em; font-size:10.5px; }
      #view-app[data-theme="ispracaj"][data-style="belimir"] .v-kicker:before{ content:''; display:block; width:40px; height:1px; background:var(--v-accent); margin:0 auto 14px; }
      #view-app[data-theme="ispracaj"][data-style="belimir"] .v-event-card{ border:1px solid rgba(169,143,110,.3); box-shadow:none; }
      #view-app[data-theme="ispracaj"][data-style="belimir"] .v-section h2{ font-weight:400; }
      #view-app[data-theme="ispracaj"][data-style="belimir"] .v-submit{ background:var(--v-deep); letter-spacing:.1em; text-transform:uppercase; font-size:12px; }
    `
  },

  /* ============================== OSTALE PROSLAVE — 3 teme ============================== */
  {
    id: 'jubilej',
    tpl: 'ostalo',
    label: 'Jubilej / Korporativni event',
    swatch: 'linear-gradient(135deg,#0B2540,#C9A24B,#0B2540)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&display=swap'],
    css: `
      #view-app[data-theme="ostalo"][data-style="jubilej"]{
        --v-bg:#F5F3EE; --v-ink:#12233A; --v-accent:#C9A24B; --v-accent2:#0B2540;
        --v-deep:#0B2540; --v-card:#FFFFFF;
        --v-display:'Cormorant Garamond',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-hero{ background-color:#0B2540; position:relative; overflow:hidden; }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-hero-overlay{ background:linear-gradient(180deg,rgba(11,37,64,.2),rgba(11,37,64,.85)); }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-names{
        color:#fff; font-weight:600; letter-spacing:.01em; position:relative; z-index:1;
        background:linear-gradient(100deg,#fff 20%,#C9A24B 45%,#fff 70%); background-size:220% auto;
        -webkit-background-clip:text; background-clip:text; color:transparent; animation: jubShine 5s linear infinite;
      }
      @keyframes jubShine{ 0%{background-position:0% 0;} 100%{background-position:-220% 0;} }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-kicker{ color:var(--v-accent); text-transform:uppercase; letter-spacing:.28em; font-size:11px; position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-sub{ color:#fff; opacity:.85; position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-section h2{ font-weight:600; letter-spacing:.01em; }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-event-card,
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-person,
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-detail-card,
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-gift-card{ border:1px solid rgba(201,162,75,.35); border-radius:2px; }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-rsvp{ background:var(--v-deep); border-radius:2px; }
      #view-app[data-theme="ostalo"][data-style="jubilej"] .v-submit{ border-radius:2px; letter-spacing:.06em; text-transform:uppercase; font-size:13px; }
    `
  },
  {
    id: 'devojacko',
    tpl: 'ostalo',
    label: 'Devojačko veče',
    swatch: 'linear-gradient(135deg,#F7D9E3,#D6A4C4,#FFFFFF)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,800&family=Poppins:wght@400;500;600&display=swap'],
    css: `
      #view-app[data-theme="ostalo"][data-style="devojacko"]{
        --v-bg:#FFF7FA; --v-ink:#3A1F30; --v-accent:#D6A4C4; --v-accent2:#E8B84B;
        --v-deep:#7A2F58; --v-card:#FFFFFF;
        --v-display:'Playfair Display',serif; --v-body:'Poppins',sans-serif;
      }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-hero{ background:linear-gradient(160deg,#FFE9F1,#F7D9E3); position:relative; overflow:hidden; }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-hero:before,
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-hero:after{
        content:'✦'; position:absolute; color:rgba(232,184,75,.5); pointer-events:none; animation: devFloat 5s ease-in-out infinite;
      }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-hero:before{ top:16%; left:10%; font-size:22px; }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-hero:after{ bottom:18%; right:12%; font-size:28px; animation-delay:1.4s; }
      @keyframes devFloat{ 0%,100%{ transform:translateY(0) rotate(0); opacity:.5; } 50%{ transform:translateY(-12px) rotate(20deg); opacity:1; } }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-names{ font-style:italic; font-weight:800; position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-kicker{ background:var(--v-accent); color:#fff; display:inline-block; padding:6px 18px; border-radius:20px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; font-size:10.5px; position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-section h2{ font-style:italic; }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-event-card,
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-person,
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-gift-card{ border-radius:24px; border:2px solid var(--v-accent); }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-submit{ border-radius:30px; background:var(--v-accent2); font-weight:600; }
      #view-app[data-theme="ostalo"][data-style="devojacko"] .v-gallery img{ border-radius:18px; }
    `
  },
  {
    id: 'konfeti',
    tpl: 'ostalo',
    label: 'Rođendanska proslava',
    swatch: 'linear-gradient(135deg,#FF6F91,#FFC75F,#845EC2)',
    badge: 'ZA ROĐENDANE',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@400;500;600;700&display=swap'],
    css: `
      #view-app[data-theme="ostalo"][data-style="konfeti"]{
        --v-bg:#FFF7F0; --v-ink:#3B2E3A; --v-accent:#FF6F91; --v-accent2:#845EC2;
        --v-deep:#2E2438; --v-card:#FFFFFF;
        --v-display:'Fredoka',sans-serif; --v-body:'Quicksand',sans-serif;
      }
      /* Vedra, toplo-pastelna pozadina umesto tamnog "svemira" — modernije i čitljivije,
         i jasno se uklapa u proslavu, ne u naučnofantastičnu temu. */
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-hero{
        background:radial-gradient(circle at 20% 15%, rgba(255,199,95,.35), transparent 45%),
                   radial-gradient(circle at 85% 20%, rgba(132,94,194,.25), transparent 50%),
                   radial-gradient(circle at 50% 90%, rgba(255,111,145,.3), transparent 55%),
                   #FFF7F0;
        position:relative; overflow:hidden;
      }
      /* Konfete koje lagano padaju — suptilno, ne agresivno, radi na svim uređajima
         jer su čist CSS (bez slika, bez JS-a, bez uticaja na brzinu učitavanja). */
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-hero:before{
        content:''; position:absolute; inset:-10% 0 0 0; pointer-events:none; opacity:.85;
        background-image:
          radial-gradient(circle, #FF6F91 0 5px, transparent 6px),
          radial-gradient(circle, #FFC75F 0 4px, transparent 5px),
          radial-gradient(circle, #845EC2 0 4.5px, transparent 5.5px),
          radial-gradient(circle, #4FCB53 0 4px, transparent 5px),
          radial-gradient(circle, #4D8AF0 0 4px, transparent 5px);
        background-position: 8% 5%, 25% 18%, 48% 8%, 68% 22%, 88% 6%;
        background-repeat: no-repeat;
        animation: kfFall 6s linear infinite;
      }
      @keyframes kfFall{ 0%{ transform:translateY(-10%) rotate(0deg); } 100%{ transform:translateY(120%) rotate(180deg); } }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-names{
        font-weight:600; position:relative; z-index:1; color:var(--v-deep);
        text-shadow:2px 2px 0 rgba(255,199,95,.6);
      }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-kicker{
        background:linear-gradient(100deg,var(--v-accent),var(--v-accent2));
        color:#fff; display:inline-block; padding:7px 18px; border-radius:20px;
        font-weight:700; letter-spacing:.02em; text-transform:none; position:relative; z-index:1;
        box-shadow:0 6px 16px -8px rgba(255,111,145,.6);
      }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-sub{ position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-section h2{ color:var(--v-deep); }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-event-card,
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-detail-card,
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-person,
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-gift-card{
        border-radius:22px; border:2px solid rgba(255,111,145,.25);
        box-shadow:0 12px 28px -18px rgba(132,94,194,.35);
      }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-person img{ border:3px solid #fff; box-shadow:0 0 0 3px var(--v-accent2); }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-submit{
        background:linear-gradient(100deg,var(--v-accent),var(--v-accent2),var(--v-accent));
        background-size:220% auto; border-radius:30px; font-weight:700;
        box-shadow:0 10px 24px -10px rgba(255,111,145,.55); transition:background-position .5s;
      }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-submit:hover{ background-position:-100% 0; }
      #view-app[data-theme="ostalo"][data-style="konfeti"] .v-gallery img{ border-radius:18px; }
    `
  },
  {
    id: 'zlatnagozba',
    tpl: 'ostalo',
    label: 'Zlatna gozba',
    badge: 'ELEGANTNO',
    swatch: 'linear-gradient(135deg,#181310,#D4AF6A,#7A3B3B)',
    fontLinks: ['https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,600&family=Jost:wght@300;400;500&display=swap'],
    css: `
      /* Elegantna, tamno-zlatna tema za jubileje i proslave punoletstva/okruglih
         rođendana odraslih — kontrast prema šarenoj "Rođendanskoj proslavi",
         za goste koji žele suptilniju, "restoransku" atmosferu. */
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"]{
        --v-bg:#181310; --v-ink:#F3ECE2; --v-accent:#D4AF6A; --v-accent2:#7A3B3B;
        --v-deep:#0F0B09; --v-card:#231C17;
        --v-display:'Fraunces',serif; --v-body:'Jost',sans-serif;
      }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-hero{
        background:radial-gradient(ellipse at 50% 100%, #2C1F16, #0F0B09 70%); position:relative; overflow:hidden;
      }
      /* Potpisni element: veliki, tanko-ocrtan sunčev/zvezdani motiv iza naslova,
         kao vodeni žig — jedan miran, samouveren potez umesto gomile sitnih ukrasa. */
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-hero:before{
        content:''; position:absolute; top:50%; left:50%; width:min(140vw,1100px); height:min(140vw,1100px);
        transform:translate(-50%,-52%); pointer-events:none;
        background:repeating-conic-gradient(from 0deg, rgba(212,175,106,.10) 0deg 1deg, transparent 1deg 15deg);
        border-radius:50%; -webkit-mask:radial-gradient(circle,#000 42%,transparent 72%); mask:radial-gradient(circle,#000 42%,transparent 72%);
      }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-kicker{ color:var(--v-accent); letter-spacing:.4em; position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-names{
        font-weight:440; position:relative; z-index:1; color:var(--v-ink);
      }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-names:after{
        content:''; display:block; width:1px; height:44px; background:linear-gradient(var(--v-accent),transparent); margin:26px auto 0;
      }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-sub{ position:relative; z-index:1; }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-section h2{ font-weight:440; }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-event-card,
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-detail-card,
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-person,
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-gift-card{
        border:1px solid rgba(212,175,106,.25); box-shadow:none;
      }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-rsvp{ background:var(--v-deep); }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-submit{
        background:var(--v-accent); color:#181310; letter-spacing:.08em; text-transform:uppercase; font-size:13px; font-weight:500;
        transition:background .3s;
      }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-submit:hover{ background:#EBD8A8; }
      #view-app[data-theme="ostalo"][data-style="zlatnagozba"] .v-count .box b{ color:var(--v-accent); font-weight:440; }
    `
  }
  // Dodaj sledeću temu ispod ovog reda, po istom obrascu (ne zaboravi zarez iznad).
];

/* ============================================================
   Ne menjaj ispod ove linije — ovo automatski učitava teme
   definisane iznad u aplikaciju (fontove, CSS, i dugmiće u galeriji).
============================================================ */
(function loadCustomThemes(){
  CUSTOM_THEMES.forEach(theme => {
    if (theme.fontLinks) {
      theme.fontLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      });
    }
    const style = document.createElement('style');
    style.textContent = theme.css;
    document.head.appendChild(style);
  });
  window.CUSTOM_THEMES = CUSTOM_THEMES;
})();
