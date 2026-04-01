import React from 'react';

const FormularioProducto = ({ 
    producto, 
    onChange, 
    onSubmit, 
    onCancel, 
    proveedores, 
    subirImagen, 
    titulo, 
    botonTexto,
    esEdicion = false
}) => {
    const inputStyle = {
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        color: 'white',
        width: '100%',
        fontSize: '0.95rem'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        color: 'var(--accent-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const groupStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    };

    return (
        <div className="glass-panel" style={{ 
            marginBottom: esEdicion ? 0 : '2rem', 
            border: esEdicion ? 'none' : '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1.5rem' 
        }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{titulo}</h3>
            
            <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                
                {/* Grupo 1: Información Básica */}
                <div style={groupStyle}>
                    <label style={{...labelStyle, color: '#f59e0b'}}>ID Interno (Auto)</label>
                    <input style={{...inputStyle, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 'bold'}} type="text" name="codigoInterno" value={producto.codigoInterno || ''} readOnly />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Código de Barras</label>
                    <input style={inputStyle} type="text" name="codigo" value={producto.codigo || ''} onChange={onChange} placeholder="Escanee o escriba..." />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Nombre del Producto</label>
                    <input style={inputStyle} type="text" name="nombre" value={producto.nombre || ''} onChange={onChange} required />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Categoría</label>
                    <input style={inputStyle} type="text" name="categoria" value={producto.categoria || ''} onChange={onChange} list="categorias" />
                </div>

                {/* Grupo 2: Precios */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Precio Costo</label>
                    <input style={inputStyle} type="number" step="0.01" name="precioCosto" value={producto.precioCosto || ''} onChange={onChange} />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Multiplicador (Margen)</label>
                    <input style={inputStyle} type="number" step="0.1" name="multiplicador" value={producto.multiplicador || ''} onChange={onChange} />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>IVA (%)</label>
                    <input style={inputStyle} type="number" name="iva" value={producto.iva || ''} onChange={onChange} />
                </div>
                <div style={groupStyle}>
                    <label style={{...labelStyle, color: '#10b981'}}>Precio Final ($)</label>
                    <input style={{...inputStyle, fontWeight: 'bold', border: '2px solid var(--accent-primary)'}} type="number" name="precio" value={producto.precio || ''} onChange={onChange} required />
                    
                    {/* Resumen de Rentabilidad en tiempo real */}
                    {producto.precio && producto.precioCosto && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Ganancia:</span>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>+${(producto.precio - producto.precioCosto).toLocaleString('es-AR')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Margen:</span>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{((producto.precio - producto.precioCosto) / producto.precioCosto * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grupo 3: Stock y Seguimiento */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Stock Actual</label>
                    <input style={inputStyle} type="number" name="stock" value={producto.stock || ''} onChange={onChange} />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Stock Mínimo</label>
                    <input style={inputStyle} type="number" name="stockMinimo" value={producto.stockMinimo || ''} onChange={onChange} />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Proveedor</label>
                    <select style={{...inputStyle, appearance: 'none', cursor: 'pointer'}} name="proveedorId" value={producto.proveedorId || ''} onChange={onChange}>
                        <option value="">Seleccione...</option>
                        {proveedores.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Grupo 4: Otros */}
                <div style={groupStyle}>
                    <label style={labelStyle}>Vencimiento</label>
                    <input style={inputStyle} type="date" name="fechaVencimiento" value={producto.fechaVencimiento || ''} onChange={onChange} />
                </div>
                <div style={groupStyle}>
                    <label style={labelStyle}>Regla de Promo</label>
                    <input style={inputStyle} type="text" name="promoRule" value={producto.promoRule || ''} onChange={onChange} placeholder="ej: 2x1" />
                </div>

                {/* Grupo 5: Imagen (OCUPA TODA LA FILA O MÁS ESPACIO) */}
                <div style={{ ...groupStyle, gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                    <label style={labelStyle}>Imagen del Producto</label>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <input style={{...inputStyle, padding: '0.5rem', border: 'none', background: 'transparent'}} type="file" onChange={(e) => subirImagen(e.target.files[0])} />
                        {producto.imagenUrl && (
                            <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--accent-primary)' }}>
                                <img src={producto.imagenUrl} alt="prev" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1.25rem' }}>{botonTexto}</button>
                    {onCancel && <button type="button" className="btn" onClick={onCancel} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}>CANCELAR</button>}
                </div>
            </form>
        </div>
    );
};

export default FormularioProducto;
