import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'empleado') {
        navigate('/empleado');
      }
    }
  }, [user, navigate]);

  return (
    <main className="home">
      <h1>Bienvenido a HR Manager</h1>
      <p>
        Inicia sesión o regístrate para comenzar.<br />
        Accede a tu panel según tu rol (Administrador o Empleado).
      </p>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <Link to="/login">
          <button>Iniciar sesión</button>
        </Link>
        <Link to="/register">
          <button>Registrarse</button>
        </Link>
      </div>
    </main>
  );
};

export default Home;
