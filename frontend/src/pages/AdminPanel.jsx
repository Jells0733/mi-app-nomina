import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado } from '../services/empleadoService';
import { getPayrolls, generatePayroll, generatePayrollForAll, deletePayroll } from '../services/payrollService';
import { useNavigate } from 'react-router-dom';
import { 
  sanitizeString, 
  sanitizeDocument, 
  sanitizePhone, 
  sanitizeText,
  sanitizeNumber 
} from '../utils/sanitize';
import { generatePayrollPDF } from '../utils/pdfGenerator';
import { showAlert, showConfirm, showActionConfirm, showDeleteConfirm } from '../utils/swal';

const AdminPanel = () => {
  const { user, token } = useContext(AuthContext);
  const [empleados, setEmpleados] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('empleados'); // 'empleados' o 'nomina'
  
  // Estado de paginación de empleados
  const [empleadosPagination, setEmpleadosPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });

  // Estado de búsqueda
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [searchNomina, setSearchNomina] = useState('');

  // Estado del formulario de empleado
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    doc_type: 'CC',
    doc_number: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    cargo: '',
    fecha_ingreso: '',
    base_salary: '',
    banco: '',
    cuenta: '',
    status: 'Activo',
    crear_usuario: false,
    username: '',
    email: '',
    password: ''
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [editarCredenciales, setEditarCredenciales] = useState(false);
  const [mostrarFormularioEmpleado, setMostrarFormularioEmpleado] = useState(false);

  // Estado del formulario de nómina
  const [nuevaNomina, setNuevaNomina] = useState({
    id_empleado: '',
    periodo_pago: '',
    aplicar_auxilio_transporte: null,
    observaciones: ''
  });

  const [generarParaTodos, setGenerarParaTodos] = useState(false);
  
  // Estado para el overlay de detalles de nómina
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const empleadoFormRef = useRef(null);
  const nombreInputRef = useRef(null);
  const navigate = useNavigate();

  // Función para cargar empleados
  const loadEmpleados = async (page = empleadosPagination.page, limit = empleadosPagination.limit, search = '') => {
    try {
      const params = { page, limit };
      
      // Determinar si la búsqueda es por nombre o documento
      if (search.trim()) {
        // Si es un número, buscar por documento, sino por nombre
        if (/^\d+$/.test(search.trim())) {
          params.documento = search.trim();
        } else {
          params.nombre = search.trim();
        }
      }
      
      const empleadosResult = await getEmpleados(token, params);
      setEmpleados(empleadosResult.data || []);
      setEmpleadosPagination({
        page: empleadosResult.page || page,
        limit: empleadosResult.limit || limit,
        total: empleadosResult.total || 0,
        totalPages: empleadosResult.totalPages || 1
      });
    } catch (err) {
      console.error('Error al obtener empleados:', err);
      setEmpleados([]);
    }
  };

  // Función para manejar búsqueda de empleados
  const handleSearchEmpleado = (e) => {
    e.preventDefault();
    setEmpleadosPagination({ ...empleadosPagination, page: 1 });
    loadEmpleados(1, empleadosPagination.limit, searchEmpleado);
  };

  // Función para filtrar nómina por búsqueda
  const filteredPayrolls = payrolls.filter(payroll => {
    if (!searchNomina.trim()) return true;
    const search = searchNomina.toLowerCase();
    const nombre = (payroll.empleado_nombre || '').toLowerCase();
    const doc = (payroll.empleado_doc || '').toLowerCase();
    return nombre.includes(search) || doc.includes(search);
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Cargar empleados con valores por defecto para asegurar que se carguen todos
        await loadEmpleados(1, 15, '');
        const payrollsData = await getPayrolls(token);
        setPayrolls(payrollsData);
      } catch (err) {
        console.error('Error al obtener datos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  // Efecto para recargar cuando cambia la página
  useEffect(() => {
    if (!user || user.role !== 'admin' || !token || loading) return;
    loadEmpleados(empleadosPagination.page, empleadosPagination.limit, searchEmpleado);
  }, [empleadosPagination.page, empleadosPagination.limit]);

  // Función para formatear número como moneda (solo visual)
  const formatCurrencyInput = (value) => {
    // Remover todo excepto números
    const numericValue = value.toString().replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    
    // Convertir a número y formatear
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    
    // Formatear con puntos para miles y comas para decimales
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  // Función para convertir valor formateado de vuelta a número
  const parseCurrencyInput = (formattedValue) => {
    return formattedValue.toString().replace(/[^0-9]/g, '');
  };

  const handleEmpleadoChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    
    // Sanitizar según el tipo de campo
    if (name === 'doc_number') {
      sanitizedValue = sanitizeDocument(value);
    } else if (name === 'nombres' || name === 'apellidos') {
      // Para nombres y apellidos, solo eliminar caracteres peligrosos
      // Permitir espacios múltiples (solo se eliminarán espacios al inicio/final al enviar)
      sanitizedValue = value
        .replace(/[<>]/g, '') // Eliminar < y >
        .replace(/javascript:/gi, '') // Eliminar javascript:
        .replace(/on\w+=/gi, ''); // Eliminar event handlers
      // NO aplicar trim ni normalizar espacios aquí - permitir escribir libremente
    } else if (name === 'cargo' || name === 'banco') {
      // Para cargo y banco, permitir espacios pero eliminar caracteres peligrosos
      sanitizedValue = value
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    } else if (name === 'telefono') {
      sanitizedValue = sanitizePhone(value);
    } else if (name === 'cuenta') {
      sanitizedValue = sanitizeString(value).replace(/[^a-zA-Z0-9-]/g, '');
    } else if (name === 'base_salary') {
      // Para sueldo, formatear visualmente como moneda pero guardar solo números
      const numericValue = parseCurrencyInput(value);
      sanitizedValue = formatCurrencyInput(numericValue);
    }
    
    setNuevoEmpleado({ ...nuevoEmpleado, [name]: sanitizedValue });
  };

  const handleCrearEmpleado = async (e) => {
    e.preventDefault();
    const { doc_type, doc_number, nombres, apellidos, fecha_ingreso, base_salary } = nuevoEmpleado;
    
    if (!doc_type || !doc_number || !nombres || !apellidos || !fecha_ingreso || !base_salary) {
      return showAlert('Los campos obligatorios son: Tipo de documento, Número de documento, Nombres, Apellidos, Fecha de ingreso y Sueldo básico', 'warning');
    }
    
    const baseSalaryNumeric = parseCurrencyInput(nuevoEmpleado.base_salary);
    if (!baseSalaryNumeric || parseFloat(baseSalaryNumeric) <= 0) {
      return showAlert('El sueldo básico debe ser mayor a 0', 'warning');
    }

    try {
      // Solo eliminar espacios al inicio y final, mantener espacios múltiples en el medio
      // Convertir base_salary de formato visual a número
      const empleadoData = {
        ...nuevoEmpleado,
        nombres: nuevoEmpleado.nombres.trim(), // Solo trim (inicio y final)
        apellidos: nuevoEmpleado.apellidos.trim(), // Solo trim (inicio y final)
        base_salary: parseFloat(baseSalaryNumeric),
        // Si se debe crear usuario, incluir datos del usuario
        crear_usuario: nuevoEmpleado.crear_usuario || false,
        username: nuevoEmpleado.crear_usuario && typeof nuevoEmpleado.username === 'string' && nuevoEmpleado.username.trim().length > 0 ? nuevoEmpleado.username.trim() : null,
        email: nuevoEmpleado.crear_usuario && typeof nuevoEmpleado.email === 'string' && nuevoEmpleado.email.trim().length > 0 ? nuevoEmpleado.email.trim().toLowerCase() : null,
        password: nuevoEmpleado.crear_usuario && typeof nuevoEmpleado.password === 'string' && nuevoEmpleado.password.trim().length > 0 ? nuevoEmpleado.password.trim() : null
      };
      
      // Validar campos de usuario si se va a crear
      if (empleadoData.crear_usuario) {
        if (!empleadoData.username || !empleadoData.email || !empleadoData.password) {
          return showAlert('Si vas a crear un usuario, debes completar todos los campos: nombre de usuario, correo y contraseña', 'warning');
        }
        if (empleadoData.password.length < 6) {
          return showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
        }
      }
      
      const nuevo = await createEmpleado(empleadoData, token);
      
      // Si llegamos aquí, el empleado se creó exitosamente
      await loadEmpleados(empleadosPagination.page, empleadosPagination.limit);
      setNuevoEmpleado({
        doc_type: 'CC',
        doc_number: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        cargo: '',
        fecha_ingreso: '',
        base_salary: '',
        banco: '',
        cuenta: '',
        status: 'Activo',
        crear_usuario: false,
        username: '',
        email: '',
        password: ''
      });
      setMostrarFormularioEmpleado(false);
      showAlert('Empleado creado exitosamente', 'success');
    } catch (err) {
      console.error('Error al crear empleado:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Error al crear el empleado';
      showAlert(errorMessage, 'error');
    }
  };

  const handleEditarEmpleado = (emp) => {
    setModoEdicion(true);
    setEmpleadoEditando(emp);
    setEditarCredenciales(false);
    setNuevoEmpleado({
      doc_type: emp.doc_type || 'CC',
      doc_number: emp.doc_number || '',
      nombres: emp.nombres || '',
      apellidos: emp.apellidos || '',
      telefono: emp.telefono || '',
      cargo: emp.cargo || '',
      fecha_ingreso: emp.fecha_ingreso ? emp.fecha_ingreso.split('T')[0] : '',
      base_salary: emp.base_salary ? formatCurrencyInput(emp.base_salary.toString()) : '',
      banco: emp.banco || '',
      cuenta: emp.cuenta || '',
      status: emp.status || 'Activo',
      // Datos de acceso existentes (si los hay)
      username: emp.username || '',
      email: emp.email || '',
      password: ''
    });
    
    setTimeout(() => {
      empleadoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nombreInputRef.current?.focus();
    }, 100);
    setMostrarFormularioEmpleado(true);
  };

  const handleActualizarEmpleado = async (e) => {
    e.preventDefault();
    const { doc_type, doc_number, nombres, apellidos, fecha_ingreso, base_salary } = nuevoEmpleado;
    
    if (!doc_type || !doc_number || !nombres || !apellidos || !fecha_ingreso || !base_salary) {
      return showAlert('Los campos obligatorios son: Tipo de documento, Número de documento, Nombres, Apellidos, Fecha de ingreso y Sueldo básico', 'warning');
    }
    
    const baseSalaryNumeric = parseCurrencyInput(nuevoEmpleado.base_salary);
    if (!baseSalaryNumeric || parseFloat(baseSalaryNumeric) <= 0) {
      return showAlert('El sueldo básico debe ser mayor a 0', 'warning');
    }

    try {
      // Solo eliminar espacios al inicio y final, mantener espacios múltiples en el medio
      // Convertir base_salary de formato visual a número
      
      const empleadoData = {
        ...nuevoEmpleado,
        nombres: nuevoEmpleado.nombres.trim(), // Solo trim (inicio y final)
        apellidos: nuevoEmpleado.apellidos.trim(), // Solo trim (inicio y final)
        base_salary: parseFloat(baseSalaryNumeric)
      };
      
      // Solo incluir campos de credenciales si editarCredenciales está marcado
      // Similar a handleCrearEmpleado que usa crear_usuario
      if (editarCredenciales) {
        empleadoData.username = nuevoEmpleado.username ? nuevoEmpleado.username.trim() : null;
        empleadoData.email = nuevoEmpleado.email ? nuevoEmpleado.email.trim().toLowerCase() : null;
        empleadoData.password = nuevoEmpleado.password ? nuevoEmpleado.password.trim() : null;
      } else {
        // Excluir campos de credenciales cuando no se están editando
        delete empleadoData.username;
        delete empleadoData.email;
        delete empleadoData.password;
      }
      
      const actualizado = await updateEmpleado(empleadoEditando.id, empleadoData, token);
      
      if (actualizado) {
        await loadEmpleados(empleadosPagination.page, empleadosPagination.limit);
        setModoEdicion(false);
        setEmpleadoEditando(null);
        setNuevoEmpleado({
          doc_type: 'CC',
          doc_number: '',
          nombres: '',
          apellidos: '',
          telefono: '',
          cargo: '',
          fecha_ingreso: '',
          base_salary: '',
          banco: '',
          cuenta: '',
          status: 'Activo',
          crear_usuario: false,
          username: '',
          email: '',
          password: ''
        });
        setEditarCredenciales(false);
        setMostrarFormularioEmpleado(false);
        showAlert('Empleado actualizado exitosamente', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showAlert('Error al actualizar el empleado', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert(err?.response?.data?.error || 'Error al actualizar el empleado', 'error');
    }
  };

  const handleEliminarEmpleado = async (emp) => {
    const accion = emp.status === 'Activo' ? 'desactivar' : 'activar';
    const confirmed = await showActionConfirm(accion, 'este empleado');
    if (!confirmed) return;
    
    try {
      // Actualizar el status del empleado
      const actualizado = await updateEmpleado(emp.id, {
        status: emp.status === 'Activo' ? 'Inactivo' : 'Activo'
      }, token);
      
      if (actualizado) {
        await loadEmpleados(empleadosPagination.page, empleadosPagination.limit);
        showAlert(`Empleado ${accion}do exitosamente`, 'success');
      } else {
        showAlert('Error al actualizar el empleado', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert(`Error al ${accion} el empleado`, 'error');
    }
  };

  const handleNominaChange = (e) => {
    const { name, value, type, checked } = e.target;
    let sanitizedValue = value;
    
    // Sanitizar según el tipo de campo
    if (name === 'observaciones') {
      sanitizedValue = sanitizeText(value);
    }
    
    setNuevaNomina({
      ...nuevaNomina,
      [name]: type === 'checkbox' ? checked : sanitizedValue
    });
  };

  const handleGenerarNomina = async (e) => {
    e.preventDefault();
    
    if (generarParaTodos) {
      if (!nuevaNomina.periodo_pago) {
        return showAlert('La fecha del período de pago es obligatoria', 'warning');
      }
      
      const confirmed = await showConfirm('¿Generar nómina para todos los empleados activos?', 'Confirmar generación masiva');
      if (!confirmed) return;
      
      try {
        const resultado = await generatePayrollForAll({
          periodo_pago: nuevaNomina.periodo_pago,
          aplicar_auxilio_transporte: nuevaNomina.aplicar_auxilio_transporte || null
        }, token);
        
        showAlert(`Nómina generada: ${resultado.exitosos} exitosos, ${resultado.errores} errores`, 'info');
        const payrollsData = await getPayrolls(token);
        setPayrolls(payrollsData);
        setNuevaNomina({
          id_empleado: '',
          periodo_pago: '',
          aplicar_auxilio_transporte: null,
          observaciones: ''
        });
      } catch (err) {
        console.error(err);
        showAlert(err?.response?.data?.error || 'Error al generar nómina', 'error');
      }
    } else {
      if (!nuevaNomina.id_empleado || !nuevaNomina.periodo_pago) {
        return showAlert('Empleado y fecha del período son obligatorios', 'warning');
      }
      
      const confirmed = await showConfirm('¿Estás seguro que deseas generar el registro de nómina?', 'Confirmar generación');
      if (!confirmed) return;
      
      try {
        await generatePayroll({
          id_empleado: parseInt(nuevaNomina.id_empleado),
          periodo_pago: nuevaNomina.periodo_pago,
          aplicar_auxilio_transporte: nuevaNomina.aplicar_auxilio_transporte || null,
          observaciones: nuevaNomina.observaciones || null
        }, token);
        
        showAlert('Nómina generada exitosamente', 'success');
        const payrollsData = await getPayrolls(token);
        setPayrolls(payrollsData);
        setNuevaNomina({
          id_empleado: '',
          periodo_pago: '',
          aplicar_auxilio_transporte: null,
          observaciones: ''
        });
      } catch (err) {
        console.error(err);
        showAlert(err?.response?.data?.error || 'Error al generar nómina', 'error');
      }
    }
  };

  const handleEliminarNomina = async (id) => {
    const confirmed = await showDeleteConfirm('¿Está seguro de eliminar este registro de nómina?', 'Confirmar eliminación');
    if (!confirmed) return;
    
    try {
      const success = await deletePayroll(id, token);
      if (success) {
        const payrollsData = await getPayrolls(token);
        setPayrolls(payrollsData);
        showAlert('Registro de nómina eliminado exitosamente', 'success');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al eliminar el registro', 'error');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= empleadosPagination.totalPages) {
      setEmpleadosPagination({ ...empleadosPagination, page: newPage });
    }
  };

  const renderPagination = () => {
    const { page, totalPages } = empleadosPagination;
    const pages = [];
    
    // Calcular qué páginas mostrar
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) pages.push(1);
    if (startPage > 2) pages.push('...');
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    if (endPage < totalPages - 1) pages.push('...');
    if (endPage < totalPages) pages.push(totalPages);

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginTop: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          style={{
            padding: '0.5rem 1rem',
            background: page === 1 ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            opacity: page === 1 ? 0.6 : 1
          }}
        >
          Anterior
        </button>
        
        {pages.map((p, idx) => (
          p === '...' ? (
            <span key={`ellipsis-${idx}`} style={{ padding: '0.5rem' }}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              style={{
                padding: '0.5rem 1rem',
                background: p === page ? '#0056b3' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: p === page ? 'bold' : 'normal',
                minWidth: '40px'
              }}
            >
              {p}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          style={{
            padding: '0.5rem 1rem',
            background: page === totalPages ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            opacity: page === totalPages ? 0.6 : 1
          }}
        >
          Siguiente
        </button>
        
        <span style={{ marginLeft: '1rem', color: '#666' }}>
          Página {page} de {totalPages} ({empleadosPagination.total} empleados)
        </span>
      </div>
    );
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="panel admin-panel" style={{ maxWidth: '100%', width: '100%', padding: '1rem' }}>
      <h2>Panel del Administrador</h2>

      {/* Navbar principal: Tabs + Acciones + Búsqueda */}
      <nav style={{ 
        marginBottom: '2rem', 
        padding: '0.75rem 1.25rem',
        backgroundColor: '#343a40',
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Grupo izquierdo: Tabs de navegación + Botón Agregar */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Tabs de navegación */}
          <button
            onClick={() => setActiveTab('empleados')}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none',
              background: activeTab === 'empleados' ? '#007bff' : 'transparent',
              color: activeTab === 'empleados' ? '#fff' : '#adb5bd',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'empleados') {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.target.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'empleados') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#adb5bd';
              }
            }}
          >
            Empleados
          </button>
          <button
            onClick={() => setActiveTab('nomina')}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none',
              background: activeTab === 'nomina' ? '#007bff' : 'transparent',
              color: activeTab === 'nomina' ? '#fff' : '#adb5bd',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'nomina') {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.target.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'nomina') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#adb5bd';
              }
            }}
          >
            Nómina
          </button>

          {/* Botón Agregar Empleado (solo en tab Empleados) */}
          {activeTab === 'empleados' && (
            <button
              type="button"
              onClick={() => {
                setModoEdicion(false);
                setEmpleadoEditando(null);
                setEditarCredenciales(false);
                setNuevoEmpleado({
                  doc_type: 'CC',
                  doc_number: '',
                  nombres: '',
                  apellidos: '',
                  telefono: '',
                  cargo: '',
                  fecha_ingreso: '',
                  base_salary: '',
                  banco: '',
                  cuenta: '',
                  status: 'Activo',
                  crear_usuario: false,
                  username: '',
                  email: '',
                  password: ''
                });
                setMostrarFormularioEmpleado(true);
              }}
              style={{
                padding: '0.6rem 1.25rem',
                fontSize: '0.95rem',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                marginLeft: '0.5rem'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              ➕ Agregar Empleado
            </button>
          )}
        </div>

        {/* Grupo derecho: Búsqueda (solo en tab Empleados) */}
        {activeTab === 'empleados' && (
          <form
            onSubmit={handleSearchEmpleado}
            style={{
              display: 'flex',
              gap: '0.5rem',
              flex: '0 1 400px',
              minWidth: '250px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchEmpleado}
              onChange={(e) => setSearchEmpleado(sanitizeString(e.target.value))}
              style={{
                flex: '1',
                padding: '0.6rem 0.75rem',
                border: '1px solid #495057',
                borderRadius: '4px',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                backgroundColor: '#fff',
                color: '#333'
              }}
            />
            <button 
              type="submit" 
              style={{ 
                padding: '0.6rem 1rem',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔍 Buscar
            </button>
            {searchEmpleado && (
              <button
                type="button"
                onClick={() => {
                  setSearchEmpleado('');
                  setEmpleadosPagination({ ...empleadosPagination, page: 1 });
                  loadEmpleados(1, empleadosPagination.limit, '');
                }}
                style={{ 
                  padding: '0.6rem 1rem',
                  background: '#6c757d',
                  color: '#fff',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </form>
        )}
      </nav>

      {/* Tab de Empleados */}
      {activeTab === 'empleados' && (
        <>

          {/* Overlay de formulario de empleado (crear / editar) */}
          {mostrarFormularioEmpleado && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
              }}
              onClick={() => {
                // cerrar al hacer clic fuera del contenido
                setMostrarFormularioEmpleado(false);
                setModoEdicion(false);
                setEmpleadoEditando(null);
                setEditarCredenciales(false);
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  maxWidth: '1200px',
                  width: '95%',
                  minWidth: '320px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '2rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <h3 style={{ margin: 0 }}>
                    {modoEdicion ? '✏️ Editar Empleado' : '➕ Crear nuevo Empleado'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormularioEmpleado(false);
                      setModoEdicion(false);
                      setEmpleadoEditando(null);
                      setEditarCredenciales(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                    aria-label="Cerrar formulario"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={modoEdicion ? handleActualizarEmpleado : handleCrearEmpleado}>
                  <div className="empleado-form-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem'
                  }}>
                <div>
                  <label>Tipo de Documento *</label>
                  <select name="doc_type" value={nuevoEmpleado.doc_type} onChange={handleEmpleadoChange} required>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label>Número de Documento *</label>
                  <input
                    name="doc_number"
                    type="text"
                    value={nuevoEmpleado.doc_number}
                    onChange={handleEmpleadoChange}
                    required
                  />
                </div>
                <div>
                  <label>Nombres *</label>
                  <input
                    ref={nombreInputRef}
                    name="nombres"
                    type="text"
                    value={nuevoEmpleado.nombres}
                    onChange={handleEmpleadoChange}
                    required
                  />
                </div>
                <div>
                  <label>Apellidos *</label>
                  <input
                    name="apellidos"
                    type="text"
                    value={nuevoEmpleado.apellidos}
                    onChange={handleEmpleadoChange}
                    required
                  />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input
                    name="telefono"
                    type="text"
                    value={nuevoEmpleado.telefono}
                    onChange={handleEmpleadoChange}
                  />
                </div>
                <div>
                  <label>Cargo</label>
                  <input
                    name="cargo"
                    type="text"
                    value={nuevoEmpleado.cargo}
                    onChange={handleEmpleadoChange}
                  />
                </div>
                <div>
                  <label>Fecha de Ingreso *</label>
                  <input
                    name="fecha_ingreso"
                    type="date"
                    value={nuevoEmpleado.fecha_ingreso}
                    onChange={handleEmpleadoChange}
                    required
                  />
                </div>
                <div>
                  <label>Sueldo Básico Mensual *</label>
                  <input
                    name="base_salary"
                    type="text"
                    value={nuevoEmpleado.base_salary}
                    onChange={handleEmpleadoChange}
                    placeholder="Ej: 1.500.000"
                    required
                  />
                </div>
                <div>
                  <label>Banco</label>
                  <input
                    name="banco"
                    type="text"
                    value={nuevoEmpleado.banco}
                    onChange={handleEmpleadoChange}
                  />
                </div>
                <div>
                  <label>Número de Cuenta</label>
                  <input
                    name="cuenta"
                    type="text"
                    value={nuevoEmpleado.cuenta}
                    onChange={handleEmpleadoChange}
                  />
                </div>
                <div>
                  <label>Estado</label>
                  <select name="status" value={nuevoEmpleado.status} onChange={handleEmpleadoChange}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
                  </div>
                  
                  {!modoEdicion && (
                    <>
                      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={nuevoEmpleado.crear_usuario}
                        onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, crear_usuario: e.target.checked })}
                      />
                      <span style={{ fontWeight: '500' }}>Crear cuenta de usuario para este empleado</span>
                    </label>
                    
                    {nuevoEmpleado.crear_usuario && (
                      <div className="empleado-form-grid" style={{ marginTop: '1rem' }}>
                        <div>
                          <label>Nombre de Usuario *</label>
                          <input
                            name="username"
                            type="text"
                            value={nuevoEmpleado.username}
                            onChange={handleEmpleadoChange}
                            required
                          />
                        </div>
                        <div>
                          <label>Correo Electrónico *</label>
                          <input
                            name="email"
                            type="email"
                            value={nuevoEmpleado.email}
                            onChange={handleEmpleadoChange}
                            required
                          />
                        </div>
                        <div>
                          <label>Contraseña *</label>
                          <input
                            name="password"
                            type="password"
                            value={nuevoEmpleado.password}
                            onChange={handleEmpleadoChange}
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    )}
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                    <button type="submit" style={{ minWidth: '200px' }}>
                      {modoEdicion ? 'Guardar cambios' : 'Crear Empleado'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModoEdicion(false);
                        setEmpleadoEditando(null);
                        setNuevoEmpleado({
                          doc_type: 'CC',
                          doc_number: '',
                          nombres: '',
                          apellidos: '',
                          telefono: '',
                          cargo: '',
                          fecha_ingreso: '',
                          base_salary: '',
                          banco: '',
                          cuenta: '',
                          status: 'Activo',
                          crear_usuario: false,
                          username: '',
                          email: '',
                          password: ''
                        });
                        setEditarCredenciales(false);
                        setMostrarFormularioEmpleado(false);
                      }}
                      style={{ 
                        minWidth: '200px',
                        background: '#6c757d'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                  
                  {/* Sección de credenciales de acceso en modo edición */}
                  {modoEdicion && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          marginBottom: '1rem',
                          flexWrap: 'wrap'
                        }}
                      >
                    <input
                      type="checkbox"
                      checked={editarCredenciales}
                      onChange={(e) => setEditarCredenciales(e.target.checked)}
                    />
                    <span style={{ fontWeight: '500' }}>Editar datos de acceso (usuario, correo y/o contraseña)</span>
                      </label>

                      {editarCredenciales && (
                        <div className="empleado-form-grid" style={{ marginTop: '1rem' }}>
                      {!(empleadoEditando && (empleadoEditando.username || empleadoEditando.email || empleadoEditando.id_usuario)) && (
                        <p style={{ gridColumn: '1 / -1', margin: 0, marginBottom: '0.5rem', color: '#555', fontSize: '0.9rem' }}>
                          Para crear la cuenta de acceso de este empleado, debes indicar <strong>usuario</strong>, <strong>correo</strong> y <strong>contraseña</strong>.
                        </p>
                      )}
                      <div>
                        <label>
                          Nombre de Usuario
                          {!(empleadoEditando && (empleadoEditando.username || empleadoEditando.email || empleadoEditando.id_usuario)) && ' *'}
                        </label>
                        <input
                          name="username"
                          type="text"
                          value={nuevoEmpleado.username}
                          onChange={handleEmpleadoChange}
                          required={editarCredenciales && !(empleadoEditando && (empleadoEditando.username || empleadoEditando.email || empleadoEditando.id_usuario))}
                        />
                      </div>
                      <div>
                        <label>
                          Correo Electrónico *
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={nuevoEmpleado.email}
                          onChange={handleEmpleadoChange}
                          required={editarCredenciales}
                        />
                      </div>
                      <div>
                        <label>
                          {empleadoEditando && (empleadoEditando.username || empleadoEditando.email || empleadoEditando.id_usuario)
                            ? 'Nueva Contraseña (opcional)'
                            : 'Contraseña *'}
                        </label>
                        <input
                          name="password"
                          type="password"
                          value={nuevoEmpleado.password}
                          onChange={handleEmpleadoChange}
                          placeholder={
                            empleadoEditando && (empleadoEditando.username || empleadoEditando.email || empleadoEditando.id_usuario)
                              ? 'Dejar en blanco si no deseas cambiarla'
                              : ''
                          }
                          minLength={editarCredenciales ? 6 : undefined}
                          required={
                            editarCredenciales &&
                            !(empleadoEditando && (empleadoEditando.username || empleadoEditando.email || empleadoEditando.id_usuario))
                          }
                        />
                      </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          <section className="panel-section">
            <h3>Lista de Empleados</h3>
            {empleados.length === 0 ? (
              <p>No hay empleados registrados.</p>
            ) : (
              <>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Documento</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Cargo</th>
                        <th>Fecha Ingreso</th>
                        <th style={{ textAlign: 'right' }}>Sueldo Básico</th>
                        <th>Banco</th>
                        <th>Cuenta</th>
                        <th style={{ textAlign: 'center' }}>Estado</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleados.map(emp => (
                        <tr key={emp.id}>
                          <td>
                            {emp.doc_type}: {emp.doc_number}
                          </td>
                          <td>{emp.nombres || 'N/A'}</td>
                          <td>{emp.apellidos || 'N/A'}</td>
                          <td>{emp.cargo || 'N/A'}</td>
                          <td>
                            {emp.fecha_ingreso ? emp.fecha_ingreso.split('T')[0] : 'N/A'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {emp.base_salary ? formatCurrency(emp.base_salary) : 'N/A'}
                          </td>
                          <td>{emp.banco || 'N/A'}</td>
                          <td>{emp.cuenta || 'N/A'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              color: emp.status === 'Activo' ? '#28a745' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {emp.status || 'N/A'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={() => handleEditarEmpleado(emp)}
                              style={{ 
                                marginRight: '0.5rem',
                                background: '#007bff'
                              }}
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleEliminarEmpleado(emp)}
                              style={{ 
                                background: emp.status === 'Activo' ? '#dc3545' : '#28a745'
                              }}
                            >
                              {emp.status === 'Activo' ? 'Desactivar' : 'Activar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination()}
              </>
            )}
          </section>
        </>
      )}

      {/* Tab de Nómina */}
      {activeTab === 'nomina' && (
        <>
          <section className="panel-section">
            <h3>Generar Nómina</h3>
            <form onSubmit={handleGenerarNomina}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={generarParaTodos}
                    onChange={(e) => setGenerarParaTodos(e.target.checked)}
                    style={{ 
                      margin: 0,
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Generar para todos los empleados activos</span>
                </label>
              </div>
              
              {!generarParaTodos && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Empleado *
                  </label>
                  <select
                    name="id_empleado"
                    value={nuevaNomina.id_empleado}
                    onChange={handleNominaChange}
                    required={!generarParaTodos}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Selecciona un empleado</option>
                    {empleados.filter(e => e.status === 'Activo').map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombres} {emp.apellidos} - {emp.doc_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Período de Pago *
                </label>
                <input
                  name="periodo_pago"
                  type="date"
                  value={nuevaNomina.periodo_pago}
                  onChange={handleNominaChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    name="aplicar_auxilio_transporte"
                    checked={nuevaNomina.aplicar_auxilio_transporte === true}
                    onChange={(e) => setNuevaNomina({
                      ...nuevaNomina,
                      aplicar_auxilio_transporte: e.target.checked ? true : null
                    })}
                    style={{ 
                      margin: 0,
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Aplicar auxilio de transporte (si no se marca, se aplica automáticamente si el sueldo es menor a 2 SMMLV)</span>
                </label>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={nuevaNomina.observaciones}
                  onChange={handleNominaChange}
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                />
              </div>
              
              <button type="submit" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                Generar Nómina
              </button>
            </form>
          </section>

          {/* Búsqueda de nómina */}
          <section className="panel-section" style={{ maxWidth: '600px', width: '100%', margin: '0 auto 2rem' }}>
            <h3>Buscar en Nómina</h3>
            <input
              type="text"
              placeholder="Buscar por nombre de empleado o documento..."
              value={searchNomina}
              onChange={(e) => setSearchNomina(sanitizeString(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </section>

          <section className="panel-section">
            <h3>Historial de Nómina</h3>
            {filteredPayrolls.length === 0 ? (
              <p>No hay registros de nómina{searchNomina ? ' que coincidan con la búsqueda' : ''}.</p>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Documento</th>
                      <th>Período de Pago</th>
                      <th>Fecha Generación</th>
                      <th style={{ textAlign: 'right' }}>Total Devengado</th>
                      <th style={{ textAlign: 'right' }}>Total Deducido</th>
                      <th style={{ textAlign: 'right' }}>Neto a Pagar</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrolls.map(payroll => (
                      <tr key={payroll.id}>
                        <td>{payroll.empleado_nombre || 'N/A'}</td>
                        <td>{payroll.empleado_doc || 'N/A'}</td>
                        <td>
                          {payroll.periodo_pago ? payroll.periodo_pago.split('T')[0] : 'N/A'}
                        </td>
                        <td>
                          {new Date(payroll.fecha_generacion).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatCurrency(payroll.total_accrued)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatCurrency(payroll.total_deducted)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#007bff' }}>
                          {formatCurrency(payroll.net_pay)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedPayroll(payroll)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#007bff',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              marginRight: '0.5rem'
                            }}
                          >
                            Ver Detalles
                          </button>
                          <button
                            onClick={() => handleEliminarNomina(payroll.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Overlay de detalles de nómina */}
      {selectedPayroll && (
        <PayrollDetailsOverlay
          payroll={selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

/**
 * Componente de overlay para mostrar los detalles de la nómina
 */
const PayrollDetailsOverlay = ({ payroll, onClose, formatCurrency }) => {
  // Cerrar con ESC
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    // Prevenir scroll del body cuando el overlay está abierto
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'auto'
      }}
      onClick={(e) => {
        // Cerrar al hacer clic fuera del contenido
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del overlay */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
            Detalles de Nómina
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => generatePayrollPDF(payroll)}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                lineHeight: 1
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenido del overlay */}
        <div style={{ padding: '2rem' }}>
          {/* Información del empleado y período */}
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e0e0e0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Empleado
                </strong>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {payroll.empleado_nombre || 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Documento
                </strong>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {payroll.empleado_doc || 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Período de Pago
                </strong>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {payroll.periodo_pago ? payroll.periodo_pago.split('T')[0] : 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Fecha de Generación
                </strong>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {new Date(payroll.fecha_generacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de detalles */}
          {payroll.details && Array.isArray(payroll.details) && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.2rem' }}>
                Conceptos de Pago
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                        Concepto
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#495057' }}>
                        Cantidad
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>
                        Valor Unitario
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>
                        Devengado
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#495057' }}>
                        Deducido
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.details.map((detail, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e0e0e0',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          {detail.concept}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {detail.quantity}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {formatCurrency(detail.unitValue)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#28a745', fontWeight: '500' }}>
                          {detail.accrued > 0 ? formatCurrency(detail.accrued) : '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#dc3545', fontWeight: '500' }}>
                          {detail.deducted > 0 ? formatCurrency(detail.deducted) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totales */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '2px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '1.1rem', color: '#495057' }}>Total Devengado:</strong>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#28a745' }}>
                {formatCurrency(payroll.total_accrued)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '1.1rem', color: '#495057' }}>Total Deducido:</strong>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc3545' }}>
                {formatCurrency(payroll.total_deducted)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '2px solid #dee2e6',
              marginTop: '1rem'
            }}>
              <strong style={{ fontSize: '1.3rem', color: '#333' }}>Neto a Pagar:</strong>
              <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#007bff' }}>
                {formatCurrency(payroll.net_pay)}
              </span>
            </div>
          </div>

          {/* Observaciones */}
          {payroll.observaciones && (
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#495057' }}>
                Observaciones:
              </strong>
              <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
                {payroll.observaciones}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
