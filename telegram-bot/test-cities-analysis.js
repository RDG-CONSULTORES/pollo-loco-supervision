// =========================================
// ANÁLISIS CIUDADES → GRUPOS
// =========================================

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function analyzeCities() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: false
  });
  
  console.log('🔍 ANÁLISIS COMPLETO: CIUDADES/ESTADOS → GRUPOS\n');
  
  // Casos específicos que mencionaste
  const cases = [
    { name: 'Tampico', pattern: '%tampico%' },
    { name: 'Reynosa', pattern: '%reynosa%' },
    { name: 'Morelia', pattern: '%morelia%' },
    { name: 'Matamoros', pattern: '%matamoros%' },
    { name: 'Queretaro', pattern: '%queretaro%' },
    { name: 'Saltillo', pattern: '%saltillo%' }
  ];
  
  console.log('🏙️ ANÁLISIS POR CIUDADES:');
  
  for (const caso of cases) {
    console.log(`🏙️  ${caso.name}:`);
    
    try {
      const query = `
        SELECT DISTINCT grupo_operativo_limpio, COUNT(*) as sucursales
        FROM supervision_operativa_clean 
        WHERE location_name ILIKE $1
        GROUP BY grupo_operativo_limpio
        ORDER BY grupo_operativo_limpio
      `;
      const result = await pool.query(query, [caso.pattern]);
      
      if (result.rows.length === 0) {
        console.log('   ❌ NO ENCONTRADO');
      } else {
        const grupos = result.rows.map(r => r.grupo_operativo_limpio);
        const esUnico = grupos.length === 1;
        
        console.log(`   📊 Grupos: ${grupos.length} (${esUnico ? '✅ ÚNICO' : '❌ MÚLTIPLES'})`);
        result.rows.forEach(row => {
          console.log(`   📋 ${row.grupo_operativo_limpio} (${row.sucursales} sucursales)`);
        });
        
        if (esUnico) {
          console.log(`   💡 CONVERSIÓN VÁLIDA: "${caso.name}" → "${grupos[0]}"`);
        } else {
          console.log(`   ⚠️  CONVERSIÓN AMBIGUA: "${caso.name}" tiene ${grupos.length} grupos`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 CASOS REALES DE USUARIO Y RECOMENDACIONES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const casosReales = [
    { pregunta: 'como va queretaro', tipo: 'estado/ciudad' },
    { pregunta: 'como va tampico', tipo: 'ciudad' },
    { pregunta: 'como va morelia', tipo: 'ciudad' },
    { pregunta: 'como va reynosa', tipo: 'ciudad' },
    { pregunta: 'supervisiones nuevo leon', tipo: 'estado' },
    { pregunta: 'supervisiones tamaulipas', tipo: 'estado' }
  ];
  
  casosReales.forEach((caso, i) => {
    console.log(`${i+1}. "${caso.pregunta}" (${caso.tipo})`);
    
    if (caso.pregunta.includes('queretaro')) {
      console.log(`   🔍 ANÁLISIS: Querétaro = estado con 1 grupo`);
      console.log(`   💡 ESTRATEGIA: Querétaro → PLOG QUERETARO ✅`);
      console.log(`   🎯 RESULTADO: Conversión directa válida`);
    } else if (caso.pregunta.includes('tampico')) {
      console.log(`   🔍 ANÁLISIS: Tampico = ciudad (verificar grupos)`);
      console.log(`   💡 ESTRATEGIA: Depende si tiene 1 o múltiples grupos`);
      console.log(`   🎯 RESULTADO: Ver análisis arriba`);
    } else if (caso.pregunta.includes('morelia')) {
      console.log(`   🔍 ANÁLISIS: Morelia = ciudad en Michoacán (1 grupo)`);
      console.log(`   💡 ESTRATEGIA: Morelia → GRUPO CANTERA ROSA ✅`);
      console.log(`   🎯 RESULTADO: Conversión directa válida`);
    } else if (caso.pregunta.includes('reynosa')) {
      console.log(`   🔍 ANÁLISIS: Reynosa = ciudad (verificar grupos)`);
      console.log(`   💡 ESTRATEGIA: Depende si tiene 1 o múltiples grupos`);  
      console.log(`   🎯 RESULTADO: Ver análisis arriba`);
    } else if (caso.pregunta.includes('nuevo leon')) {
      console.log(`   🔍 ANÁLISIS: Nuevo León = estado con 10 grupos`);
      console.log(`   💡 ESTRATEGIA: NO convertir - mantener estado`);
      console.log(`   🎯 RESULTADO: "supervisiones Nuevo León" (sin conversión)`);
    } else if (caso.pregunta.includes('tamaulipas')) {
      console.log(`   🔍 ANÁLISIS: Tamaulipas = estado con 8 grupos`);
      console.log(`   💡 ESTRATEGIA: NO convertir - mantener estado`);
      console.log(`   🎯 RESULTADO: "supervisiones Tamaulipas" (sin conversión)`);
    }
    console.log('');
  });
  
  await pool.end();
}

analyzeCities().catch(console.error);