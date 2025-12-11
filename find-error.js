const fs = require('fs');

const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');
const lines = content.split('\n');

// Find script tags and JavaScript content
let inScript = false;
let jsLines = [];
let currentJSLineNumber = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('<script') && !line.includes('src=')) {
        inScript = true;
        currentJSLineNumber = 0;
        continue;
    }
    
    if (line.includes('</script>')) {
        inScript = false;
        continue;
    }
    
    if (inScript) {
        currentJSLineNumber++;
        jsLines.push({
            htmlLine: i + 1,
            jsLine: currentJSLineNumber,
            content: line
        });
    }
}

// Find line 329 in JavaScript
const targetJSLine = jsLines.find(l => l.jsLine === 329);
const nearbyLines = jsLines.filter(l => l.jsLine >= 325 && l.jsLine <= 335);

console.log('🔍 Looking for JavaScript line 329...\n');

if (targetJSLine) {
    console.log(`📍 JavaScript line 329 corresponds to HTML line ${targetJSLine.htmlLine}:`);
    console.log(`"${targetJSLine.content}"`);
}

console.log('\n📋 Context around JavaScript line 329:');
nearbyLines.forEach(l => {
    const marker = l.jsLine === 329 ? '👈 ERROR HERE' : '';
    console.log(`JS:${l.jsLine} HTML:${l.htmlLine} | ${l.content} ${marker}`);
});

// Look for brace pattern issue
console.log('\n🔍 Searching for potential brace issues...');
const problematicLines = jsLines.filter(l => {
    const content = l.content.trim();
    return content === '}' || content.startsWith('} ') || content.includes('}}');
});

console.log('\n⚠️ Lines with potential brace issues:');
problematicLines.slice(0, 10).forEach(l => {
    console.log(`JS:${l.jsLine} HTML:${l.htmlLine} | "${l.content}"`);
});