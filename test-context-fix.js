const IntelligentContextManager = require('./telegram-bot/intelligent-context-manager');
const LLMManager = require('./telegram-bot/llm-manager');

async function testContextFix() {
    console.log('🧠 TESTING CONTEXT FIX - TEPEYAC vs EPL SO');
    
    try {
        const llm = new LLMManager();
        const contextManager = new IntelligentContextManager(llm);
        
        const testChatId = 'test_user_tepeyac';
        
        // 1. Simular que el usuario ya completó onboarding con TEPEYAC
        console.log('\n1️⃣ Simulando perfil de usuario con TEPEYAC configurado...');
        
        const userProfile = {
            userType: 'supervisor',
            primaryGroup: 'TEPEYAC',
            region: 'norte',
            interests: ['todo'],
            onboardingCompleted: true
        };
        
        // Crear conversación con perfil
        contextManager.conversations.set(testChatId, {
            history: [],
            lastGroup: null,
            userProfile: userProfile,
            lastUpdate: new Date()
        });
        
        console.log('✅ Usuario configurado:', userProfile);
        
        // 2. Test pregunta ambigua que debe usar TEPEYAC
        console.log('\n2️⃣ Testing pregunta ambigua: "¿cómo vamos?"');
        
        const contextData = await contextManager.analyzeQuestionContext(
            "¿cómo vamos?",
            testChatId,
            []
        );
        
        console.log('\n📊 RESULTADO DEL ANÁLISIS:');
        console.log('- Grupo detectado:', contextData.detectedGroup);
        console.log('- Grupo del contexto:', contextData.groupFromContext);
        console.log('- Grupo principal:', contextData.primaryGroup);
        console.log('- GRUPO FINAL:', contextData.finalGroup);
        console.log('- Confianza:', contextData.confidence);
        console.log('- Razonamiento:', contextData.reasoning);
        
        // 3. Verificación
        if (contextData.finalGroup === 'TEPEYAC') {
            console.log('\n✅ ÉXITO: Ana usó TEPEYAC correctamente (grupo principal del usuario)');
        } else {
            console.log('\n❌ ERROR: Ana usó', contextData.finalGroup, 'en lugar de TEPEYAC');
            console.log('   Este es el bug que estamos arreglando');
        }
        
        // 4. Test adicional con pregunta específica
        console.log('\n3️⃣ Testing pregunta específica sobre otro grupo');
        const specificContext = await contextManager.analyzeQuestionContext(
            "¿cómo va OGAS?",
            testChatId,
            []
        );
        
        console.log('\n📊 RESULTADO PREGUNTA ESPECÍFICA:');
        console.log('- GRUPO FINAL:', specificContext.finalGroup, '(debería ser OGAS)');
        
        if (specificContext.finalGroup === 'OGAS') {
            console.log('✅ Correcto: Ana detectó OGAS específico');
        } else {
            console.log('❌ Error: No detectó OGAS específico');
        }
        
        console.log('\n🎯 CONTEXTO MANAGER MEJORADO PROBADO');
        
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        if (error.message.includes('OPENAI_API_KEY')) {
            console.log('\n⚠️  Sin OpenAI API KEY - Solo se puede probar el fallback');
            
            // Test fallback
            const llm = new LLMManager();
            const contextManager = new IntelligentContextManager(llm);
            
            // Simular perfil
            contextManager.conversations.set('test', {
                userProfile: { primaryGroup: 'TEPEYAC' }
            });
            
            const fallbackResult = contextManager.getFallbackContext("¿cómo vamos?", 'test');
            console.log('Fallback result:', fallbackResult.finalGroup);
            
            if (fallbackResult.finalGroup === 'TEPEYAC') {
                console.log('✅ FALLBACK FUNCIONA: Usa TEPEYAC del perfil');
            }
        }
    }
}

testContextFix();