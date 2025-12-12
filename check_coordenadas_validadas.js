const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getCoordenadasValidadas() {
    try {
        const query = await pool.query(`
            SELECT 
                numero_sucursal,
                nombre_sucursal, 
                grupo_operativo,
                estado,
                tipo_territorial
            FROM coordenadas_validadas
            ORDER BY grupo_operativo, numero_sucursal
        `);
        
        console.log('📍 COORDENADAS_VALIDADAS - GRUPOS NORMALIZADOS:');
        console.log('Total sucursales:', query.rows.length);
        console.log('');
        
        let currentGroup = '';
        let localCount = 0, foraneaCount = 0;
        
        query.rows.forEach(row => {
            if (row.grupo_operativo !== currentGroup) {
                if (currentGroup) console.log('');
                currentGroup = row.grupo_operativo;
                console.log(`🏢 ${currentGroup}:`);
            }
            console.log(`   ${row.numero_sucursal} - ${row.nombre_sucursal} (${row.estado}) [${row.tipo_territorial}]`);
            
            if (row.tipo_territorial === 'Local') localCount++;
            if (row.tipo_territorial === 'Foránea') foraneaCount++;
        });
        
        console.log(`\n📊 TOTALES: ${localCount} Locales + ${foraneaCount} Foráneas = ${query.rows.length} sucursales`);
        
        // Mostrar grupos mixtos específicamente
        console.log('\n🎯 GRUPOS MIXTOS (Local + Foránea):');
        const gruposMixtos = await pool.query(`
            SELECT 
                grupo_operativo,
                tipo_territorial,
                COUNT(*) as sucursales,
                STRING_AGG(numero_sucursal || ' - ' || nombre_sucursal, ', ' ORDER BY numero_sucursal) as lista
            FROM coordenadas_validadas
            GROUP BY grupo_operativo, tipo_territorial
            HAVING grupo_operativo IN (
                SELECT grupo_operativo 
                FROM coordenadas_validadas 
                GROUP BY grupo_operativo 
                HAVING COUNT(DISTINCT tipo_territorial) > 1
            )
            ORDER BY grupo_operativo, tipo_territorial
        `);
        
        let currentMixedGroup = '';
        gruposMixtos.rows.forEach(row => {
            if (row.grupo_operativo !== currentMixedGroup) {
                currentMixedGroup = row.grupo_operativo;
                console.log(`\n🔄 ${currentMixedGroup}:`);
            }
            console.log(`   ${row.tipo_territorial} (${row.sucursales}): ${row.lista}`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

getCoordenadasValidadas();