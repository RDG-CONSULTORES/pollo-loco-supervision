const fs = require('fs');

// Test the fixed file
const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED-FIXED.html', 'utf8');

// Extract just the JavaScript sections
const scriptSections = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g);

if (!scriptSections) {
    console.log('No script sections found');
    process.exit(1);
}

let totalJS = scriptSections.map(s => s.replace(/<\/?script[^>]*>/g, '')).join('\n\n');

console.log('📊 Testing fixed file JavaScript brace balance...\n');

let braceCount = 0;
let line = 1;
let inString = false;
let inTemplate = false;
let stringChar = null;

for (let i = 0; i < totalJS.length; i++) {
    const c = totalJS[i];
    const prev = i > 0 ? totalJS[i-1] : '';
    
    if (c === '\n') {
        line++;
        continue;
    }
    
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
    } else if (c === '}') {
        braceCount--;
        
        if (braceCount < 0) {
            console.log(`❌ Extra closing brace at line ${line}`);
            break;
        }
    }
}

console.log(`📊 Final JavaScript brace count: ${braceCount}`);
if (braceCount === 0) {
    console.log(`✅ JavaScript braces are balanced!`);
} else {
    console.log(`❌ JavaScript braces are NOT balanced! Missing ${braceCount > 0 ? 'closing' : 'opening'} braces: ${Math.abs(braceCount)}`);
}

// Test CSS as well
const styleMatch = content.match(/<style[^>]*>([\s\S]*)<\/style>/);
if (styleMatch) {
    const cssContent = styleMatch[1];
    let cssBraceCount = 0;
    let cssInString = false;
    let cssStringChar = null;
    
    for (let i = 0; i < cssContent.length; i++) {
        const c = cssContent[i];
        const prev = i > 0 ? cssContent[i-1] : '';
        
        // Handle strings
        if (!cssInString && (c === '"' || c === "'")) {
            cssInString = true;
            cssStringChar = c;
            continue;
        } else if (cssInString && c === cssStringChar && prev !== '\\') {
            cssInString = false;
            cssStringChar = null;
            continue;
        }
        
        if (!cssInString) {
            if (c === '{') {
                cssBraceCount++;
            } else if (c === '}') {
                cssBraceCount--;
                if (cssBraceCount < 0) {
                    console.log(`❌ Extra CSS closing brace detected`);
                    break;
                }
            }
        }
    }
    
    console.log(`📊 Final CSS brace count: ${cssBraceCount}`);
    if (cssBraceCount === 0) {
        console.log(`✅ CSS braces are balanced!`);
    } else {
        console.log(`❌ CSS braces are NOT balanced! Missing ${cssBraceCount > 0 ? 'closing' : 'opening'} braces: ${Math.abs(cssBraceCount)}`);
    }
}

console.log('\n🎉 File validation complete!');