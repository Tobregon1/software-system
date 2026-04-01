import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaProveedores() {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();
    const [nuevoProv, setNuevoProv] = useState({ nombre: '', contacto: '', telefono: '', rubro: '' });

    const cargarProveedores = async () => {
        setCargando(true);
        try {
            const data = await api.get('/api/proveedores');
            setProveedores(data);
        } catch (err) {
            console.error("Error cargando proveedores", err);
            notify("Error al cargar proveedores", "error");
        } finally {
            setCargando(false);
        }
    };

    const cargarProductos = () => {
        api.get('/api/productos')
            .then(data => setProductos(data))
            .catch(err => console.error("Error cargando productos", err));
    };

    useEffect(() => {
        cargarProveedores();
        cargarProductos();
    }, []);

    const manejarCambio = (e) => {
        setNuevoProv({ ...nuevoProv, [e.target.name]: e.target.value });
    };

    const agregarProveedor = (e) => {
        e.preventDefault();
        api.post('/api/proveedores', nuevoProv)
            .then(() => {
                notify("Proveedor registrado correctamente", "success");
                setNuevoProv({ nombre: '', contacto: '', telefono: '', rubro: '' });
                cargarProveedores();
            })
            .catch(err => {
                console.error("Error guardando prov", err);
                notify("Error al registrar proveedor", "error");
            });
    };

    const eliminarProveedor = (id) => {
        if (!confirm("¿Seguro quieres eliminar este proveedor?")) return;
        api.delete(`/api/proveedores/${id}`)
            .then(() => {
                notify("Proveedor eliminado del sistema", "info");
                cargarProveedores();
            })
            .catch(err => {
                console.error("Error eliminando prov", err);
                notify("Error al eliminar proveedor", "error");
            });
    };

    const generarPedidoWhatsApp = (p) => {
        const prodBajoStock = productos.filter(prod =>
            prod.proveedorId == p.id &&
            Number(prod.stock || 0) <= Number(prod.stockMinimo || 5)
        );

        if (prodBajoStock.length === 0) {
            notify("No hay productos con stock bajo para este proveedor.", "info");
            return;
        }

        let mensaje = `*PEDIDO PARA ${p.nombre.toUpperCase()}*\n\nHola, necesito reponer los siguientes productos:\n`;
        prodBajoStock.forEach(item => {
            mensaje += `- ${item.nombre} (Stock actual: ${item.stock})\n`;
        });
        mensaje += `\n_Generado desde Sistema Kiosco_`;

        const tel = p.contacto.replace(/\D/g, '');
        const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    if (cargando) return <LoadingSpinner mensaje="Cargando lista de proveedores..." />;

    return (
        <div className="glass-panel fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Directorio de Proveedores</h2>
                <div className="badge" style={{ backgroundColor: 'var(--accent-primary)', fontSize: '1rem' }}>
                    {proveedores.length} Proveedores Registrados
                </div>
            </div>

            <form onSubmit={agregarProveedor} className="input-group" style={{ flexWrap: 'wrap', marginBottom: '2rem' }}>
                <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre del Proveedor (ej: Coca-Cola)"
                    value={nuevoProv.nombre}
                    onChange={manejarCambio}
                    required
                    style={{ flex: '2 1 200px' }}
                />
                <input
                    type="text"
                    name="contacto"
                    placeholder="Contacto / Teléfono"
                    value={nuevoProv.contacto}
                    onChange={manejarCambio}
                    style={{ flex: '1 1 150px' }}
                />
                <input
                    type="text"
                    name="notas"
                    placeholder="Notas (ej: Visita los Martes)"
                    value={nuevoProv.notas}
                    onChange={manejarCambio}
                    style={{ flex: '2 1 200px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>REGISTRAR PROVEEDOR</button>
            </form>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Contacto</th>
                            <th>Notas</th>
                            <th className="text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedores.map(p => (
                            <tr key={p.id}>
                                <td style={{ fontWeight: 'bold' }}>{p.nombre}</td>
                                <td>{p.contacto || '-'}</td>
                                <td style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{p.notas || '-'}</td>
                                <td className="text-right">
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => generarPedidoWhatsApp(p)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 0.8rem', backgroundColor: '#25D366', borderColor: '#25D366' }}
                                            title="Generar pedido por WhatsApp"
                                        >
                                            PEDIDO
                                        </button>
                                        <button onClick={() => eliminarProveedor(p.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>X</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {proveedores.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No hay proveedores registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
