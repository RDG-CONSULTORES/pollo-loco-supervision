const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getRealGruposMixtos() {
    try {
        console.log('🔍 ANALIZANDO coordenadas_validadas - GRUPOS REALES...');
        
        // Ver todos los grupos y sus estados
        const grupos = await pool.query(`
            SELECT 
                grupo_operativo,
                estado,
                COUNT(*) as sucursales,
                STRING_AGG(numero_sucursal || ' - ' || nombre_sucursal, ', ' ORDER BY numero_sucursal) as lista_sucursales
            FROM coordenadas_validadas
            GROUP BY grupo_operativo, estado
            ORDER BY grupo_operativo, estado
        `);
        
        console.log('\n📊 TODOS LOS GRUPOS POR ESTADO:');
        console.log('================================');
        
        let currentGroup = '';
        const grupoData = {};
        
        grupos.rows.forEach(row => {
            if (row.grupo_operativo !== currentGroup) {
                currentGroup = row.grupo_operativo;
                console.log(`\n🏢 ${currentGroup}:`);
                grupoData[currentGroup] = {};
            }
            console.log(`   📍 ${row.estado}: ${row.sucursales} sucursales`);
            console.log(`      ${row.lista_sucursales}`);
            
            grupoData[currentGroup][row.estado] = {
                count: row.sucursales,
                sucursales: row.lista_sucursales
            };
        });
        
        // Identificar grupos mixtos (que tienen sucursales en Nuevo León Y otros estados)
        console.log('\n🎯 GRUPOS MIXTOS IDENTIFICADOS:');
        console.log('===============================');
        
        Object.keys(grupoData).forEach(grupo => {
            const estados = Object.keys(grupoData[grupo]);
            const tieneNL = estados.includes('Nuevo León');
            const tieneOtros = estados.some(e => e !== 'Nuevo León');
            
            if (tieneNL && tieneOtros) {
                console.log(`\n🔄 ${grupo} (MIXTO):`);
                estados.forEach(estado => {
                    const tipo = estado === 'Nuevo León' ? 'LOCAL' : 'FORÁNEA';
                    console.log(`   ${tipo}: ${grupoData[grupo][estado].count} sucursales en ${estado}`);
                    console.log(`      ${grupoData[grupo][estado].sucursales}`);
                });
            }
        });
        
        // Crear el territorialMapping correcto
        console.log('\n🛠️ TERRITORIAL MAPPING CORRECTO:');
        console.log('==================================');
        
        const territorialMapping = {};
        Object.keys(grupoData).forEach(grupo => {
            const estados = Object.keys(grupoData[grupo]);
            const tieneNL = estados.includes('Nuevo León');
            const tieneOtros = estados.some(e => e !== 'Nuevo León');
            
            if (tieneNL && tieneOtros) {
                territorialMapping[grupo] = {
                    local: [],
                    foranea: []
                };
                
                estados.forEach(estado => {
                    const sucursales = grupoData[grupo][estado].sucursales.split(', ');
                    if (estado === 'Nuevo León') {
                        territorialMapping[grupo].local = sucursales;
                    } else {
                        territorialMapping[grupo].foranea.push(...sucursales);
                    }
                });
            }
        });
        
        console.log('const territorialMapping = {');
        Object.keys(territorialMapping).forEach(grupo => {
            console.log(`    '${grupo}': {`);
            console.log(`        local: [${territorialMapping[grupo].local.map(s => `'${s}'`).join(', ')}],`);
            console.log(`        foranea: [${territorialMapping[grupo].foranea.map(s => `'${s}'`).join(', ')}]`);
            console.log(`    },`);
        });
        console.log('};');
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

getRealGruposMixtos();