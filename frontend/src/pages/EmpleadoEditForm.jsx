import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const EmpleadoEditForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', salario: '' });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchEmpleado = async () => {
      try {
        const res = await api.get(`/empleados`);
        const emp = res.data.find(e => e.id === parseInt(id));
        if (!emp) throw new Error('Empleado no encontrado');
        setForm({ nombre: emp.nombre, salario: emp.salario });
      } catch (error) {
        console.error(error);
        setMensaje('No se pudo cargar el empleado');
      } finally {
        setCargando(false);
      }
    };
    fetchEmpleado();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/empleados/${id}`, {
        nombre: form.nombre,
        salario: parseFloat(form.salario),
      });
      setMensaje('Empleado actualizado con éxito');
      setTimeout(() => navigate('/admin'), 1500); // redirige al panel admin
    } catch (error) {
      console.error(error);
      setMensaje('Error al actualizar el empleado');
    }
  };

  if (cargando) return <p>Cargando empleado...</p>;

  return (
    <div className="panel">
      <h2>Editar Empleado</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <label htmlFor="salario">Salario</label>
        <input
          id="salario"
          name="salario"
          type="number"
          value={form.salario}
          onChange={handleChange}
          required
        />

        <button type="submit">Guardar cambios</button>
      </form>

      {mensaje && <p style={{ marginTop: '1rem', color: mensaje.includes('✅') ? 'green' : 'red' }}>{mensaje}</p>}
    </div>
  );
};

export default EmpleadoEditForm;
