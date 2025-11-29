/**
 * @fileoverview Controlador de autenticación
 * Maneja el registro de usuarios y el inicio de sesión
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../models/userModel');
const { createEmpleado, getEmpleadoByUserId } = require('../models/empleadoModel');

/**
 * Registra un nuevo usuario en el sistema
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con los datos del usuario creado
 */
const register = async (req, res) => {
  const { username, nombre, email, password, role, salario } = req.body;

  // Validar que todos los campos obligatorios estén presentes
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' });
  }

  try {
    // Encriptar la contraseña usando bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear el usuario en la base de datos
    const user = await createUser({ username, nombre, email, password: hashedPassword, role });

    // Nota: El registro de empleado ya no se crea automáticamente aquí
    // Los empleados deben ser creados desde el panel de administrador
    // con todos los campos requeridos (doc_type, doc_number, nombres, apellidos, etc.)

    // Retornar respuesta exitosa con los datos del usuario (sin contraseña)
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      message: role === 'empleado' 
        ? 'Usuario registrado. Un administrador debe completar tu información de empleado.'
        : 'Usuario registrado exitosamente'
    });
  } catch (error) {
    // Manejar error de duplicación de usuario/email
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Usuario o correo ya registrado' });
    }
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * Autentica un usuario y genera un token JWT
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con el token JWT y datos del usuario
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validar que se proporcionen email y contraseña
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    // Buscar usuario por email
    const user = await getUserByEmail(email);

    // Verificar que el usuario existe
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar que la contraseña sea correcta
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Validación adicional para empleados: verificar que existe el registro de empleado
    // Si no existe, permitir el login pero el usuario no podrá acceder a funcionalidades de empleado
    if (user.role === 'empleado') {
      const empleado = await getEmpleadoByUserId(user.id);
      if (!empleado) {
        // Permitir login pero informar que falta información de empleado
        console.warn(`Usuario ${user.id} (empleado) no tiene registro de empleado asociado`);
      }
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      throw new Error('Falta JWT_SECRET en el entorno');
    }

    // Generar token JWT con información del usuario
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Retornar token y datos del usuario
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { register, login };
