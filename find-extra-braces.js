const fs = require('fs');

const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');
const lines = content.split('\n');

// Extract style section
let inStyle = false;
let styleLines = [];
let styleStartLine = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '<style>') {
        inStyle = true;
        styleStartLine = i + 1;
        continue;
    }
    if (lines[i].trim() === '</style>') {
        inStyle = false;
        break;
    }
    if (inStyle) {
        styleLines.push({
            lineNum: styleStartLine + styleLines.length,
            content: lines[i],
            trimmed: lines[i].trim()
        });
    }
}

console.log('🔍 Analyzing CSS for extra closing braces...\n');

let braceStack = [];
let currentBlock = null;

for (let i = 0; i < styleLines.length; i++) {
    const line = styleLines[i];
    const content = line.content;
    const trimmed = line.trimmed;
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
        continue;
    }
    
    // Track opening braces
    for (let char of content) {
        if (char === '{') {
            braceStack.push({
                line: line.lineNum,
                content: trimmed,
                type: 'open'
            });
        } else if (char === '}') {
            if (braceStack.length === 0) {
                console.log(`❌ EXTRA CLOSING BRACE at line ${line.lineNum}: "${trimmed}"`);
            } else {
                const openBrace = braceStack.pop();
                if (braceStack.length === 0) {
                    console.log(`✅ Block closed: "${openBrace.content}" → "${trimmed}" (lines ${openBrace.line}-${line.lineNum})`);
                }
            }
        }
    }
}

console.log(`\n📊 Remaining unclosed blocks: ${braceStack.length}`);
if (braceStack.length > 0) {
    console.log('\nUnclosed blocks:');
    braceStack.forEach(brace => {
        console.log(`  Line ${brace.line}: "${brace.content}"`);
    });
}