import React from 'react';
import { calcularPrecioEfectivo, calcularSubtotalItem } from '../utils/promo';

const CarritoVentas = ({ carrito, actualizarCantidad, quitarDelCarrito }) => {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Stock</th>
                        <th>Cantidad</th>
                        <th className="text-right">Precio Unit.</th>
                        <th className="text-right">IVA %</th>
                        <th className="text-right">Total Parcial</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {carrito.map(item => (
                        <tr key={item.id}>
                            <td>
                                <div>{item.nombre}</div>
                                {item.stock <= (item.stockMinimo || 5) && (
                                    <div style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 'bold' }}>STOCK CRÍTICO: {item.stock}</div>
                                )}
                                {item.fechaVencimiento && (() => {
                                    const fv = new Date(item.fechaVencimiento);
                                    const hoy = new Date();
                                    if (fv <= hoy) return <div style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 'bold' }}>PRODUCTO VENCIDO ({item.fechaVencimiento})</div>;
                                    const proximo = new Date();
                                    proximo.setDate(hoy.getDate() + 7);
                                    if (fv <= proximo) return <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 'bold' }}>VENCE EL {item.fechaVencimiento}</div>;
                                    return null;
                                })()}
                            </td>
                            <td>
                                <span style={{ color: item.stock <= 5 ? 'var(--danger)' : 'inherit' }}>
                                    {item.stock}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => actualizarCantidad(item.id, -1)}>-</button>
                                    <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 'bold' }}>{item.cantidad}</span>
                                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => actualizarCantidad(item.id, 1)}>+</button>
                                </div>
                            </td>
                            <td className="text-right">
                                    {item.descuento > 0 ? (
                                        <>
                                            <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.8rem', marginRight: '5px' }}>
                                                ${item.precio.toLocaleString('es-AR')}
                                            </span>
                                            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                                ${calcularPrecioEfectivo(item.precio, item.descuento).toLocaleString('es-AR')}
                                            </span>
                                        </>
                                    ) : (
                                        `$${item.precio.toLocaleString('es-AR')}`
                                    )}
                            </td>
                            <td className="text-right" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {item.iva || 0}%
                            </td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>
                                {`$${calcularSubtotalItem(item).toLocaleString('es-AR')}`}
                            </td>
                            <td className="text-right">
                                <button className="btn btn-danger" onClick={() => quitarDelCarrito(item.id)}>X</button>
                            </td>
                        </tr>
                    ))}
                    {carrito.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                                El carrito está vacío. Empiece a escanear productos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CarritoVentas;
