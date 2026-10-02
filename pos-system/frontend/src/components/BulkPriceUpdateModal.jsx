import { useState } from 'react';
import { Percent, X, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function BulkPriceUpdateModal({ isOpen, onClose, categories, onSuccess }) {
  const [percentage, setPercentage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [target, setTarget] = useState('SALE'); // 'SALE' | 'COST' | 'BOTH'
  const [roundToFifty, setRoundToFifty] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pct = Number(percentage);
    if (!pct || isNaN(pct)) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/products/bulk-price-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: pct,
          category: selectedCategory,
          target,
          roundToFifty
        })
      });

      if (!res.ok) throw new Error('Error al actualizar precios masivamente');
      const data = await res.json();

      onSuccess(data.count, pct);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Actualización Masiva de Precios</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Advertencia */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Esta acción modificará los precios de los productos seleccionados de forma permanente.</span>
          </div>

          {/* Categoría a afectar */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alcance / Categoría</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 text-sm"
            >
              <option value="ALL">Todo el catálogo (Todos los productos)</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Porcentaje de Aumento */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Porcentaje de Ajuste (%)</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                required
                placeholder="Ej: 10 o 15.5"
                value={percentage}
                onChange={e => setPercentage(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-black text-slate-800 outline-none focus:border-amber-500"
                autoFocus
              />
              <span className="absolute right-3 font-bold text-slate-400">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ingresá números positivos para aumentar o negativos para rebajar.</p>
          </div>

          {/* Qué precios actualizar */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precios a Modificar</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTarget('SALE')}
                className={`py-2 px-2 rounded-xl border transition ${
                  target === 'SALE' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Solo Venta
              </button>
              <button
                type="button"
                onClick={() => setTarget('COST')}
                className={`py-2 px-2 rounded-xl border transition ${
                  target === 'COST' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Solo Costo
              </button>
              <button
                type="button"
                onClick={() => setTarget('BOTH')}
                className={`py-2 px-2 rounded-xl border transition ${
                  target === 'BOTH' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Ambos
              </button>
            </div>
          </div>

          {/* Redondeo inteligente */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 select-none">
            <input
              type="checkbox"
              checked={roundToFifty}
              onChange={e => setRoundToFifty(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 accent-amber-500"
            />
            <div className="text-xs">
              <p className="font-bold text-slate-700">Redondear a múltiplos de $50</p>
              <p className="text-[10px] text-slate-400">Evita precios como $1.234 y los redondea a $1.250 para dar vuelto fácil.</p>
            </div>
          </label>

          {/* Acciones */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !percentage}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 font-bold text-white rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Aplicando...' : 'Aplicar Aumento'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}