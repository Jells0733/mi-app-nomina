/**
 * @fileoverview Utilidades para manejo de transacciones atómicas
 * Proporciona funciones para ejecutar operaciones de base de datos de forma atómica (todo o nada)
 */

const db = require('../config/db');

/**
 * Ejecuta una función dentro de una transacción
 * Si la función lanza un error, la transacción se revierte automáticamente
 * @param {Function} callback - Función que recibe un cliente de transacción y retorna un resultado
 * @returns {Promise<any>} Resultado de la función callback
 * @throws {Error} Si ocurre un error, la transacción se revierte y se lanza el error
 */
const withTransaction = async (callback) => {
  // Obtener un cliente del pool para la transacción
  const client = await db.connect();
  
  try {
    // Iniciar la transacción
    await client.query('BEGIN');
    
    // Ejecutar la función callback con el cliente de transacción
    const result = await callback(client);
    
    // Si todo salió bien, confirmar la transacción
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    // Si ocurrió un error, revertir la transacción
    await client.query('ROLLBACK');
    
    // Re-lanzar el error para que el llamador pueda manejarlo
    throw error;
  } finally {
    // Liberar el cliente de vuelta al pool
    client.release();
  }
};

/**
 * Ejecuta múltiples queries dentro de una transacción
 * Útil cuando necesitas ejecutar varias operaciones de forma atómica
 * @param {Array<Function>} queries - Array de funciones que reciben un cliente y retornan un resultado
 * @returns {Promise<Array>} Array con los resultados de cada query
 */
const executeTransaction = async (queries) => {
  return withTransaction(async (client) => {
    const results = [];
    
    for (const queryFn of queries) {
      const result = await queryFn(client);
      results.push(result);
    }
    
    return results;
  });
};

module.exports = {
  withTransaction,
  executeTransaction,
};

