const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize database pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function queryTepeyacSucursales() {
    try {
        // Query to find all distinct sucursal names for grupo_operativo='TEPEYAC'
        const query = `
            SELECT DISTINCT sucursal_clean 
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
            ORDER BY sucursal_clean;
        `;
        
        console.log('Executing query to find TEPEYAC sucursales...\n');
        
        const result = await pool.query(query);
        
        console.log(`Found ${result.rows.length} sucursales in TEPEYAC grupo operativo:\n`);
        
        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.sucursal_clean}`);
        });
        
        // Also get a count of records per sucursal
        const countQuery = `
            SELECT sucursal_clean, COUNT(*) as total_records
            FROM supervision_operativa_detalle 
            WHERE grupo_operativo = 'TEPEYAC'
            GROUP BY sucursal_clean
            ORDER BY sucursal_clean;
        `;
        
        const countResult = await pool.query(countQuery);
        
        console.log('\n\nRecord count per sucursal:');
        console.log('─'.repeat(50));
        
        countResult.rows.forEach(row => {
            console.log(`${row.sucursal_clean}: ${row.total_records} records`);
        });
        
    } catch (error) {
        console.error('Error querying database:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the query
queryTepeyacSucursales();