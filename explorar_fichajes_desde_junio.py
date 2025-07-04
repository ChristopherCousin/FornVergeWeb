#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔒 EXPLORACIÓN FICHAJES DESDE 06/06/2025 - ULTRA SEGURO
⚠️  CRÍTICO: SOLO LECTURA - Solo usuarios activos - Solo desde que cogió el negocio
"""

import pymssql
import sys
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta

class AgoraFichagesFromJune:
    """
    Exploración específica de fichajes desde 06/06/2025
    SOLO usuarios activos y NO eliminados
    """
    
    def __init__(self):
        self.config = {
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
        self.connection = None
        # FECHA CRÍTICA: Cuando cogió el negocio
        self.start_date = '2025-06-06'
    
    def connect(self) -> bool:
        try:
            self.connection = pymssql.connect(**self.config)
            print("✅ Conexión establecida - MODO ULTRA SEGURO")
            print(f"📅 Filtrando datos desde: {self.start_date}")
            return True
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def ultra_safe_query(self, query: str, description: str = "") -> List[Dict]:
        """
        Consulta ULTRA SEGURA con validaciones extremas
        """
        if not self.connection:
            return []
        
        # VALIDACIÓN EXTREMA DE SEGURIDAD
        query_upper = query.upper().strip()
        
        # Palabras absolutamente prohibidas
        forbidden = [
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
            'TRUNCATE', 'EXEC', 'EXECUTE', 'MERGE', 'REPLACE',
            'GRANT', 'REVOKE', 'DENY', 'BACKUP', 'RESTORE'
        ]
        
        for keyword in forbidden:
            if keyword in query_upper:
                print(f"🚨 CONSULTA BLOQUEADA: Contiene '{keyword}' - PROHIBIDO")
                return []
        
        if not query_upper.startswith('SELECT'):
            print(f"🚨 SOLO SELECT permitido - Consulta rechazada")
            return []
        
        # Verificar que no hay comandos maliciosos ocultos
        if ';' in query and not query.strip().endswith(';'):
            print(f"🚨 Múltiples comandos detectados - Prohibido")
            return []
        
        try:
            cursor = self.connection.cursor()
            if description:
                print(f"🔍 {description}")
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            results = []
            for row in cursor.fetchall():
                row_dict = {}
                for i, value in enumerate(row):
                    if i < len(columns):
                        row_dict[columns[i]] = value
                results.append(row_dict)
            
            print(f"   📊 {len(results)} registros desde {self.start_date}")
            return results
            
        except Exception as e:
            print(f"❌ Error en consulta: {e}")
            return []
    
    def get_active_employees(self):
        """
        Obtener SOLO empleados activos (no eliminados)
        """
        print("\n👥 EMPLEADOS ACTIVOS (NO ELIMINADOS):")
        
        query = """
        SELECT 
            Id,
            Name,
            ShowInClockings,
            IsTrainee,
            FullName,
            DeletionDate
        FROM [dbo].[User] 
        WHERE DeletionDate IS NULL 
        AND ShowInClockings = 1
        ORDER BY Name
        """
        
        employees = self.ultra_safe_query(query, "Obteniendo empleados activos")
        
        if employees:
            print(f"   👥 {len(employees)} empleados activos encontrados:")
            for emp in employees:
                name = emp.get('FullName') or emp.get('Name', 'Sin nombre')
                trainee = " (APRENDIZ)" if emp.get('IsTrainee') else ""
                print(f"      • ID {emp['Id']}: {name}{trainee}")
        
        return employees
    
    def explore_working_periods_since_june(self):
        """
        Explorar WorkingPeriod desde 06/06/2025 - SOLO usuarios activos
        """
        print(f"\n⏰ PERÍODOS DE TRABAJO DESDE {self.start_date}:")
        
        # Primero ver la estructura
        structure_query = """
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'WorkingPeriod' AND TABLE_SCHEMA = 'dbo'
        ORDER BY ORDINAL_POSITION
        """
        
        structure = self.ultra_safe_query(structure_query, "Estructura de WorkingPeriod")
        if structure:
            print("   📋 Columnas de WorkingPeriod:")
            for col in structure[:10]:  # Solo primeras 10
                print(f"      • {col['COLUMN_NAME']} ({col['DATA_TYPE']})")
        
        # Contar registros desde junio para usuarios activos
        count_query = f"""
        SELECT COUNT(*) as total 
        FROM [dbo].[WorkingPeriod] wp
        INNER JOIN [dbo].[User] u ON wp.UserId = u.Id
        WHERE u.DeletionDate IS NULL 
        AND u.ShowInClockings = 1
        AND wp.BusinessDay >= '{self.start_date}'
        """
        
        count = self.ultra_safe_query(count_query, f"Contando períodos desde {self.start_date}")
        if count:
            print(f"   📊 {count[0]['total']} períodos de trabajo desde junio")
        
        # Muestra de datos recientes
        sample_query = f"""
        SELECT TOP 10
            wp.*,
            u.Name as EmployeeName
        FROM [dbo].[WorkingPeriod] wp
        INNER JOIN [dbo].[User] u ON wp.UserId = u.Id
        WHERE u.DeletionDate IS NULL 
        AND u.ShowInClockings = 1
        AND wp.BusinessDay >= '{self.start_date}'
        ORDER BY wp.BusinessDay DESC, wp.StartTime DESC
        """
        
        recent_periods = self.ultra_safe_query(sample_query, "Últimos períodos de trabajo")
        if recent_periods:
            print("   📋 Últimos períodos registrados:")
            for i, period in enumerate(recent_periods[:5], 1):
                business_day = period.get('BusinessDay', '')
                start_time = period.get('StartTime', '')
                end_time = period.get('EndTime', '')
                employee = period.get('EmployeeName', 'Sin nombre')
                
                if business_day and start_time:
                    day_str = business_day.strftime('%d/%m/%Y') if hasattr(business_day, 'strftime') else str(business_day)
                    start_str = start_time.strftime('%H:%M') if hasattr(start_time, 'strftime') else str(start_time)
                    end_str = end_time.strftime('%H:%M') if hasattr(end_time, 'strftime') and end_time else 'En curso'
                    
                    print(f"      {i}. {employee} - {day_str}: {start_str} a {end_str}")
    
    def explore_audit_events_since_june(self):
        """
        Explorar eventos de auditoría desde junio - SOLO usuarios activos
        """
        print(f"\n📋 EVENTOS DE AUDITORÍA DESDE {self.start_date}:")
        
        # Contar eventos por usuario desde junio
        count_query = f"""
        SELECT 
            COUNT(*) as total_events,
            u.Name as EmployeeName,
            COUNT(DISTINCT CAST(ae.Time AS DATE)) as days_with_activity
        FROM [dbo].[AuditEvent] ae
        INNER JOIN [dbo].[User] u ON ae.UserId = u.Id
        WHERE u.DeletionDate IS NULL 
        AND u.ShowInClockings = 1
        AND ae.Time >= '{self.start_date}'
        GROUP BY u.Id, u.Name
        ORDER BY total_events DESC
        """
        
        audit_summary = self.ultra_safe_query(count_query, "Resumen de actividad por empleado")
        if audit_summary:
            print("   📊 Actividad por empleado:")
            for summary in audit_summary[:10]:  # Top 10
                employee = summary.get('EmployeeName', 'Sin nombre')
                events = summary.get('total_events', 0)
                days = summary.get('days_with_activity', 0)
                print(f"      • {employee}: {events} eventos en {days} días")
    
    def get_employee_hours_summary(self):
        """
        Resumen de horas trabajadas por empleado desde junio
        """
        print(f"\n📊 RESUMEN DE HORAS DESDE {self.start_date}:")
        
        hours_query = f"""
        SELECT 
            u.Name as EmployeeName,
            COUNT(*) as total_periods,
            COUNT(DISTINCT wp.BusinessDay) as days_worked,
            MIN(wp.BusinessDay) as first_day,
            MAX(wp.BusinessDay) as last_day
        FROM [dbo].[WorkingPeriod] wp
        INNER JOIN [dbo].[User] u ON wp.UserId = u.Id
        WHERE u.DeletionDate IS NULL 
        AND u.ShowInClockings = 1
        AND wp.BusinessDay >= '{self.start_date}'
        GROUP BY u.Id, u.Name
        ORDER BY total_periods DESC
        """
        
        hours_summary = self.ultra_safe_query(hours_query, "Resumen de horas trabajadas")
        if hours_summary:
            print("   📊 Empleados con más períodos trabajados:")
            for summary in hours_summary:
                employee = summary.get('EmployeeName', 'Sin nombre')
                periods = summary.get('total_periods', 0)
                days = summary.get('days_worked', 0)
                first_day = summary.get('first_day', '')
                last_day = summary.get('last_day', '')
                
                first_str = first_day.strftime('%d/%m') if hasattr(first_day, 'strftime') else str(first_day)
                last_str = last_day.strftime('%d/%m') if hasattr(last_day, 'strftime') else str(last_day)
                
                print(f"      • {employee}: {periods} períodos en {days} días ({first_str} - {last_str})")
    
    def disconnect(self):
        if self.connection:
            self.connection.close()
            print("🔒 Conexión cerrada de forma segura")

def main():
    print("🔍 EXPLORACIÓN FICHAJES DESDE 06/06/2025")
    print("🔒 MODO ULTRA SEGURO - SOLO LECTURA")
    print("👥 SOLO empleados activos (no eliminados)")
    print("📅 SOLO datos desde que cogió el negocio")
    
    explorer = AgoraFichagesFromJune()
    
    if not explorer.connect():
        return False
    
    try:
        # 1. Empleados activos
        active_employees = explorer.get_active_employees()
        
        # 2. Períodos de trabajo desde junio
        explorer.explore_working_periods_since_june()
        
        # 3. Eventos de auditoría desde junio
        explorer.explore_audit_events_since_june()
        
        # 4. Resumen de horas
        explorer.get_employee_hours_summary()
        
        print(f"\n✅ Exploración completada - SOLO datos desde {explorer.start_date}")
        print("🔒 Ningún dato fue modificado")
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante exploración: {e}")
        return False
        
    finally:
        explorer.disconnect()

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️ Exploración interrumpida de forma segura")
        sys.exit(1) 