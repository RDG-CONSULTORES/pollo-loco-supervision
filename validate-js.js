// Validation script for territorial toggle implementation
const fs = require('fs');

try {
    const htmlContent = fs.readFileSync('dashboard-ios-ORIGINAL-RESTORED.html', 'utf8');
    
    // Check for key territorial functions
    const checks = [
        { name: 'applyTerritorialFilter function', pattern: /function applyTerritorialFilter/ },
        { name: 'territorial mapping', pattern: /territorialMapping = {/ },
        { name: 'territorial options HTML', pattern: /data-territorial="all"/ },
        { name: 'isLocalGroup function', pattern: /function isLocalGroup/ },
        { name: 'syncTerritorialFilterAcrossTabs function', pattern: /function syncTerritorialFilterAcrossTabs/ },
        { name: 'territorial CSS classes', pattern: /\.territorial-filter/ },
        { name: 'territorial filter in currentFilters', pattern: /territorial: 'all'/ }
    ];
    
    console.log('🔍 Validating territorial toggle implementation...\n');
    
    let allPassed = true;
    
    checks.forEach(check => {
        const found = check.pattern.test(htmlContent);
        console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? 'FOUND' : 'NOT FOUND'}`);
        if (!found) allPassed = false;
    });
    
    // Check for balanced braces in JavaScript sections
    const jsSection = htmlContent.match(/<script[^>]*>([\s\S]*)<\/script>/g);
    if (jsSection) {
        const jsContent = jsSection.join('\n');
        const openBraces = (jsContent.match(/\{/g) || []).length;
        const closeBraces = (jsContent.match(/\}/g) || []).length;
        
        console.log(`\n🔧 JavaScript syntax check:`);
        console.log(`${openBraces === closeBraces ? '✅' : '❌'} Braces balanced: ${openBraces} open, ${closeBraces} close`);
        if (openBraces !== closeBraces) allPassed = false;
    }
    
    // Check for potential syntax errors
    const potentialErrors = [
        { name: 'Unclosed strings', pattern: /[^\\]"[^"]*$/ },
        { name: 'Unclosed template literals', pattern: /[^\\]`[^`]*$/ },
        { name: 'Missing semicolons after function', pattern: /function[^{]*{[^}]*}(?!\s*[;,)])/ }
    ];
    
    console.log(`\n🚨 Potential syntax issues:`);
    potentialErrors.forEach(error => {
        const matches = htmlContent.match(error.pattern);
        if (matches) {
            console.log(`⚠️ ${error.name}: ${matches.length} potential issues`);
        } else {
            console.log(`✅ ${error.name}: OK`);
        }
    });
    
    console.log(`\n📊 Final result: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME ISSUES FOUND'}`);
    console.log(`📄 File size: ${htmlContent.length} characters`);
    
    process.exit(allPassed ? 0 : 1);
    
} catch (error) {
    console.error('❌ Error reading file:', error.message);
    process.exit(1);
}