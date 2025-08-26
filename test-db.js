const { Pool } = require('pg');

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS\n');

// Probar diferentes formatos de connection string
const connectionStrings = [
    // Nueva connection string de Neon
    'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    // Sin channel_binding
    'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    // Con puerto explícito
    'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech:5432/neondb?sslmode=require'
];

async function testConnection(connString, index) {
    console.log(`\n📋 PRUEBA ${index + 1}:`);
    console.log(`Connection string: ${connString.substring(0, 50)}...`);
    
    const pool = new Pool({
        connectionString: connString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const client = await pool.connect();
        console.log('✅ CONEXIÓN EXITOSA!');
        
        // Probar una query simple
        const result = await client.query('SELECT NOW()');
        console.log(`📅 Hora del servidor: ${result.rows[0].now}`);
        
        // Verificar si la tabla existe
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'supervision_operativa_detalle'
            );
        `);
        console.log(`📊 Tabla existe: ${tableCheck.rows[0].exists ? 'SÍ' : 'NO'}`);
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        if (error.code) console.log('📍 Código de error:', error.code);
        await pool.end();
        return false;
    }
}

// Ejecutar todas las pruebas
async function runAllTests() {
    let successfulConnection = null;
    
    for (let i = 0; i < connectionStrings.length; i++) {
        const success = await testConnection(connectionStrings[i], i);
        if (success && !successfulConnection) {
            successfulConnection = connectionStrings[i];
        }
    }
    
    console.log('\n' + '='.repeat(50));
    if (successfulConnection) {
        console.log('✅ CONEXIÓN EXITOSA ENCONTRADA!');
        console.log('📝 Usa esta connection string:');
        console.log(successfulConnection);
    } else {
        console.log('❌ TODAS LAS CONEXIONES FALLARON');
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verifica que el password sea correcto en Neon Dashboard');
        console.log('2. Revisa que la base de datos esté activa');
        console.log('3. Confirma que el usuario sea neondb_owner');
        console.log('4. Intenta resetear el password en Neon');
    }
}

runAllTests();