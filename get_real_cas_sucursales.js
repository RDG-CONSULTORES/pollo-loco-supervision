const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getAllSucursales() {
    try {
        const query = await pool.query(`
            SELECT DISTINCT location_name, COUNT(*) as evaluaciones
            FROM supervision_operativa_cas 
            WHERE location_name IS NOT NULL
            GROUP BY location_name
            ORDER BY COUNT(*) DESC
        `);
        
        console.log('📍 TODAS LAS SUCURSALES EN supervision_operativa_cas:');
        console.log('Total:', query.rows.length, 'sucursales únicas');
        console.log('');
        
        query.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.location_name} (${row.evaluaciones} evaluaciones)`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

getAllSucursales();