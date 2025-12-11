const fs = require('fs');

const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');
const lines = content.split('\n');

// Look specifically for CSS brace issues
let inStyle = false;
let braceCount = 0;
let currentSelector = '';
let issues = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed === '<style>') {
        inStyle = true;
        console.log(`📍 Style section starts at line ${i + 1}`);
        continue;
    }
    
    if (trimmed === '</style>') {
        inStyle = false;
        console.log(`📍 Style section ends at line ${i + 1}`);
        break;
    }
    
    if (!inStyle) continue;
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
        continue;
    }
    
    // Process each character
    for (let char of line) {
        if (char === '{') {
            braceCount++;
        } else if (char === '}') {
            braceCount--;
            if (braceCount < 0) {
                issues.push({
                    line: i + 1,
                    content: trimmed,
                    type: 'extra_closing'
                });
                console.log(`❌ Extra closing brace at HTML line ${i + 1}: "${trimmed}"`);
            }
        }
    }
}

console.log(`\n📊 Final brace count: ${braceCount}`);
console.log(`📊 Issues found: ${issues.length}`);

if (braceCount !== 0) {
    console.log(`\n🔧 Need to ${braceCount > 0 ? 'add closing' : 'remove opening'} braces: ${Math.abs(braceCount)}`);
}

// Show context around problematic lines
console.log('\n🔍 Problem areas:');
issues.forEach(issue => {
    console.log(`\nLine ${issue.line}: ${issue.content}`);
    const start = Math.max(0, issue.line - 3);
    const end = Math.min(lines.length, issue.line + 2);
    for (let j = start; j < end; j++) {
        const marker = j === issue.line - 1 ? ' >>> ' : '     ';
        console.log(`${marker}${j + 1}: ${lines[j]}`);
    }
});