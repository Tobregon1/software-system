import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaDashboard({ navegar }) {
    const [resumen, setResumen] = useState({ total: 0, cantidad: 0 });
    const [stats, setStats] = useState({
        totalVentas: 0,
        totalGastos: 0,
        porMetodo: {},
        gananciaNeta: 0,
        totalDeudaClientes: 0,
        productosBajoStock: 0,
        valorInventario: 0,
        porCategoria: {},
        topVendidos: [],
        alertasVencimiento: { vencidos: 0, proximos: 0 }
    });
    const [cerrando, setCerrando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();

    const cargarDatos = (silencioso = false) => {
        if (!silencioso) setCargando(true);
        
        api.get('/api/session-total')
            .then(setResumen)
            .catch(err => {
                console.error("Error cargando total sesión", err);
                if (!silencioso) notify("Error al cargar el resumen de sesión", "error");
            });

        api.get('/api/stats')
            .then(setStats)
            .catch(err => {
                console.error("Error cargando stats", err);
                if (!silencioso) notify("Error al cargar las estadísticas", "error");
            })
            .finally(() => {
                if (!silencioso) setCargando(false);
            });
    };

    useEffect(() => {
        cargarDatos(false);
        const intervalo = setInterval(() => cargarDatos(true), 15000); // 15 segundos, silencioso
        return () => clearInterval(intervalo);
    }, []);

    const realizarCierre = () => {
        if (!confirm("¿Desea cerrar la sesión actual y generar el reporte?")) return;
        setCerrando(true);
        api.post('/api/cierre-caja', {})
            .then(datos => {
                // Note: setReporte is not defined in the original component.
                // This line might cause an error unless `reporte` state is added.
                // Assuming `datos` might contain details for export or display.
                // If the intention was to export, the exportExcel function would need to be called here.
                // For now, faithfully applying the instruction as given.
                // setReporte(datos); 
                notify("Cierre realizado con éxito.", "success");
                cargarDatos();
            })
            .catch(err => {
                console.error("Error en cierre", err);
                notify("Error al cerrar: " + (err.response?.data?.message || err.message), "error");
            })
            .finally(() => setCerrando(false));
    };

    const exportarExcel = (detalles) => {
        if (!detalles || detalles.length === 0) return;
        const headers = ["Fecha", "Producto", "Cantidad", "Precio Unit", "Subtotal"];
        const rows = detalles.map(d => [
            new Date(d.fecha).toLocaleString('es-AR'),
            d.producto.toString().trim(),
            d.cantidad,
            d.precio_unit.toFixed(2).replace('.', ','),
            d.subtotal.toFixed(2).replace('.', ',')
        ]);
        const csvContent = "\uFEFFsep=;\n" + headers.join(";") + "\n" + rows.map(r => r.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const fechaStr = new Date().toLocaleDateString('es-AR').split('/').join('-');
        link.setAttribute("href", url);
        link.setAttribute("download", `cierre_caja_${fechaStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (cargando) return <LoadingSpinner mensaje="Analizando desempeño del negocio..." />;

    return (
        <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
            {/* Tarjetas Principales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-primary)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>GANANCIA NETA REAL</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stats.gananciaNeta >= 0 ? 'var(--accent-primary)' : 'var(--danger)', margin: '1rem 0' }}>
                        $ {stats.gananciaNeta.toLocaleString('es-AR')}
                    </div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ventas - Gastos - Costos</p>
                </div>

                <div className="glass-panel" style={{ textAlign: 'center', borderTop: '4px solid #3498db' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>VALOR DEL INVENTARIO</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3498db', margin: '1rem 0' }}>
                        $ {(stats.valorInventario || 0).toLocaleString('es-AR')}
                    </div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Capital en mercadería</p>
                </div>

                <div className="glass-panel" 
                    style={{ textAlign: 'center', borderTop: '4px solid #f39c12', cursor: 'pointer' }}
                    onClick={() => navegar('Gastos')}
                >
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>TOTAL GASTOS</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f39c12', margin: '1rem 0' }}>
                        $ {stats.totalGastos.toLocaleString('es-AR')}
                    </div>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>Ver Detalle</span>
                </div>

                <div className="glass-panel" 
                    style={{ textAlign: 'center', borderTop: '4px solid #e74c3c', background: stats.productosBajoStock > 0 ? 'rgba(231, 76, 60, 0.1)' : 'transparent', cursor: 'pointer' }}
                    onClick={() => navegar('Inventario', { soloBajoStock: true })}
                >
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>PRODUCTOS BAJO STOCK</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e74c3c', margin: '1rem 0' }}>
                        {stats.productosBajoStock}
                    </div>
                    {stats.productosBajoStock > 0 && <span style={{ fontSize: '0.7rem', color: '#e74c3c', fontWeight: 'bold' }}>⚠️ REQUIERE REPOSICIÓN</span>}
                </div>

                <div className="glass-panel" 
                    style={{ textAlign: 'center', borderTop: '4px solid #9b59b6', background: (stats.alertasVencimiento?.vencidos > 0 || stats.alertasVencimiento?.proximos > 0) ? 'rgba(155, 89, 182, 0.1)' : 'transparent', cursor: 'pointer' }}
                    onClick={() => navegar('Inventario')}
                >
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ALERTAS VENCIMIENTO</h3>
                    <div style={{ margin: '1rem 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{stats.alertasVencimiento?.vencidos || 0}</div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>VENCIDOS</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f1c40f' }}>{stats.alertasVencimiento?.proximos || 0}</div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>PRÓXIMOS</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Segunda Fila: Métodos de Pago y Caja */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="glass-panel">
                    <h3>Ventas por Método de Pago</h3>
                    <div style={{ marginTop: '2rem' }}>
                        {Object.entries(stats.porMetodo || {}).map(([metodo, monto]) => {
                            const porcentaje = (monto / stats.totalVentas) * 100;
                            return (
                                <div key={metodo} style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>{metodo}</span>
                                        <span style={{ fontWeight: 'bold' }}>$ {monto.toLocaleString('es-AR')} ({porcentaje.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${porcentaje}%`,
                                            height: '100%',
                                            background: metodo === 'Efectivo' ? 'var(--accent-primary)' : (metodo === 'Fiado' ? 'var(--danger)' : '#a29bfe'),
                                            transition: 'width 1s ease-in-out'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(stats.porMetodo || {}).length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Aún no hay ventas registradas.</p>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Caja del Turno</h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        $ {resumen.total.toLocaleString('es-AR')}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{resumen.cantidad} ventas desde el último cierre</p>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '1rem 2rem', fontSize: '1rem', width: '100%' }}
                        onClick={realizarCierre}
                        disabled={resumen.cantidad === 0 || cerrando}
                    >
                        {cerrando ? 'CERRANDO...' : 'CERRAR CAJA Y BAJAR EXCEL'}
                    </button>
                </div>
            </div>

            {/* Tercera Fila: Top Productos y Rentabilidad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="glass-panel">
                    <h3>🏆 Top 5 Productos más Vendidos</h3>
                    <div style={{ marginTop: '1.5rem' }}>
                        {(stats.topVendidos || []).map((prod, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>{idx + 1}. {prod.nombre}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{prod.cantidad} unid.</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel">
                    <h3>Rentabilidad por Categoría</h3>
                    <div style={{ marginTop: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {Object.entries(stats.porCategoria || {}).map(([cat, info]) => (
                            <div key={cat} style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                    <span>{cat}</span>
                                    <span style={{ fontWeight: 'bold' }}>Neto: $ {info.ganancia.toLocaleString('es-AR')}</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{
                                        width: `${Math.min(100, (info.ganancia / (stats.gananciaNeta || 1)) * 100)}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--accent-primary), #00d2ff)',
                                        borderRadius: '3px'
                                    }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', opacity: 0.6 }}>Ventas: $ {info.ventas.toLocaleString('es-AR')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
