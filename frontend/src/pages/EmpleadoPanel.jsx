import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPayrolls } from '../services/payrollService';
import { getEmpleadoIdByUsuario } from '../services/empleadoService';
import { useNavigate } from 'react-router-dom';
import { generatePayrollPDF } from '../utils/pdfGenerator';

const EmpleadoPanel = () => {
  const { user, token } = useContext(AuthContext);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleadoId, setEmpleadoId] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'empleado') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener el ID del empleado asociado al usuario
        const id = await getEmpleadoIdByUsuario(token);
        setEmpleadoId(id);
        
        if (id) {
          // Obtener nóminas filtradas por el empleado actual
          const payrollsData = await getPayrolls(token, { id_empleado: id });
          setPayrolls(payrollsData);
        } else {
          console.warn('No se encontró un empleado asociado al usuario');
        }
      } catch (error) {
        console.error('Error al cargar nómina:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  };

  if (loading) return <p>Cargando tu nómina...</p>;

  return (
    <div className="panel admin-panel">
      <h2>Bienvenido, {user.username}</h2>

      <section className="panel-section">
        <h3>Mi Historial de Nómina</h3>
        {payrolls.length === 0 ? (
          <p>Aún no tienes registros de nómina.</p>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
                <tr>
                  <th>Período de Pago</th>
                  <th>Fecha Generación</th>
                  <th style={{ textAlign: 'right' }}>Total Devengado</th>
                  <th style={{ textAlign: 'right' }}>Total Deducido</th>
                  <th style={{ textAlign: 'right' }}>Neto a Pagar</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll.id}>
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
                          fontWeight: '500'
                        }}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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

export default EmpleadoPanel;
