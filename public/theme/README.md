# Sistem tema po fajlu (public/theme/)

Ovaj folder sadrži premium teme pozivnica kao **zasebne HTML fajlove**. Svaki fajl je
kompletna, samostalna vizuelna tema — sopstveni CSS, sopstveni raspored, sopstvene
animacije.

## VAŽNO — bezbednosni princip

Ove teme se **NE učitavaju u browseru gosta preko interneta** (to bi bilo rizično —
ako fajl ne stigne na vreme, gost bi video praznu stranicu). Umesto toga, **Cloudflare
Worker (server) učitava fajl, popunjava placeholder-e stvarnim podacima, i tek onda
šalje gotov, kompletan HTML gostu.** Ako nešto pođe po zlu (fajl nedostaje, neispravan
je), server se automatski vraća na proverenu, staru verziju sajta — gost nikad ne vidi
prazno.

## Kako se dodaje nova tema

1. Napravi novi `.html` fajl u ovom folderu (npr. `wedding-modern.html`), po uzoru na
   `wedding-elegant.html` — kopiraj ceo fajl i menjaj CSS/HTML kako želiš.
2. Koristi placeholder-e (tačan spisak ispod) tamo gde treba da uđu stvarni podaci.
3. Dodaj novi unos u `manifest.json` (kopiraj postojeći blok, promeni `id`, `file`,
   `name`, `type`, `colors`).
4. Sačuvaj, commit-uj na GitHub, sačekaj automatski deploy. Nova tema se pojavljuje
   u galeriji šablona na sajtu.

## Dostupni placeholder-i

| Placeholder | Šta se ubacuje |
|---|---|
| `{{title}}` | Naslov pozivnice (npr. "Goca & Branko") |
| `{{date}}` | Datum događaja, formatiran (npr. "14. jun 2026.") |
| `{{date_label}}` | Reč ispred datuma ("Subota," i sl.) — može biti prazno |
| `{{time_suffix}}` | " u 17:00h" (sa razmakom ispred) ako je vreme uneto, inače prazno |
| `{{message}}` | Poruka gostima koju je domaćin uneo |
| `{{cover_image}}` | URL naslovne fotografije (ako nije uneta, `cover_display` je "none") |
| `{{cover_display}}` | "block" ili "none" — koristi se kao `style="display:{{cover_display}}"` da se ceo okvir sakrije ako nema slike |
| `{{persons_html}}` | Gotov HTML blok sa svim unetim osobama (mladenci, kumovi...), server ga sam sastavlja — tema stilizuje `.person`, `.ph`, `.role`, `.name` klase |
| `{{persons_section_display}}` | "block"/"none" — sakriva celu sekciju ako nema unetih osoba |
| `{{locations_html}}` | Gotov HTML blok sa svim lokacijama/terminima, server sastavlja — tema stilizuje `.card` klasu |
| `{{gallery_html}}` | Gotov HTML blok sa `<img>` tagovima iz galerije |
| `{{gallery_section_display}}` | "block"/"none" — sakriva sekciju galerije ako nema slika |
| `{{countdown_target}}` | ISO datum/vreme za JS odbrojavanje (npr. "2026-06-14T14:00:00"), prazno ako nema datuma |
| `{{countdown_display}}` | "block"/"none" — sakriva sekciju odbrojavanja ako nema datuma |
| `{{rsvp_url}}` | Link ka postojećoj, već testiranoj RSVP formi — dugme "Potvrdi dolazak" MORA linkovati ovde, ne pravi svoju formu |

## Pravilo koje se mora poštovati

**Dugme "Potvrdi dolazak" mora biti obična `<a>` veza ka `{{rsvp_url}}`, ne svoja
forma.** RSVP sistem (čuvanje odgovora, brojanje gostiju, izvoz u CSV/Excel) je
složen, testiran, i deljen sa ostatkom sajta — ne treba ga ponovo praviti u svakoj
temi. Ako klikne to dugme, gost odlazi na postojeću, proverenu formu.
