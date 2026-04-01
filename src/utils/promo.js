/**
 * Calcula el precio unitario aplicando el descuento por porcentaje.
 */
export const calcularPrecioEfectivo = (precio, descuento = 0) => {
    return precio * (1 - (descuento / 100));
};

/**
 * Calcula el subtotal de una línea del carrito considerando cantidad y reglas de promoción.
 * Soporta promociones tipo "NxM" (ej: 3x2, 2x1).
 */
export const calcularSubtotalItem = (item) => {
    const base = calcularPrecioEfectivo(item.precio, item.descuento || 0);
    let sub = base * item.cantidad;
    
    // Regla de promoción tipo "NxM" (ej: "3x2")
    if (item.promoRule && item.promoRule.toLowerCase().includes('x')) {
        const parts = item.promoRule.toLowerCase().split('x').map(Number);
        const [n, m] = parts;
        
        // n es la cantidad requerida para la promo, m es la cantidad que se paga.
        if (!isNaN(n) && !isNaN(m) && n > m && item.cantidad >= n) {
            const grupos = Math.floor(item.cantidad / n);
            // Se restan (n-m) unidades por cada grupo completo de n.
            sub -= grupos * (n - m) * base;
        }
    }
    
    return sub;
};

/**
 * Calcula el precio final sugerido basado en costo, multiplicador de margen e IVA.
 */
export const calcularPrecioFinal = (costo, multiplicador, iva) => {
    return (parseFloat(costo) || 0) * (parseFloat(multiplicador) || 0) * (1 + (parseFloat(iva) || 0) / 100);
};

/**
 * Calcula el valor neto (sin IVA) a partir de un subtotal final.
 */
export const calcularNeto = (subtotalFinal, ivaPorcentaje = 0) => {
    return subtotalFinal / (1 + (ivaPorcentaje / 100));
};

/**
 * Calcula el monto de IVA contenido en un subtotal final.
 */
export const calcularIVA = (subtotalFinal, ivaPorcentaje = 0) => {
    return subtotalFinal - calcularNeto(subtotalFinal, ivaPorcentaje);
};

/**
 * Calcula el total general de un carrito de ventas.
 */
export const calcularTotalCarrito = (carrito) => {
    return carrito.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
};
