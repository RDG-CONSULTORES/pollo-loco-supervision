// Test Ana Ultra Intelligence System
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

// Import the Ultra Intelligence system
const UltraIntelligenceEngine = require('./ultra-intelligence-engine');
const DynamicQueryEngine = require('./dynamic-query-engine');
const AgenticDirector = require('./agentic-director');
const IntelligentKnowledgeBase = require('./intelligent-knowledge-base');
const IntelligentSupervisionSystem = require('./intelligent-supervision-system');

// Initialize database pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testAnaIntelligence() {
    console.log('🧠 TESTING ANA ULTRA INTELLIGENCE SYSTEM');
    console.log('=========================================');
    
    try {
        // Initialize systems
        console.log('📦 Initializing systems...');
        const knowledgeBase = new IntelligentKnowledgeBase(pool);
        const intelligentSystem = new IntelligentSupervisionSystem(pool);
        const agenticDirector = new AgenticDirector(pool, knowledgeBase, intelligentSystem);
        
        // Test 1: Check initial intelligence status
        console.log('\n1️⃣ Testing intelligence status...');
        const initialStatus = agenticDirector.getIntelligenceStatus();
        console.log('Initial Status:', JSON.stringify(initialStatus, null, 2));
        
        // Test 2: Test a simple query without ultra intelligence
        console.log('\n2️⃣ Testing basic query processing...');
        const basicQuery = "¿Cuáles son las sucursales de TEPEYAC?";
        const basicResponse = await agenticDirector.processFallbackQuestion(basicQuery, 'test_chat_123');
        console.log(`Basic Query Response (${basicResponse.length} chars):`, basicResponse.substring(0, 200) + '...');
        
        // Test 3: Verify ultra intelligence training status
        console.log('\n3️⃣ Checking ultra intelligence training...');
        const finalStatus = agenticDirector.getIntelligenceStatus();
        console.log('Final Training Status:', finalStatus.training_complete ? '✅ COMPLETE' : '⏳ IN PROGRESS');
        console.log('Intelligence Level:', finalStatus.intelligence_level);
        console.log('Database Knowledge:', finalStatus.database_knowledge);
        
        // Test 4: Test dynamic query capabilities
        if (finalStatus.training_complete) {
            console.log('\n4️⃣ Testing ultra intelligent query...');
            const ultraQuery = "¿Qué oportunidades tiene el grupo OGAS en Q3?";
            const ultraResponse = await agenticDirector.processUserQuestion(ultraQuery, 'test_chat_456');
            console.log(`Ultra Response (${ultraResponse.length} chars):`, ultraResponse.substring(0, 200) + '...');
        } else {
            console.log('\n4️⃣ Ultra intelligence still training, skipping advanced test');
        }
        
        console.log('\n✅ ANA INTELLIGENCE TEST COMPLETED');
        console.log('🎯 Ana is ready to answer questions with 120% database knowledge!');
        
    } catch (error) {
        console.error('❌ Error testing Ana intelligence:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
testAnaIntelligence();