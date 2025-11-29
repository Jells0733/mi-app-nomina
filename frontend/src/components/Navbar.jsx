import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/">Inicio</Link>
      {user ? (
        <>
          <span style={{ marginRight: '1rem' }}>
            Hola, {user.username} ({user.role})
          </span>
          {user.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user.role === 'empleado' && <Link to="/empleado">Mi Panel</Link>}
          <button onClick={logout} aria-label="Cerrar sesión">Cerrar sesión</button>
        </>
      ) : (
        <>
          <Link to="/login">Entrar</Link>
          <Link to="/register">Registro</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
