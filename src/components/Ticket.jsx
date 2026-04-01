import React from 'react';
import { calcularSubtotalItem, calcularNeto, calcularIVA, calcularTotalCarrito } from '../utils/promo';

const Ticket = ({ venta, config }) => {
  if (!venta) return null;

  return (
    <div className="impresion-ticket">
      {config.logoUrl && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <img src={config.logoUrl} alt="logo" style={{ maxHeight: '80px', maxWidth: '150px' }} />
        </div>
      )}
      <h2 style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>{config.nombreNegocio}</h2>
      {config.direccion && <p style={{ textAlign: 'center', margin: '2px 0' }}>{config.direccion}</p>}
      {config.telefono && <p style={{ textAlign: 'center', margin: '2px 0' }}>Tel: {config.telefono}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed black', margin: '10px 0', paddingBottom: '5px' }}>
        <span>Fecha: {new Date(venta.fecha).toLocaleDateString('es-AR')}</span>
        <span>Hora: {new Date(venta.fecha).toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '5px' }}>
        <div><b>Método:</b> {venta.metodoPago}</div>
        {venta.clienteId && (
          <div><b>Cliente ID:</b> {venta.clienteId}</div>
        )}
      </div>

      <table style={{ width: '100%', marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid black' }}>
            <th align="left">Producto</th>
            <th align="right">Subt.</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item, i) => {
            const subFinal = calcularSubtotalItem(item);
            const baseUnit = item.precio * (1 - (item.descuento || 0) / 100);
            const descPromo = (baseUnit * item.cantidad) - subFinal;

            return (
              <tr key={i}>
                <td style={{ padding: '4px 0' }}>
                  <div>{item.nombre}</div>
                  <div style={{ fontSize: '11px' }}>
                    {item.cantidad} x ${item.precio.toLocaleString()}
                    {item.descuento > 0 && ` (-${item.descuento}%)`}
                  </div>
                  {descPromo > 0 && (
                    <div style={{ fontSize: '11px', color: 'black', fontWeight: 'bold' }}>
                      Promo {item.promoRule}: -${descPromo.toLocaleString()}
                    </div>
                  )}
                </td>
                <td align="right" valign="bottom">${subFinal.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ borderTop: '2px solid black', paddingTop: '10px', marginTop: '10px' }}>
        {(() => {
          let subtotalNeto = 0;
          let ivaTotal = 0;
          const totalFinal = calcularTotalCarrito(venta.items);

          venta.items.forEach(item => {
            const subFinal = calcularSubtotalItem(item);
            subtotalNeto += calcularNeto(subFinal, item.iva || 0);
            ivaTotal += calcularIVA(subFinal, item.iva || 0);
          });

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Subtotal (Neto)</span>
                <span>${subtotalNeto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>IVA</span>
                <span>${ivaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>
                <span>TOTAL</span>
                <span>${totalFinal.toLocaleString()}</span>
              </div>
            </>
          );
        })()}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px' }}>
        <p style={{ margin: '5px 0', fontStyle: 'italic' }}>{config.mensajePie || '¡Gracias por su compra!'}</p>
        <p style={{ margin: '5px 0', fontSize: '10px', opacity: 0.8 }}>Kiosco System Premium v3.0</p>
      </div>
    </div>
  );
};

export default Ticket;
