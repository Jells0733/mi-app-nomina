/**
 * @fileoverview Controlador de empleados
 * Maneja las operaciones CRUD para la gestión de empleados
 */

const {
  getEmpleados: getAll,
  createEmpleado,
  updateEmpleadoById,
  deleteEmpleadoById,
  getEmpleadoById
} = require('../models/empleadoModel');
const { createUser } = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { withTransaction } = require('../utils/transactions');

/**
 * Obtiene la lista de empleados con paginación y filtro por nombre
 * @param {Object} req - Objeto de petición Express con query params
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con empleados paginados
 */
const getEmpleados = async (req, res) => {
  let { page = 1, limit = 10, nombre = '', documento = '', status = '' } = req.query;

  // Validar y convertir parámetros de paginación
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;

  try {
    // Obtener todos los empleados
    const allEmpleados = await getAll();
    
    // Filtrar por nombre o documento si se especifica
    let filtered = allEmpleados;
    if (nombre) {
      filtered = filtered.filter(e => {
        const fullName = `${e.nombres || ''} ${e.apellidos || ''}`.toLowerCase();
        return fullName.includes(nombre.toLowerCase());
      });
    }

    // Filtrar por documento si se especifica
    if (documento) {
      filtered = filtered.filter(e => {
        const docNumber = (e.doc_number || '').toString().toLowerCase();
        return docNumber.includes(documento.toLowerCase());
      });
    }

    // Filtrar por status si se especifica
    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }

    // Aplicar paginación
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    // Retornar respuesta con metadatos de paginación
    res.json({
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      data: paginated,
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};

/**
 * Crea un nuevo empleado en el sistema
 * @param {Object} req - Objeto de petición Express con datos del empleado
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con el empleado creado
 */
const postEmpleado = async (req, res) => {
  const {
    doc_type,
    doc_number,
    nombres,
    apellidos,
    telefono,
    cargo,
    fecha_ingreso,
    base_salary,
    banco,
    cuenta,
    status,
    id_usuario,
    crear_usuario,
    username,
    email,
    password
  } = req.body;

  // Validar campos obligatorios
  if (!doc_type || !doc_number || !nombres || !apellidos || !fecha_ingreso || !base_salary) {
    return res.status(400).json({
      error: 'Los campos obligatorios son: doc_type, doc_number, nombres, apellidos, fecha_ingreso, base_salary'
    });
  }

  // Validar que base_salary sea un número positivo
  if (isNaN(base_salary) || base_salary <= 0) {
    return res.status(400).json({ error: 'El sueldo básico debe ser un número mayor a 0' });
  }

  // Si se va a crear un usuario, validar campos de usuario
  if (crear_usuario) {
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Si vas a crear un usuario, debes proporcionar username, email y password'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
  }

  try {
    let nuevo;
    
    // Si se debe crear un usuario, usar transacción para crear ambos
    if (crear_usuario) {
      nuevo = await withTransaction(async (client) => {
        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crear el usuario primero
        const user = await createUser({
          username,
          nombre: `${nombres} ${apellidos}`.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'empleado'
        }, client);
        
        // Crear el empleado asociado al usuario
        const empleado = await createEmpleado({
          doc_type,
          doc_number,
          nombres,
          apellidos,
          telefono,
          cargo,
          fecha_ingreso,
          base_salary,
          banco,
          cuenta,
          status: status || 'Activo',
          id_usuario: user.id
        }, client);
        
        return empleado;
      });
    } else {
      // Si no se crea usuario, crear solo el empleado
      nuevo = await createEmpleado({
        doc_type,
        doc_number,
        nombres,
        apellidos,
        telefono,
        cargo,
        fecha_ingreso,
        base_salary,
        banco,
        cuenta,
        status: status || 'Activo',
        id_usuario
      });
    }
    
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear empleado:', error);
    
    // Manejar error de duplicado de doc_number
    if (error.code === '23505') {
      if (error.constraint === 'empleados_doc_number_key') {
        return res.status(400).json({ error: 'Ya existe un empleado con este número de documento' });
      }
      if (error.constraint && error.constraint.includes('users')) {
        return res.status(400).json({ error: 'Ya existe un usuario con este username o email' });
      }
    }
    
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

/**
 * Actualiza los datos de un empleado existente
 * @param {Object} req - Objeto de petición Express con ID y datos a actualizar
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con el empleado actualizado
 */
const updateEmpleado = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Validar que base_salary sea un número positivo si se proporciona
  if (updateData.base_salary !== undefined) {
    if (isNaN(updateData.base_salary) || updateData.base_salary <= 0) {
      return res.status(400).json({ error: 'El sueldo básico debe ser un número mayor a 0' });
    }
  }

  try {
    // Verificar que el empleado existe antes de actualizar
    const empleado = await getEmpleadoById(id);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Actualizar el empleado en la base de datos
    const actualizado = await updateEmpleadoById(id, updateData);
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    
    // Manejar error de duplicado de doc_number
    if (error.code === '23505' && error.constraint === 'empleados_doc_number_key') {
      return res.status(400).json({ error: 'Ya existe un empleado con este número de documento' });
    }
    
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

/**
 * Elimina un empleado del sistema (soft delete - cambia status a Inactivo)
 * @param {Object} req - Objeto de petición Express con ID del empleado
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con mensaje de confirmación
 */
const deleteEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el empleado existe antes de eliminar
    const empleado = await getEmpleadoById(id);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Desactivar el empleado (soft delete)
    await deleteEmpleadoById(id);
    res.json({ message: 'Empleado desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};

/**
 * Obtiene un empleado por su ID
 * @param {Object} req - Objeto de petición Express con ID del empleado
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con el empleado
 */
const getEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    const empleado = await getEmpleadoById(id);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

module.exports = {
  getEmpleados,
  createEmpleado: postEmpleado,
  updateEmpleado,
  deleteEmpleado,
  getEmpleado,
};
