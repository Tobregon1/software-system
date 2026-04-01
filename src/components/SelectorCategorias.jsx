import React from 'react';

const SelectorCategorias = ({ categorias, seleccionada, alSeleccionar }) => {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}>
            {categorias.map(cat => (
                <button
                    key={cat}
                    onClick={() => alSeleccionar(cat)}
                    className={`badge ${seleccionada === cat ? 'active' : ''}`}
                    style={{
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        backgroundColor: seleccionada === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};

export default SelectorCategorias;
