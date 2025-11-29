import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { registerSchema } from '../utils/validationSchemas';
import { sanitizeText } from '../utils/dompurify';
import { useNotifications } from '../hooks/useNotifications';
import { handleError } from '../utils/errorHandler';

const Register = () => {
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();
  const { success, error: showError } = useNotifications();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange', // Validar mientras el usuario escribe
  });

  const onSubmit = async (data) => {
    setEnviando(true);
    setMensaje('');

    // Sanitizar datos antes de enviar
    // Para nombre, solo eliminar espacios al inicio y final, mantener espacios múltiples en el medio
    // Para email, eliminar espacios y solo permitir guiones medios/bajos además de caracteres válidos
    const sanitizeEmail = (email) => {
      return email
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '') // Eliminar todos los espacios
        .replace(/[<>]/g, '') // Eliminar < y >
        .replace(/javascript:/gi, '') // Eliminar javascript:
        .replace(/on\w+=/gi, '') // Eliminar event handlers
        .replace(/[^a-zA-Z0-9@._-]/g, ''); // Solo permitir letras, números, @, punto, guión bajo y guión medio
    };
    
    const payload = {
      username: sanitizeText(data.username),
      nombre: data.nombre.trim(), // Solo trim (inicio y final), mantener espacios múltiples
      email: sanitizeEmail(data.email),
      password: data.password, // No sanitizar contraseña
      role: sanitizeText(data.role),
    };

    try {
      const res = await registerUser(payload);
      if (res.id) {
        const mensajeExito = res.message || 'Usuario creado con éxito. Redirigiendo...';
        setMensaje(mensajeExito);
        // Si el mensaje es de advertencia (empleado), no mostrar como éxito
        if (res.message && res.message.includes('administrador debe completar')) {
          // El mensaje ya se mostrará en amarillo por la lógica del color
        } else {
          success(mensajeExito);
        }
        if (res.message && !res.message.includes('administrador debe completar')) {
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        const mensajeError = res.error || '❌ Error desconocido al registrarse.';
        setMensaje(mensajeError);
        showError(mensajeError);
      }
    } catch (error) {
      console.error('Error al registrarse:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error al registrar usuario';
      setMensaje(errorMsg);
      handleError(error, showError);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <h2>Registro</h2>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <input
            {...register('nombre')}
            placeholder="Nombre completo *"
            aria-invalid={errors.nombre ? 'true' : 'false'}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ minHeight: '1.5rem', marginTop: '0.25rem' }}>
            {errors.nombre && (
              <span style={{ color: 'red', fontSize: '0.875rem', display: 'block' }}>
                {errors.nombre.message}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <input
            {...register('username')}
            placeholder="Nombre de usuario *"
            aria-invalid={errors.username ? 'true' : 'false'}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ minHeight: '1.5rem', marginTop: '0.25rem' }}>
            {errors.username && (
              <span style={{ color: 'red', fontSize: '0.875rem', display: 'block' }}>
                {errors.username.message}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <input
            {...register('email')}
            type="email"
            placeholder="Correo electrónico *"
            aria-invalid={errors.email ? 'true' : 'false'}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ minHeight: '1.5rem', marginTop: '0.25rem' }}>
            {errors.email && (
              <span style={{ color: 'red', fontSize: '0.875rem', display: 'block' }}>
                {errors.email.message}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <input
            {...register('password')}
            type="password"
            placeholder="Contraseña"
            aria-invalid={errors.password ? 'true' : 'false'}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ minHeight: '1.5rem', marginTop: '0.25rem' }}>
            {errors.password && (
              <span style={{ color: 'red', fontSize: '0.875rem', display: 'block' }}>
                {errors.password.message}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <select 
            {...register('role')} 
            aria-invalid={errors.role ? 'true' : 'false'}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
              backgroundColor: '#fff'
            }}
          >
            <option value="empleado">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
          <div style={{ minHeight: '1.5rem', marginTop: '0.25rem' }}>
            {errors.role && (
              <span style={{ color: 'red', fontSize: '0.875rem', display: 'block' }}>
                {errors.role.message}
              </span>
            )}
          </div>
        </div>

        {mensaje && (
          <div style={{ 
            width: '100%', 
            padding: '0.75rem', 
            marginBottom: '1rem',
            borderRadius: '4px',
            backgroundColor: mensaje.includes('éxito') || mensaje.includes('exitosamente') || mensaje.includes('Redirigiendo') ? '#d4edda' : '#fff3cd',
            color: mensaje.includes('éxito') || mensaje.includes('exitosamente') || mensaje.includes('Redirigiendo') ? '#155724' : '#856404',
            border: `1px solid ${mensaje.includes('éxito') || mensaje.includes('exitosamente') || mensaje.includes('Redirigiendo') ? '#c3e6cb' : '#ffeaa7'}`
          }}>
            {mensaje}
          </div>
        )}

        <button 
          type="submit" 
          disabled={enviando}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: enviando ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: enviando ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem'
          }}
        >
          {enviando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </main>
  );
};

export default Register;
