import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaCierre({ user, alCerrarSesion }) {
    const [stats, setStats] = useState({ ventasCount: 0, porMetodo: {}, totalRegistrado: 0 });
    const [efectivoFisico, setEfectivoFisico] = useState('');
    const [notas, setNotas] = useState('');
    const [gastos, setGastos] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [filtros, setFiltros] = useState({ desde: '', hasta: '', usuarioId: '' });
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();
    const [msg, setMsg] = useState(null);

    const cargarDatos = async (aplicarFiltros = false, silencioso = false) => {
        if (!silencioso) setCargando(true);
        try {
            // Construir query string para filtros
            const params = new URLSearchParams();
            if (aplicarFiltros) {
                if (filtros.desde) params.append('desde', filtros.desde);
                if (filtros.hasta) params.append('hasta', filtros.hasta);
                if (filtros.usuarioId) params.append('usuarioId', filtros.usuarioId);
            }

            const endpoints = [
                api.get('/api/arqueo/actual'),
                user.rol === 'admin' ? api.get(`/api/arqueo/historial?${params.toString()}`) : Promise.resolve([]),
                api.get('/api/gastos/hoy')
            ];

            // Cargar usuarios solo una vez si es admin
            if (user.rol === 'admin' && usuarios.length === 0) {
                endpoints.push(api.get('/api/usuarios'));
            }

            const [dataActual, dataHistorialResult, gastosHoy, listaUsuarios] = await Promise.all(endpoints);

            setStats(dataActual);
            setGastos(gastosHoy);

            if (user.rol === 'admin') {
                setHistorial(dataHistorialResult);
                if (listaUsuarios) setUsuarios(listaUsuarios);
            }
        } catch (error) {
            console.error("Error cargando arqueos:", error);
            if (!silencioso) {
                notify('Error al cargar los datos de arqueo.', 'error');
                setMsg({ tipo: 'error', texto: 'Error al cargar los datos de arqueo.' });
            }
        } finally {
            if (!silencioso) setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos(false, false);
        const intervalo = setInterval(() => cargarDatos(false, true), 20000); // Cada 20 segs silencioso
        return () => clearInterval(intervalo);
    }, []);

    const manejarCierre = async (e) => {
        e.preventDefault();
        if (!window.confirm("¿Está seguro que desea cerrar la caja? Esta acción marcará todas las ventas actuales como cerradas.")) return;

        try {
            await api.post('/api/arqueo/cerrar', {
                efectivoFisico: Number(efectivoFisico),
                notas,
                usuarioId: user.id
            });

            setMsg({ tipo: 'success', texto: '¡Cierre de caja realizado con éxito!' });
            setEfectivoFisico('');
            setNotas('');
            cargarDatos();
        } catch (error) {
            setMsg({ tipo: 'error', texto: 'Error al realizar el cierre: ' + error.message });
        }
    };

    const limpiarFiltros = () => {
        setFiltros({ desde: '', hasta: '', usuarioId: '' });
        // Forzamos la carga sin filtros ignorando el estado actual que aún no se actualizó
        cargarDatos(false);
    };

    const efectivoRegistrado = stats.porMetodo['Efectivo'] || 0;
    const diferencia = Number(efectivoFisico) - efectivoRegistrado;

    if (cargando && historial.length === 0 && stats.totalRegistrado === 0) return <div className="loading-state">Cargando datos de caja...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Control de Caja y Cierre de Turno
            </h2>

            {msg && (
                <div className={`alert alert-${msg.tipo}`} style={{ marginBottom: '1.5rem' }}>
                    {msg.texto}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Panel de Ventas Actuales */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.8 }}>Ventas en este Turno</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                            <span>Total Ventas:</span>
                            <span style={{ fontWeight: 'bold' }}>{stats.ventasCount}</span>
                        </div>
                        {Object.entries(stats.porMetodo).map(([metodo, total]) => (
                            <div key={metodo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>{metodo}:</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid var(--accent-primary)' }}>
                            <span style={{ fontWeight: 'bold' }}>TOTAL REGISTRADO:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                                ${stats.totalRegistrado.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formulario de Arqueo */}
                <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--accent-primary)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Realizar Arqueo</h3>
                    <form onSubmit={manejarCierre} style={{ display: 'grid', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Efectivo Físico en Caja</label>
                            <input
                                type="number"
                                value={efectivoFisico}
                                onChange={(e) => setEfectivoFisico(e.target.value)}
                                placeholder="Ingrese el monto físico..."
                                required
                                style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}
                            />
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid' + (diferencia === 0 ? 'var(--accent-primary)' : diferencia > 0 ? '#4ade80' : '#f87171') }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Diferencia (Sobrante/Faltante):</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: diferencia === 0 ? 'white' : diferencia > 0 ? '#4ade80' : '#f87171' }}>
                                {diferencia > 0 ? '+' : ''}{diferencia.toLocaleString()}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Notas de Cierre</label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Opcional: novedades del turno..."
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px', color: 'white', minHeight: '60px' }}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ height: '50px' }}>
                            CERRAR CAJA Y TURNO
                        </button>
                    </form>
                </div>
            </div>

            {/* Historial (Solo Admin) */}
            {user.rol === 'admin' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', opacity: 0.8, margin: 0 }}>Historial de Arqueos</h3>
                        
                        {/* BARRA DE FILTROS */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.7rem' }}>Desde</label>
                                <input type="date" value={filtros.desde} onChange={e => setFiltros({...filtros, desde: e.target.value})} style={{ padding: '0.3rem', fontSize: '0.8rem' }} />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.7rem' }}>Hasta</label>
                                <input type="date" value={filtros.hasta} onChange={e => setFiltros({...filtros, hasta: e.target.value})} style={{ padding: '0.3rem', fontSize: '0.8rem' }} />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.7rem' }}>Usuario</label>
                                <select 
                                    value={filtros.usuarioId} 
                                    onChange={e => setFiltros({...filtros, usuarioId: e.target.value})}
                                    style={{ padding: '0.3rem', fontSize: '0.8rem', background: 'rgba(30, 41, 59, 1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                                >
                                    <option value="" style={{ background: '#1e293b', color: 'white' }}>Todos</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id} style={{ background: '#1e293b', color: 'white' }}>{u.nombre || u.usuario}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={() => cargarDatos(true)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>FILTRAR</button>
                            <button onClick={limpiarFiltros} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: 'white' }}>LIMPIAR</button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                                    <th style={{ padding: '0.75rem' }}>Usuario</th>
                                    <th style={{ padding: '0.75rem' }}>Registrado</th>
                                    <th style={{ padding: '0.75rem' }}>Físico</th>
                                    <th style={{ padding: '0.75rem' }}>Diferencia</th>
                                    <th style={{ padding: '0.75rem' }}>Total General</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No se encontraron registros.</td>
                                    </tr>
                                ) : historial.map(arq => (
                                    <tr key={arq.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                                            {new Date(arq.fecha).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{arq.nombreUsuario}</td>
                                        <td style={{ padding: '0.75rem' }}>${arq.efectivoRegistrado.toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>${arq.efectivoFisico.toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem', color: arq.diferencia === 0 ? 'white' : arq.diferencia > 0 ? '#4ade80' : '#f87171' }}>
                                            {arq.diferencia > 0 ? '+' : ''}{arq.diferencia.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>${arq.totalGeneral.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
