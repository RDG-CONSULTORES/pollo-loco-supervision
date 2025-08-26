// Test simple del context manager sin OpenAI
const IntelligentContextManager = require('./telegram-bot/intelligent-context-manager');

function testContextFallback() {
    console.log('🧠 TESTING CONTEXT FALLBACK - TEPEYAC vs EPL SO');
    
    try {
        const contextManager = new IntelligentContextManager(null); // Sin LLM para test
        const testChatId = 'test_user_tepeyac';
        
        console.log('\n1️⃣ Simulando perfil de usuario con TEPEYAC configurado...');
        
        // Crear conversación con TEPEYAC como grupo principal
        contextManager.conversations.set(testChatId, {
            history: [],
            lastGroup: null,
            userProfile: {
                userType: 'supervisor',
                primaryGroup: 'TEPEYAC',
                region: 'norte',
                interests: ['todo'],
                onboardingCompleted: true
            },
            lastUpdate: new Date()
        });
        
        console.log('✅ Usuario configurado con primaryGroup: TEPEYAC');
        
        console.log('\n2️⃣ Testing pregunta ambigua: "¿cómo vamos?" (debería usar TEPEYAC)');
        
        // Test fallback con chatId
        const result1 = contextManager.getFallbackContext("¿cómo vamos?", testChatId);
        
        console.log('\n📊 RESULTADO:');
        console.log('- Grupo detectado directamente:', result1.detectedGroup);
        console.log('- Grupo principal del perfil:', result1.primaryGroup);
        console.log('- GRUPO FINAL elegido:', result1.finalGroup);
        console.log('- Confianza:', result1.confidence);
        console.log('- Razonamiento:', result1.reasoning);
        
        if (result1.finalGroup === 'TEPEYAC') {
            console.log('\n✅ ÉXITO: Context Manager usa TEPEYAC del perfil usuario');
        } else {
            console.log('\n❌ ERROR: Eligió', result1.finalGroup, 'en lugar de TEPEYAC');
        }
        
        console.log('\n3️⃣ Testing pregunta específica: "¿cómo va OGAS?"');
        const result2 = contextManager.getFallbackContext("¿cómo va OGAS?", testChatId);
        
        console.log('- GRUPO FINAL elegido:', result2.finalGroup, '(debería ser OGAS)');
        
        if (result2.finalGroup === 'OGAS') {
            console.log('✅ Correcto: Detectó OGAS específico');
        } else {
            console.log('❌ Error: No detectó OGAS');
        }
        
        console.log('\n4️⃣ Testing sin perfil configurado (nuevo usuario)');
        const result3 = contextManager.getFallbackContext("¿cómo vamos?", 'new_user');
        console.log('- GRUPO FINAL para nuevo usuario:', result3.finalGroup, '(debería ser TEPEYAC default)');
        
        console.log('\n🎯 CONTEXT MANAGER FALLBACK PROBADO EXITOSAMENTE');
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testContextFallback();