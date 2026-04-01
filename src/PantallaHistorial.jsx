import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';
import { calcularSubtotalItem } from './utils/promo';

export default function PantallaHistorial({ onPrint, adminMode }) {
    const [ventas, setVentas] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [criterio, setCriterio] = useState('Hoy');
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();
    const [reporte, setReporte] = useState(null);
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [ventaDetalle, setVentaDetalle] = useState(null);

    const cargarVentas = async () => {
        setCargando(true);
        try {
            const data = await api.get(`/api/ventas?criterio=${criterio}`);
            setVentas(data.sort((a, b) => b.id - a.id));
        } catch (err) {
            console.error("Error cargando historial", err);
            notify("Error al obtener el historial de ventas", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarVentas();
    }, [criterio]);

    const eliminarVenta = (id) => {
        if (!adminMode) return notify("No tiene permisos para eliminar ventas.", "warning");
        if (!confirm("¿Está seguro de eliminar esta venta?")) return;
        api.delete(`/api/ventas/${id}`)
            .then(() => {
                notify("Venta eliminada exitosamente. El stock y saldos han sido revertidos.", "success");
                cargarVentas();
            })
            .catch(err => {
                console.error("Error eliminando venta", err);
                notify("Error al anular venta: " + (err.response?.data?.message || err.message), "error");
            });
    };

    const generarCierre = () => {
        if (!adminMode) return notify("Acceso restringido.", "warning");
        api.get('/api/reporte/cierre')
            .then(datos => {
                setReporte(datos);
                setMostrarReporte(true);
            })
            .catch(err => {
                console.error("Error reporte", err);
                notify("Error al generar el reporte de cierre: " + (err.response?.data?.message || err.message), "error");
            });
    };

    const ventasFiltradas = ventas.filter(v => {
        const busqueda = filtro.toLowerCase();
        if (!busqueda) return true;

        // Formatear fecha para búsqueda (ej: "26/03/2026 22:00")
        const fechaLocal = new Date(v.fecha).toLocaleString('es-AR', { hour12: false }).toLowerCase();
        
        // Nombres de todos los productos en la venta
        const nombresProductos = v.items.map(i => i.nombre.toLowerCase()).join(' ');
        
        // Atributos adicionales
        const totalVenta = v.total.toString();
        const metodo = (v.metodoPago || '').toLowerCase();
        const idVenta = v.id?.toString() || '';

        return fechaLocal.includes(busqueda) || 
               nombresProductos.includes(busqueda) || 
               totalVenta.includes(busqueda) || 
               metodo.includes(busqueda) ||
               idVenta.includes(busqueda);
    });

    if (cargando) return <LoadingSpinner mensaje="Cargando historial de operaciones..." />;

    return (
        <div className="glass-panel fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Historial de Ventas</h2>
                {adminMode && (
                    <button className="btn btn-primary" onClick={generarCierre}>
                        CIERRE DE CAJA (HOY)
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por producto, fecha, total o pago..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Periodo:</label>
                    <select 
                        value={criterio} 
                        onChange={(e) => setCriterio(e.target.value)}
                        style={{ 
                            padding: '0.8rem', 
                            borderRadius: '12px', 
                            background: 'var(--bg-color)', 
                            color: 'white', 
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="Hoy">Hoy</option>
                        <option value="Ayer">Ayer</option>
                        <option value="Semana">Última Semana</option>
                        <option value="Mes">Este Mes</option>
                        <option value="Todo">Todo el Historial</option>
                    </select>
                </div>
            </div>

            {mostrarReporte && reporte && (
                <div className="glass-panel" style={{ marginBottom: '2rem', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--accent-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>Resumen del Día</h3>
                        <button className="btn" onClick={() => setMostrarReporte(false)}>X</button>
                    </div>
                    <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)' }}>Ventas Realizadas</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reporte.cantidadVentas}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)' }}>Total Recaudado</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>${reporte.totalRecaudado.toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)' }}>Top Producto</p>
                            <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                                {Object.entries(reporte.productosMasVendidos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha y Hora</th>
                            <th>Productos</th>
                            <th className="text-right">Total</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventasFiltradas.map(v => (
                            <tr key={v.id}>
                                <td>{new Date(v.fecha).toLocaleString('es-AR', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                <td
                                    onClick={() => setVentaDetalle(v)}
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    title="Ver Detalle"
                                >
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {v.items.length} ítems: {v.items.slice(0, 2).map(i => i.nombre).join(', ')}{v.items.length > 2 ? '...' : ''}
                                    </div>
                                </td>
                                <td className="text-right" style={{ fontWeight: 600 }}>${v.total.toLocaleString('es-AR')}</td>
                                <td className="text-right">
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => onPrint(v)}
                                            className="btn"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                        >
                                            Imprimir
                                        </button>
                                        {adminMode && (
                                            <button
                                                onClick={() => eliminarVenta(v.id)}
                                                className="btn btn-danger"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                            >
                                                X
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Detalle de Venta */}
            {ventaDetalle && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3>Detalle de Venta #{ventaDetalle.id}</h3>
                            <button className="btn" onClick={() => setVentaDetalle(null)}>X</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Fecha: {new Date(ventaDetalle.fecha).toLocaleString('es-AR', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} | Pago: {ventaDetalle.metodoPago || 'Efectivo'}
                        </p>
                        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th className="text-right">Cant.</th>
                                        <th className="text-right">Precio</th>
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventaDetalle.items.map((item, i) => {
                                        const subFinal = calcularSubtotalItem(item);
                                        const baseUnit = item.precio * (1 - (item.descuento || 0) / 100);
                                        const descPromo = (baseUnit * item.cantidad) - subFinal;
                                        return (
                                        <tr key={i}>
                                            <td>
                                                <div>{item.nombre}</div>
                                                {descPromo > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Promo {item.promoRule}: -${descPromo.toLocaleString('es-AR')}</div>}
                                            </td>
                                            <td className="text-right">{item.cantidad}</td>
                                            <td className="text-right">${item.precio.toLocaleString('es-AR')}</td>
                                            <td className="text-right" style={{ fontWeight: 'bold' }}>
                                                ${subFinal.toLocaleString('es-AR')}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                TOTAL: ${ventaDetalle.total.toLocaleString('es-AR')}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
