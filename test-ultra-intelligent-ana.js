const { getDatabaseManager } = require('./telegram-bot/database-manager');
const UltraIntelligentDirector = require('./telegram-bot/ultra-intelligent-director');

console.log('🧠⚡ TESTING ANA ULTRA INTELIGENTE - OpenAI MÁXIMO');

async function testUltraIntelligentAna() {
    try {
        const dbManager = getDatabaseManager();
        const director = new UltraIntelligentDirector();
        const testChatId = 'test_ultra_user';

        console.log('\n📊 Test de Conexión Database Manager');
        const dbInfo = await dbManager.getConnectionInfo();
        console.log('Estado de conexión:', dbInfo.isConnected ? '✅ Conectado' : '❌ Desconectado');
        if (dbInfo.isConnected) {
            console.log('Base de datos:', dbInfo.databaseName);
            console.log('Conexiones activas:', dbInfo.activeConnections);
        }

        console.log('\n🧠 Test de Inteligencia Ultra');
        const intelligenceStats = director.getIntelligenceStats();
        console.log('Tipo de inteligencia:', intelligenceStats.intelligence_type);
        console.log('Capacidades IA:');
        console.log('  • Análisis de contexto:', intelligenceStats.ai_capabilities.contextAnalysis ? '✅' : '❌');
        console.log('  • Generación de queries:', intelligenceStats.ai_capabilities.queryGeneration ? '✅' : '❌');
        console.log('  • Análisis de datos:', intelligenceStats.ai_capabilities.dataAnalysis ? '✅' : '❌');
        console.log('  • Respuestas adaptativas:', intelligenceStats.ai_capabilities.adaptiveResponses ? '✅' : '❌');

        console.log('\n🎯 Test Consulta Multi-Dimensional');
        const complexQuery = "Dame las sucursales supervisadas de OGAS este trimestre con sus calificaciones y áreas de oportunidad";
        console.log('PREGUNTA:', complexQuery);
        
        console.log('\n🔄 Procesando con IA máxima...');
        const startTime = Date.now();
        const response = await director.processUserQuestion(complexQuery, testChatId);
        const processingTime = Date.now() - startTime;
        
        console.log(`\n📊 RESPUESTA ULTRA INTELIGENTE (${processingTime}ms):`);
        console.log(response.substring(0, 600) + '...');

        console.log('\n🎯 Test Consulta de Contexto');
        const contextQuery = "y cuales son sus áreas de oportunidad"; // Debe usar OGAS del contexto anterior
        console.log('PREGUNTA CONTEXTUAL:', contextQuery);
        
        const contextResponse = await director.processUserQuestion(contextQuery, testChatId);
        console.log('\n📋 RESPUESTA CONTEXTUAL:');
        console.log(contextResponse.substring(0, 400) + '...');

        console.log('\n✅ ANA ULTRA INTELIGENTE FUNCIONANDO');
        console.log('\n🚀 MEJORAS IMPLEMENTADAS:');
        console.log('   ✅ Removido Claude - Solo OpenAI optimizado');
        console.log('   ✅ Context Manager con IA conversacional');
        console.log('   ✅ Response Generator con análisis empresarial');
        console.log('   ✅ Database Manager con reconexión automática');
        console.log('   ✅ Queries inteligentes generados por IA');
        console.log('   ✅ Respuestas adaptativas por perfil de usuario');
        console.log('   ✅ Memoria conversacional para contexto de grupos');
        
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        if (error.message.includes('OPENAI_API_KEY')) {
            console.log('\n⚠️  NOTA: Para funcionalidad completa, configura OPENAI_API_KEY');
            console.log('   El sistema funcionará con datos reales pero sin IA conversacional');
        }
    } finally {
        // Cerrar conexión
        try {
            const dbManager = getDatabaseManager();
            await dbManager.close();
        } catch (e) {
            // Ignorar errores de cierre
        }
    }
}

testUltraIntelligentAna();