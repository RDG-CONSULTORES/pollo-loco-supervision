const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_DlSRAHuyaY83@ep-orange-grass-a402u4o5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function analyzeDatabase() {
  try {
    await client.connect();
    console.log('✅ Conectado a Neon PostgreSQL');

    // 1. Listar todas las tablas
    console.log('\n📊 ESTRUCTURA DE TABLAS:');
    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tablas encontradas:');
    tablesQuery.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // 2. Para cada tabla, mostrar su estructura
    for (const table of tablesQuery.rows) {
      console.log(`\n📋 Estructura de tabla: ${table.table_name}`);
      const columnsQuery = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table.table_name]);
      
      columnsQuery.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      // Contar registros
      const countQuery = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  Total registros: ${countQuery.rows[0].count}`);
    }

    // 3. Buscar tabla de supervisiones o similar
    console.log('\n🔍 Buscando tabla de supervisiones...');
    const supervisionTables = tablesQuery.rows.filter(row => 
      row.table_name.toLowerCase().includes('superv') || 
      row.table_name.toLowerCase().includes('indicador') ||
      row.table_name.toLowerCase().includes('calific') ||
      row.table_name.toLowerCase().includes('eval')
    );
    
    if (supervisionTables.length > 0) {
      console.log('Posibles tablas de supervisión encontradas:');
      supervisionTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

analyzeDatabase();