var fs = require('fs'),
	path = require('path'),
	bibleData = require('../data/bible_data.js'),
	bibleFormatter = require('../bible_formatter.js'),
	verseIndexer = require('../verse_indexer.js'),
	readline = require('readline');
const bookMap = require('../bookMap.js');
const { OT_BOOKS, AP_BOOKS } = require('../data/bible_data.js');
	stream = require('stream');
const {EOL} = require('os');


function generate(inputPath, info, createIndex, startProgress, updateProgress) {
	var
		data = {
			chapterData: [],
			indexData: {},
			indexLemmaData: {},
			infoHtml: ''
		},
		validBooks = [],
		validBookNames = [],
		validChapters = [],
		files = fs.readdirSync(inputPath),

		lastBookNumber = -1,
		lastChapterNumber = -1,
		lastVerseNumber = -1,
		currentChapter = null;


	// LOAD strongs
	var strongsPath = filePath = path.join(inputPath, 'strongs.json'),
		strongsText = fs.readFileSync(strongsPath, 'utf8')
		strongsData = JSON.parse(strongsText),
		strongsLemmaKey = {};

	//create strongs mapping 
	for (var strongsNumber in strongsData) {
		var strongsEntry = strongsData[strongsNumber];

		strongsLemmaKey[strongsEntry.lemma] = strongsNumber;
	}

	startProgress(files.length, "LXX");
	var notFoundBooks = [];
	// process files
	files.forEach(function(filename) {

		if (filename.indexOf('.txt') == -1) {
			return;
		}
		var filePath = path.join(inputPath, filename),
			rawText = fs.readFileSync(filePath, 'utf8'),
			chaptersTexts = rawText.split(EOL + EOL);
		var description = undefined;
			chaptersTexts.forEach(ct => {
				var lines = ct.split(EOL);
				if(lines.length === 1) return;
				var bookNumber = parseInt(filename.split('.', 1)[0]),
					bookName = lines[0].split(' ')[0],
					chapterNumber= lines[0].split(' ')[1].split(':')[0], 
					verseNumber= lines[0].split(' ')[1].split(':')[1],
					content = lines.slice(1);
		// READ TEXT

		
		var dbsCode = bookMap[bookName];
		if (dbsCode === undefined) {
			notFoundBooks.push(bookName);
			return;
		}
		if (verseNumber === undefined || bookNumber === undefined) return;
			if (verseNumber == 0 && bookNumber == 51) {
				// build description
				description = '';
				for (let c of content) {
					description += c.split(' ').slice(-1) + " ";
				}
				return;
		}
		for (var i=1, il=content.length; i<=il; i++) {
			var line = lines[i].trim(),
				parts = line.split(' ');
				if(parts.length < 3) return;
			
			var	bookInfo = bibleData.getBookInfoByDbsCode( dbsCode ),
				partOfSpeech = parts[1].trim().slice(0,2),
				parsing = parts[1].trim().slice(2),
				word = parts[0].trim(),
				lemma = parts[2].trim(),
				strongs = strongsLemmaKey[lemma] ?? strongsLemmaKey[word] ,

				dbsCode = bookInfo['dbsCode'],
				chapterCode = dbsCode + '' + chapterNumber.toString(),
				verseCode = chapterCode + '_' + verseNumber.toString();

			// new book
			if (bookNumber != lastBookNumber) {

				bookName = bibleData.getBookName(dbsCode, info['lang'])

				if (bookName == null) {
					bookName = bookInfo['name'].split('/')[0];
				}
				if (validBooks.indexOf(dbsCode) == -1) {
					validBooks.push(dbsCode)
				}
				if (validBookNames.indexOf(bookName) == -1) {
					validBookNames.push(bookName)
				}

				// reset
				lastBookNumber = bookNumber;
				lastChapterNumber = -1;
				lastVerseNumber = -1;
			}

			// new chapter
			if (chapterNumber != lastChapterNumber) {

				// close old
				if (currentChapter != null) {
					currentChapter.html +=
						'</span>' + bibleFormatter.breakChar + // verse
						'</div>' + bibleFormatter.breakChar + // paragraph
						bibleFormatter.closeChapter();
				}

				// create new
				currentChapter = {
					id: chapterCode,
					nextid: bibleData.getNextChapter(chapterCode, [...OT_BOOKS, ...AP_BOOKS]),
					previd: bibleData.getPrevChapter(chapterCode, [...OT_BOOKS, ...AP_BOOKS]),
					html: '',
					title: bookName + ' ' + chapterNumber,
				};
				data.chapterData.push( currentChapter );

				if (validChapters.indexOf(chapterCode) == -1) {
					validChapters.push(chapterCode)
				}


				// setup new
				currentChapter.html = bibleFormatter.openChapter(info, currentChapter);

				if (chapterNumber == 1) {
					currentChapter.html += '<div class="mt">' + bookName + '</div>' + bibleFormatter.breakChar;
					if (description!==undefined) {
						currentChapter.html += '<div>' + description + '</div>' + bibleFormatter.breakChar + '<br />';
					}
				}

				currentChapter.html +=
									'<div class="c">' + chapterNumber + '</div>' + bibleFormatter.breakChar +
									'<div class="p">' + bibleFormatter.breakChar;

				lastChapterNumber = chapterNumber;
				lastVerseNumber = -1;
			}

			// new verse
			if (verseNumber != lastVerseNumber) {


				if (createIndex) {
					//verseIndexer.indexVerse(verseCode, text, data.indexData, info.lang);
				}

				if (verseNumber > 1) {
					// close
					currentChapter.html += bibleFormatter.closeVerse();
				}

				// open
				currentChapter.html += bibleFormatter.openVerse(verseCode, verseNumber.toString());

				// store
				lastVerseNumber = verseNumber;
			}

			// add word
			currentChapter.html += '<l' + (strongs != 'undefined' && typeof strongs != 'undefined' ? ' s="' + strongs + '"' : '') + ' m="' + partOfSpeech.replace('-','') + '-' + parsing.replace(/-/gi,'') + '">' + word + '</l> ';

			if (createIndex && strongs) {
				verseIndexer.indexStrongs(verseCode, strongs, data.indexLemmaData, info.lang);
			}
		}
		
	})//end chapters loop
	updateProgress();
	});
	console.log([...new Set(notFoundBooks)]);
	currentChapter.html += '</span>' + bibleFormatter.breakChar +
						'</div>' + bibleFormatter.breakChar +
						+ bibleFormatter.closeChapter();



	// copy about if present
	var aboutPath = path.join(inputPath, 'about.html');
	if (fs.existsSync(aboutPath)) {
		data.aboutHtml = fs.readFileSync( aboutPath , 'utf8');
	}

	// CREATE INFO
	info.type = 'bible';
	info.divisionNames = validBookNames;
	info.divisions = validBooks;
	info.sections = validChapters;
	return data;
}

module.exports = {
	generate: generate
}
