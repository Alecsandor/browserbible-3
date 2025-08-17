console.log('Test script started...');

const fs = require('fs');
const path = require('path');

try {
    console.log('Reading info.json...');
    const infoPath = path.join(__dirname, 'input', 'BSB', 'info.json');
    let rawJson = fs.readFileSync(infoPath, 'utf8');
    rawJson = rawJson.replace(/^\uFEFF/, '');
    const info = JSON.parse(rawJson);
    
    console.log('JSON parsed successfully');
    console.log('decorativeInitials books count:', Object.keys(info.decorativeInitials.books).length);
    
    // Testează citirea unui fișier USFM
    const usfmFiles = fs.readdirSync(path.join(__dirname, 'input', 'BSB')).filter(file => file.endsWith('.usfm'));
    console.log('Found USFM files:', usfmFiles.length);
    
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}

console.log('Test script finished.');
