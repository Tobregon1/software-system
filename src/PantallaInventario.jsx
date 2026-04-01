import React, { useState, useEffect } from 'react';
import api from './api';
import FormularioProducto from './components/FormularioProducto';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';
import { calcularPrecioFinal } from './utils/promo';

export default function PantallaInventario({ soloBajoStockInicial = false }) {
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [nuevoProducto, setNuevoProducto] = useState({
        codigo: '', codigoInterno: '', nombre: '', precio: 0, stock: '', descuento: 0, iva: 21,
        precioCosto: 0, multiplicador: 1.5, categoria: '', imagenUrl: '',
        promoRule: '', stockMinimo: 5, proveedorId: '', fechaVencimiento: ''
    });
    const [editandoId, setEditandoId] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [ordenarPor, setOrdenarPor] = useState('nombre');
    const [direccionOrden, setDireccionOrden] = useState('asc');
    const [soloBajoStock, setSoloBajoStock] = useState(soloBajoStockInicial);
    const [productoEditado, setProductoEditado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const { notify } = useNotifications();

    const toggleOrden = (columna) => {
        if (ordenarPor === columna) {
            setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenarPor(columna);
            setDireccionOrden('asc');
        }
    };

    const formatearFechaParaInput = (fechaStr) => {
        if (!fechaStr) return '';
        if (fechaStr.includes('/')) {
            const [d, m, y] = fechaStr.split('/');
            if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return fechaStr; // assume it's already YYYY-MM-DD
    };

    const subirImagen = async (file, setUrl) => {
        const formData = new FormData();
        formData.append('producto', file);
        try {
            const data = await api.upload('/api/upload-product-image', formData);
            setUrl(data.imageUrl);
            notify("Imagen subida correctamente", "success");
        } catch (err) {
            console.error("Error subiendo imagen", err);
            notify("Error al subir la imagen", "error");
        }
    };

    // Auto-cálculo para nuevo producto
    useEffect(() => {
        const costo = parseFloat(nuevoProducto.precioCosto) || 0;
        const mult = parseFloat(nuevoProducto.multiplicador) || 0;
        const iva = parseFloat(nuevoProducto.iva) || 0;
        const final = (costo * mult) * (1 + iva / 100);
        setNuevoProducto(prev => ({ ...prev, precio: final.toFixed(2) }));
    }, [nuevoProducto.precioCosto, nuevoProducto.multiplicador, nuevoProducto.iva]);

    // Auto-cálculo de precio final para nuevo producto
    useEffect(() => {
        const final = calcularPrecioFinal(nuevoProducto.precioCosto, nuevoProducto.multiplicador, nuevoProducto.iva);
        setNuevoProducto(prev => ({ ...prev, precio: final.toFixed(2) }));
    }, [nuevoProducto.precioCosto, nuevoProducto.multiplicador, nuevoProducto.iva]);

    // Auto-cálculo de precio final para producto editado
    useEffect(() => {
        if (!productoEditado) return;
        const final = calcularPrecioFinal(productoEditado.precioCosto, productoEditado.multiplicador, productoEditado.iva);
        setProductoEditado(prev => ({ ...prev, precio: final.toFixed(2) }));
    }, [productoEditado?.precioCosto, productoEditado?.multiplicador, productoEditado?.iva]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [prods, provs, next] = await Promise.all([
                api.get('/api/productos'),
                api.get('/api/proveedores'),
                api.get('/api/productos/next-id')
            ]);
            setProductos(prods);
            setProveedores(provs);
            setNuevoProducto(prev => ({ ...prev, codigoInterno: next.nextId }));
        } catch (err) {
            console.error("Error cargando datos", err);
            notify("Error al sincronizar inventario", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const manejarCambioNuevo = (e) => {
        setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
    };

    const manejarCambioEditando = (e) => {
        setProductoEditado({ ...productoEditado, [e.target.name]: e.target.value });
    };

    const agregarProducto = (e) => {
        e.preventDefault();
        api.post('/api/productos', nuevoProducto)
            .then(() => {
                notify(`¡${nuevoProducto.nombre} agregado!`, "success");
                setNuevoProducto({
                    codigo: '', codigoInterno: '', nombre: '', precio: 0, stock: '', descuento: 0, iva: 21,
                    precioCosto: 0, multiplicador: 1.5, categoria: '', imagenUrl: '',
                    promoRule: '', stockMinimo: 5, proveedorId: '', fechaVencimiento: ''
                });
                cargarDatos();
            })
            .catch(err => {
                console.error("Error agregando producto", err);
                notify("Error al agregar: " + err.message, "error");
            });
    };

    const iniciarEdicion = (p) => {
        setEditandoId(p.id);
        setProductoEditado({ ...p });
    };

    const guardarEdicion = () => {
        api.put(`/api/productos/${productoEditado.id}`, productoEditado)
            .then(() => {
                notify("Producto actualizado correctamente", "success");
                cargarDatos();
                setEditandoId(null);
                setProductoEditado(null);
            })
            .catch(err => {
                console.error("Error editando producto", err);
                notify("Error al actualizar: " + err.message, "error");
            });
    };

    const eliminarProducto = (id) => {
        if (!confirm("¿Seguro quieres eliminar este producto?")) return;
        api.delete(`/api/productos/${id}`)
            .then(() => {
                notify("Producto eliminado del inventario", "info");
                cargarDatos();
            })
            .catch(err => {
                console.error("Error eliminando producto", err);
                notify("Error al eliminar", "error");
            });
    };

    const productosMostrados = productos
        .filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
                                  (p.codigo?.toLowerCase().includes(filtro.toLowerCase())) ||
                                  (p.categoria?.toLowerCase().includes(filtro.toLowerCase()));
            
            const matchesStock = soloBajoStock ? (p.stock <= (p.stockMinimo || 0)) : true;
            
            return matchesSearch && matchesStock;
        })
        .sort((a, b) => {
            let valA = a[ordenarPor];
            let valB = b[ordenarPor];

            // Manejo de valores numéricos para ordenamiento correcto
            if (['precio', 'precioCosto', 'stock', 'stockMinimo', 'codigoInterno'].includes(ordenarPor)) {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return direccionOrden === 'asc' ? -1 : 1;
            if (valA > valB) return direccionOrden === 'asc' ? 1 : -1;
            return 0;
        });

    if (cargando) return <LoadingSpinner mensaje="Cargando inventario y proveedores..." />;

    return (
        <div className="glass-panel fade-in">
            <h2 style={{ marginBottom: '1.5rem' }}>Gestión de Inventario</h2>

            <FormularioProducto 
                producto={nuevoProducto}
                onChange={manejarCambioNuevo}
                onSubmit={agregarProducto}
                proveedores={proveedores}
                subirImagen={(file) => subirImagen(file, (url) => setNuevoProducto({ ...nuevoProducto, imagenUrl: url }))}
                titulo="Agregar Nuevo Producto"
                botonTexto="AGREGAR AL INVENTARIO"
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                <div className="input-group" style={{ margin: 0, flex: 1, maxWidth: '400px' }}>
                    <input 
                        type="text" 
                        placeholder="Buscar en el inventario..." 
                        value={filtro} 
                        onChange={(e) => setFiltro(e.target.value)} 
                    />
                </div>
                <button 
                    className={`btn ${soloBajoStock ? 'btn-danger' : ''}`}
                    onClick={() => setSoloBajoStock(!soloBajoStock)}
                    style={{ marginLeft: '1rem', border: soloBajoStock ? 'none' : '1px solid var(--danger)', color: soloBajoStock ? 'white' : 'var(--danger)', background: soloBajoStock ? 'var(--danger)' : 'transparent' }}
                >
                    {soloBajoStock ? 'MOSTRAR TODO' : '⚠️ VER BAJO STOCK'}
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => toggleOrden('codigoInterno')} style={{ cursor: 'pointer' }}>
                                ID Int. {ordenarPor === 'codigoInterno' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => toggleOrden('codigo')} style={{ cursor: 'pointer' }}>
                                Cód. {ordenarPor === 'codigo' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th>Imagen</th>
                            <th onClick={() => toggleOrden('nombre')} style={{ cursor: 'pointer' }}>
                                Nombre {ordenarPor === 'nombre' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => toggleOrden('categoria')} style={{ cursor: 'pointer' }}>
                                Categoría {ordenarPor === 'categoria' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th>Promo</th>
                            <th className="text-right" onClick={() => toggleOrden('precioCosto')} style={{ cursor: 'pointer' }}>
                                Costo {ordenarPor === 'precioCosto' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="text-right">Mult.</th>
                            <th className="text-right">IVA</th>
                            <th className="text-right" onClick={() => toggleOrden('precio')} style={{ cursor: 'pointer' }}>
                                Precio Final {ordenarPor === 'precio' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="text-right" onClick={() => toggleOrden('stock')} style={{ cursor: 'pointer' }}>
                                Stock {ordenarPor === 'stock' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="text-right" onClick={() => toggleOrden('stockMinimo')} style={{ cursor: 'pointer' }}>
                                Mín. {ordenarPor === 'stockMinimo' && (direccionOrden === 'asc' ? '▲' : '▼')}
                            </th>
                            <th>Vencimiento</th>
                            <th>Proveedor</th>
                            <th className="text-right" style={{ width: '130px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {productosMostrados.map(p => {
                            const esEditando = editandoId === p.id;
                            const bajoStock = p.stock <= (p.stockMinimo || 0);

                            return (
                                <tr key={p.id} style={{ 
                                    background: bajoStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    borderLeft: bajoStock ? '4px solid var(--danger)' : 'none'
                                }}>
                                    <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        {p.codigoInterno || '-'}
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>
                                        {esEditando ? <input type="text" name="codigo" value={productoEditado.codigo} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '100px' }} /> : p.codigo}
                                    </td>
                                    <td>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                            {p.imagenUrl ? <img src={p.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}
                                        </div>
                                    </td>
                                    <td>
                                        {esEditando ? <input type="text" name="nombre" value={productoEditado.nombre} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '150px' }} /> : p.nombre}
                                    </td>
                                    <td>
                                        {esEditando ? <input type="text" name="categoria" value={productoEditado.categoria} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '100px' }} /> : (
                                            <span className="badge" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.categoria}</span>
                                        )}
                                    </td>
                                    <td>
                                        {esEditando ? <input type="text" name="promoRule" value={productoEditado.promoRule} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '60px' }} /> : (
                                            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{p.promoRule || '-'}</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        {esEditando ? (
                                            <input type="number" step="0.01" name="precioCosto" value={productoEditado.precioCosto} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '70px' }} />
                                        ) : `$ ${Number(p.precioCosto || 0).toLocaleString('es-AR')}`}
                                    </td>
                                    <td className="text-right">
                                        {esEditando ? (
                                            <input type="number" step="0.1" name="multiplicador" value={productoEditado.multiplicador} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '50px' }} />
                                        ) : `x${p.multiplicador || 1}`}
                                    </td>
                                    <td className="text-right">
                                        {esEditando ? (
                                            <input type="number" name="iva" value={productoEditado.iva} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '50px' }} />
                                        ) : `${p.iva || 0}%`}
                                    </td>
                                    <td className="text-right" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        {esEditando ? `$ ${productoEditado.precio}` : `$ ${Number(p.precio).toLocaleString('es-AR')}`}
                                    </td>
                                    <td className="text-right">
                                        {esEditando ? (
                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                <input type="number" name="stock" value={productoEditado.stock} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '50px' }} />
                                            </div>
                                        ) : (
                                            <span className="badge" style={{ backgroundColor: p.stock <= (p.stockMinimo || 0) ? 'var(--danger)' : 'rgba(255,255,255,0.1)' }}>
                                                {p.stock || 0}
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        {esEditando ? (
                                            <input type="number" name="stockMinimo" value={productoEditado.stockMinimo} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '40px' }} />
                                        ) : p.stockMinimo}
                                    </td>
                                    <td>
                                        {esEditando ? (
                                            <input type="date" name="fechaVencimiento" value={formatearFechaParaInput(productoEditado.fechaVencimiento)} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '120px' }} />
                                        ) : (
                                            p.fechaVencimiento ? (() => {
                                                let fvStr = p.fechaVencimiento;
                                                if (fvStr.includes('/')) {
                                                    const [d, m, y] = fvStr.split('/');
                                                    fvStr = `${y}-${m}-${d}`;
                                                }
                                                const fv = new Date(fvStr + "T12:00:00Z"); // Fix TZone
                                                const hoy = new Date();
                                                const proximo = new Date();
                                                proximo.setDate(hoy.getDate() + 7);

                                                let bgColor = 'rgba(255,255,255,0.1)';
                                                let label = p.fechaVencimiento;
                                                
                                                // Reset time for comparison
                                                hoy.setHours(0,0,0,0);
                                                fv.setHours(0,0,0,0);

                                                if (fv < hoy) {
                                                    bgColor = 'var(--danger)';
                                                    label = `VENCIDO (${p.fechaVencimiento})`;
                                                } else if (fv <= proximo) {
                                                    bgColor = '#f59e0b'; // Amber
                                                    label = `PRÓXIMO (${p.fechaVencimiento})`;
                                                }

                                                return <span className="badge" style={{ backgroundColor: bgColor, fontSize: '0.7rem' }}>{label}</span>;
                                            })() : '-'
                                        )}
                                    </td>
                                    <td>
                                        {esEditando ? (
                                            <select name="proveedorId" value={productoEditado.proveedorId || ''} onChange={manejarCambioEditando} style={{ padding: '5px', fontSize: '0.8rem', width: '100px' }}>
                                                <option value="">-</option>
                                                {proveedores.map(prov => (
                                                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            proveedores.find(prov => prov.id == p.proveedorId)?.nombre || '-'
                                        )}
                                    </td>
                                    <td className="text-right">
                                        {esEditando ? (
                                            <button onClick={guardarEdicion} className="btn btn-primary" style={{ padding: '0.5rem', marginRight: '5px' }}>OK</button>
                                        ) : (
                                            <button onClick={() => iniciarEdicion(p)} className="btn btn-primary" style={{ padding: '0.5rem', marginRight: '5px', backgroundColor: 'var(--text-secondary)' }}>Edit</button>
                                        )}
                                        <button onClick={() => eliminarProducto(p.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>X</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
