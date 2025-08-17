# Biblia Șerban Cantacuzino (BSB) - Documentație

## Despre această versiune
Biblia Șerban Cantacuzino (1688) - prima traducere completă a Bibliei în limba română tipărită în Țara Românească.

## Generarea Paginii "About BSB"

### Cum funcționează sistemul:

1. **SURSĂ DE DATE**: 
   - Conținutul paginii "About BSB" este definit în fișierul `about.html` din acest director
   - Conține HTML formatat cu styling CSS inline pentru aspectul manuscrisului istoric

2. **PROCESARE**: 
   - Generatorul `tools/generators/usfm.js` (linia 26) verifică dacă există fișier `about.html`
   - Pentru BSB citește direct din `about.html` (nu folosește proprietatea `aboutHtml` din `info.json`)

3. **CONȚINUT PAGINII**:
   - **Imagine header**: `content/media/images/headers/Prima pagină.svg` - din ediția jubiliară 1988
   - **Imagine manuscris original**: `content/media/images/headers/Pagina manuscris 1688.svg` - manuscrisul chirilic autentic
   - **Context istoric**: Informații despre tipărirea din 1688 și ediția jubiliară din 1988
   - **Distincția cronologică**: Clarificarea între manuscrisul original chirilic (1688) și transcrierea modernă (1988)
   - **Styling autentic**: CSS inline pentru aspectul de manuscris istoric

4. **SISTEMUL DE IMAGINI**:
   - **Book Headers**: Definite în `bookHeaders.basePath` și `bookHeaders.books`
   - **Inițiale decorative**: Configurate în `decorativeInitials` cu căi separate pentru:
     - `simplePath`: Inițiale simple
     - `complexPath`: Inițiale complexe (pentru prima literă din capitolul 1)

## Structura fișierelor

```
input/BSB/
├── info.json          # Configurația principală (fără aboutHtml)
├── about.html         # Conținutul paginii About cu HTML formatat
├── README.md         # Această documentație
├── 01-GENBSB.usfm    # Geneza
├── 02-EXOBSB.usfm    # Exodul
└── ...               # Restul cărților biblice
```

## Modificarea paginii About

Pentru a modifica pagina "About BSB":
1. Editează fișierul `about.html` din acest director
2. Rulează generatorul: `node tools/generate.js -v BSB`
3. Pagina va fi actualizată automat în aplicație

## Imagini și resurse

- Imaginile header sunt în `app/content/media/images/headers/`
- Inițialele decorative sunt în `app/content/media/images/initials/`
- Prima pagină din manuscris: `Prima pagină.svg`

## Note tehnice

- Fișierul `info.json` TREBUIE să fie JSON valid (fără comentarii)
- Conținutul About este în fișierul `about.html` separat
- HTML-ul poate conține CSS inline pentru styling
- Imaginile se referă prin căi relative față de aplicație
- Sistemul de inițiale decorative este configurat per capitol pentru fiecare carte biblică
