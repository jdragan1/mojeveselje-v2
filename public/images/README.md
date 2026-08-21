# Slike — šta staviti u ovaj folder i kako da se zovu

## Već uključeno (iz tvojih poslatih šablona)
Ubacio sam dve slike iz besplatnih licenciranih šablona koje si poslao — legalne su za komercijalnu upotrebu (HTML Codex / ThemeWagon licence, CC BY 4.0 — otud kredit-link na dnu sajta, obavezan deo licence):
- `silueta-prosidba.jpg` — koristi se u novoj temi "Noć zaljubljenih" (Venčanje kategorija)
- `par-fotografija-1.jpg` — rezervna fotografija para, dostupna za dalju upotrebu

**Ako ikad poželiš da ukloniš kredit-link** (dole u footeru sajta) — HTML Codex nudi "Credit Removal License" po malu cenu (htmlcodex.com/credit-removal) po šablonu.

Trenutno sajt i dalje koristi besplatne generičke fotografije (Lorem Picsum / Unsplash) kao privremeno rešenje za DEMO kartice u galeriji. Kad ubaciš svoje prave fotografije ovde, po ovim tačnim imenima, sajt će automatski njih koristiti umesto generičkih — treba samo da promeniš par linija u `index.html` (uputstvo na dnu ovog fajla).

## Koje slike ti trebaju (prioritet — glavne 3)

Ovo su fotografije koje se prikazuju kao "naslovna" fotografija na karticama šablona u galeriji (Venčanje, Krštenje, Ostale proslave — Ispraćaj namerno nema fotografiju, iz poštovanja):

| Fajl (tačan naziv) | Za šta se koristi | Preporučena dimenzija |
|---|---|---|
| `vencanje-cover.jpg` | Kartice šablona za venčanje | 800×800px (kvadrat), do 300KB |
| `krstenje-cover.jpg` | Kartice šablona za krštenje | 800×800px (kvadrat), do 300KB |
| `ostalo-cover.jpg` | Kartice šablona za ostale proslave | 800×800px (kvadrat), do 300KB |

**Šta da bude na slikama:** nešto opšte i lepo — par u venčanici (bez lica ako želiš diskreciju — npr. samo ruke, buket, leđa), beba za krštenje, balon/torta za ostale proslave. Ne moraju biti od pravih klijenata — mogu biti kupljene sa Unsplash+/Depositphotos/Shutterstock (par desetina evra za paket) ili tvoje sopstvene.

## Opciono — bogatija galerija (16 slika, po jedna za svaki od 4 rasporeda × 4 kategorije)

Ako želiš da svaka od 16 kombinacija u galerij šablona ima svoju jedinstvenu fotografiju (ne istu za sve 4 rasporeda unutar kategorije):

```
vencanje-1.jpg   vencanje-2.jpg   vencanje-3.jpg   vencanje-4.jpg
krstenje-1.jpg   krstenje-2.jpg   krstenje-3.jpg   krstenje-4.jpg
ostalo-1.jpg     ostalo-2.jpg     ostalo-3.jpg     ostalo-4.jpg
```
(Ispraćaj namerno bez fotografija.)

Javi mi kad ih ubaciš pa ću ti povezati kod da čita svih 16 pojedinačno umesto po 1 za celu kategoriju.

## Kako da ih ubaciš (GitHub, sa telefona)

1. Uđi u `public/images` folder na GitHub-u.
2. **Add file → Upload files** → izaberi svoje fotografije sa telefona, sa tačnim imenima iz tabele iznad.
3. Commit.

## Kako da uključiš da ih sajt koristi

Otvori `public/index.html` na GitHub-u, pronađi (Edit → Ctrl+F / pretraga) ove tri linije (deo koda `CATEGORY_META`):

```
vencanje: {label:'Venčanje', ..., photo:'https://picsum.photos/seed/vencanje-cover/500/500'},
krstenje: {label:'Krštenje', ..., photo:'https://picsum.photos/seed/krstenje-cover/500/500'},
ostalo:   {label:'Ostale proslave', ..., photo:'https://picsum.photos/seed/ostalo-cover/500/500'}
```

Zameni svaki `photo:'https://picsum.photos/...'` sa `photo:'/images/vencanje-cover.jpg'` (i tako za krstenje i ostalo). Commit — gotovo, sajt sad koristi tvoje slike.

## Napomena o autorskim pravima

Ako kupuješ fotografije sa stock sajtova (Unsplash+, Depositphotos, Shutterstock, Envato) — proveri da licenca dozvoljava **komercijalnu upotrebu** (jer naplaćuješ pozivnice). Obična besplatna Unsplash licenca (unsplash.com, ne Unsplash+) to već dozvoljava besplatno. Nikad ne koristi slike "sa Google-a" bez provere licence — to je rizik tužbe.
