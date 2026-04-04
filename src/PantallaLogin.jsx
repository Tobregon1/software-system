import React, { useState } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';

export default function PantallaLogin({ alIngresar, config }) {
    const [usuario, setUsuario] = useState('');
    const [clave, setClave] = useState('');
    const [cargando, setCargando] = useState(false);
    const { notify } = useNotifications();

    const manejarLogin = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const user = await api.post('/api/login', { usuario, clave });
            notify(`¡Bienvenido de nuevo, ${user.usuario}!`, "success");
            alIngresar(user); 
        } catch (err) {
            console.error("Error en login", err);
            notify(err.message || "Usuario o clave incorrecta", "error");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" style={{ height: '80px', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }} />
                    ) : (
                        <img src="/logo_vertical_pillar.png" alt="PILLAR Logo" style={{ height: '120px', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }} />
                    )}
                    <h1 style={{ fontSize: '1.8rem', color: 'white' }}>{config.nombreNegocio}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Sistema de Gestión Integral</p>
                </div>

                <form onSubmit={manejarLogin} style={{ display: 'grid', gap: '1.25rem', textAlign: 'left' }}>
                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>USUARIO</label>
                        <input
                            type="text"
                            placeholder="Ingrese su usuario"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            autoFocus
                            style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>CONTRASEÑA</label>
                        <input
                            type="password"
                            placeholder="****"
                            value={clave}
                            onChange={(e) => setClave(e.target.value)}
                            required
                            style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ height: '55px', fontSize: '1.1rem', marginTop: '1rem' }}
                        disabled={cargando}
                    >
                        {cargando ? 'VALIDANDO...' : 'INICIAR SESIÓN'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                        Versión Empresarial v3.0
                    </p>
                </form>
            </div>
        </div>
    );
}
