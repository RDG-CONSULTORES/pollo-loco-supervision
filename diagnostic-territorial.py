import json
import sys
import requests

def diagnostic_territorial():
    try:
        response = requests.get('http://localhost:3000/api/heatmap-periods')
        data = response.json()
        
        if data.get('success') and data.get('data'):
            groups = data['data']['groups']
            
            print('🧪 DIAGNÓSTICO COMPLETO TOGGLE TERRITORIAL')
            print('=' * 60)
            
            # Simulación de funciones de clasificación actuales
            territorial_mapping = {
                'TEC': {'local': True, 'foranea': True},
                'EXPO': {'local': True, 'foranea': True}
            }
            
            def is_local_group(group_name):
                if group_name in territorial_mapping:
                    return territorial_mapping[group_name]['local']
                
                local_puros = ['OGAS', 'EPL SO', 'TEPEYAC', 'EFM', 'PLOG NUEVO LEON', 'GRUPO SABINAS HIDALGO', 'GRUPO CENTRITO']
                return group_name in local_puros
            
            def is_foranea_group(group_name):
                if group_name in territorial_mapping:
                    return territorial_mapping[group_name]['foranea']
                    
                foraneas_puros = ['PLOG QUERETARO', 'GRUPO MATAMOROS', 'GRUPO RIO BRAVO', 'CRR', 'RAP', 'OCHTER TAMPICO', 'GRUPO NUEVO LAREDO (RUELAS)', 'PLOG LAGUNA', 'GRUPO PIEDRAS NEGRAS', 'GRUPO SALTILLO', 'GRUPO CANTERA ROSA (MORELIA)']
                return group_name in foraneas_puros
            
            # Clasificar todos los grupos
            locales = []
            foraneas = []
            mixtos = []
            
            for group in groups:
                name = group['grupo']
                is_local = is_local_group(name)
                is_foranea = is_foranea_group(name)
                
                if is_local and is_foranea:
                    mixtos.append(name)
                elif is_local:
                    locales.append(name)
                elif is_foranea:
                    foraneas.append(name)
            
            print(f'📊 ESTADO ACTUAL DEL FILTRO:')
            print(f'🏠 LOCALES ({len(locales)}): {locales}')
            print(f'🔀 MIXTOS ({len(mixtos)}): {mixtos}')
            print(f'🌐 FORÁNEAS ({len(foraneas)}): {foraneas}')
            print(f'')
            
            # Simular filtros
            print('🧪 SIMULACIÓN DE FILTROS:')
            print('┌─ FILTRO "LOCALES" mostraría:')
            local_filter = [g['grupo'] for g in groups if is_local_group(g['grupo'])]
            print(f'   📍 {len(local_filter)} grupos: {local_filter}')
            
            print('┌─ FILTRO "FORÁNEAS" mostraría:')  
            foranea_filter = [g['grupo'] for g in groups if is_foranea_group(g['grupo'])]
            print(f'   🌍 {len(foranea_filter)} grupos: {foranea_filter}')
            
            print('┌─ FILTRO "TODAS" mostraría:')
            print(f'   🔄 {len(groups)} grupos: TODOS')
            
            print('')
            print('❓ PROBLEMAS DETECTADOS:')
            if 'GRUPO SALTILLO' in mixtos:
                print('⚠️  GRUPO SALTILLO clasificado como MIXTO (debería ser FORÁNEO según API)')
            expected_mixtos = 2
            if len(mixtos) != expected_mixtos:
                print(f'⚠️  Mixtos incorrectos: esperado {expected_mixtos}, actual {len(mixtos)}')
            
            print('')
            print('🔧 RECOMENDACIONES:')
            print('1. Según API: GRUPO SALTILLO tiene estado="Coahuila" -> debe ser FORÁNEO')
            print('2. Solo TEC y EXPO deben ser MIXTOS (tienen Nuevo León + otro estado)')
            print('3. Verificar que filtros funcionen en tab Histórico')
                
        else:
            print('❌ Error obteniendo datos del API')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    diagnostic_territorial()