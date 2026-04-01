import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaGastos() {
    const [gastos, setGastos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();
    const [nuevoGasto, setNuevoGasto] = useState({ concepto: '', monto: '', categoria: 'General' });

    const cargarGastos = async () => {
        setCargando(true);
        try {
            const data = await api.get('/api/gastos');
            setGastos(data);
        } catch (err) {
            console.error("Error historial", err);
            notify("Error al cargar gastos", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarGastos();
    }, []);

    const manejarCambio = (e) => {
        setNuevoGasto({ ...nuevoGasto, [e.target.name]: e.target.value });
    };

    const agregarGasto = (e) => {
        e.preventDefault();
        api.post('/api/gastos', nuevoGasto)
            .then(() => {
                notify("Gasto registrado correctamente", "success");
                setNuevoGasto({ concepto: '', monto: '', categoria: 'General' });
                cargarGastos();
            })
            .catch(err => {
                console.error("Error guardando gasto", err);
                notify("Error al registrar gasto", "error");
            });
    };

    const eliminarGasto = (id) => {
        if (!confirm("¿Seguro quieres eliminar este gasto?")) return;
        api.delete(`/api/gastos/${id}`)
            .then(() => {
                notify("Gasto eliminado del sistema", "info");
                cargarGastos();
            })
            .catch(err => {
                console.error("Error eliminando gasto", err);
                notify("Error al eliminar gasto", "error");
            });
    };

    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

    if (cargando) return <LoadingSpinner mensaje="Cargando historial de gastos..." />;

    return (
        <div className="glass-panel fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Control de Gastos</h2>
                <div className="badge" style={{ backgroundColor: 'var(--danger)', fontSize: '1rem' }}>
                    Total Gastos: $ {totalGastos.toLocaleString('es-AR')}
                </div>
            </div>

            <form onSubmit={agregarGasto} className="input-group" style={{ flexWrap: 'wrap', marginBottom: '2rem' }}>
                <select name="categoria" value={nuevoGasto.categoria} onChange={manejarCambio} required style={{ flex: '1 1 150px' }}>
                    <option value="">-- Categoría --</option>
                    <option value="Mercadería">Mercadería (Insumos)</option>
                    <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                    <option value="Sueldos">Sueldos</option>
                    <option value="Alquiler">Alquiler</option>
                    <option value="Otros">Otros</option>
                </select>
                <input
                    type="text"
                    name="descripcion"
                    placeholder="Descripción (ej: Pago de Luz)"
                    value={nuevoGasto.descripcion}
                    onChange={manejarCambio}
                    required
                    style={{ flex: '2 1 250px' }}
                />
                <input
                    type="number"
                    name="monto"
                    placeholder="Monto ($)"
                    value={nuevoGasto.monto}
                    onChange={manejarCambio}
                    required
                    style={{ flex: '1 1 120px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>REGISTRAR GASTO</button>
            </form>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th className="text-right">Monto</th>
                            <th className="text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gastos.map(g => (
                            <tr key={g.id}>
                                <td>{new Date(g.fecha).toLocaleDateString()}</td>
                                <td>
                                    <span className="badge" style={{ fontSize: '0.7rem' }}>{g.categoria}</span>
                                </td>
                                <td>{g.descripcion}</td>
                                <td className="text-right" style={{ fontWeight: 'bold' }}>$ {Number(g.monto).toLocaleString('es-AR')}</td>
                                <td className="text-right">
                                    <button onClick={() => eliminarGasto(g.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>X</button>
                                </td>
                            </tr>
                        ))}
                        {gastos.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No hay gastos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
