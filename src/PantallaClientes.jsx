import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaClientes() {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();
    const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', email: '', direccion: '', saldo: 0 });
    const [montoPago, setMontoPago] = useState({});

    const cargarClientes = async () => {
        setCargando(true);
        try {
            const data = await api.get('/api/clientes');
            setClientes(data);
        } catch (err) {
            console.error("Error historial", err);
            notify("Error al cargar clientes", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    const manejarCambioNuevo = (e) => {
        setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value });
    };

    const agregarCliente = (e) => {
        e.preventDefault();
        api.post('/api/clientes', nuevoCliente)
            .then(() => {
                notify("Cliente registrado con éxito", "success");
                setNuevoCliente({ nombre: '', telefono: '', email: '', direccion: '', saldo: 0 });
                cargarClientes();
            })
            .catch(err => {
                console.error("Error guardando cliente", err);
                notify("Error al registrar cliente", "error");
            });
    };

    const registrarPago = (id) => {
        const monto = parseFloat(montoPago[id]);
        if (!monto || monto <= 0) return notify("Ingrese un monto válido", "warning");

        api.post(`/api/clientes/${id}/pagar`, { monto })
            .then(() => {
                notify("Pago de cliente acreditado", "success");
                setMontoPago({ ...montoPago, [id]: '' });
                cargarClientes();
            })
            .catch(err => {
                console.error("Error registrando pago", err);
                notify("Error al procesar pago", "error");
            });
    };

    const eliminarCliente = (id) => {
        if (!confirm("¿Seguro quieres eliminar este cliente?")) return;
        api.delete(`/api/clientes/${id}`)
            .then(() => {
                notify("Cliente eliminado del sistema", "info");
                cargarClientes();
            })
            .catch(err => {
                console.error("Error eliminando cliente", err);
                notify("Error al eliminar cliente", "error");
            });
    };

    const deudaTotal = clientes.reduce((acc, c) => acc + (c.saldo || 0), 0);

    if (cargando) return <LoadingSpinner mensaje="Cargando base de datos de clientes..." />;

    return (
        <div className="glass-panel fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Gestión de Cuentas Corrientes</h2>
                <div className="badge" style={{ backgroundColor: 'var(--accent-primary)', fontSize: '1rem' }}>
                    Deuda Total en Calle: $ {deudaTotal.toLocaleString('es-AR')}
                </div>
            </div>

            <form onSubmit={agregarCliente} className="input-group" style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre del Cliente"
                    value={nuevoCliente.nombre}
                    onChange={manejarCambioNuevo}
                    required
                    style={{ flex: '2 1 200px' }}
                />
                <input
                    type="text"
                    name="telefono"
                    placeholder="Teléfono / WhatsApp"
                    value={nuevoCliente.telefono}
                    onChange={manejarCambioNuevo}
                    style={{ flex: '1 1 150px' }}
                />
                <button type="submit" className="btn btn-primary">REGISTRAR CLIENTE</button>
            </form>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Contacto</th>
                            <th className="text-right">Saldo Deudor</th>
                            <th className="text-right" style={{ width: '250px' }}>Registrar Pago</th>
                            <th className="text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.sort((a, b) => b.saldo - a.saldo).map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 'bold' }}>{c.nombre}</td>
                                <td>{c.telefono || '-'}</td>
                                <td className="text-right" style={{ color: c.saldo > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                                    $ {Number(c.saldo || 0).toLocaleString('es-AR')}
                                </td>
                                <td className="text-right">
                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                        <input
                                            type="number"
                                            placeholder="Monto"
                                            value={montoPago[c.id] || ''}
                                            onChange={(e) => setMontoPago({ ...montoPago, [c.id]: e.target.value })}
                                            style={{ width: '100px', padding: '0.4rem', fontSize: '0.8rem' }}
                                        />
                                        <button className="btn btn-primary" onClick={() => registrarPago(c.id)}>COBRAR</button>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <button onClick={() => eliminarCliente(c.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>X</button>
                                </td>
                            </tr>
                        ))}
                        {clientes.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No hay clientes registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
