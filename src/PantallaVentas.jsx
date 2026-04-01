import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import SelectorCategorias from './components/SelectorCategorias';
import GrillaProductos from './components/GrillaProductos';
import ModalQR from './components/ModalQR';
import CarritoVentas from './components/CarritoVentas';
import { useNotifications } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';
import { calcularTotalCarrito } from './utils/promo';

export default function PantallaVentas({ onPrint, config }) {
    const [productosDB, setProductosDB] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [total, setTotal] = useState(0);
    const [codigoIngresado, setCodigoIngresado] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [clienteId, setClienteId] = useState('');
    const [usarPuntos, setUsarPuntos] = useState(false);
    const [descuentoPuntos, setDescuentoPuntos] = useState(0);
    const [montoRecibido, setMontoRecibido] = useState('');
    const [mostrarModalQR, setMostrarModalQR] = useState(false);
    const [ventaTemporal, setVentaTemporal] = useState(null);
    const [cargando, setCargando] = useState(true);
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
            notify("Error al sincronizar datos con el servidor", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        const escucharVenta = () => procesarCobro();
        window.addEventListener('procesar-venta', escucharVenta);
        return () => window.removeEventListener('procesar-venta', escucharVenta);
    }, [carrito, total, metodoPago, clienteId, usarPuntos, descuentoPuntos, clientes, productosDB]);

    useEffect(() => {
        setTotal(calcularTotalCarrito(carrito));
    }, [carrito]);

    const manejarIngreso = (e) => {
        e.preventDefault();
        const codigo = codigoIngresado.trim();
        if (!codigo) return;

        const producto = productosDB.find(p => 
            p.codigo === codigo || 
            p.codigoInterno?.toString() === codigo || 
            p.nombre.toLowerCase().includes(codigo.toLowerCase())
        );

        if (producto) {
            if (producto.stock <= 0) {
                notify(`¡${producto.nombre} no tiene stock disponible!`, "error");
                setCodigoIngresado('');
                return;
            }

            const enCarrito = carrito.find(item => item.id === producto.id);
            if (enCarrito) {
                setCarrito(carrito.map(item =>
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                ));
            } else {
                let cantInicial = 1;
                if (producto.promoRule && producto.promoRule.toLowerCase().includes('x')) {
                    const [n, m] = producto.promoRule.toLowerCase().split('x').map(Number);
                    if (!isNaN(n) && !isNaN(m) && n > m) {
                        cantInicial = n;
                    }
                }
                setCarrito([...carrito, { ...producto, cantidad: cantInicial }]);
            }
        } else {
            notify(`Producto "${codigo}" no encontrado`, "info");
        }
        setCodigoIngresado('');
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

        const totalVenta = total;
        const venta = {
            items: carrito,
            total: totalVenta,
            metodoPago,
            clienteId: clienteId ? parseInt(clienteId) : null
        };

        if (metodoPago === 'QR' && config.qrAlias) {
            setVentaTemporal(venta);
            setMostrarModalQR(true);
            return;
        }

        // Si usa puntos, canjear primero
        if (usarPuntos && clienteId) {
            const clienteSel = clientes.find(c => c.id === parseInt(clienteId));
            if (clienteSel && clienteSel.puntos > 0) {
                try {
                    const data = await api.post(`/api/clientes/${clienteId}/canjear-puntos`, { puntos: clienteSel.puntos });
                    venta.total = Math.max(0, venta.total - (data?.descuento || 0));
                } catch (err) {
                    console.error('Error canjeando puntos', err);
                }
            }
        }

        enviarVentaAlBackend(venta);
    };

    const enviarVentaAlBackend = (venta) => {
        api.post('/api/ventas', venta)
            .then((datos) => {
                notify(`¡Venta procesada con éxito! Total: $${venta.total.toLocaleString('es-AR')}`, "success");
                setCarrito([]);
                setMostrarModalQR(false);
                setVentaTemporal(null);
                setMontoRecibido('');
                setUsarPuntos(false);
                setDescuentoPuntos(0);
                cargarDatos();

                if (confirm("¿Desea imprimir el ticket?")) {
                    onPrint(datos);
                }
            })
            .catch(err => {
                console.error("Error al cobrar", err);
                notify("Error al cobrar: " + err.message, "error");
            });
    };

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');

    const categorias = ['Todas', ...new Set(productosDB.map(p => p.categoria || 'General'))];

    if (cargando) return <LoadingSpinner mensaje="Sincronizando productos y clientes..." />;

    return (
        <div className="glass-panel fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Punto de Venta</h2>
                <div className="badge">{productosDB.length} Productos en sistema</div>
            </div>

            <SelectorCategorias 
                categorias={categorias} 
                seleccionada={categoriaSeleccionada} 
                alSeleccionar={setCategoriaSeleccionada} 
            />

            <form onSubmit={manejarIngreso} className="input-group">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escanee o ingrese código/nombre..."
                    value={codigoIngresado}
                    onChange={(e) => setCodigoIngresado(e.target.value)}
                    autoFocus
                />
                <button type="submit" className="btn btn-primary">BUSCAR</button>
            </form>

            <GrillaProductos 
                productos={productosDB} 
                categoriaSeleccionada={categoriaSeleccionada} 
                alClick={(p) => {
                    const enCarrito = carrito.find(item => item.id === p.id);
                    if (enCarrito) {
                        setCarrito(carrito.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item));
                    } else {
                        let cantInicial = 1;
                        if (p.promoRule && p.promoRule.toLowerCase().includes('x')) {
                            const [n, m] = p.promoRule.toLowerCase().split('x').map(Number);
                            if (!isNaN(n) && !isNaN(m) && n > m) {
                                cantInicial = n;
                            }
                        }
                        setCarrito([...carrito, { ...p, cantidad: cantInicial }]);
                    }
                }} 
            />

            <CarritoVentas 
                carrito={carrito} 
                actualizarCantidad={actualizarCantidad} 
                quitarDelCarrito={quitarDelCarrito} 
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: '1' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Método de Pago:</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['Efectivo', 'Tarjeta', 'QR', 'Fiado'].map(metodo => (
                                <button
                                    key={metodo}
                                    onClick={() => setMetodoPago(metodo)}
                                    className={`btn ${metodoPago === metodo ? 'btn-primary' : ''}`}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9rem',
                                        backgroundColor: metodoPago === metodo ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                >
                                    {metodo === 'Efectivo' && '💵 '}
                                    {metodo === 'Tarjeta' && '💳 '}
                                    {metodo === 'QR' && '📱 '}
                                    {metodo === 'Fiado' && '👤 '}
                                    {metodo === 'Fiado' ? 'Cuenta Corriente' : metodo}
                                </button>
                            ))}
                        </div>
                    </div>

                    {metodoPago === 'Fiado' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Seleccionar Cliente:</label>
                             <select
                                 value={clienteId}
                                 onChange={(e) => { setClienteId(e.target.value); setUsarPuntos(false); setDescuentoPuntos(0); }}
                                 style={{ padding: '0.5rem', borderRadius: '8px', flex: 1, cursor: 'pointer' }}
                             >
                                 <option value="">-- Elegir Cliente --</option>
                                 {clientes.map(c => (
                                     <option key={c.id} value={c.id}>
                                         {c.nombre} (Saldo: ${c.saldo})
                                     </option>
                                 ))}
                             </select>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>

                    {/* Calculador de Vuelto */}
                    {metodoPago === 'Efectivo' && carrito.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>El cliente pagó con:</label>
                            <input
                                type="number"
                                placeholder="$ Monto recibido"
                                value={montoRecibido}
                                onChange={(e) => setMontoRecibido(e.target.value)}
                                style={{ fontSize: '1.2rem', fontWeight: 'bold', padding: '0.5rem', textAlign: 'center' }}
                            />
                            {montoRecibido && (
                                <div style={{ textAlign: 'center', padding: '0.4rem', borderRadius: '8px', background: (Number(montoRecibido) - total) >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>VUELTO:</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (Number(montoRecibido) - total) >= 0 ? 'var(--accent-primary)' : 'var(--danger)' }}>
                                        $ {(Number(montoRecibido) - total).toLocaleString('es-AR')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-right">
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total a cobrar:</p>
                        <div className="total-display">$ {total.toLocaleString('es-AR')}</div>
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '1.5rem 3rem', fontSize: '1.25rem' }}
                        onClick={procesarCobro}
                        disabled={carrito.length === 0 || (metodoPago === 'Fiado' && !clienteId)}
                    >
                        PROCESAR COBRO (Enter)
                    </button>
                </div>
            </div>

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