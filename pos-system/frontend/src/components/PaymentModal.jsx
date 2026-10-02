import { useState, useEffect } from 'react';
import { X, DollarSign, QrCode, CreditCard, Check, Loader2, RefreshCw } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, total, onConfirmSale, isProcessing }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  
  // Estados para Mercado Pago QR
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setAmountPaid(total.toString());
      setQrCodeData(null);
      setQrError(null);
    }
  }, [isOpen, total]);

  // Función para pedir el QR dinámico al backend
  const fetchQRCode = async () => {
    try {
      setLoadingQR(true);
      setQrError(null);
      const res = await fetch('http://localhost:4000/api/mp/create-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount: total })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo generar el QR');
      }

      setQrCodeData(data.qrImage);
    } catch (err) {
      console.error('Error QR:', err);
      setQrError(err.message);
    } finally {
      setLoadingQR(false);
    }
  };

  // Pedir QR al cambiar a QR_TRANSFER si aún no existe
  useEffect(() => {
    if (paymentMethod === 'QR_TRANSFER' && !qrCodeData && !loadingQR) {
      fetchQRCode();
    }
  }, [paymentMethod]);

  // Atajos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === '1' && e.altKey) {
        setPaymentMethod('CASH');
      }
      if (e.key === '2' && e.altKey) {
        setPaymentMethod('QR_TRANSFER');
      }
      if (e.key === '3' && e.altKey) {
        setPaymentMethod('CARD');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numericPaid = Number(amountPaid) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, numericPaid - total) : 0;
  const isCovered = paymentMethod !== 'CASH' || numericPaid >= total;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isCovered || isProcessing) return;

    onConfirmSale({
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'CASH' ? numericPaid : total,
      change_returned: change
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
        
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">Finalizar Venta</h3>
            <p className="text-xs text-slate-400">Seleccione el medio de pago [Esc para cancelar]</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          
          {/* Total a Pagar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total a Cobrar</span>
            <p className="text-3xl font-black text-slate-900 mt-1">$ {total.toLocaleString('es-AR')}</p>
          </div>

          {/* Selector de Medios de Pago */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                paymentMethod === 'CASH' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('QR_TRANSFER')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                paymentMethod === 'QR_TRANSFER' 
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>QR MercadoPago</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-bold ${
                paymentMethod === 'CARD' 
                  ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Tarjeta</span>
            </button>
          </div>

          {/* Sección Dinámica según Medio de Pago */}

          {/* 1. EFECTIVO */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paga con ($) [Enter para confirmar]</label>
                <input
                  type="number"
                  required
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-black text-slate-800 outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Billetes rápidos */}
              <div className="flex gap-2">
                {[1000, 2000, 5000, 10000, 20000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountPaid(val.toString())}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition"
                  >
                    ${val >= 1000 ? `${val/1000}k` : val}
                  </button>
                ))}
              </div>

              {/* Vuelto */}
              <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl flex justify-between items-center text-emerald-900">
                <span className="text-xs font-bold uppercase">Vuelto a Entregar:</span>
                <span className="text-xl font-black">$ {change.toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}

          {/* 2. MERCADO PAGO QR */}
          {paymentMethod === 'QR_TRANSFER' && (
            <div className="pt-2 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {loadingQR ? (
                <div className="py-8 flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Generando QR con Mercado Pago...</span>
                </div>
              ) : qrError ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs font-semibold text-rose-600">{qrError}</p>
                  <button
                    type="button"
                    onClick={fetchQRCode}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                  </button>
                </div>
              ) : qrCodeData ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={qrCodeData} alt="QR Mercado Pago" className="w-48 h-48 rounded-lg shadow-xs border border-slate-200" />
                  <p className="text-[11px] font-bold text-slate-500 text-center">
                    Escaneá con la app de Mercado Pago o cualquier billetera
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* 3. TARJETA */}
          {paymentMethod === 'CARD' && (
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl text-center space-y-1">
              <p className="text-xs font-bold text-purple-900">Cobro con Tarjeta / Posnet</p>
              <p className="text-xs text-purple-700">Procesá el importe en la terminal de cobro física y confirmá la venta.</p>
            </div>
          )}

          {/* Botón de Confirmación */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isCovered || isProcessing || (paymentMethod === 'QR_TRANSFER' && loadingQR)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-base transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Check className="w-5 h-5" />
              <span>{isProcessing ? 'Procesando...' : 'Confirmar Cobro (Enter)'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}