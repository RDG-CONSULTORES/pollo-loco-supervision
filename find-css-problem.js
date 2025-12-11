const fs = require('fs');

const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');

// Extract style section
const styleMatch = content.match(/<style[^>]*>([\s\S]*)<\/style>/);
if (!styleMatch) {
    console.log('No style section found');
    process.exit(1);
}

const cssContent = styleMatch[1];
const lines = cssContent.split('\n');

console.log('🎨 Analyzing CSS brace balance...\n');

let braceCount = 0;
let line = 1;
let currentSelector = null;
let inString = false;
let stringChar = null;

for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const trimmed = lineContent.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
        continue;
    }
    
    // Look for CSS selectors
    if (trimmed.includes('{') && !trimmed.includes('}')) {
        currentSelector = trimmed.replace('{', '').trim();
        console.log(`📍 Selector: ${currentSelector} at line ${i + 1}`);
    }
    
    for (let char of lineContent) {
        // Handle strings
        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            continue;
        } else if (inString && char === stringChar) {
            inString = false;
            stringChar = null;
            continue;
        }
        
        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount < 0) {
                    console.log(`❌ Extra closing brace at line ${i + 1}: "${trimmed}"`);
                }
            }
        }
    }
}

console.log(`\n📊 Final CSS brace count: ${braceCount}`);
if (braceCount !== 0) {
    console.log(`❌ CSS braces are NOT balanced! Missing ${braceCount > 0 ? 'closing' : 'opening'} braces: ${Math.abs(braceCount)}`);
} else {
    console.log(`✅ CSS braces are balanced!`);
}