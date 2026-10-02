import { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, saleData }) {
  const [businessInfo, setBusinessInfo] = useState({
    name: 'NEXO POS',
    cuit: '30-71234567-9',
    address: 'Av. Comercial 1234',
    city: 'Buenos Aires, Argentina',
    footerMessage: '¡Gracias por su compra!'
  });

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:4000/api/settings/business-info')
        .then(res => res.json())
        .then(data => {
          if (data && data.name) setBusinessInfo(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col">
        
        {/* Cabecera no imprimible */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comprobante No Fiscal</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ÁREA DEL TICKET */}
        <div className="p-6 bg-white text-slate-900 font-mono text-xs select-text overflow-y-auto max-h-[70vh]" id="printable-receipt">
          
          {/* Encabezado Dinámico */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
            <h2 className="text-lg font-black tracking-widest uppercase">{businessInfo.name}</h2>
            {businessInfo.cuit && <p className="text-[11px] text-slate-600">CUIT: {businessInfo.cuit}</p>}
            {businessInfo.address && <p className="text-[10px] text-slate-500">{businessInfo.address}</p>}
            {businessInfo.city && <p className="text-[10px] text-slate-500">{businessInfo.city}</p>}
          </div>

          {/* Metadatos de la Venta */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>TICKET #:</span>
              <span className="font-bold">{(saleData.id || 1).toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FECHA:</span>
              <span>{new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ATENDIÓ:</span>
              <span className="font-bold uppercase text-slate-800">{saleData.cashier_name || 'Cajero'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>PAGO:</span>
              <span className="font-bold">
                {saleData.payment_method === 'CASH' ? 'EFECTIVO' : saleData.payment_method === 'QR_TRANSFER' ? 'QR / TRANSF.' : 'TARJETA'}
              </span>
            </div>
            {saleData.seller_code && (
              <div className="flex justify-between text-slate-600">
                <span>VENDEDOR:</span>
                <span className="font-bold">{saleData.seller_code}</span>
              </div>
            )}
          </div>

          {/* Tabla de Artículos */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
            <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase">
              <span>Cant. / Descripción</span>
              <span>Total</span>
            </div>

            {saleData.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2">
                  <span className="font-bold">{item.quantity}x </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold shrink-0">$ {(item.quantity * item.sale_price).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>

          {/* Totales y Vuelto */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-base font-black pt-1">
              <span>TOTAL:</span>
              <span>$ {Number(saleData.total).toLocaleString('es-AR')}</span>
            </div>

            {saleData.payment_method === 'CASH' && (
              <>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>ABONÓ CON:</span>
                  <span>$ {Number(saleData.amount_paid).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>SU VUELTO:</span>
                  <span>$ {Number(saleData.change_returned).toLocaleString('es-AR')}</span>
                </div>
              </>
            )}
          </div>

          {/* Pie Dinámico */}
          <div className="pt-4 text-center space-y-1">
            <p className="font-bold text-[11px] uppercase tracking-wide">{businessInfo.footerMessage}</p>
            <p className="text-[9px] text-slate-400">Comprobante no válido como factura fiscal</p>
          </div>

        </div>

        {/* Acciones */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition active:scale-95"
          >
            Cerrar (Esc)
          </button>
          
          <button
            type="button"
            onClick={handlePrint}
            className="flex-[2] py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>

      </div>
    </div>
  );
}