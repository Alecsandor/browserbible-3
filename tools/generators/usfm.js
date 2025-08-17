var fs = require('fs'),
	path = require('path'),
	bibleData = require('../data/bible_data.js'),
	bibleFormatter = require('../bible_formatter.js'),
	verseIndexer = require('../verse_indexer.js'),
	usfmParser = require('./usfm_parser.js'),
	readline = require('readline'),
	stream = require('stream'),
	jsdom = require("jsdom"),
	$ = require('jquery')(jsdom.jsdom().defaultView);

function generate(inputBasePath, info, createIndex, startProgress, updateProgress) {
	var breakChar = '\n';

	var
		unparsedUsfmFlags = [],
		bookCodes = [],
		bookNames = [],
		bookAbbreviations = [],
		chapterList = [],
		aboutPath = path.join(inputBasePath, 'about.html'),
		data = {
			chapterData: [],
			indexData: {},
			indexLemmaData: {},
			aboutHtml: fs.existsSync(aboutPath) ? fs.readFileSync(aboutPath, 'utf8') : ''
		}

	skipAheadKeys = ['', 'add', 'add*', 'wj', 'wj*', 'x', 'x*', 'f', 'f*', 'qs', 'ft', 'bk', 'fqa'];

	var usfmFiles = fs.readdirSync(inputBasePath);


	startProgress(usfmFiles.length, 'Books');


	usfmFiles.forEach(function(filename) {

		if (filename.indexOf('.usfm') == -1) {
			return;
		}

		var filePath = path.join(inputBasePath, filename),
			rawText = fs.readFileSync(filePath, 'utf8'),
			lines = rawText.split('\n');

		//console.log(filePath, lines.length);

		var bookName = '',
			bookAbbr = '';

		var
			currentBookInfo = null,
			currentChapterNum = null,
			currentVerseNum = '',
			currentChapterHtml = '',
			currentChapterCode = '',
			paragraphIsOpen = false,
			currentVerseCode = null,
			quoteIsOpen = false,
			verseIsOpen = false,
			currentHeader = '',
			currentVerseText = '',
			notes = '',
			noteNumber = 1,
			chapterVerse = '',
			hasDecorativeInitial = false,
			decorativeInitialLetter = '';

		for (var i = 0, il = lines.length; i < il; i++) {
			var line = lines[i],
				usfm = usfmParser.parseLine(line);

			if (usfm == null) {
				return;
			}


			// check the next line
			if (skipAheadKeys.indexOf(usfm.key) == -1) {

				var nextLineIndex = i + 1;
				while (nextLineIndex < lines.length) {

					var nextLine = lines[nextLineIndex],
						nextUsfm = usfmParser.parseLine(nextLine);

					if (skipAheadKeys.indexOf(nextUsfm.key) > -1) {
						usfm.text += ' ' + nextLine;
					} else if (nextUsfm == null) {
						usfm.text += ' ' + nextLine;
					} else {
						break;
					}
					nextLineIndex++;
				}
			} else {
				// skip these
				continue;

			}


			switch (usfm.key) {
				default:
				// store all the flags we can use
				if (unparsedUsfmFlags.indexOf(usfm.key) == -1) {
					unparsedUsfmFlags.push(usfm.key);
				}

				// do nothing?
				break;

				case 'ide':
					// assume usfm
					break;

				case 'id':
					// get book info
					var bookId = usfm.text.split(' ')[0].trim();
					currentBookInfo = bibleData.getBookInfoByUsfmCode(bookId.toUpperCase());

					//console.log(bookId, (typeof currentBookInfo != 'undefined' ? currentBookInfo.dbsCode : '?'));

					bookCodes.push(currentBookInfo.dbsCode);
					//console.log('book', currentBookInfo != null ? currentBookInfo.names.eng[0] : 'NULL: ' + bookId);
					
					// Reset decorative initial variables for new book
					hasDecorativeInitial = false;
					decorativeInitialLetter = '';
					break;

				// intro stuff
				case 'is':
				case 'ip':
				case 'ili':
				case 'ili2':

				// headings
				case 'mt':
				case 'mt1':
				case 'mt2':
				case 'mt3':
				case 'ms':
				case 'd':
				case 'sp':
				case 'sr':
				case 's1':
				case 's2':
				case 'r':

					if (verseIsOpen) {
						currentChapterHtml += '</span>' + breakChar;
						verseIsOpen = false;
					}

					if (paragraphIsOpen) {
						currentChapterHtml += '</div>' + breakChar;
						paragraphIsOpen = false;
					}

					var formatted = usfmParser.formatText(usfm.text, noteNumber, chapterVerse);
					notes += formatted.notes;

					// Check if this is a main title (mt) and if book has decorative header
					if (usfm.key === 'mt' && info.bookHeaders && info.bookHeaders.enabled) {
						var bookHeader = info.bookHeaders.books[currentBookInfo.dbsCode];
						if (bookHeader) {
							// Add decorative book header before the title
							var ornamentPath = info.bookHeaders.basePath + bookHeader.ornament;
							var titleText = formatted.text; // Use original USFM title
							var headerHtml = '<div class="book-header">' +
								'<div class="book-header-ornament">' +
								'<img src="' + ornamentPath + '" alt="Ornament decorativ din Biblia Șerban Cantacuzino (1688) ediția 1988" ' +
								'title="Ornament decorativ din Biblia Șerban Cantacuzino (1688) ediția 1988" />' +
								'</div>' +
								'<div class="book-header-title">' + titleText + '</div>' +
								'</div>';
							currentChapterHtml += headerHtml + breakChar;
						} else {
							// Default title processing
							currentChapterHtml += '<div class="' + usfm.key + '">' + formatted.text + '</div>' + breakChar;
						}
					} else {
						// Default processing for other heading types
						currentChapterHtml += '<div class="' + usfm.key + '">' + formatted.text + '</div>' + breakChar;
					}



					break;

				case 'b':

					if (verseIsOpen) {
						currentChapterHtml += '</span>' + breakChar;
						verseIsOpen = false;
					}

					if (paragraphIsOpen) {
						currentChapterHtml += '</div>' + breakChar;
						paragraphIsOpen = false;
					}
					currentChapterHtml += '<div class="b">&nbsp;</div>' + breakChar;


					break;

				// TEXT BLOCKS
				case 'cp':
				case 'nb':
				case 'bd':
				case 'm':
				case 'mi':
				case 'pi':
				case 'li':
				case 'li1':
				case 'li2':
					// letting this fall through for now.

				case 'p':
					if (verseIsOpen) {
						currentChapterHtml += '</span>' + breakChar;
						verseIsOpen = false;
					}

					if (paragraphIsOpen) {
						currentChapterHtml += '</div>' + breakChar;
						paragraphIsOpen = false;
					}

					if (quoteIsOpen) {
						currentChapterHtml += '</div>' + breakChar;
						quoteIsOpen = false;
					}

					currentChapterHtml += '<div class="' + usfm.key + '">' + breakChar;
					paragraphIsOpen = true;

					if (usfm.text != '') {

						var formatted = usfmParser.formatText(usfm.text, noteNumber, chapterVerse);
						notes += formatted.notes;


						currentChapterHtml += bibleFormatter.openVerse(currentVerseCode, null) +
						//'<span class="v ' + currentVerseCode + '" data-id="' + currentVerseCode + '">' +
						formatted.text;

						verseIsOpen = true;

						currentVerseText += usfmParser.plainText(usfm.text);
					}

					break;

				case 'c':
					// new chapter
					if (usfm.text > 1) {


						if (verseIsOpen) {
							currentChapterHtml += '</span>' + breakChar;
							verseIsOpen = false;
						}
						if (paragraphIsOpen || quoteIsOpen) {
							currentChapterHtml += '</div>' + breakChar;
							paragraphIsOpen = false;
							quoteIsOpen = false;
						}


						/*
						// pull out notes
						var notesHtml = '',
							chapterNode = $(currentChapterHtml),
							notes = chapterNode.find('.note');

						//console.log(notes.length);

						notes.each(function(i, n) {
							var note = $(this),
								key = note.find('.key').html(),
								noteNumber = i+1,
								noteText = note.find('.text');

							note.attr('id','note-' + noteNumber);
							note.find('.key').attr('href','#footnote-' + noteNumber);

							notesHtml += '<span class="footnote" id="footnote-' + noteNumber + '">' +
												'<a class="key" href="#note-' + noteNumber + '">' + key + '</a>' +
												'<span class="text">' + noteText.html() + '</span>' +
											'</span>' + bibleFormatter.breakChar;

							noteText.remove();
						});
						*/


						// finish previous chapter
						data.chapterData.push({
							id: currentChapterCode,
							previd: null,
							nextid: null,
							html: currentChapterHtml,
							//html: chapterNode[0].outerHTML,
							//html: chapterNode.wrapAll('<div></div>').parent().html(),
							notes: notes,
							title: currentBookInfo.name + ' ' + chapter
						});
						currentChapterHtml = '';
						paragraphIsOpen = false;
						quoteIsOpen = false;
						verseIsOpen = false;
						chapterList.push(currentChapterCode);
					}

					//console.log('c', usfm.text);

					currentChapterNum = usfm.text;
					currentChapterCode = bibleFormatter.formatChapterCode(currentBookInfo.dbsCode, currentChapterNum);
					
					// Store decorative initial configuration for later use in verse processing
					var hasDecorativeInitial = false;
					var decorativeInitialLetter = '';
					var decorativeInitialType = 'complex'; // default type
					if (info.decorativeInitials && info.decorativeInitials.enabled) {
						var bookInitials = info.decorativeInitials.books[currentBookInfo.dbsCode];
						if (bookInitials && bookInitials.chapters && bookInitials.chapters[currentChapterNum]) {
							var chapterConfig = bookInitials.chapters[currentChapterNum];
							hasDecorativeInitial = true;
							
							// Support both old format (string) and new format (object)
							if (typeof chapterConfig === 'string') {
								decorativeInitialLetter = chapterConfig;
								decorativeInitialType = 'complex'; // backward compatibility
							} else if (typeof chapterConfig === 'object') {
								decorativeInitialLetter = chapterConfig.letter;
								decorativeInitialType = chapterConfig.type || 'complex';
							}
						}
					}
					
					currentChapterHtml += '<div class="c">' +
						(currentBookInfo.dbsCode == 'PS' ?
						(currentHeader.substring(currentHeader.length - 1) == 's' ? currentHeader.substring(0, currentHeader.length - 1) : currentHeader) + ' ' : ''
					) + usfm.text.toString() +
						'</div>' + breakChar;

					break;

				case 'v':
					if (verseIsOpen) {
						currentChapterHtml += '</span>' + breakChar;
						verseIsOpen = false;
					}

					// handle index
					if (createIndex && currentVerseText != '' && currentVerseCode != null) {
						verseIndexer.indexVerse(currentVerseCode, currentVerseText, data.indexData, info.lang);
					}
					// restart
					currentVerseText = usfmParser.plainText(usfm.text);



					// start new verse
					currentVerseNum = usfm.number;

					if (currentVerseNum == '' && usfm.text != '' && usfm.text.trim().indexOf(' ') == -1) {
						currentVerseNum = usfm.text;
					}

					if (!currentVerseNum || !currentChapterNum) {
						console.log('ERROR with verse:', i, currentBookInfo.dbsCode, 'cc:' + currentChapterCode, 'v:' + currentVerseNum, 'c:' + currentChapterNum);
						console.log(usfm);
						return;
					}

					currentVerseCode = bibleFormatter.formatVerseCode(currentBookInfo.dbsCode, currentChapterNum, currentVerseNum);

					chapterVerse = currentChapterNum + ':' + currentVerseNum;

					var formatted = usfmParser.formatText(usfm.text, noteNumber, chapterVerse);
					notes += formatted.notes;

					// Special handling for first verse with decorative initial
					var isFirstVerse = (currentVerseNum == '1');
					var shouldUseDecorativeInitial = isFirstVerse && hasDecorativeInitial;
					
					if (shouldUseDecorativeInitial) {
						// For first verse with decorative initial:
						// 1. Add verse number first
						// 2. Add decorative initial
						// 3. Remove first letter from text (it's replaced by the decorative initial)
						
						// Determine the correct path based on type
						var basePath;
						if (decorativeInitialType === 'simple' && info.decorativeInitials.simplePath) {
							basePath = info.decorativeInitials.simplePath;
						} else if (decorativeInitialType === 'complex' && info.decorativeInitials.complexPath) {
							basePath = info.decorativeInitials.complexPath;
						} else {
							// Fallback to default path
							basePath = info.decorativeInitials.basePath;
						}
						
						var imagePath = basePath + decorativeInitialLetter + '.png';
						var textWithoutFirstLetter = formatted.text.replace(/^[A-Za-zÀ-ÿĂÂÎȘȚăâîșț]/, '');
						
						currentChapterHtml += '<span class="v-num v-' + currentVerseNum + '">' + currentVerseNum + '&nbsp;</span>' +
							'<div class="decorative-initial-container">' +
							'<img src="' + imagePath + '" alt="Inițială decorativă ' + decorativeInitialLetter + '" ' +
							'title="Inițială decorativă din Biblia Șerban Cantacuzino (1688) ediția 1988" ' +
							'class="decorative-initial ' + decorativeInitialType + '" data-letter="' + decorativeInitialLetter + '" data-type="' + decorativeInitialType + '" />' +
							'</div>' +
							'<span class="v ' + currentVerseCode + '" data-id="' + currentVerseCode + '">' +
							textWithoutFirstLetter;
					} else {
						// Normal verse processing
						currentChapterHtml += bibleFormatter.openVerse(currentVerseCode, currentVerseNum) +
							formatted.text;
					}


					verseIsOpen = true;

					break;
				case '':

					// ignore b/c we use a peak ahead function

					//currentChapterHtml += usfmParser.formatText(usfm.text);
					break;

				case 'q':
					// continue
				case 'q1':
				case 'q2':
				case 'q3':

					if (verseIsOpen) {
						currentChapterHtml += '</span>' + breakChar;
						verseIsOpen = false;
					}

					if (quoteIsOpen) {
						currentChapterHtml += '</div>' + breakChar;
						quoteIsOpen = false;
					}

					if (paragraphIsOpen) {
						currentChapterHtml += '</div>' + breakChar;
						paragraphIsOpen = false;
					}

					currentChapterHtml += '<div class="' + usfm.key + '">' + breakChar;
					quoteIsOpen = true;

					if (usfm.text != '') {

						var formatted = usfmParser.formatText(usfm.text, noteNumber, chapterVerse);
						notes += formatted.notes;

						currentChapterHtml += '<span class="v ' + currentVerseCode + '" data-id="' + currentVerseCode + '">' + formatted.text;

						currentVerseText += usfmParser.plainText(usfm.text);
						verseIsOpen = true;
					}


					break;

				case 'h':
					currentHeader = usfm.text.trim();
					break;
				case 'toc1':
					if (usfm.text.trim() != '') {
						bookName = usfm.text.trim();
					}
					break;
				case 'toc2':
					// use this shorter one for the listing
					if (usfm.text.trim() != '') {
						bookName = usfm.text.trim();
					}
					break;
				case 'toc3':
					if (usfm.text.trim() != '') {
						bookAbbr = usfm.text.trim();
					}
					// TODO: add to book names and
					break;



			}

			/*
			if (currentVerseCode == 'PS1_2') {
				console.log('PS1_2', usfm.key, usfm.text);
				console.log( usfmParser.formatText(usfm.text) );

			}
			*/
		}

		// last index
		if (createIndex && currentVerseText != '' && currentVerseCode != null) {
			verseIndexer.indexVerse(currentVerseCode, currentVerseText, data.indexData, info.lang);
		}


		// final closing tags
		if (verseIsOpen) {
			currentChapterHtml += '</span>' + breakChar;
			verseIsOpen = false;
		}
		if (paragraphIsOpen || quoteIsOpen) {
			currentChapterHtml += '</div>' + breakChar;
			paragraphIsOpen = false;
			quoteIsOpen = false;
		}

		if (bookName != '') {
			bookNames.push(bookName);
		} else {
			bookNames.push(currentBookInfo.names.eng[0]);
		}
		if (bookAbbr != '') {
			bookAbbreviations.push(bookAbbr);
		} else {
			bookAbbreviations.push(currentBookInfo.names.eng[0].replace(/\s/gi, '').substring(0, 3));
		}


		// pull out notes
		var notesHtml = '',
			chapterNode = $(currentChapterHtml),
			notes = chapterNode.find('.note');

		//console.log(notes.length);

		notes.each(function(i, n) {
			var note = $(this),
				key = note.find('.key').html(),
				noteNumber = i + 1,
				noteText = note.find('.text');

			note.attr('id', 'note-' + noteNumber);
			note.find('.key').attr('href', '#footnote-' + noteNumber);

			notesHtml += '<span class="footnote" id="footnote-' + noteNumber + '">' +
				'<a class="key" href="#note-' + noteNumber + '">' + key + '</a>' +
				'<span class="text">' + noteText.html() + '</span>' +
				'</span>' + bibleFormatter.breakChar;

			noteText.remove();
		});



		// add final html
		data.chapterData.push({
			id: currentChapterCode,
			//html: chapterNode[0].outerHTML,
			html: chapterNode.wrapAll('<div></div>').parent().html(),
			notes: notesHtml
		});
		chapterList.push(currentChapterCode);


		updateProgress();
	});

	console.log('chapters:', data.chapterData.length);


	// create prev/next code and wrappers
	for (var i = 0, il = data.chapterData.length; i < il; i++) {
		var chapter = data.chapterData[i];

		chapter.previd = (i == 0) ? null : data.chapterData[i - 1].id;
		chapter.nextid = (i == il - 1) ? null : data.chapterData[i + 1].id;
		
		// Check if this is the last chapter of a book that should have a decorative image
		var shouldAddDecorativeImage = false;
		var decorativeImageConfig = null;
		
		if (info.decorativeImages && chapter.nextid) {
			// Extract book code from current and next chapter IDs
			var currentMatch = chapter.id.match(/^([A-Z]+)(\d+)$/);
			var nextMatch = chapter.nextid.match(/^([A-Z]+)(\d+)$/);
			
			if (currentMatch && nextMatch) {
				var currentBookCode = currentMatch[1];
				var currentChapter = parseInt(currentMatch[2]);
				var nextBookCode = nextMatch[1];
				var nextChapter = parseInt(nextMatch[2]);
				
				// Handle special cases like C2 (2 Corinthians)
				if (currentBookCode === 'C' && currentChapter >= 14) {
					currentBookCode = 'C2'; // 2 Corinthians chapters 14+
				}
				if (nextBookCode === 'C' && nextChapter >= 14) {
					nextBookCode = 'C2'; // 2 Corinthians chapters 14+
				}
				
				// If next chapter is from a different book, this is the last chapter of current book
				if (currentBookCode !== nextBookCode && info.decorativeImages[currentBookCode]) {
					shouldAddDecorativeImage = true;
					decorativeImageConfig = info.decorativeImages[currentBookCode];
				}
			}
		} else if (info.decorativeImages && !chapter.nextid) {
			// This is the very last chapter - check if its book should have an image
			var currentMatch = chapter.id.match(/^([A-Z]+)(\d+)$/);
			
			if (currentMatch) {
				var currentBookCode = currentMatch[1];
				var currentChapter = parseInt(currentMatch[2]);
				
				// Handle special cases like C2 (2 Corinthians)
				if (currentBookCode === 'C' && currentChapter >= 14) {
					currentBookCode = 'C2'; // 2 Corinthians chapters 14+
				}
				
				if (info.decorativeImages[currentBookCode]) {
					shouldAddDecorativeImage = true;
					decorativeImageConfig = info.decorativeImages[currentBookCode];
				}
			}
		}
		
		// Add decorative image if needed
		var decorativeImageHtml = '';
		if (shouldAddDecorativeImage && decorativeImageConfig.position === 'end') {
			decorativeImageHtml = '<div class="decorative-image book-end">' +
				'<img src="content/media/images/' + decorativeImageConfig.image + '" ' +
				'alt="' + (decorativeImageConfig.alt || 'Decorative image') + '" ' +
				'title="' + (decorativeImageConfig.description || '') + '" ' +
				'class="book-ornament" />' +
				'</div>';
		}
		
		chapter.html =
			bibleFormatter.openChapter(info, chapter) +
			chapter.html +
			decorativeImageHtml +
			bibleFormatter.closeChapter();

	}


	// spit out info
	info.type = 'bible';
	info.divisions = bookCodes;
	info.divisionNames = bookNames;
	info.divisionAbbreviations = bookAbbreviations;
	info.sections = chapterList;


	console.log('unparsed', unparsedUsfmFlags);

	return data;

}

module.exports = {
	generate: generate
}
