const fs = require('fs');

const bookAbbreviations = {
  // Cărți din Vechiul Testament
  
  'facere': 'Gen',
  'iesire': 'Exo',
  'levitic': 'Lev',
  'numeri': 'Num',
  'deuteronom': 'Deu',
  'iosua': 'Jos',
  'judecători': 'Jdg',
  'rut': 'Rth',
  '1 regi': '1Sa', // Actualizat pentru "I Regi"
  '2 regi': '2Sa', // Actualizat pentru "II Regi"
  '3 regi': '1Ki', // Actualizat pentru "III Regi"
  '4 regi': '2Ki', // Actualizat pentru "IV Regi"
  'ezdra': 'Ezr',
  'neemia': 'Neh',
  'estera': 'Est',
  'iov': 'Job',
  'psalm': 'Psa',
  'pilde': 'Pro',
  'ecclesiastul': 'Ecc',
  'cântarea cântărilor': 'Son',
  'isaia': 'Isa',
  'ieremia': 'Jer',
  'plângeri': 'Lam',
  'Iezechiil': 'Eze',
  'daniil': 'Dan',
  'osea': 'Hos',
  'amos': 'Amo',
  'miheia': 'Mic',
  'ioil': 'Joe',
  'avdie': 'Oba',
  'iona': 'Jon',
  'naum': 'Nah',
  'avacum': 'Hab',
  'sofonie': 'Zep',
  'hagai': 'Hag',
  'zaharia': 'Zec',
  'maleahi': 'Mal',
  'Cartea înțelepciunii lui Isus fiul lui Sirah' : 'Sir',
  'Cartea înțelepciunii lui Solomon': 'Wis',

 // Cărți din Noul Testament
  'matei': 'Mat',
  'marcu': 'Mar',
  'luca': 'Luk',
  'ioan': 'Joh',
  'faptele apostolilor': 'Act',
  'Fapte': 'Act',
  'romani': 'Rom',
  '1 corinteni': '1Co',
  '2 corinteni': '2Co',
  'galateni': 'Gal',
  'efeseni': 'Eph',
  'filipeni': 'Phi',
  'coloseni': 'Col',
  '1 tesaloniceni': '1Th',
  '2 tesaloniceni': '2Th',
  '1 timotei': '1Ti',
  '2 timotei': '2Ti',
  'tit': 'Tit',
  'filimon': 'Phm',
  'evrei': 'Heb',
  'iacov': 'Jam',
  '1 petru': '1Pe',
  '2 petru': '2Pe',
  '1 ioan': '1Jo',
  '2 ioan': '2Jo',
  '3 ioan': '3Jo',
  'iuda': 'Jud',
  'apocalipsa': 'Rev'
};

function replaceBibleReferences(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Regex îmbunătățit pentru numere romane și formate complexe
    const bibleRegex = /(\b[IVXLCDM]+\s+)?([\wșțăîâȘȚĂÎÂ]+(?:\s+[\wșțăîâȘȚĂÎÂ]+)*)\s+(\d+)\s*,\s*((\d+\s*-\s*\d+)|(\d+))/gi;
    
    content = content.replace(bibleRegex, (match, romanNumeral, book, chapter, verse) => {
      // Normalizare avansată
      let normalizedBook = (romanNumeral ? romanNumeral + ' ' : '') + book;
      normalizedBook = normalizedBook.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Elimină toate diacriticele
        .replace(/ș/g, 's').replace(/ț/g, 't')
        .replace(/\s+/g, ' ') // Reducem spațiile multiple
        .trim();

      // Corecții speciale
      if(normalizedBook.startsWith('iv ')) {
        normalizedBook = normalizedBook.replace('iv ', '4 ');
      }
      if(normalizedBook.startsWith('iii ')) {
        normalizedBook = normalizedBook.replace('iii ', '3 ');
      }
      if(normalizedBook.startsWith('ii ')) {
        normalizedBook = normalizedBook.replace('ii ', '2 ');
      }
      if(normalizedBook.startsWith('i ')) {
        normalizedBook = normalizedBook.replace('i ', '1 ');
      }

      // Găsim prescurtarea
      const abbreviation = bookAbbreviations[normalizedBook] || book;
      
      // Curățăm versetele
      const cleanVerse = verse.replace(/\s*-\s*/g, '-');
      
      return `<u>${abbreviation}_${chapter}:${cleanVerse}</u>`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`Modificări complete în: ${filePath}`);
  } catch (error) {
    console.error(`Eroare procesare fișier: ${error}`);
  }
}

// Exemplu de utilizare
const filePath = 'D:/browserbible-3/input/com_sf_ioan_gura_de_aur/com-ioan-gura-de-aur.txt';
replaceBibleReferences(filePath);