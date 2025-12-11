const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO ESQUEMA DE BASE DE DATOS');
    console.log('=' .repeat(60));

    // Check if supervision_normalized_view exists
    const viewsQuery = `
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE viewname LIKE '%supervision%' OR viewname LIKE '%normalized%';
    `;
    
    const viewsResult = await client.query(viewsQuery);
    console.log('\n📋 VISTAS DISPONIBLES:');
    if (viewsResult.rows.length > 0) {
      viewsResult.rows.forEach(row => {
        console.log(`   ${row.schemaname}.${row.viewname}`);
      });
    } else {
      console.log('   No se encontraron vistas con "supervision" o "normalized"');
    }

    // Check available tables
    const tablesQuery = `
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND (tablename LIKE '%supervision%' OR tablename LIKE '%sucursal%');
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 TABLAS DISPONIBLES:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   ${row.schemaname}.${row.tablename}`);
      });
    } else {
      console.log('   No se encontraron tablas con "supervision" o "sucursal"');
    }
    
    // Try to describe the supervision_normalized_view if it exists
    try {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'supervision_normalized_view'
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await client.query(columnsQuery);
      
      if (columnsResult.rows.length > 0) {
        console.log('\n📋 COLUMNAS EN supervision_normalized_view:');
        columnsResult.rows.forEach(row => {
          console.log(`   ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
        });
      }
    } catch (error) {
      console.log('\n❌ No se pudo acceder a supervision_normalized_view');
    }
    
    // Try alternative table names
    const alternativeQueries = [
      "SELECT * FROM supervisions LIMIT 1;",
      "SELECT * FROM supervision LIMIT 1;", 
      "SELECT * FROM sucursales LIMIT 1;",
      "SELECT * FROM supervision_data LIMIT 1;"
    ];
    
    console.log('\n🔍 PROBANDO NOMBRES ALTERNATIVOS DE TABLAS:');
    
    for (const query of alternativeQueries) {
      const tableName = query.split(' ')[3];
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName};`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} registros`);
        
        // Show columns for found table
        const descQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `;
        const descResult = await client.query(descQuery);
        console.log(`   Columnas: ${descResult.rows.map(r => r.column_name).join(', ')}`);
        
      } catch (error) {
        console.log(`❌ ${tableName}: No existe`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();