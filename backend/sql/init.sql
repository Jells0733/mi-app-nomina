-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente al crear el contenedor de PostgreSQL
-- Define la estructura de tablas necesarias para la aplicación

-- Tabla de usuarios del sistema
-- Almacena información de autenticación y roles de los usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                    -- Identificador único autoincremental
  username VARCHAR(50) UNIQUE NOT NULL,     -- Nombre de usuario único
  nombre VARCHAR(100),                      -- Nombre completo de la persona
  email VARCHAR(100) UNIQUE NOT NULL,       -- Email único del usuario
  password TEXT NOT NULL,                   -- Contraseña encriptada
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'empleado')),  -- Rol con validación
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Fecha de creación automática
);

-- Tabla de empleados
-- Almacena información específica de los empleados de la empresa
CREATE TABLE IF NOT EXISTS empleados (
  id SERIAL PRIMARY KEY,                    -- Identificador único autoincremental
  id_usuario INTEGER UNIQUE REFERENCES users(id),  -- Referencia única al usuario asociado
  
  -- Información de identificación
  doc_type VARCHAR(20) NOT NULL,            -- Tipo de documento (CC, CE, NIT, etc.)
  doc_number VARCHAR(50) UNIQUE NOT NULL,   -- Número de documento único
  
  -- Información personal
  nombres VARCHAR(100) NOT NULL,            -- Nombres del empleado
  apellidos VARCHAR(100) NOT NULL,          -- Apellidos del empleado
  telefono VARCHAR(20),                     -- Teléfono de contacto
  
  -- Información contractual
  cargo VARCHAR(100),                       -- Cargo o puesto de trabajo
  fecha_ingreso DATE NOT NULL,              -- Fecha de ingreso del empleado
  base_salary NUMERIC(12, 2) NOT NULL,      -- Sueldo básico mensual
  
  -- Información bancaria
  banco VARCHAR(100),                       -- Entidad bancaria
  cuenta VARCHAR(50),                      -- Número de cuenta bancaria
  
  -- Estado
  status VARCHAR(20) DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo'))  -- Estado del empleado
);

-- Tabla de registros de nómina (pagos)
-- Almacena el historial de pagos realizados a los empleados
CREATE TABLE IF NOT EXISTS payroll_records (
  id SERIAL PRIMARY KEY,                    -- Identificador único autoincremental
  id_empleado INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,  -- Empleado al que se le paga
  periodo_pago DATE NOT NULL,               -- Fecha del período de pago (ej: 2024-01-31)
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Fecha y hora de generación del registro
  
  -- Detalles de la colilla (almacenados como JSON)
  details JSONB NOT NULL,                   -- Array de conceptos con: concept, quantity, unitValue, accrued, deducted
  
  -- Totales calculados
  total_accrued NUMERIC(12, 2) NOT NULL,    -- Total devengado (ingresos)
  total_deducted NUMERIC(12, 2) NOT NULL,   -- Total deducido (descuentos)
  net_pay NUMERIC(12, 2) NOT NULL,          -- Neto a pagar (total_accrued - total_deducted)
  
  -- Metadatos
  observaciones TEXT                        -- Observaciones adicionales sobre el pago
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_payroll_empleado ON payroll_records(id_empleado);
CREATE INDEX IF NOT EXISTS idx_payroll_periodo ON payroll_records(periodo_pago);
CREATE INDEX IF NOT EXISTS idx_empleados_status ON empleados(status);
CREATE INDEX IF NOT EXISTS idx_empleados_doc ON empleados(doc_number);

