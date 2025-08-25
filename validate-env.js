#!/usr/bin/env node
/**
 * 🔍 Validador de Variables de Entorno
 * Ejecuta este script en Render para verificar las variables
 */

console.log('🔍 VALIDADOR DE VARIABLES DE ENTORNO');
console.log('====================================\n');

const requiredVars = [
    'DATABASE_URL',
    'NODE_ENV', 
    'TELEGRAM_BOT_TOKEN',
    'START_BOT'
];

let allValid = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    const exists = value !== undefined;
    const hasSpaces = exists && (value.trim() !== value || value.includes('  '));
    
    console.log(`📋 ${varName}:`);
    console.log(`   ✅ Existe: ${exists ? 'SÍ' : '❌ NO'}`);
    
    if (exists) {
        console.log(`   ✅ Sin espacios: ${!hasSpaces ? 'SÍ' : '❌ TIENE ESPACIOS'}`);
        console.log(`   📏 Longitud: ${value.length} caracteres`);
        
        // Mostrar primeros y últimos caracteres para validar
        if (varName === 'DATABASE_URL') {
            console.log(`   🔗 Inicia con: "${value.substring(0, 15)}..."`);
            console.log(`   🔗 Termina con: "...${value.substring(value.length - 15)}"`);
        } else if (varName === 'TELEGRAM_BOT_TOKEN') {
            console.log(`   🤖 Inicia con: "${value.substring(0, 10)}..."`);
        } else {
            console.log(`   💡 Valor: "${value}"`);
        }
        
        if (hasSpaces) allValid = false;
    } else {
        allValid = false;
    }
    
    console.log('');
});

console.log('====================================');
if (allValid) {
    console.log('✅ TODAS LAS VARIABLES SON VÁLIDAS');
    console.log('🚀 El sistema debería funcionar correctamente');
} else {
    console.log('❌ HAY PROBLEMAS CON LAS VARIABLES');
    console.log('🔧 Revisa las variables marcadas como problemáticas');
}

// Test de conexión a base de datos
if (process.env.DATABASE_URL) {
    console.log('\n🔌 PROBANDO CONEXIÓN A BASE DE DATOS...');
    
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    pool.connect()
        .then(() => {
            console.log('✅ CONEXIÓN A BASE DE DATOS: EXITOSA');
            pool.end();
        })
        .catch(err => {
            console.log('❌ CONEXIÓN A BASE DE DATOS: FALLÓ');
            console.log(`🚨 Error: ${err.message}`);
            
            if (err.message.includes('password authentication failed')) {
                console.log('💡 PROBABLE CAUSA: Password o usuario incorrecto');
            } else if (err.message.includes('does not exist')) {
                console.log('💡 PROBABLE CAUSA: Base de datos no existe');  
            } else if (err.message.includes('connection')) {
                console.log('💡 PROBABLE CAUSA: URL de conexión malformada');
            }
        });
}