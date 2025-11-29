/**
 * @fileoverview Rutas de autenticación
 * Define los endpoints para registro e inicio de sesión de usuarios
 */

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema
 * Body: { username, email, password, role, salario? }
 */
router.post('/register', validateRegister, register);

/**
 * POST /api/auth/login
 * Autentica un usuario y retorna un token JWT
 * Body: { email, password }
 */
router.post('/login', validateLogin, login);

module.exports = router;
