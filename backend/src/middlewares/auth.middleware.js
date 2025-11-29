/**
 * @fileoverview Middleware de autenticación y autorización
 * Proporciona funciones para verificar tokens JWT y autorizar roles de usuario
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la validez del token JWT
 * Extrae el token del header Authorization y verifica su validez
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const authenticateToken = (req, res, next) => {
  // Extraer el token del header Authorization (formato: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  // Verificar que se proporcionó un token
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Verificar que JWT_SECRET esté configurado en las variables de entorno
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET no está definido');
    return res.status(500).json({ error: 'Error del servidor: configuración incompleta' });
  }

  // Verificar la validez del token JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // Agregar la información del usuario decodificada al objeto request
    // decoded contiene: { userId, role, iat, exp }
    req.user = decoded;
    next();
  });
};

/**
 * Middleware para autorizar acceso basado en roles de usuario
 * Verifica que el usuario tenga uno de los roles permitidos
 * @param {Array} allowedRoles - Array de roles permitidos para acceder al recurso
 * @returns {Function} Middleware de autorización
 */
const authorizeRole = (allowedRoles) => (req, res, next) => {
  // Verificar que el usuario esté autenticado y tenga un rol válido
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado: rol no autorizado' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
};
