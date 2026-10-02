import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Percent, CheckCircle2, XCircle, X } from 'lucide-react';

export default function PromotionsManager({ onBackToMenu }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'PAYMENT_METHOD',
    target_value: 'CASH',
    discount_percentage: '10',
    buy_qty: '2',
    pay_qty: '1'
  });

  const loadPromos = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/promotions')
      .then(res => res.json())
      .then(data => {
        setPromos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const handleToggle = async (id) => {
    try {
      await fetch(`http://localhost:4000/api/promotions/${id}/toggle`, { method: 'PATCH' });
      loadPromos();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          target_value: formData.target_value,
          discount_percentage: Number(formData.discount_percentage) || 0,
          buy_qty: Number(formData.buy_qty) || 0,
          pay_qty: Number(formData.pay_qty) || 0
        })
      });

      if (!res.ok) throw new Error('Error al guardar promoción');
      setIsModalOpen(false);
      setFormData({
        name: '',
        type: 'PAYMENT_METHOD',
        target_value: 'CASH',
        discount_percentage: '10',
        buy_qty: '2',
        pay_qty: '1'
      });
      loadPromos();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none pb-10">
      
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
            <h1 className="text-lg font-bold leading-tight">Promociones y Descuentos</h1>
            <p className="text-xs text-slate-400">Reglas comerciales, combos y beneficios por pago</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-sm font-bold text-white transition active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Promoción</span>
        </button>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Nombre</th>
                <th className="p-3.5">Tipo de Beneficio</th>
                <th className="p-3.5">Detalle / Regla</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Cargando...</td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">No hay promociones creadas</td></tr>
              ) : (
                promos.map(promo => (
                  <tr key={promo.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Percent className="w-4 h-4 text-rose-500" />
                      {promo.name}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                        {promo.type === 'PAYMENT_METHOD' ? 'Por Medio de Pago' : 'Combo / Cantidad'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {promo.type === 'PAYMENT_METHOD' 
                        ? `${promo.discount_percentage}% OFF abonando en ${promo.target_value === 'CASH' ? 'Efectivo' : 'Transferencia'}`
                        : `Lleva ${promo.buy_qty} y Paga ${promo.pay_qty}`
                      }
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        promo.is_active === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {promo.is_active === 1 ? 'Activa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggle(promo.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          promo.is_active === 1 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {promo.is_active === 1 ? 'Pausar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Nueva Promo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Crear Regla de Promoción</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Descriptivo</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: 10% Efectivo o Promo 2x1"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Regla</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-500"
                >
                  <option value="PAYMENT_METHOD">Descuento por Medio de Pago</option>
                  <option value="BUY_X_GET_Y">Combo por Cantidad (Ej: 2x1)</option>
                </select>
              </div>

              {formData.type === 'PAYMENT_METHOD' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medio</label>
                    <select
                      value={formData.target_value}
                      onChange={e => setFormData({...formData, target_value: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-500"
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="QR_TRANSFER">QR / Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">% Descuento</label>
                    <input 
                      type="number"
                      required
                      value={formData.discount_percentage}
                      onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lleva (Cant.)</label>
                    <input 
                      type="number"
                      required
                      value={formData.buy_qty}
                      onChange={e => setFormData({...formData, buy_qty: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paga (Cant.)</label>
                    <input 
                      type="number"
                      required
                      value={formData.pay_qty}
                      onChange={e => setFormData({...formData, pay_qty: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 font-bold text-white rounded-xl text-sm transition shadow-sm"
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}