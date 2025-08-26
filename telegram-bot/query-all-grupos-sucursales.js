const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize database pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function queryAllGruposOperativos() {
    try {
        // First, get all distinct grupos operativos
        const gruposQuery = `
            SELECT DISTINCT grupo_operativo 
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo IS NOT NULL
            ORDER BY grupo_operativo;
        `;
        
        console.log('Getting all grupos operativos...\n');
        const gruposResult = await pool.query(gruposQuery);
        
        console.log(`Found ${gruposResult.rows.length} grupos operativos:\n`);
        
        // For each grupo operativo, get all its sucursales
        for (const grupoRow of gruposResult.rows) {
            const grupo = grupoRow.grupo_operativo;
            console.log(`\n${'='.repeat(60)}`);
            console.log(`GRUPO OPERATIVO: ${grupo}`);
            console.log('='.repeat(60));
            
            // Get all distinct sucursales for this grupo
            const sucursalesQuery = `
                SELECT DISTINCT sucursal_clean, COUNT(*) as record_count
                FROM supervision_operativa_detalle 
                WHERE grupo_operativo = $1
                GROUP BY sucursal_clean
                ORDER BY COUNT(*) DESC, sucursal_clean;
            `;
            
            const sucursalesResult = await pool.query(sucursalesQuery, [grupo]);
            
            console.log(`Total sucursales: ${sucursalesResult.rows.length}\n`);
            
            // Show top 10 sucursales by record count
            console.log('Top sucursales by record count:');
            console.log('-'.repeat(50));
            
            const topSucursales = sucursalesResult.rows.slice(0, 10);
            topSucursales.forEach((row, index) => {
                console.log(`${(index + 1).toString().padStart(2)}. ${row.sucursal_clean.padEnd(30)} - ${row.record_count} records`);
            });
            
            // Show all sucursales in a compact format
            if (sucursalesResult.rows.length > 10) {
                console.log(`\nAll ${sucursalesResult.rows.length} sucursales:`);
                console.log('-'.repeat(50));
                const allSucursales = sucursalesResult.rows.map(row => row.sucursal_clean).join(', ');
                console.log(allSucursales);
            }
            
            // Get total records for this grupo
            const totalQuery = `
                SELECT COUNT(*) as total_records
                FROM supervision_operativa_detalle 
                WHERE grupo_operativo = $1;
            `;
            
            const totalResult = await pool.query(totalQuery, [grupo]);
            console.log(`\nTotal records for ${grupo}: ${totalResult.rows[0].total_records}`);
        }
        
        // Also create a summary with JSON output for easy parsing
        console.log('\n\n' + '='.repeat(60));
        console.log('JSON SUMMARY FOR KNOWLEDGE BASE');
        console.log('='.repeat(60));
        
        const summaryQuery = `
            SELECT 
                grupo_operativo,
                ARRAY_AGG(DISTINCT sucursal_clean ORDER BY sucursal_clean) as sucursales,
                COUNT(DISTINCT sucursal_clean) as total_sucursales,
                COUNT(*) as total_records
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo IS NOT NULL
            GROUP BY grupo_operativo
            ORDER BY grupo_operativo;
        `;
        
        const summaryResult = await pool.query(summaryQuery);
        
        const knowledgeBase = {};
        summaryResult.rows.forEach(row => {
            knowledgeBase[row.grupo_operativo] = {
                sucursales: row.sucursales,
                total_sucursales: parseInt(row.total_sucursales),
                total_records: parseInt(row.total_records)
            };
        });
        
        console.log(JSON.stringify(knowledgeBase, null, 2));
        
    } catch (error) {
        console.error('Error querying database:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the query
queryAllGruposOperativos();