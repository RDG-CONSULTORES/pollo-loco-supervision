#!/usr/bin/env python3
"""
ETL Data Cleaning Rules - El Pollo Loco CAS
Reglas de limpieza para aplicar ANTES de insertar en BD
"""

import re
from typing import Dict, Optional

class PolloLocoDataCleaner:
    """
    Limpiador de datos para El Pollo Loco CAS
    Aplica reglas de normalización ANTES de insertar en BD
    """
    
    def __init__(self):
        # Mapeo de estados normalizados
        self.estados_normalizados = {
            'michoacán de ocampo': 'Michoacán',
            'michoacan de ocampo': 'Michoacán', 
            'coahuila de zaragoza': 'Coahuila',
            'estado de méxico': 'México',
            'estado de mexico': 'México',
            'nuevo león': 'Nuevo León',
            'nuevo leon': 'Nuevo León'
        }
        
        # Mapeo de grupos operativos (detectados por ubicación/nombre)
        self.grupos_por_ubicacion = {
            # Tepeyac - Monterrey
            ('nuevo león', 'monterrey'): 'TEPEYAC',
            ('nuevo leon', 'monterrey'): 'TEPEYAC',
            
            # Cantera Rosa - Morelia
            ('michoacán', 'morelia'): 'GRUPO CANTERA ROSA (MORELIA)',
            ('michoacan', 'morelia'): 'GRUPO CANTERA Rosa (MORELIA)',
            
            # Ogas - Nuevo León (específicas)
            ('nuevo león', 'apodaca'): 'OGAS',
            ('nuevo león', 'guadalupe'): 'OGAS',
            
            # RAP - Reynosa
            ('tamaulipas', 'reynosa'): 'RAP',
            
            # CRR - Reynosa (específicas por nombre)
            # Se maneja por location_name
        }
        
        # Mapeo por nombres específicos de sucursal
        self.grupos_por_nombre = {
            # RAP
            '76 - aeropuerto (reynosa)': 'RAP',
            '77 - boulevard morelos': 'RAP', 
            '78 - alcala': 'RAP',
            
            # CRR  
            '73 - anzalduas': 'CRR',
            '74 - hidalgo (reynosa)': 'CRR',
            '75 - libramiento (reynosa)': 'CRR',
            
            # OGAS por números específicos
            # Agregar según sea necesario
        }
        
        # Patrones de nombres de sucursal a limpiar
        self.patrones_limpieza = [
            (r'\s+', ' '),  # Múltiples espacios → uno solo
            (r'^\d+\s*-\s*', ''),  # Remover números al inicio
            (r'\([^)]+\)$', ''),  # Remover paréntesis al final
        ]
    
    def normalizar_estado(self, estado: str) -> str:
        """Normaliza nombres de estados duplicados"""
        if not estado:
            return estado
            
        estado_lower = estado.lower().strip()
        return self.estados_normalizados.get(estado_lower, estado)
    
    def detectar_grupo_operativo(self, location_name: str, estado: str, 
                                municipio: str, grupo_actual: str) -> str:
        """
        Detecta el grupo operativo correcto basado en ubicación y nombre
        """
        # Si ya tiene un grupo válido, mantenerlo
        if (grupo_actual and 
            grupo_actual not in ['NO_ENCONTRADO', 'SIN_MAPEO', '', None]):
            return grupo_actual
        
        if not location_name:
            return 'SIN_MAPEO'
            
        location_lower = location_name.lower().strip()
        estado_lower = estado.lower().strip() if estado else ''
        municipio_lower = municipio.lower().strip() if municipio else ''
        
        # 1. Buscar por nombre específico
        if location_lower in self.grupos_por_nombre:
            return self.grupos_por_nombre[location_lower]
        
        # 2. Buscar por ubicación geográfica
        ubicacion_key = (estado_lower, municipio_lower)
        if ubicacion_key in self.grupos_por_ubicacion:
            return self.grupos_por_ubicacion[ubicacion_key]
        
        # 3. Detección por patrones en nombre
        if 'reynosa' in location_lower:
            if any(x in location_lower for x in ['boulevard', 'aeropuerto', 'alcala']):
                return 'RAP'
            elif any(x in location_lower for x in ['anzalduas', 'hidalgo', 'libramiento']):
                return 'CRR'
        
        if 'morelia' in location_lower or 'michoacán' in estado_lower:
            return 'GRUPO CANTERA ROSA (MORELIA)'
        
        if 'monterrey' in municipio_lower and 'nuevo león' in estado_lower:
            return 'TEPEYAC'
            
        # Si no se puede determinar
        return 'REQUIERE_MAPEO_MANUAL'
    
    def limpiar_registro(self, registro: Dict) -> Dict:
        """
        Limpia un registro completo aplicando todas las reglas
        """
        registro_limpio = registro.copy()
        
        # Normalizar estado
        if 'estado' in registro_limpio:
            registro_limpio['estado'] = self.normalizar_estado(registro_limpio['estado'])
        
        # Detectar grupo operativo correcto
        grupo_detectado = self.detectar_grupo_operativo(
            registro_limpio.get('location_name', ''),
            registro_limpio.get('estado', ''),
            registro_limpio.get('municipio', ''),
            registro_limpio.get('grupo_operativo', '')
        )
        
        registro_limpio['grupo_operativo'] = grupo_detectado
        registro_limpio['metodo_mapeo'] = 'auto_cleaned'
        registro_limpio['confianza_mapeo'] = self._calcular_confianza(grupo_detectado)
        
        return registro_limpio
    
    def _calcular_confianza(self, grupo: str) -> int:
        """Calcula nivel de confianza del mapeo"""
        if grupo in ['SIN_MAPEO', 'REQUIERE_MAPEO_MANUAL']:
            return 0
        elif grupo in ['NO_ENCONTRADO']:
            return 10
        elif 'GRUPO' in grupo:  # Nombres completos
            return 95
        else:
            return 85

# Ejemplo de uso en ETL
def aplicar_limpieza_etl(registros_raw):
    """
    Función para integrar en el pipeline ETL existente
    """
    cleaner = PolloLocoDataCleaner()
    registros_limpios = []
    
    for registro in registros_raw:
        registro_limpio = cleaner.limpiar_registro(registro)
        registros_limpios.append(registro_limpio)
    
    return registros_limpios

# Estadísticas de limpieza
def generar_reporte_limpieza(registros_antes, registros_despues):
    """Genera reporte de qué se limpió"""
    
    grupos_antes = {}
    grupos_despues = {}
    
    for r in registros_antes:
        grupo = r.get('grupo_operativo', 'NULL')
        grupos_antes[grupo] = grupos_antes.get(grupo, 0) + 1
    
    for r in registros_despues:
        grupo = r.get('grupo_operativo', 'NULL')
        grupos_despues[grupo] = grupos_despues.get(grupo, 0) + 1
    
    print("🧹 REPORTE DE LIMPIEZA ETL")
    print("\nANTES:")
    for grupo, count in sorted(grupos_antes.items()):
        print(f"  {grupo}: {count}")
    
    print("\nDESPUÉS:")  
    for grupo, count in sorted(grupos_despues.items()):
        print(f"  {grupo}: {count}")
    
    reduccion_sin_mapeo = (
        grupos_antes.get('NO_ENCONTRADO', 0) + 
        grupos_antes.get('SIN_MAPEO', 0)
    ) - (
        grupos_despues.get('NO_ENCONTRADO', 0) + 
        grupos_despues.get('SIN_MAPEO', 0) + 
        grupos_despues.get('REQUIERE_MAPEO_MANUAL', 0)
    )
    
    print(f"\n✅ Registros sin mapeo reducidos en: {reduccion_sin_mapeo}")