import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>404 - Página no encontrada</h1>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <Link to="/">
        <button style={{ marginTop: '1rem' }}>Volver al inicio</button>
      </Link>
    </main>
  );
};

export default NotFound;
