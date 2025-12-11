const fs = require('fs');

// Read the original file
const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');
const lines = content.split('\n');

// The original error showed -2 brace count, meaning 2 extra closing braces
// Based on the exact line output, we need to find which lines are the problematic ones

console.log('🔍 Looking for potential issues in the CSS...');

// Let's examine the specific areas where extra braces were detected
// Based on the original CSS analysis, there are extra closing braces

// Find all lines that are just closing braces with minimal context
let potentialIssues = [];
let inStyle = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '<style>') {
        inStyle = true;
        continue;
    }
    if (line === '</style>') {
        inStyle = false;
        break;
    }
    
    if (inStyle && line === '}') {
        // Check context
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
        
        console.log(`Line ${i+1}: "}"`);
        console.log(`  Previous: "${prevLine}"`);
        console.log(`  Next: "${nextLine}"`);
        
        // Look for patterns that might indicate this is an extra brace
        if (nextLine === '}' || nextLine === '' && i < lines.length - 2 && lines[i+2].trim() === '}') {
            potentialIssues.push(i);
            console.log(`  ⚠️ POTENTIAL EXTRA BRACE`);
        }
        console.log();
    }
}

console.log(`\n📊 Found ${potentialIssues.length} potential extra braces`);

if (potentialIssues.length >= 2) {
    console.log('🔧 Attempting to fix by removing the last 2 potential extra braces...');
    
    // Create a copy and remove the problematic lines (in reverse order to maintain indices)
    let fixedLines = [...lines];
    
    // Remove the last 2 potential issues (in reverse order)
    const toRemove = potentialIssues.slice(-2);
    for (let i = toRemove.length - 1; i >= 0; i--) {
        console.log(`Removing line ${toRemove[i] + 1}: "${lines[toRemove[i]]}"`);
        fixedLines.splice(toRemove[i], 1);
    }
    
    // Write the fixed content
    const fixedContent = fixedLines.join('\n');
    fs.writeFileSync('dashboard-ios-ORIGINAL-RESTORED-FIXED.html', fixedContent);
    
    console.log('\n✅ Fixed file saved as dashboard-ios-ORIGINAL-RESTORED-FIXED.html');
}