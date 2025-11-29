/**
 * @fileoverview Configuración principal de la aplicación Express
 * Este archivo configura el servidor Express, middleware, y define las rutas principales
 */

const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');
require('dotenv').config();

// Crear instancia de la aplicación Express
const app = express();

// Configurar middleware CORS para permitir peticiones desde el frontend
app.use(cors());

// Configurar middleware para parsear JSON en las peticiones
app.use(express.json());

/**
 * Ruta de prueba para verificar la conexión con la base de datos
 * Solo disponible en modo desarrollo
 */
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-db', async (req, res) => {
    try {
      // Ejecutar consulta simple para verificar conexión
      const result = await pool.query('SELECT NOW()');
      res.json({ ok: true, dbTime: result.rows[0].now });
    } catch (error) {
      console.error('Error en test-db:', error);
      res.status(500).json({ ok: false, error: 'Error al conectar con la base de datos' });
    }
  });
}

/**
 * Importar y configurar las rutas de la aplicación
 * Cada módulo de rutas maneja un dominio específico de la aplicación
 */
const authRoutes = require('./src/routes/auth.routes');
const empleadosRoutes = require('./src/routes/empleados.routes');
const payrollRoutes = require('./src/routes/payroll.routes');

// Montar las rutas en la aplicación con prefijos específicos
app.use('/api/auth', authRoutes);        // Rutas de autenticación
app.use('/api/empleados', empleadosRoutes);    // Rutas de gestión de empleados
app.use('/api/payroll', payrollRoutes);  // Rutas de gestión de nómina

module.exports = app;
