-- ===============================================
-- VIEWS LIMPIAS CON MAPEO AUTOMÁTICO POR COORDENADAS
-- Solución inmediata para datos duplicados y sin mapeo
-- ===============================================

-- 1. View principal con datos limpios Y MAPEO AUTOMÁTICO POR COORDENADAS
CREATE OR REPLACE VIEW supervision_operativa_clean AS
SELECT 
  id,
  submission_id,
  location_id,
  location_name,
  sucursal_clean,
  municipio,
  
  -- Normalizar estados duplicados
  CASE 
    WHEN estado = 'Michoacán de Ocampo' THEN 'Michoacán'
    WHEN estado = 'Coahuila de Zaragoza' THEN 'Coahuila'
    WHEN estado = 'Estado de México' THEN 'México'
    ELSE estado
  END as estado_normalizado,
  
  latitud,
  longitud,
  
  -- MAPEO AUTOMÁTICO INTELIGENTE por coordenadas y nombres
  CASE 
    -- Si ya tiene grupo válido, mantenerlo
    WHEN grupo_operativo NOT IN ('NO_ENCONTRADO', 'SIN_MAPEO', '') 
         AND grupo_operativo IS NOT NULL THEN grupo_operativo
    
    -- MAPEO POR NOMBRES ESPECÍFICOS CONFIRMADO POR USUARIO
    -- REYNOSA - TAMAULIPAS
    WHEN location_name = '74 - Hidalgo (Reynosa)' THEN 'CRR'
    WHEN location_name = '77 - Boulevard Morelos' THEN 'RAP'
    WHEN location_name = '76 - Aeropuerto (Reynosa)' THEN 'RAP'
    WHEN location_name = '75 - Libramiento (Reynosa)' THEN 'CRR'
    WHEN location_name = '78 - Alcala' THEN 'RAP'
    WHEN location_name = '73 - Anzalduas' THEN 'CRR'
    
    -- NUEVO LEÓN - CONFIRMADO COMO EXPO
    WHEN location_name = '32 - Allende' THEN 'EXPO'
    WHEN location_name = '31 - Las Quintas' THEN 'EXPO'
    WHEN location_name = '27 - Santiago' THEN 'EXPO'
    WHEN location_name = '34 - Montemorelos' THEN 'EXPO'
    WHEN location_name = '24 - Exposicion' THEN 'EXPO'
    WHEN location_name = '33 - Eloy Cavazos' THEN 'EXPO'
    WHEN location_name = '26 - Cadereyta' THEN 'EXPO'
    
    -- MAPEO FINAL - 5 SUCURSALES RESTANTES CONFIRMADAS POR USUARIO
    WHEN location_name = '25 - Juarez' THEN 'EXPO'
    WHEN location_name = '30 - Carrizo' THEN 'EXPO'
    WHEN location_name = '29 - Pablo Livas' THEN 'EXPO'
    WHEN location_name = '28 - Guerrero' THEN 'EXPO'
    WHEN location_name = 'Sucursal SC - Santa Catarina' THEN 'TEPEYAC'
    
    -- COAHUILA - GRUPO SALTILLO (5 sucursales confirmadas)
    WHEN location_name = '52 - Venustiano Carranza' THEN 'GRUPO SALTILLO'
    WHEN location_name = '54 - Ramos Arizpe' THEN 'GRUPO SALTILLO'
    WHEN location_name = '55 - Eulalio Gutierrez' THEN 'GRUPO SALTILLO'
    WHEN location_name = '56 - Luis Echeverria' THEN 'GRUPO SALTILLO'
    WHEN location_name = '57 - Harold R. Pape' THEN 'GRUPO SALTILLO'
    
    -- MAPEO POR NOMBRES SIMILARES (análisis de patrones)
    WHEN location_name ILIKE '%aeropuerto%' AND (estado = 'Tamaulipas' OR municipio ILIKE '%reynosa%') THEN 'RAP'
    WHEN location_name ILIKE '%boulevard%' AND location_name ILIKE '%morelos%' THEN 'RAP'
    WHEN location_name ILIKE '%alcala%' AND (estado = 'Tamaulipas' OR municipio ILIKE '%reynosa%') THEN 'RAP'
    WHEN location_name ILIKE '%anzalduas%' THEN 'CRR'
    WHEN location_name ILIKE '%hidalgo%' AND municipio ILIKE '%reynosa%' THEN 'CRR'
    WHEN location_name ILIKE '%libramiento%' AND municipio ILIKE '%reynosa%' THEN 'CRR'
    
    -- MAPEO POR PATRONES DE NOMBRES SIMILARES A GRUPOS EXISTENTES
    -- TEPEYAC - Monterrey centro
    WHEN location_name ILIKE '%pino suarez%' OR location_name ILIKE '%pino%suarez%' THEN 'TEPEYAC'
    WHEN location_name ILIKE '%madero%' AND estado = 'Nuevo León' AND municipio = 'Monterrey' THEN 'TEPEYAC'
    WHEN location_name ILIKE '%matamoros%' AND estado = 'Nuevo León' AND municipio = 'Monterrey' THEN 'TEPEYAC'
    WHEN location_name ILIKE '%felix%gomez%' OR location_name ILIKE '%felix%u%gomez%' THEN 'TEPEYAC'
    
    -- OGAS - San Nicolás, Apodaca área
    WHEN location_name ILIKE '%anahuac%' AND estado = 'Nuevo León' THEN 'OGAS'
    WHEN location_name ILIKE '%barragan%' AND estado = 'Nuevo León' THEN 'OGAS'
    WHEN location_name ILIKE '%lincoln%' AND estado = 'Nuevo León' THEN 'OGAS'
    WHEN location_name ILIKE '%concordia%' AND estado = 'Nuevo León' THEN 'OGAS'
    WHEN location_name ILIKE '%apodaca%' AND estado = 'Nuevo León' THEN 'OGAS'
    
    -- EXPO - Basado en confirmaciones (área metropolitana Nuevo León)
    WHEN location_name ILIKE '%exposicion%' AND estado = 'Nuevo León' THEN 'EXPO'
    WHEN location_name ILIKE '%quintas%' AND estado = 'Nuevo León' THEN 'EXPO'
    WHEN location_name ILIKE '%allende%' AND estado = 'Nuevo León' THEN 'EXPO'
    WHEN location_name ILIKE '%santiago%' AND estado = 'Nuevo León' THEN 'EXPO'
    WHEN location_name ILIKE '%montemorelos%' AND estado = 'Nuevo León' THEN 'EXPO'
    WHEN location_name ILIKE '%eloy%cavazos%' AND estado = 'Nuevo León' THEN 'EXPO'
    WHEN location_name ILIKE '%cadereyta%' AND estado = 'Nuevo León' THEN 'EXPO'
    
    -- MAPEO CANTERA ROSA por patrones
    WHEN location_name ILIKE '%lazaro%cardenas%' AND (estado ILIKE '%michoacán%' OR municipio ILIKE '%morelia%') THEN 'GRUPO CANTERA ROSA (MORELIA)'
    WHEN location_name ILIKE '%madero%' AND (estado ILIKE '%michoacán%' OR municipio ILIKE '%morelia%') THEN 'GRUPO CANTERA ROSA (MORELIA)'
    WHEN location_name ILIKE '%huerta%' AND (estado ILIKE '%michoacán%' OR municipio ILIKE '%morelia%') THEN 'GRUPO CANTERA ROSA (MORELIA)'
    
    -- MAPEO por números conocidos en rangos específicos
    WHEN location_name ~ '^[1-9] - ' AND estado = 'Nuevo León' AND municipio = 'Monterrey' THEN 'TEPEYAC'
    WHEN location_name ~ '^[67][0-9] - ' AND estado = 'Tamaulipas' AND municipio = 'Reynosa' THEN 
      CASE 
        WHEN location_name ~ '^7[678] - ' THEN 'RAP'
        WHEN location_name ~ '^7[345] - ' THEN 'CRR'
        ELSE 'RAP'
      END
    
    -- MAPEO POR COORDENADAS GEOGRÁFICAS (Reynosa - Tamaulipas)
    WHEN estado = 'Tamaulipas' AND municipio = 'Reynosa' AND
         latitud::numeric BETWEEN 26.02 AND 26.07 AND longitud::numeric BETWEEN -98.30 AND -98.22
         THEN 'RAP'
    WHEN estado = 'Tamaulipas' AND municipio = 'Reynosa' AND
         latitud::numeric BETWEEN 26.04 AND 26.10 AND longitud::numeric BETWEEN -98.35 AND -98.30
         THEN 'CRR'
    
    -- MAPEO NUEVO LEÓN por proximidad a grupos conocidos
    WHEN estado = 'Nuevo León' AND municipio = 'Monterrey' AND
         latitud::numeric BETWEEN 25.66 AND 25.69 AND longitud::numeric BETWEEN -100.33 AND -100.31
         THEN 'TEPEYAC'
    WHEN estado = 'Nuevo León' AND municipio IN ('San Nicolás de los Garza', 'Apodaca', 'Guadalupe') AND
         latitud::numeric BETWEEN 25.75 AND 25.79 AND longitud::numeric BETWEEN -100.41 AND -100.25
         THEN 'OGAS'
    WHEN estado = 'Nuevo León' AND (municipio = 'Guadalupe' OR location_name ILIKE '%quintas%') AND
         latitud::numeric BETWEEN 25.68 AND 25.70 AND longitud::numeric BETWEEN -100.22 AND -100.20
         THEN 'EXPO'
    
    -- MAPEO MICHOACÁN
    WHEN (estado = 'Michoacán' OR estado = 'Michoacán de Ocampo') AND municipio = 'Morelia'
         THEN 'GRUPO CANTERA ROSA (MORELIA)'
    
    -- GRUPO SALTILLO - Coahuila (basado en confirmaciones)
    WHEN location_name ILIKE '%harold%pape%' OR location_name ILIKE '%harold%r%pape%' THEN 'GRUPO SALTILLO'
    WHEN location_name ILIKE '%luis%echeverria%' THEN 'GRUPO SALTILLO'
    WHEN (estado = 'Coahuila' OR estado = 'Coahuila de Zaragoza') AND municipio = 'Monclova' THEN 'GRUPO SALTILLO'
    WHEN (estado = 'Coahuila' OR estado = 'Coahuila de Zaragoza') AND municipio = 'Saltillo' THEN 'GRUPO SALTILLO'
    
    -- MAPEO FINAL - 22 SUCURSALES NO_ENCONTRADO CONFIRMADAS POR USUARIO
    -- GRUPO EXPO (11 sucursales: Nuevo León + Tamaulipas)
    WHEN location_name = '31 - Las Quintas' THEN 'EXPO'
    WHEN location_name = '32 - Allende' THEN 'EXPO'
    WHEN location_name = '24 - Exposicion' THEN 'EXPO'
    WHEN location_name = '27 - Santiago' THEN 'EXPO'
    WHEN location_name = '34 - Montemorelos' THEN 'EXPO'
    WHEN location_name = '26 - Cadereyta' THEN 'EXPO'
    WHEN location_name = '25 - Juarez' THEN 'EXPO'
    WHEN location_name = '33 - Eloy Cavazos' THEN 'EXPO'
    WHEN location_name = '29 - Pablo Livas' THEN 'EXPO'
    WHEN location_name = '30 - Carrizo' THEN 'EXPO'
    WHEN location_name = '28 - Guerrero' THEN 'EXPO'
    
    -- GRUPO RAP (3 sucursales: Reynosa, Tamaulipas)
    WHEN location_name = '76 - Aeropuerto (Reynosa)' THEN 'RAP'
    WHEN location_name = '78 - Alcala' THEN 'RAP'
    WHEN location_name = '77 - Boulevard Morelos' THEN 'RAP'
    
    -- GRUPO CRR (3 sucursales: Reynosa, Tamaulipas) 
    WHEN location_name = '74 - Hidalgo (Reynosa)' THEN 'CRR'
    WHEN location_name = '75 - Libramiento (Reynosa)' THEN 'CRR'
    WHEN location_name = '73 - Anzalduas' THEN 'CRR'
    
    -- GRUPO SALTILLO (5 sucursales: Coahuila)
    WHEN location_name = '57 - Harold R. Pape' THEN 'GRUPO SALTILLO'
    WHEN location_name = '56 - Luis Echeverria' THEN 'GRUPO SALTILLO'
    WHEN location_name = '52 - Venustiano Carranza' THEN 'GRUPO SALTILLO'
    WHEN location_name = '54 - Ramos Arizpe' THEN 'GRUPO SALTILLO'
    WHEN location_name = '55 - Eulalio Gutierrez' THEN 'GRUPO SALTILLO'
    
    -- Sin casos pendientes
    ELSE grupo_operativo
  END as grupo_operativo_limpio,
  
  director_operativo,
  supervisor_campo,
  fecha_supervision,
  area_evaluacion,
  puntos_maximos,
  puntos_obtenidos,
  porcentaje,
  metodo_mapeo,
  confianza_mapeo,
  fecha_actualizacion
  
FROM supervision_operativa_detalle
WHERE grupo_operativo IS NOT NULL 
  AND location_name IS NOT NULL;

-- 2. View para calificaciones generales limpias
CREATE OR REPLACE VIEW calificaciones_generales_clean AS
SELECT DISTINCT
  submission_id,
  location_name,
  grupo_operativo_limpio as grupo_operativo,
  estado_normalizado as estado,
  municipio,
  porcentaje as calificacion_general,
  fecha_supervision,
  EXTRACT(YEAR FROM fecha_supervision) as año,
  EXTRACT(QUARTER FROM fecha_supervision) as trimestre
FROM supervision_operativa_clean
WHERE area_evaluacion = ''
  AND porcentaje IS NOT NULL
  AND grupo_operativo_limpio IS NOT NULL;

-- 3. View para áreas específicas limpias  
CREATE OR REPLACE VIEW areas_evaluacion_clean AS
SELECT 
  submission_id,
  location_name,
  grupo_operativo_limpio as grupo_operativo,
  estado_normalizado as estado,
  municipio,
  area_evaluacion,
  porcentaje,
  fecha_supervision,
  EXTRACT(YEAR FROM fecha_supervision) as año,
  EXTRACT(QUARTER FROM fecha_supervision) as trimestre
FROM supervision_operativa_clean
WHERE area_evaluacion IS NOT NULL 
  AND area_evaluacion != ''
  AND area_evaluacion != 'PUNTOS MAXIMOS'
  AND porcentaje IS NOT NULL
  AND grupo_operativo_limpio IS NOT NULL;

-- 4. View para estadísticas de grupos
CREATE OR REPLACE VIEW grupos_estadisticas AS
SELECT 
  grupo_operativo,
  COUNT(DISTINCT location_name) as total_sucursales,
  COUNT(DISTINCT submission_id) as total_supervisiones,
  ROUND(AVG(calificacion_general), 2) as promedio_grupo,
  MIN(fecha_supervision) as primera_supervision,
  MAX(fecha_supervision) as ultima_supervision,
  COUNT(DISTINCT estado) as estados_presentes
FROM calificaciones_generales_clean
GROUP BY grupo_operativo;

-- 5. View para validar efectividad del mapeo automático
CREATE OR REPLACE VIEW mapeo_automatico_stats AS
SELECT 
  grupo_operativo_limpio,
  COUNT(*) as total_registros,
  COUNT(DISTINCT location_name) as sucursales_unicas,
  COUNT(DISTINCT estado_normalizado) as estados,
  ROUND(AVG(
    CASE WHEN area_evaluacion = '' AND porcentaje IS NOT NULL 
    THEN porcentaje END
  ), 2) as promedio_calificacion_general,
  -- Indicar método de mapeo
  CASE 
    WHEN grupo_operativo_limpio = 'REQUIERE_MAPEO_MANUAL' THEN 'Manual requerido'
    WHEN grupo_operativo_limpio IN (
      SELECT DISTINCT grupo_operativo 
      FROM supervision_operativa_detalle 
      WHERE grupo_operativo NOT IN ('NO_ENCONTRADO', 'SIN_MAPEO')
    ) THEN 'Mapeo original'
    ELSE 'Mapeo automático'
  END as metodo_mapeo
FROM supervision_operativa_clean
WHERE grupo_operativo_limpio IS NOT NULL
GROUP BY grupo_operativo_limpio
ORDER BY 
  CASE WHEN grupo_operativo_limpio = 'REQUIERE_MAPEO_MANUAL' THEN 1 ELSE 0 END,
  total_registros DESC;

-- 6. View de sucursales problemáticas para revisión manual
CREATE OR REPLACE VIEW sucursales_requieren_revision AS
SELECT DISTINCT
  location_name,
  estado_normalizado,
  municipio, 
  latitud,
  longitud,
  COUNT(*) as total_registros,
  -- Mostrar grupos cercanos por coordenadas para ayuda
  CASE 
    WHEN latitud IS NOT NULL AND longitud IS NOT NULL THEN 
      'Revisar coordenadas para mapeo manual'
    ELSE 'Sin coordenadas - mapeo por nombre requerido'
  END as sugerencia
FROM supervision_operativa_clean  
WHERE grupo_operativo_limpio = 'REQUIERE_MAPEO_MANUAL'
GROUP BY location_name, estado_normalizado, municipio, latitud, longitud
ORDER BY total_registros DESC;

-- Comentarios para documentación
COMMENT ON VIEW supervision_operativa_clean IS 'Vista limpia con mapeo automático por coordenadas y nombres similares';
COMMENT ON VIEW calificaciones_generales_clean IS 'Vista específica para calificaciones generales limpias';
COMMENT ON VIEW areas_evaluacion_clean IS 'Vista específica para áreas de evaluación limpias';
COMMENT ON VIEW grupos_estadisticas IS 'Estadísticas consolidadas por grupo operativo';
COMMENT ON VIEW mapeo_automatico_stats IS 'Estadísticas de efectividad del mapeo automático';
COMMENT ON VIEW sucursales_requieren_revision IS 'Sucursales que requieren mapeo manual';