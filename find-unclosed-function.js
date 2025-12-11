const fs = require('fs');

const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');

// Extract JavaScript content
const scriptMatch = content.match(/<script[^>]*>([\s\S]*)<\/script>/g);
if (!scriptMatch) {
    console.log('No script tags found');
    process.exit(1);
}

const jsContent = scriptMatch.map(s => s.replace(/<\/?script[^>]*>/g, '')).join('\n');
const lines = jsContent.split('\n');

console.log('🔍 Looking for unclosed functions...\n');

let braceStack = [];
let currentFunction = null;
let functions = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track function declarations
    const functionMatch = trimmed.match(/function\s+(\w+)\s*\(/);
    if (functionMatch) {
        const funcName = functionMatch[1];
        currentFunction = {
            name: funcName,
            startLine: i + 1,
            braceDepth: 0,
            endLine: null
        };
        functions.push(currentFunction);
        console.log(`📍 Found function: ${funcName} at line ${i + 1}`);
    }
    
    // Count braces
    for (let char of line) {
        if (char === '{') {
            braceStack.push({ line: i + 1, char: '{', function: currentFunction?.name });
            if (currentFunction) currentFunction.braceDepth++;
        } else if (char === '}') {
            if (braceStack.length > 0) {
                braceStack.pop();
                if (currentFunction) {
                    currentFunction.braceDepth--;
                    if (currentFunction.braceDepth === 0) {
                        currentFunction.endLine = i + 1;
                        currentFunction = null;
                    }
                }
            } else {
                console.log(`❌ Extra closing brace at line ${i + 1}: "${trimmed}"`);
                break;
            }
        }
    }
}

console.log('\n📊 Function analysis:');
functions.forEach(func => {
    const status = func.endLine ? '✅ Closed' : '❌ NOT CLOSED';
    console.log(`${status} | ${func.name} | Lines ${func.startLine}-${func.endLine || 'UNKNOWN'} | Depth: ${func.braceDepth}`);
});

console.log(`\n🔧 Remaining open braces: ${braceStack.length}`);
if (braceStack.length > 0) {
    console.log('Open braces from:');
    braceStack.slice(-5).forEach(brace => {
        console.log(`  Line ${brace.line} in function: ${brace.function || 'unknown'}`);
    });
}