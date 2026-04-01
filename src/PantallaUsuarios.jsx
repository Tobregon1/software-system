import React, { useState, useEffect } from 'react';
import api from './api';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

export default function PantallaUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [nuevoUser, setNuevoUser] = useState({ usuario: '', clave: '', nombre: '', rol: 'cajero' });
    const [cargando, setCargando] = useState(false);
    const { notify } = useNotifications();

    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            const data = await api.get('/api/usuarios');
            setUsuarios(data);
        } catch (err) {
            console.error("Error cargando usuarios", err);
            notify("Error al cargar usuarios", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const manejarCambio = (e) => {
        setNuevoUser({ ...nuevoUser, [e.target.name]: e.target.value });
    };

    const agregarUsuario = (e) => {
        e.preventDefault();
        api.post('/api/usuarios', nuevoUser)
            .then(() => {
                notify("Usuario creado con éxito", "success");
                setNuevoUser({ usuario: '', clave: '', nombre: '', rol: 'cajero' });
                cargarUsuarios();
            })
            .catch(err => {
                console.error("Error agregando usuario", err);
                notify("Error al crear usuario", "error");
            });
    };

    const eliminarUsuario = (id) => {
        if (id === 1) return notify("No se puede eliminar al administrador principal.", "warning");
        if (!confirm("¿Seguro quieres eliminar este usuario?")) return;

        api.delete(`/api/usuarios/${id}`)
            .then(() => {
                notify("Usuario revocado del sistema", "info");
                cargarUsuarios();
            })
            .catch(err => {
                console.error("Error eliminando usuario", err);
                notify("Error al eliminar usuario", "error");
            });
    };

    if (cargando) return <LoadingSpinner mensaje="Gestionando credenciales de acceso..." />;

    return (
        <div className="glass-panel fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Gestión de Personal y Accesos</h2>
                <div className="badge">{usuarios.length} Usuarios Activos</div>
            </div>

            <form onSubmit={agregarUsuario} className="glass-panel" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', marginBottom: '2.5rem', border: '1px solid var(--accent-primary)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Registrar Nuevo Usuario</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Nombre Completo</label>
                        <input type="text" name="nombre" value={nuevoUser.nombre} onChange={manejarCambio} required placeholder="Ej: Juan Pérez" />
                    </div>
                    <div className="input-group">
                        <label>Usuario (Login)</label>
                        <input type="text" name="usuario" value={nuevoUser.usuario} onChange={manejarCambio} required placeholder="juan24" />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" name="clave" value={nuevoUser.clave} onChange={manejarCambio} required placeholder="****" />
                    </div>
                    <div className="input-group">
                        <label>Rol / Permisos</label>
                        <select name="rol" value={nuevoUser.rol} onChange={manejarCambio} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px' }}>
                            <option value="cajero" style={{ color: 'black' }}>Cajero (Ventas solamente)</option>
                            <option value="admin" style={{ color: 'black' }}>Administrador (Acceso total)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '50px' }}>CREAR CUENTA</button>
                    </div>
                </div>
            </form>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Username</th>
                            <th>Rol</th>
                            <th className="text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>@{u.usuario}</td>
                                <td>
                                    <span className="badge" style={{ background: u.rol === 'admin' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)' }}>
                                        {u.rol.toUpperCase()}
                                    </span>
                                </td>
                                <td className="text-right">
                                    {u.id !== 1 && (
                                        <button onClick={() => eliminarUsuario(u.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>QUITAR ACCESO</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
