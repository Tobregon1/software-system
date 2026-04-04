import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import SelectorCategorias from './components/SelectorCategorias';
import GrillaProductos from './components/GrillaProductos';
import ModalQR from './components/ModalQR';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';
import { calcularTotalCarrito, calcularSubtotalItem, calcularPrecioEfectivo } from './utils/promo';
import './POS.css';

export default function PantallaPOS({ onPrint, config, user }) {
    const [productosDB, setProductosDB] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [total, setTotal] = useState(0);
    const [codigoIngresado, setCodigoIngresado] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [clienteId, setClienteId] = useState('');
    const [montoRecibido, setMontoRecibido] = useState('');
    const [mostrarModalQR, setMostrarModalQR] = useState(false);
    const [ventaTemporal, setVentaTemporal] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    
    const { notify } = useNotifications();
    const inputRef = useRef(null);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [prods, clis] = await Promise.all([
                api.get('/api/productos'),
                api.get('/api/clientes')
            ]);
            setProductosDB(prods);
            setClientes(clis);
        } catch (err) {
            console.error("Error cargando datos", err);
            notify("Error al sincronizar datos", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        setTotal(calcularTotalCarrito(carrito));
    }, [carrito]);

    // Autofocus logic
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
                inputRef.current?.focus();
            }
        }, 500);
        return () => clearInterval(timer);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                procesarCobro();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                if (confirm("¿Vaciar carrito actual?")) setCarrito([]);
            }
            if (e.key === 'F4') {
                e.preventDefault();
                // Focus cliente select if needed
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [carrito, total, metodoPago, clienteId]);

    const manejarIngreso = (e) => {
        e.preventDefault();
        let codigo = codigoIngresado.trim();
        if (!codigo) return;

        // Soporte para QR: Si es una URL o cadena larga, intentamos extraer el código
        if (codigo.startsWith('http') || codigo.length > 20) {
            try {
                // Si es URL
                if (codigo.startsWith('http')) {
                    const url = new URL(codigo);
                    codigo = url.searchParams.get('id') || url.searchParams.get('code') || url.pathname.split('/').pop();
                } 
                // Si es un código largo con separadores (ej: 000201... o BIT:123)
                else if (codigo.includes(':')) {
                    codigo = codigo.split(':').pop();
                }
                // Si tiene muchos ceros iniciales (común en algunos escaneos)
                codigo = codigo.replace(/^0+/, '');
            } catch (e) { }
        }

        const producto = productosDB.find(p => 
            p.codigo === codigo || 
            p.codigoInterno?.toString() === codigo || 
            p.nombre.toLowerCase().includes(codigo.toLowerCase())
        );

        if (producto) {
            if (producto.stock <= 0) {
                notify(`¡${producto.nombre} sin stock!`, "error");
                setCodigoIngresado('');
                return;
            }
            agregarAlCarrito(producto);
        } else {
            notify(`Producto no encontrado`, "info");
        }
        setCodigoIngresado('');
    };

    const agregarAlCarrito = (producto) => {
        const enCarrito = carrito.find(item => item.id === producto.id);
        if (enCarrito) {
            setCarrito(carrito.map(item =>
                item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
            ));
        } else {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        }
    };

    const actualizarCantidad = (id, delta) => {
        setCarrito(carrito.map(item => {
            if (item.id === id) {
                const nuevaCant = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: nuevaCant };
            }
            return item;
        }));
    };

    const quitarDelCarrito = (id) => {
        setCarrito(carrito.filter(item => item.id !== id));
    };

    const procesarCobro = async () => {
        if (carrito.length === 0) return;

        const venta = {
            items: carrito,
            total,
            metodoPago,
            clienteId: clienteId ? parseInt(clienteId) : null
        };

        if (metodoPago === 'QR' && config.qrAlias) {
            setVentaTemporal(venta);
            setMostrarModalQR(true);
            return;
        }

        enviarVentaAlBackend(venta);
    };

    const enviarVentaAlBackend = (venta) => {
        api.post('/api/ventas', venta)
            .then((datos) => {
                notify("Venta procesada con éxito", "success");
                setCarrito([]);
                setMostrarModalQR(false);
                setVentaTemporal(null);
                setMontoRecibido('');
                cargarDatos();
                if (confirm("¿Imprimir ticket?")) onPrint(datos);
            })
            .catch(err => {
                notify("Error al cobrar: " + err.message, "error");
            });
    };

    if (cargando) return <LoadingSpinner mensaje="Iniciando Punto de Venta..." />;

    const categorias = ['Todas', ...new Set(productosDB.map(p => p.categoria || 'General'))];

    return (
        <div className="pos-container fade-in">
            <div className="pos-main">
                <header className="pos-nav-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/icon_pillar.png" alt="Logo" style={{ height: '50px', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }} />
                        <div>
                            <h1 style={{ marginBottom: '0.25rem', fontSize: '1.8rem' }}>MODO CAJA</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Operador: <strong>{user?.nombre || 'Usuario'}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="badge">{productosDB.length} productos sincronizados</div>
                </header>

                <form onSubmit={manejarIngreso} className="input-group">
                    <input
                        ref={inputRef}
                        className="pos-search-input"
                        type="text"
                        placeholder="Escanea un producto o busca por nombre..."
                        value={codigoIngresado}
                        onChange={(e) => setCodigoIngresado(e.target.value)}
                        autoFocus
                    />
                </form>

                <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <SelectorCategorias 
                        categorias={categorias} 
                        seleccionada={categoriaSeleccionada} 
                        alSeleccionar={setCategoriaSeleccionada} 
                    />
                    <div style={{ flexGrow: 1, overflowY: 'auto', marginTop: '1rem' }}>
                        <GrillaProductos 
                            productos={productosDB} 
                            categoriaSeleccionada={categoriaSeleccionada} 
                            alClick={agregarAlCarrito} 
                        />
                    </div>
                </div>
            </div>

            <aside className="pos-sidebar">
                <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
                    CARRITO <span className="badge">{carrito.length} ítems</span>
                </h3>

                <div className="pos-cart-list">
                    {carrito.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                            Esperando productos...
                        </div>
                    ) : (
                        carrito.map(item => (
                            <div key={item.id} className="pos-item-row">
                                <div style={{ flexGrow: 1 }}>
                                    <div style={{ fontWeight: '600' }}>{item.nombre}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {item.cantidad} x ${item.precio.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        ${calcularSubtotalItem(item).toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        <button className="btn btn-danger" style={{ padding: '2px 8px' }} onClick={() => actualizarCantidad(item.id, -1)}>-</button>
                                        <button className="btn btn-primary" style={{ padding: '2px 8px' }} onClick={() => actualizarCantidad(item.id, 1)}>+</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pos-total-card">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>TOTAL A PAGAR</p>
                    <div className="pos-big-total">$ {total.toLocaleString('es-AR')}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    <select 
                        value={metodoPago} 
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center' }}
                    >
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Tarjeta">💳 Tarjeta</option>
                        <option value="QR">📱 QR</option>
                        <option value="Fiado">👤 Fiado</option>
                    </select>

                    {metodoPago === 'Fiado' ? (
                        <select
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                        >
                            <option value="">Cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    ) : (
                        <input 
                            type="number" 
                            placeholder="Paga con..."
                            value={montoRecibido}
                            onChange={(e) => setMontoRecibido(e.target.value)}
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    )}
                </div>

                {montoRecibido && !isNaN(montoRecibido) && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Vuelto: </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                            $ {(Number(montoRecibido) - total).toLocaleString()}
                        </span>
                    </div>
                )}

                <button 
                    className="btn btn-primary pos-btn-checkout"
                    onClick={procesarCobro}
                    disabled={carrito.length === 0 || (metodoPago === 'Fiado' && !clienteId)}
                >
                    COBRAR <span className="shortcut-hint" style={{ background: 'var(--accent-primary)', color: 'white' }}>F2</span>
                </button>
                <button 
                    className="btn btn-danger" 
                    style={{ width: '100%', marginTop: '0.5rem', opacity: 0.9, fontWeight: 'bold' }}
                    onClick={() => { if(confirm("¿Vaciar?")) setCarrito([]); }}
                >
                    VACIAR <span className="shortcut-hint" style={{ background: '#f87171', color: 'white' }}>ESC</span>
                </button>
            </aside>

            <ModalQR 
                show={mostrarModalQR}
                onClose={() => { setMostrarModalQR(false); setVentaTemporal(null); }}
                onConfirm={enviarVentaAlBackend}
                total={total}
                config={config}
                ventaTemporal={ventaTemporal}
            />
        </div>
    );
}
