import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaConfiguracion({ onConfigChange }) {
    const [config, setConfig] = useState({ 
        nombreNegocio: '', 
        qrAlias: '', 
        logoUrl: '',
        direccion: '',
        telefono: '',
        mensajePie: ''
    });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const { notify } = useNotifications();

    useEffect(() => {
        const cargarConfig = async () => {
            setCargando(true);
            try {
                const data = await api.get('/api/config');
                if (data) setConfig(data);
            } catch (err) {
                console.error("Error cargando config", err);
                notify("Error al cargar configuración", "error");
            } finally {
                setCargando(false);
            }
        };
        cargarConfig();
    }, []);

    const guardar = (e) => {
        e.preventDefault();
        setGuardando(true);

        api.put('/api/config', config)
            .then(datos => {
                onConfigChange();
                notify("Configuración guardada correctamente", "success");
            })
            .catch(err => {
                console.error("Error guardando config", err);
                notify("Error al guardar los cambios", "error");
            })
            .finally(() => setGuardando(false));
    };

    if (cargando) return <LoadingSpinner mensaje="Cargando ajustes del sistema..." />;

    return (
        <div className="glass-panel fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Personalización de Marca</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Ajuste los datos que aparecerán en el sistema y en los tickets.
            </p>

            <form onSubmit={guardar} style={{ display: 'grid', gap: '1.5rem' }}>
                <div className="input-group">
                    <label>Nombre del Negocio</label>
                    <input
                        type="text"
                        value={config.nombreNegocio}
                        onChange={e => setConfig({ ...config, nombreNegocio: e.target.value })}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Dirección (opcional)</label>
                    <input
                        type="text"
                        value={config.direccion}
                        onChange={e => setConfig({ ...config, direccion: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Teléfono (opcional)</label>
                    <input
                        type="text"
                        value={config.telefono}
                        onChange={e => setConfig({ ...config, telefono: e.target.value })}
                    />
                </div>

                <div className="input-group" style={{ border: '1px solid var(--accent-primary)', padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <label style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Configuración de Pago QR</label>
                    <input
                        type="text"
                        placeholder="Tu Alias, CBU o CVU (Mercado Pago, Brubank, etc.)"
                        value={config.qrAlias || ''}
                        onChange={e => setConfig({ ...config, qrAlias: e.target.value })}
                        style={{ marginTop: '0.5rem' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        Este dato se usará para generar el código QR automáticamente al cobrar.
                    </p>
                </div>

                <div className="input-group">
                    <label>Mensaje al pie del ticket</label>
                    <textarea
                        rows="3"
                        value={config.mensajePie}
                        onChange={e => setConfig({ ...config, mensajePie: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '1rem' }}
                    disabled={guardando}
                >
                    {guardando ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
            </form>
        </div>
    );
}
