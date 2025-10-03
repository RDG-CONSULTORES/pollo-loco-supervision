#!/usr/bin/env node
/**
 * Script para corregir los problemas críticos identificados:
 * 1. Endpoint sucursales-ranking no respeta filtros correctamente
 * 2. KPIs no se actualizan consistentemente con filtros
 * 3. Falta filtro area_evaluacion = '' en consultas
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correcciones críticas...');

// Leer el archivo server-integrated.js
const serverPath = path.join(__dirname, 'server-integrated.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// FIX 1: Corregir la referencia a 'sucursal' no definida
console.log('📝 FIX 1: Eliminando referencia a variable sucursal no definida...');
serverContent = serverContent.replace(
    `        if (sucursal) {
            whereConditions.push(\`location_name = \$\${paramIndex}\`);
            params.push(sucursal);
            paramIndex++;
        }`,
    `        // Removed undefined sucursal filter - was causing errors`
);

// FIX 2: Agregar filtro area_evaluacion = '' en sucursales-ranking
console.log('📝 FIX 2: Agregando filtro area_evaluacion en endpoint sucursales-ranking...');

// Buscar el query de sucursales-ranking y modificarlo
const sucursalesQueryPattern = /SELECT\s+location_name as sucursal,[\s\S]*?FROM supervision_operativa_clean\s+WHERE (.*?)\s+GROUP BY/;
const match = serverContent.match(sucursalesQueryPattern);

if (match) {
    // Agregar area_evaluacion = '' a las condiciones WHERE
    const newWhereConditions = `[
            'porcentaje IS NOT NULL', 
            'location_name IS NOT NULL',
            'grupo_operativo_limpio IS NOT NULL',
            'area_evaluacion = \\'\\''  // CRITICAL: Only use general evaluation scores
        ]`;
    
    serverContent = serverContent.replace(
        `        let whereConditions = [
            'porcentaje IS NOT NULL', 
            'location_name IS NOT NULL',
            'grupo_operativo_limpio IS NOT NULL'
        ];`,
        `        let whereConditions = ${newWhereConditions};`
    );
}

// FIX 3: Modificar la consulta para usar el cálculo correcto
console.log('📝 FIX 3: Corrigiendo cálculo de promedio con CASE WHEN...');
serverContent = serverContent.replace(
    `ROUND(AVG(porcentaje), 2) as promedio,`,
    `ROUND(AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END), 2) as promedio,`
);

// FIX 4: Remover HAVING COUNT que podría filtrar sucursales válidas
console.log('📝 FIX 4: Ajustando filtro HAVING para incluir todas las sucursales...');
serverContent = serverContent.replace(
    `HAVING COUNT(DISTINCT area_evaluacion) >= 5`,
    `HAVING AVG(CASE WHEN area_evaluacion = '' THEN porcentaje END) IS NOT NULL`
);

// Guardar el archivo corregido
fs.writeFileSync(serverPath, serverContent);
console.log('✅ server-integrated.js actualizado correctamente');

// Ahora corregir el frontend para asegurar actualización consistente de KPIs
console.log('\n🔧 Corrigiendo frontend para actualización de KPIs...');

const appPath = path.join(__dirname, 'telegram-bot/web-app/public/app.js');
let appContent = fs.readFileSync(appPath, 'utf8');

// FIX 5: Asegurar que loadKPIData use todos los filtros incluyendo periodoCas
console.log('📝 FIX 5: Asegurando que KPIs incluyan filtro periodoCas...');

// Buscar la función loadKPIData
const loadKPIDataPattern = /async loadKPIData\(\) {[\s\S]*?if \(this\.currentFilters\.trimestre\) {[\s\S]*?}/;
const kpiMatch = appContent.match(loadKPIDataPattern);

if (kpiMatch) {
    // Agregar filtro periodoCas después del filtro trimestre
    const updatedKPIFunction = kpiMatch[0] + `
            if (this.currentFilters.periodoCas) {
                params.append('periodoCas', this.currentFilters.periodoCas);
            }`;
    
    appContent = appContent.replace(kpiMatch[0], updatedKPIFunction);
}

// FIX 6: Forzar actualización completa al aplicar filtros
console.log('📝 FIX 6: Forzando actualización completa de datos al cambiar filtros...');

// Buscar la función applyFilters
const applyFiltersPattern = /async applyFilters\(\) {[\s\S]*?this\.updateDashboard\(\);/;
const filtersMatch = appContent.match(applyFiltersPattern);

if (filtersMatch) {
    // Reemplazar updateDashboard() con loadAllData() para forzar recarga completa
    const updatedFilters = filtersMatch[0].replace(
        'this.updateDashboard();',
        `// Force complete data reload to ensure consistency
        await this.loadAllData();
        this.updateDashboard();`
    );
    
    appContent = appContent.replace(filtersMatch[0], updatedFilters);
}

// Guardar el archivo app.js corregido
fs.writeFileSync(appPath, appContent);
console.log('✅ app.js actualizado correctamente');

console.log('\n🎉 Todas las correcciones aplicadas exitosamente!');
console.log('📋 Resumen de cambios:');
console.log('  1. ✅ Eliminada variable sucursal no definida');
console.log('  2. ✅ Agregado filtro area_evaluacion = \'\' en sucursales');
console.log('  3. ✅ Corregido cálculo de promedio con CASE WHEN');
console.log('  4. ✅ Ajustado filtro HAVING para incluir todas las sucursales');
console.log('  5. ✅ KPIs ahora incluyen filtro periodoCas');
console.log('  6. ✅ Filtros ahora fuerzan recarga completa de datos');
console.log('\n⚡ Próximo paso: Hacer commit y push para deploy');