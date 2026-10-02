import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Plus } from 'lucide-react';

export default function QuickProductModal({ isOpen, barcode, onClose, onProductCreated }) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'Varios',
    cost_price: '',
    sale_price: '',
    stock: '10'
  });
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        barcode: barcode || '',
        name: '',
        category: 'Varios',
        cost_price: '',
        sale_price: '',
        stock: '10'
      });
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, barcode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sale_price) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: formData.barcode,
          name: formData.name.trim(),
          category: formData.category.trim() || 'Varios',
          cost_price: Number(formData.cost_price) || 0,
          sale_price: Number(formData.sale_price) || 0,
          stock: Number(formData.stock) || 0
        })
      });

      if (!res.ok) throw new Error('Error al registrar el producto');
      const created = await res.json();

      onProductCreated({
        id: created.id,
        barcode: formData.barcode,
        name: formData.name.trim(),
        category: formData.category.trim() || 'Varios',
        cost_price: Number(formData.cost_price) || 0,
        sale_price: Number(formData.sale_price) || 0,
        stock: Number(formData.stock) || 0
      });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm leading-tight">Producto No Encontrado</h3>
              <p className="text-[11px] text-amber-100">Alta rápida para venta inmediata</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-white/80 hover:bg-amber-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Código de Barras Escaneado</label>
            <input 
              type="text"
              readOnly
              value={formData.barcode}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre / Descripción *</label>
            <input 
              ref={nameInputRef}
              type="text"
              required
              placeholder="Ej: Alfajor Milka Blanco"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Precio Venta ($) *</label>
              <input 
                type="number"
                required
                placeholder="0"
                value={formData.sale_price}
                onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-blue-600 text-base outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Stock Inicial</label>
              <input 
                type="number"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Costo ($)</label>
              <input 
                type="number"
                placeholder="0"
                value={formData.cost_price}
                onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Categoría</label>
              <input 
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-xl text-xs transition"
            >
              Cancelar (Esc)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-white rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar y Agregar al Ticket</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}