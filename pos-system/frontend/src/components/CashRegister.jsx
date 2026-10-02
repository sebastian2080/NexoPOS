import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Lock, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

export default function CashRegisterManager({ onBackToMenu }) {
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para apertura / cierre
  const [initialAmountInput, setInitialAmountInput] = useState('');
  const [countedCashInput, setCountedCashInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closeResult, setCloseResult] = useState(null);

  const loadShift = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/cash/current-shift')
      .then(res => res.json())
      .then(data => {
        setShiftData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadShift();
  }, []);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/cash/open-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_amount: Number(initialAmountInput) || 0 })
      });
      if (!res.ok) throw new Error('Error al abrir caja');
      setInitialAmountInput('');
      loadShift();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!shiftData?.shift?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/cash/close-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: shiftData.shift.id,
          counted_cash: Number(countedCashInput) || 0,
          notes: notesInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar caja');
      setCloseResult(data.summary);
      setCountedCashInput('');
      setNotesInput('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <p className="text-slate-500 font-bold text-sm">Cargando estado de caja...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none pb-12">
      
      {/* Header */}
      <header className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToMenu}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center gap-2 text-sm font-bold active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menú Principal</span>
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Control & Cierre de Caja</h1>
            <p className="text-xs text-slate-400">Arqueo físico de billetes, ventas y egresos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto p-6 space-y-6">
        
        {/* CASO 1: CAJA CERRADA (Formulario de Apertura) */}
        {!shiftData?.isOpen && !closeResult && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Apertura de Turno</h2>
              <p className="text-xs text-slate-400 mt-1">Ingresá el fondo inicial de cambio con el que arranca la caja.</p>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-left">Fondo Inicial ($)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={initialAmountInput}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setInitialAmountInput(val);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-emerald-500 select-text"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition shadow-sm"
              >
                {submitting ? 'Abriendo turno...' : 'Abrir Caja'}
              </button>
            </form>
          </div>
        )}

        {/* CASO 2: RESULTADO DE ARQUEO RECIÉN CERRADO */}
        {closeResult && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto text-center space-y-5 animate-scale-up">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              closeResult.difference === 0 ? 'bg-emerald-50 text-emerald-600' : closeResult.difference > 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {closeResult.difference === 0 ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                {closeResult.difference === 0 ? '¡Caja Cuadrada Perfecta!' : closeResult.difference > 0 ? 'Sobrante de Caja' : 'Faltante de Caja'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">El turno fue cerrado y registrado en el historial.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-bold">
              <div className="flex justify-between text-slate-600">
                <span>Efectivo Esperado:</span>
                <span>$ {Number(closeResult.expectedCash).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-slate-800">
                <span>Efectivo Contado (Físico):</span>
                <span>$ {Number(closeResult.countedCash).toLocaleString('es-AR')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                <span>Diferencia:</span>
                <span className={closeResult.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {closeResult.difference > 0 && '+'}$ {Number(closeResult.difference).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setCloseResult(null);
                loadShift();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
            >
              Aceptar y Volver
            </button>
          </div>
        )}

        {/* CASO 3: CAJA ABIERTA (Resumen en Tiempo Real & Arqueo) */}
        {shiftData?.isOpen && !closeResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Columna Izquierda: Tarjetas de Balance */}
            <div className="md:col-span-2 space-y-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Estado del Turno</span>
                    <h3 className="text-base font-bold text-slate-800">Turno en Curso</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    ● Abierto
                  </span>
                </div>

                {/* Desglose de Caja */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Fondo Inicial</span>
                    <p className="text-base font-bold text-slate-800 mt-0.5">$ {Number(shiftData.summary.initialAmount).toLocaleString('es-AR')}</p>
                  </div>

                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">+ Ventas en Efectivo</span>
                    <p className="text-base font-black text-emerald-800 mt-0.5">$ {Number(shiftData.summary.cashSales).toLocaleString('es-AR')}</p>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>- Egresos / Gastos</span>
                    </span>
                    <p className="text-base font-black text-rose-800 mt-0.5">$ {Number(shiftData.summary.totalExpenses).toLocaleString('es-AR')}</p>
                  </div>

                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                    <span className="text-[11px] font-bold text-blue-700 uppercase">= Efectivo Esperado</span>
                    <p className="text-base font-black text-blue-900 mt-0.5">$ {Number(shiftData.summary.expectedCash).toLocaleString('es-AR')}</p>
                  </div>
                </div>

                {/* Otros Medios de Cobro (Bancarizados) */}
                <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-semibold">
                  <span>QR / Transf: <strong>${Number(shiftData.summary.qrSales).toLocaleString('es-AR')}</strong></span>
                  <span>Tarjeta: <strong>${Number(shiftData.summary.cardSales).toLocaleString('es-AR')}</strong></span>
                </div>
              </div>

            </div>

            {/* Columna Derecha: Formulario de Cierre / Arqueo */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Efectuar Cierre de Caja</h3>
                </div>

                <form onSubmit={handleCloseShift} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Efectivo Físico Contado ($)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="Total contado en el cajón"
                      value={countedCashInput}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCountedCashInput(val);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-black text-slate-900 outline-none focus:border-purple-500 select-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones / Notas</label>
                    <textarea
                      rows={2}
                      placeholder="Opcional: motivos de diferencias..."
                      value={notesInput}
                      onChange={e => setNotesInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 select-text"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !countedCashInput}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{submitting ? 'Cerrando turno...' : 'Cerrar Turno & Guardar'}</span>
                  </button>
                </form>
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-4">
                El cierre es definitivo y genera el arqueo histórico.
              </p>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}