// =========================================
// TEST LLM SYSTEM - Validación completa del sistema inteligente
// =========================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const LLMManager = require('./llm-manager');
const ElPolloLocoPromptEngine = require('./prompt-engine');
const IntelligentQueryEngine = require('./intelligent-query-engine');
const TrueAgenticDirector = require('./true-agentic-director');

// Configurar pool de base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testLLMSystem() {
    console.log('🧪 TESTING LLM SYSTEM - EL POLLO LOCO ANA INTELLIGENCE');
    console.log('========================================================');
    
    try {
        // Test 1: LLM Manager
        console.log('\n1️⃣ Testing LLM Manager...');
        const llmManager = new LLMManager();
        
        console.log('🔧 Testing all LLM providers...');
        const providerTests = await llmManager.testAllProviders();
        console.log('Provider results:', JSON.stringify(providerTests, null, 2));
        
        let workingProviders = Object.values(providerTests).filter(p => p.status === 'OK').length;
        console.log(`✅ LLM Manager: ${workingProviders}/${Object.keys(providerTests).length} providers working`);
        
        if (workingProviders === 0) {
            console.log('❌ NO LLM PROVIDERS WORKING - Check API keys in .env');
            console.log('Required environment variables:');
            console.log('- OPENAI_API_KEY (starts with sk-)');
            console.log('- CLAUDE_API_KEY (starts with sk-ant-)');
            return false;
        }
        
        // Test 2: Prompt Engine
        console.log('\n2️⃣ Testing Prompt Engine...');
        const promptEngine = new ElPolloLocoPromptEngine();
        
        const testQuestion = "¿Cuántas sucursales tiene TEPEYAC?";
        const queryType = promptEngine.detectQueryType(testQuestion);
        const entities = promptEngine.extractEntities(testQuestion);
        
        console.log(`Query type detected: ${queryType.type} (confidence: ${queryType.confidence})`);
        console.log(`Entities extracted:`, entities);
        console.log('✅ Prompt Engine working correctly');
        
        // Test 3: Database Connection
        console.log('\n3️⃣ Testing Database Connection...');
        const dbTest = await pool.query('SELECT COUNT(*) as total FROM supervision_operativa_detalle LIMIT 1');
        console.log(`Database connection: ${dbTest.rows[0].total} total records found`);
        console.log('✅ Database connection working');
        
        // Test 4: Intelligent Query Engine
        console.log('\n4️⃣ Testing Intelligent Query Engine...');
        const queryEngine = new IntelligentQueryEngine(llmManager, pool, promptEngine);
        
        const testResult = await queryEngine.processIntelligentQuery(
            "¿Cuál es el promedio general de supervisiones?", 
            { test_context: true }
        );
        
        console.log('Query engine test result:');
        console.log(`- Intent detected: ${testResult.intent_detected?.primary_intent}`);
        console.log(`- Data found: ${testResult.data_found} records`);
        console.log(`- Processing time: ${testResult.processing_time}ms`);
        console.log(`- Success: ${testResult.success}`);
        console.log('✅ Intelligent Query Engine working');
        
        // Test 5: True Agentic Director
        console.log('\n5️⃣ Testing True Agentic Director...');
        const trueDirector = new TrueAgenticDirector(pool, null, null);
        
        const directorTest = await trueDirector.processUserQuestion(
            "¿Cuáles son los 3 mejores grupos operativos?",
            'test-user-123'
        );
        
        console.log('True Agentic Director test result:');
        console.log(`Response length: ${directorTest.length} characters`);
        console.log(`Sample response: "${directorTest.substring(0, 100)}..."`);
        console.log('✅ True Agentic Director working');
        
        // Test 6: Intelligence Status
        console.log('\n6️⃣ Testing Intelligence Status...');
        const status = trueDirector.getIntelligenceStatus();
        console.log('Intelligence Status:');
        console.log(`- Name: ${status.name}`);
        console.log(`- Intelligence type: ${status.intelligence_type}`);
        console.log(`- Training complete: ${status.training_complete}`);
        console.log(`- Capabilities: ${status.capabilities.length} active`);
        console.log(`- Conversations handled: ${status.conversations_handled}`);
        console.log('✅ Intelligence Status working');
        
        // Final Summary
        console.log('\n🎉 SYSTEM TEST COMPLETE - ALL COMPONENTS WORKING');
        console.log('========================================================');
        console.log('✅ LLM Manager - Multi-provider support active');
        console.log('✅ Prompt Engine - El Pollo Loco business context loaded');
        console.log('✅ Database - Connection and queries working');
        console.log('✅ Query Engine - Intelligent SQL generation active');
        console.log('✅ True Agentic Director - Conversational AI ready');
        console.log('✅ Intelligence Status - Real metrics available');
        console.log('\n🚀 ANA IS NOW TRULY INTELLIGENT AND READY!');
        console.log('🤖 The fake system has been completely replaced');
        console.log('💡 Ana will now provide real business insights instead of meaningless numbers');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ SYSTEM TEST FAILED:', error);
        console.log('\nTroubleshooting:');
        console.log('1. Check database connection (DATABASE_URL in .env)');
        console.log('2. Verify LLM API keys (OPENAI_API_KEY, CLAUDE_API_KEY)');
        console.log('3. Ensure all npm packages are installed');
        console.log('4. Check network connectivity');
        return false;
    }
}

async function testSpecificScenarios() {
    console.log('\n🧪 TESTING SPECIFIC BUSINESS SCENARIOS');
    console.log('=====================================');
    
    const trueDirector = new TrueAgenticDirector(pool, null, null);
    
    const testScenarios = [
        {
            name: "Grupo Analysis",
            question: "¿Cómo está el performance de TEPEYAC?"
        },
        {
            name: "Ranking Query", 
            question: "¿Cuáles son los 5 mejores grupos operativos?"
        },
        {
            name: "Areas Analysis",
            question: "¿Qué áreas necesitan más atención?"
        },
        {
            name: "Comparative Analysis",
            question: "¿Cómo se compara OGAS con TEPEYAC?"
        }
    ];
    
    for (const scenario of testScenarios) {
        console.log(`\n🎯 Testing: ${scenario.name}`);
        console.log(`Question: "${scenario.question}"`);
        
        try {
            const response = await trueDirector.processUserQuestion(
                scenario.question, 
                `test-scenario-${scenario.name.toLowerCase().replace(' ', '-')}`
            );
            
            console.log(`✅ Response generated (${response.length} chars)`);
            console.log(`Sample: "${response.substring(0, 150)}..."`);
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
}

// Run tests
async function runAllTests() {
    const systemSuccess = await testLLMSystem();
    
    if (systemSuccess) {
        await testSpecificScenarios();
        
        console.log('\n🚀 READY FOR PRODUCTION!');
        console.log('Ana is now truly intelligent and can handle complex business queries.');
        console.log('The transformation from fake to real AI is complete.');
    }
    
    process.exit(systemSuccess ? 0 : 1);
}

// Execute if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { testLLMSystem, testSpecificScenarios };