import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { loginSchema } from '../utils/validationSchemas';
import { sanitizeText } from '../utils/dompurify';
import { useNotifications } from '../hooks/useNotifications';
import { handleError } from '../utils/errorHandler';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error: showError } = useNotifications();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    setLoading(true);
    
    // Sanitizar email antes de enviar
    const sanitizedEmail = sanitizeText(data.email).toLowerCase().trim();
    
    try {
      const res = await loginUser(sanitizedEmail, data.password);
      if (res.token) {
        login(res.user, res.token);
        success('Inicio de sesión exitoso');
        navigate('/');
      } else {
        showError(res.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      handleError(error, showError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
        <h2>Iniciar Sesión</h2>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <input
            {...register('email')}
            type="email"
            placeholder="Correo"
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
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem'
          }}
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
};

export default Login;
