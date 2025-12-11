const fs = require('fs');

const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');

// Extract just the JavaScript sections
const scriptSections = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g);

if (!scriptSections) {
    console.log('No script sections found');
    process.exit(1);
}

let totalJS = scriptSections.map(s => s.replace(/<\/?script[^>]*>/g, '')).join('\n\n');

console.log('📊 Analyzing JavaScript brace balance...\n');

let braceCount = 0;
let line = 1;
let char = 0;
let lastOpenBrace = null;
let lastCloseBrace = null;
let inString = false;
let inTemplate = false;
let stringChar = null;

for (let i = 0; i < totalJS.length; i++) {
    const c = totalJS[i];
    const prev = i > 0 ? totalJS[i-1] : '';
    
    if (c === '\n') {
        line++;
        char = 0;
        continue;
    }
    char++;
    
    // Handle strings and template literals
    if (!inString && !inTemplate) {
        if (c === '"' || c === "'" || c === '`') {
            if (c === '`') {
                inTemplate = true;
            } else {
                inString = true;
                stringChar = c;
            }
            continue;
        }
    } else if (inString) {
        if (c === stringChar && prev !== '\\') {
            inString = false;
            stringChar = null;
        }
        continue;
    } else if (inTemplate) {
        if (c === '`' && prev !== '\\') {
            inTemplate = false;
        }
        continue;
    }
    
    // Count braces outside of strings
    if (c === '{') {
        braceCount++;
        lastOpenBrace = { line, char, position: i };
    } else if (c === '}') {
        braceCount--;
        lastCloseBrace = { line, char, position: i };
        
        if (braceCount < 0) {
            console.log(`❌ Extra closing brace at line ${line}, character ${char}`);
            console.log(`Context: "${totalJS.slice(Math.max(0, i-30), i+30)}"`);
            break;
        }
    }
}

console.log(`📊 Final brace count: ${braceCount}`);
console.log(`📍 Last opening brace: line ${lastOpenBrace?.line}, char ${lastOpenBrace?.char}`);
console.log(`📍 Last closing brace: line ${lastCloseBrace?.line}, char ${lastCloseBrace?.char}`);

if (braceCount !== 0) {
    console.log(`\n❌ Braces are NOT balanced! Missing ${braceCount > 0 ? 'closing' : 'opening'} braces: ${Math.abs(braceCount)}`);
    
    if (braceCount > 0 && lastOpenBrace) {
        const start = Math.max(0, lastOpenBrace.position - 100);
        const end = Math.min(totalJS.length, lastOpenBrace.position + 100);
        console.log(`\nContext around last opening brace:`);
        console.log(`"${totalJS.slice(start, end)}"`);
    }
    
    process.exit(1);
} else {
    console.log(`\n✅ All braces are balanced!`);
}