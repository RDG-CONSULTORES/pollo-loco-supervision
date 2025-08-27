-- ===============================================
-- VIEWS LIMPIAS PARA EL POLLO LOCO CAS
-- Solución inmediata para datos duplicados y sin mapeo
-- ===============================================

-- 1. View principal con datos limpios
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
  
  -- Solo grupos válidos (excluir sin mapeo)
  CASE 
    WHEN grupo_operativo IN ('NO_ENCONTRADO', 'SIN_MAPEO') THEN NULL
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
  AND grupo_operativo NOT IN ('NO_ENCONTRADO', 'SIN_MAPEO')
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

-- Comentarios para documentación
COMMENT ON VIEW supervision_operativa_clean IS 'Vista limpia sin datos duplicados ni grupos sin mapear';
COMMENT ON VIEW calificaciones_generales_clean IS 'Vista específica para calificaciones generales limpias';
COMMENT ON VIEW areas_evaluacion_clean IS 'Vista específica para áreas de evaluación limpias';
COMMENT ON VIEW grupos_estadisticas IS 'Estadísticas consolidadas por grupo operativo';