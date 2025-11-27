const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function createCoordinatesTable() {
    try {
        console.log('📊 Creating validated coordinates table...');
        
        // Drop table if exists
        await pool.query('DROP TABLE IF EXISTS coordenadas_validadas');
        
        // Create table
        await pool.query(`
            CREATE TABLE coordenadas_validadas (
                numero_sucursal INTEGER PRIMARY KEY,
                nombre_sucursal VARCHAR(255),
                grupo_operativo VARCHAR(255),
                ciudad VARCHAR(255),
                estado VARCHAR(255),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                location_code VARCHAR(50),
                synced_at TIMESTAMP
            )
        `);
        
        console.log('✅ Table created');
        
        // Read and parse CSV
        const csvPath = './data/grupos_operativos_final_corregido.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n');
        
        console.log('📋 Loading CSV data...');
        
        // Insert CSV data
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse CSV line
            const parts = line.split(',');
            if (parts.length < 9) continue;
            
            try {
                const numero = parseInt(parts[0]);
                const nombre = parts[1];
                const grupo = parts[2];
                const ciudad = parts[3];
                const estado = parts[4];
                const lat = parseFloat(parts[5]);
                const lng = parseFloat(parts[6]);
                const location_code = parts[7];
                const synced_at = parts[8];
                
                if (numero && !isNaN(lat) && !isNaN(lng)) {
                    await pool.query(`
                        INSERT INTO coordenadas_validadas 
                        (numero_sucursal, nombre_sucursal, grupo_operativo, ciudad, estado, latitude, longitude, location_code, synced_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [numero, nombre, grupo, ciudad, estado, lat, lng, location_code, synced_at]);
                    
                    if (numero <= 5 || numero >= 82) {
                        console.log(`  ✓ ${numero}: ${nombre} (${grupo}) - ${lat}, ${lng}`);
                    }
                }
            } catch (rowError) {
                console.log(`  ⚠️ Skipped line ${i}: ${rowError.message}`);
            }
        }
        
        // Verify data
        const countResult = await pool.query('SELECT COUNT(*) as total FROM coordenadas_validadas');
        console.log(`\n✅ Loaded ${countResult.rows[0].total} validated coordinates`);
        
        // Show key coordinates including new ones
        const sampleResult = await pool.query(`
            SELECT numero_sucursal, nombre_sucursal, grupo_operativo, latitude, longitude
            FROM coordenadas_validadas 
            WHERE numero_sucursal IN (4, 6, 7, 82, 83, 84, 85)
            ORDER BY numero_sucursal
        `);
        
        console.log('\n📍 Key validated coordinates (including new branches):');
        sampleResult.rows.forEach(row => {
            console.log(`  ${row.numero_sucursal}: ${row.nombre_sucursal} (${row.grupo_operativo}) - ${row.latitude}, ${row.longitude}`);
        });
        
        await pool.end();
        console.log('\n✅ Coordinates table creation complete');
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

createCoordinatesTable();