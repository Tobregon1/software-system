import React from 'react';

const ModalQR = ({ show, onClose, onConfirm, total, config, ventaTemporal }) => {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem', border: '2px solid var(--accent-primary)' }}>
                <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>COBRO CON QR</h2>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'inline-block' }}>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Entidad: ${config.nombreNegocio}\nAlias/CBU: ${config.qrAlias}\nMonto: $${total}`)}`}
                        alt="QR de Pago"
                        style={{ width: '200px', height: '200px' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem', textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Alias / CBU:</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{config.qrAlias}</p>
                    <div style={{ height: '10px' }}></div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Monto Final:</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--accent-primary)' }}>${total.toLocaleString('es-AR')}</p>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={() => onConfirm(ventaTemporal)}>
                        YA PAGÓ (CONFIRMAR VENTA)
                    </button>
                    <button className="btn btn-danger" onClick={onClose}>
                        CANCELAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalQR;
