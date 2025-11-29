/**
 * @fileoverview Controlador de nómina
 * Maneja las operaciones relacionadas con la generación y consulta de registros de pago
 */

const {
  getPayrollRecords,
  getPayrollRecordsByEmpleado,
  getPayrollRecordById,
  createPayrollRecord,
  getPayrollRecordByEmpleadoAndPeriodo,
  deletePayrollRecord
} = require('../models/payrollModel');

const { getEmpleadoById, getEmpleadosActivos } = require('../models/empleadoModel');

// Constantes para cálculos
const SMMLV = 1300000; // Salario Mínimo Mensual Legal Vigente (ejemplo, debería ser configurable)
const APORTE_SALUD_PORCENTAJE = 0.04; // 4%
const APORTE_PENSION_PORCENTAJE = 0.04; // 4%
const AUXILIO_TRANSPORTE = 162000; // Valor del auxilio de transporte (ejemplo)
const LIMITE_AUXILIO_TRANSPORTE = SMMLV * 2; // 2 SMMLV

/**
 * Calcula los conceptos de nómina para un empleado
 * @param {Object} empleado - Datos del empleado
 * @param {number} baseSalary - Sueldo básico
 * @param {boolean} aplicarAuxilioTransporte - Si se debe aplicar auxilio de transporte
 * @returns {Object} Objeto con details, total_accrued, total_deducted, net_pay
 */
const calcularNomina = (empleado, baseSalary, aplicarAuxilioTransporte = null) => {
  const details = [];

  // 1. Sueldo básico (devengado)
  details.push({
    concept: 'Sueldo Básico',
    quantity: 1,
    unitValue: baseSalary,
    accrued: baseSalary,
    deducted: 0
  });

  // 2. Auxilio de transporte (si aplica)
  // Aplica si el sueldo es menor a 2 SMMLV, o si se especifica manualmente
  const debeAplicarAuxilio = aplicarAuxilioTransporte !== null 
    ? aplicarAuxilioTransporte 
    : baseSalary < LIMITE_AUXILIO_TRANSPORTE;

  if (debeAplicarAuxilio) {
    details.push({
      concept: 'Auxilio de Transporte',
      quantity: 1,
      unitValue: AUXILIO_TRANSPORTE,
      accrued: AUXILIO_TRANSPORTE,
      deducted: 0
    });
  }

  // 3. Aporte Salud (deducido) - 4% del sueldo básico
  const aporteSalud = baseSalary * APORTE_SALUD_PORCENTAJE;
  details.push({
    concept: 'Aporte Salud',
    quantity: 1,
    unitValue: aporteSalud,
    accrued: 0,
    deducted: aporteSalud
  });

  // 4. Aporte Pensión (deducido) - 4% del sueldo básico
  const aportePension = baseSalary * APORTE_PENSION_PORCENTAJE;
  details.push({
    concept: 'Aporte Pensión',
    quantity: 1,
    unitValue: aportePension,
    accrued: 0,
    deducted: aportePension
  });

  // Calcular totales
  const totalAccrued = details.reduce((sum, d) => sum + (d.accrued || 0), 0);
  const totalDeducted = details.reduce((sum, d) => sum + (d.deducted || 0), 0);
  const netPay = totalAccrued - totalDeducted;

  return {
    details,
    total_accrued: totalAccrued,
    total_deducted: totalDeducted,
    net_pay: netPay
  };
};

/**
 * Obtiene todos los registros de nómina con paginación
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getPayrolls = async (req, res) => {
  let { page = 1, limit = 10, id_empleado } = req.query;
  const { userId, role } = req.user;

  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;

  try {
    let allRecords;

    // Si es empleado, solo puede ver sus propias nóminas
    if (role === 'empleado') {
      const { getEmpleadoByUserId } = require('../models/empleadoModel');
      const empleado = await getEmpleadoByUserId(userId);
      if (!empleado) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      allRecords = await getPayrollRecordsByEmpleado(empleado.id);
    } else if (id_empleado) {
      // Admin puede filtrar por empleado específico
      allRecords = await getPayrollRecordsByEmpleado(id_empleado);
    } else {
      // Admin puede ver todos los registros
      allRecords = await getPayrollRecords();
    }

    // Aplicar paginación
    const offset = (page - 1) * limit;
    const paginated = allRecords.slice(offset, offset + limit);

    res.json({
      page,
      limit,
      total: allRecords.length,
      totalPages: Math.ceil(allRecords.length / limit),
      data: paginated,
    });
  } catch (error) {
    console.error('Error al obtener registros de nómina:', error);
    res.status(500).json({ error: 'Error al obtener registros de nómina' });
  }
};

/**
 * Obtiene un registro de nómina por su ID
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getPayroll = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await getPayrollRecordById(id);
    if (!record) {
      return res.status(404).json({ error: 'Registro de nómina no encontrado' });
    }
    res.json(record);
  } catch (error) {
    console.error('Error al obtener registro de nómina:', error);
    res.status(500).json({ error: 'Error al obtener registro de nómina' });
  }
};

/**
 * Genera un nuevo registro de nómina para un empleado
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 */
const generatePayroll = async (req, res) => {
  const { id_empleado, periodo_pago, aplicar_auxilio_transporte, observaciones } = req.body;

  // Validar campos obligatorios
  if (!id_empleado || !periodo_pago) {
    return res.status(400).json({
      error: 'Los campos id_empleado y periodo_pago son obligatorios'
    });
  }

  try {
    // Verificar que el empleado existe
    const empleado = await getEmpleadoById(id_empleado);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar que el empleado esté activo
    if (empleado.status !== 'Activo') {
      return res.status(400).json({
        error: 'No se puede generar nómina para un empleado inactivo'
      });
    }

    // Verificar si ya existe un registro para este período
    const existingRecord = await getPayrollRecordByEmpleadoAndPeriodo(id_empleado, periodo_pago);
    if (existingRecord) {
      return res.status(400).json({
        error: 'Ya existe un registro de nómina para este empleado en este período'
      });
    }

    // Obtener el sueldo básico del empleado
    const baseSalary = parseFloat(empleado.base_salary);
    if (!baseSalary || baseSalary <= 0) {
      return res.status(400).json({
        error: 'El empleado no tiene un sueldo básico válido'
      });
    }

    // Calcular la nómina
    const calculo = calcularNomina(empleado, baseSalary, aplicar_auxilio_transporte);

    // Crear el registro de nómina
    const nuevoRegistro = await createPayrollRecord({
      id_empleado,
      periodo_pago,
      details: calculo.details,
      total_accrued: calculo.total_accrued,
      total_deducted: calculo.total_deducted,
      net_pay: calculo.net_pay,
      observaciones
    });

    res.status(201).json(nuevoRegistro);
  } catch (error) {
    console.error('Error al generar nómina:', error);
    res.status(500).json({ error: 'Error al generar nómina' });
  }
};

/**
 * Genera nómina para todos los empleados activos
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 */
const generatePayrollForAll = async (req, res) => {
  const { periodo_pago, aplicar_auxilio_transporte } = req.body;

  if (!periodo_pago) {
    return res.status(400).json({
      error: 'El campo periodo_pago es obligatorio'
    });
  }

  try {
    const empleadosActivos = await getEmpleadosActivos();
    const resultados = {
      exitosos: [],
      errores: []
    };

    for (const empleado of empleadosActivos) {
      try {
        // Verificar si ya existe un registro para este período
        const existingRecord = await getPayrollRecordByEmpleadoAndPeriodo(
          empleado.id,
          periodo_pago
        );

        if (existingRecord) {
          resultados.errores.push({
            empleado_id: empleado.id,
            empleado_nombre: `${empleado.nombres} ${empleado.apellidos}`,
            error: 'Ya existe un registro de nómina para este período'
          });
          continue;
        }

        const baseSalary = parseFloat(empleado.base_salary);
        if (!baseSalary || baseSalary <= 0) {
          resultados.errores.push({
            empleado_id: empleado.id,
            empleado_nombre: `${empleado.nombres} ${empleado.apellidos}`,
            error: 'Sueldo básico inválido'
          });
          continue;
        }

        // Calcular la nómina
        const calculo = calcularNomina(empleado, baseSalary, aplicar_auxilio_transporte);

        // Crear el registro
        const registro = await createPayrollRecord({
          id_empleado: empleado.id,
          periodo_pago,
          details: calculo.details,
          total_accrued: calculo.total_accrued,
          total_deducted: calculo.total_deducted,
          net_pay: calculo.net_pay
        });

        resultados.exitosos.push({
          empleado_id: empleado.id,
          empleado_nombre: `${empleado.nombres} ${empleado.apellidos}`,
          registro_id: registro.id
        });
      } catch (error) {
        resultados.errores.push({
          empleado_id: empleado.id,
          empleado_nombre: `${empleado.nombres} ${empleado.apellidos}`,
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `Procesados ${empleadosActivos.length} empleados`,
      exitosos: resultados.exitosos.length,
      errores: resultados.errores.length,
      detalles: resultados
    });
  } catch (error) {
    console.error('Error al generar nómina masiva:', error);
    res.status(500).json({ error: 'Error al generar nómina masiva' });
  }
};

/**
 * Elimina un registro de nómina
 * @param {Object} req - Objeto de petición Express
 * @param {Object} res - Objeto de respuesta Express
 */
const deletePayroll = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deletePayrollRecord(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Registro de nómina no encontrado' });
    }
    res.json({ message: 'Registro de nómina eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro de nómina:', error);
    res.status(500).json({ error: 'Error al eliminar registro de nómina' });
  }
};

module.exports = {
  getPayrolls,
  getPayroll,
  generatePayroll,
  generatePayrollForAll,
  deletePayroll,
  calcularNomina, // Exportar para uso en tests
};

