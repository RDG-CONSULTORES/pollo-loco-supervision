const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseURL = `https://api.telegram.org/bot${token}`;

async function cleanupBot() {
    console.log('🧹 Iniciando limpieza completa del bot...');
    
    try {
        // 1. Eliminar todos los comandos
        console.log('1️⃣ Eliminando comandos...');
        const deleteCommands = await axios.post(`${baseURL}/deleteMyCommands`);
        console.log('✅ Comandos eliminados:', deleteCommands.data);
        
        // 2. Configurar solo comandos esenciales
        console.log('2️⃣ Configurando comandos nuevos...');
        const setCommands = await axios.post(`${baseURL}/setMyCommands`, {
            commands: [
                { command: "start", description: "Iniciar el bot" },
                { command: "dashboard", description: "Ver dashboard interactivo" }
            ]
        });
        console.log('✅ Comandos configurados:', setCommands.data);
        
        // 3. Configurar menu button (botón azul)
        console.log('3️⃣ Configurando menu button...');
        const setMenuButton = await axios.post(`${baseURL}/setChatMenuButton`, {
            menu_button: {
                type: "web_app",
                text: "📊 Dashboard",
                web_app: {
                    url: "https://pollo-loco-supervision.onrender.com/dashboard-ios-complete"
                }
            }
        });
        console.log('✅ Menu button configurado:', setMenuButton.data);
        
        // 4. Obtener información del bot para verificar
        console.log('4️⃣ Verificando configuración...');
        const botInfo = await axios.get(`${baseURL}/getMe`);
        console.log('🤖 Bot info:', botInfo.data.result);
        
        console.log('\n🎯 LIMPIEZA COMPLETADA:');
        console.log('✅ Comandos: solo /start y /dashboard');
        console.log('✅ Menu button: 📊 Dashboard');
        console.log('✅ URL: https://pollo-loco-supervision.onrender.com/dashboard-ios-complete');
        console.log('\n📱 Prueba el bot ahora: /start');
        
    } catch (error) {
        console.error('❌ Error en limpieza:', error.response?.data || error.message);
    }
}

// Función para enviar mensaje de limpieza de teclado a un chat específico
async function removeKeyboardForChat(chatId) {
    try {
        const response = await axios.post(`${baseURL}/sendMessage`, {
            chat_id: chatId,
            text: "🧹 Limpiando interfaz del bot...",
            reply_markup: {
                remove_keyboard: true
            }
        });
        console.log(`✅ Teclado removido para chat ${chatId}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error removiendo teclado para ${chatId}:`, error.response?.data || error.message);
    }
}

// Ejecutar limpieza
cleanupBot();

// Exportar función para usar en bot principal
module.exports = { removeKeyboardForChat };