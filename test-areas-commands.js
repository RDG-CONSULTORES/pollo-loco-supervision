const { Pool } = require('pg');
const ElPolloLocoBusinessKnowledge = require('./telegram-bot/business-knowledge');

console.log('🧪 TESTING NUEVOS COMANDOS DE ÁREAS');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function testAreaCommands() {
    try {
        const businessKnowledge = new ElPolloLocoBusinessKnowledge();

        console.log('📊 TESTING /areas_criticas (Oportunidades):');
        const areasCriticas = await businessKnowledge.generateFalconResponse('areas_criticas', pool);
        console.log(areasCriticas);

        console.log('\n🏆 TESTING /top_areas (Mejores):');
        const topAreas = await businessKnowledge.generateFalconResponse('top_areas', pool);
        console.log(topAreas);

        console.log('\n✅ AMBOS COMANDOS FUNCIONAN!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testAreaCommands();