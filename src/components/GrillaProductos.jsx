import React from 'react';

const GrillaProductos = ({ productos, alClick, categoriaSeleccionada }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '2rem',
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '0.5rem'
        }}>
            {productos
                .filter(p => categoriaSeleccionada === 'Todas' || p.categoria === categoriaSeleccionada)
                .map(p => (
                    <div
                        key={p.id}
                        onClick={() => alClick(p)}
                        className="glass-panel"
                        style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'transform 0.1s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.imagenUrl ? <img src={p.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}
                        </div>
                        <div style={{ fontWeight: 'bold' }}>{p.nombre}</div>
                        {p.promoRule && <div className="badge" style={{ fontSize: '0.6rem', background: 'var(--accent-primary)', marginBottom: '2px' }}>PROMO {p.promoRule}</div>}

                        {p.fechaVencimiento && (() => {
                            const fv = new Date(p.fechaVencimiento);
                            const hoy = new Date();
                            const proximo = new Date();
                            proximo.setDate(hoy.getDate() + 7);
                            if (fv <= hoy) return <div style={{ fontSize: '0.6rem', color: 'var(--danger)', fontWeight: 'bold' }}>VENCIDO</div>;
                            if (fv <= proximo) return <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 'bold' }}>VENCE PRONTO</div>;
                            return null;
                        })()}
                        <div style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                            ${Number(p.precio * (1 - (p.descuento || 0) / 100)).toLocaleString('es-AR')}
                        </div>
                    </div>
                ))
            }
        </div>
    );
};

export default GrillaProductos;
