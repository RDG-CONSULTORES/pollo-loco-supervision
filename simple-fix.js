const fs = require('fs');

// Read the file
const content = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');

// The CSS validation showed we have 2 extra closing braces
// Based on patterns from other similar debug scripts, let's look for standalone closing braces
// that aren't properly part of a CSS rule

const lines = content.split('\n');

// Look specifically at lines 1763 and 1764 which were flagged
console.log('Checking lines around 1763-1764:');
for (let i = 1760; i < 1768; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    console.log(`${i + 1}: "${line}"`);
    if (trimmed === '}' && i === 1762) { // Line 1763 in 1-based
        console.log(`  ^^ REMOVING THIS LINE (extra closing brace)`);
    }
}

// Create fixed content by removing the extra closing braces
let fixedContent = content;

// Remove line 1763 (it's just a standalone '}')
const contentLines = content.split('\n');
contentLines.splice(1762, 1); // Remove index 1762 (line 1763 in 1-based)

fixedContent = contentLines.join('\n');

// Write the fixed content
fs.writeFileSync('dashboard-ios-ORIGINAL-RESTORED-FIXED.html', fixedContent);

console.log('\n✅ Fixed file saved as dashboard-ios-ORIGINAL-RESTORED-FIXED.html');
console.log('🔍 Removed 1 extra closing brace at line 1763');

// Now check if this fixes the brace balance
console.log('\n🔧 Verifying fix...');

// Run validation on the fixed file
const { execSync } = require('child_process');
try {
    const result = execSync('node check-braces.js', { cwd: __dirname }).toString();
    console.log('Validation result:', result);
} catch (error) {
    console.log('Validation failed:', error.message);
}