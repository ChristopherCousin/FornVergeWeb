#!/usr/bin/env python3
"""
MIGRACIÓN SIMPLE DE FICHAJES
Solo migra WorkingPeriod desde Ágora → tabla 'fichajes' en Supabase
El análisis del convenio se hace desde el frontend
"""

import pymssql
import os
from supabase import create_client, Client
from datetime import datetime, date
import json

class MigradorFichajesSimple:
    def __init__(self):
        # Configuración Ágora (copiada del script que funciona)
        self.agora_config = {
            'server': 'vergedelluch.ddns.net',
            'port': 50031,
            'database': 'igtpos',
            'user': 'sa',
            'password': 'igt123',
            'tds_version': '7.0',
            'timeout': 30,
            'login_timeout': 30,
            'charset': 'utf8'
        }
        
        # Configuración Supabase
        self.supabase_url = 'https://csxgkxjeifakwslamglc.supabase.co'
        self.supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeGdreGplaWZha3dzbGFtZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjM4NjIsImV4cCI6MjA2NDg5OTg2Mn0.iGDmQJGRjsldPGmXLO5PFiaLOk7P3Rpr0omF3b8SJkg'
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
    def conectar_agora(self):
        """Conectar a base de datos Ágora usando pymssql"""
        try:
            conn = pymssql.connect(**self.agora_config)
            print("✅ Conectado a Ágora con pymssql")
            return conn
        except Exception as e:
            print(f"❌ Error conectando a Ágora: {e}")
            return None
    
    def cargar_mapeo_empleados(self):
        """Cargar mapeo de empleados desde Supabase"""
        try:
            # Obtener empleados de Supabase
            response = self.supabase.table('employees').select('id, name').execute()
            empleados_supabase = response.data
            
            print(f"✅ Cargados {len(empleados_supabase)} empleados de Supabase")
            
            # Crear mapeo inteligente (exacto + similitud)
            mapeo_por_nombre = {}
            
            # Mapeo exacto normalizado
            for emp in empleados_supabase:
                nombre_normalizado = emp['name'].strip().upper()
                mapeo_por_nombre[nombre_normalizado] = emp['id']
            
            # Mapeos específicos conocidos
            mapeos_especiales = {
                'MERCEDES JOVANI ROIG': 'MERCEDES',
                'FRANCISCA ESONO': 'XISCA',
                'MARIA': 'MARÍA'
            }
            
            for agora_name, supabase_name in mapeos_especiales.items():
                supabase_name_upper = supabase_name.upper()
                if supabase_name_upper in mapeo_por_nombre:
                    mapeo_por_nombre[agora_name] = mapeo_por_nombre[supabase_name_upper]
                    print(f"   🔗 Mapeo especial: {agora_name} → {supabase_name}")
            
            return mapeo_por_nombre
            
        except Exception as e:
            print(f"❌ Error cargando empleados de Supabase: {e}")
            return {}
    
    def obtener_fichajes_agora(self, conn, fecha_desde='2025-06-01'):
        """Obtener fichajes desde Ágora"""
        try:
            query = """
            SELECT 
                wp.Id as agora_id,
                wp.UserId as empleado_id,
                wp.BusinessDay as fecha,
                wp.ClockInWhen as entrada,
                wp.ClockOutWhen as salida,
                wp.WorkedHours as horas_trabajadas,
                wp.Completed as completado,
                u.Name as nombre_empleado
            FROM [dbo].[WorkingPeriod] wp
            INNER JOIN [dbo].[User] u ON wp.UserId = u.Id
            WHERE wp.BusinessDay >= %s 
                AND u.DeletionDate IS NULL 
                AND u.ShowInClockings = 1
            ORDER BY wp.BusinessDay DESC, wp.UserId
            """
            
            cursor = conn.cursor()
            cursor.execute(query, (fecha_desde,))
            
            fichajes = []
            for row in cursor:
                fichaje = {
                    'agora_id': row[0],
                    'empleado_id': row[1],
                    'fecha': row[2].strftime('%Y-%m-%d') if row[2] else None,
                    'entrada': row[3].isoformat() if row[3] else None,
                    'salida': row[4].isoformat() if row[4] else None,
                    'horas_trabajadas': float(row[5]) if row[5] else 0.0,
                    'completado': bool(row[6]),
                    'nombre_empleado': row[7]
                }
                fichajes.append(fichaje)
            
            print(f"✅ Obtenidos {len(fichajes)} fichajes desde {fecha_desde}")
            return fichajes
            
        except Exception as e:
            print(f"❌ Error obteniendo fichajes: {e}")
            return []
    
    def migrar_a_supabase(self, fichajes, mapeo_empleados):
        """Migrar fichajes a Supabase"""
        if not fichajes:
            print("❌ No hay fichajes para migrar")
            return False
            
        try:
            # Preparar datos para inserción
            datos_insercion = []
            fichajes_sin_mapeo = []
            
            for fichaje in fichajes:
                nombre_normalizado = fichaje['nombre_empleado'].strip().upper()
                
                # Buscar UUID del empleado en Supabase
                uuid_empleado = mapeo_empleados.get(nombre_normalizado)
                
                if uuid_empleado:
                    datos_insercion.append({
                        'agora_id': fichaje['agora_id'],
                        'empleado_id': uuid_empleado,
                        'fecha': fichaje['fecha'],
                        'entrada': fichaje['entrada'],
                        'salida': fichaje['salida'],
                        'horas_trabajadas': fichaje['horas_trabajadas'],
                        'completado': fichaje['completado']
                    })
                else:
                    fichajes_sin_mapeo.append(fichaje['nombre_empleado'])
            
            # Mostrar empleados sin mapear
            if fichajes_sin_mapeo:
                empleados_unicos = list(set(fichajes_sin_mapeo))
                print(f"⚠️  Empleados sin mapear: {', '.join(empleados_unicos)}")
            
            # Insertar en Supabase (upsert para evitar duplicados)
            if datos_insercion:
                response = self.supabase.table('fichajes').upsert(
                    datos_insercion, 
                    on_conflict='agora_id'
                ).execute()
                
                print(f"✅ Migrados {len(datos_insercion)} fichajes a Supabase")
                return True
            else:
                print("❌ No se pudieron mapear fichajes")
                return False
            
        except Exception as e:
            print(f"❌ Error migrando a Supabase: {e}")
            return False
    
    def ejecutar_migracion(self, fecha_desde='2025-06-01'):
        """Ejecutar migración completa"""
        print(f"🚀 Iniciando migración simple de fichajes desde {fecha_desde}")
        
        # 1. Cargar mapeo de empleados desde Supabase
        mapeo_empleados = self.cargar_mapeo_empleados()
        if not mapeo_empleados:
            print("❌ No se pudo cargar el mapeo de empleados")
            return False
        
        # 2. Conectar a Ágora
        conn = self.conectar_agora()
        if not conn:
            return False
        
        try:
            # 3. Obtener fichajes
            fichajes = self.obtener_fichajes_agora(conn, fecha_desde)
            
            # 4. Migrar a Supabase
            if fichajes:
                exito = self.migrar_a_supabase(fichajes, mapeo_empleados)
                if exito:
                    print("✅ Migración completada exitosamente")
                    self.mostrar_resumen(fichajes)
                    return True
            
            return False
            
        finally:
            conn.close()
            print("🔌 Conexión Ágora cerrada")
    
    def mostrar_resumen(self, fichajes):
        """Mostrar resumen de la migración"""
        if not fichajes:
            return
            
        empleados = {}
        for fichaje in fichajes:
            nombre = fichaje['nombre_empleado']
            if nombre not in empleados:
                empleados[nombre] = {
                    'fichajes': 0,
                    'horas_total': 0.0
                }
            empleados[nombre]['fichajes'] += 1
            empleados[nombre]['horas_total'] += fichaje['horas_trabajadas']
        
        print("\n📊 RESUMEN DE MIGRACIÓN:")
        print(f"   Total fichajes: {len(fichajes)}")
        print(f"   Empleados: {len(empleados)}")
        print("\n👥 Por empleado:")
        for nombre, datos in empleados.items():
            print(f"   • {nombre}: {datos['fichajes']} fichajes, {datos['horas_total']:.1f}h")

if __name__ == "__main__":
    migrador = MigradorFichajesSimple()
    
    # Ejecutar migración desde junio
    migrador.ejecutar_migracion('2025-06-01') 