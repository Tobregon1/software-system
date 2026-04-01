import React from 'react';

const LoadingSpinner = ({ mensaje = "Cargando..." }) => {
    return (
        <div className="spinner-container fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>{mensaje}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
