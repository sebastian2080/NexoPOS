import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ArrowDownRight, ArrowUpRight, DollarSign, X } from 'lucide-react';

export default function CashMovementsManager({ onBackToMenu }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    category: 'PROVEEDOR',
    description: '',
    amount: ''
  });

  const loadMovements = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/cash-movements')
      .then(res => res.json())
      .then(data => {
        setMovements(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const totalExpenses = movements.reduce((acc, m) => m.type === 'EXPENSE' ? acc + Number(m.amount) : acc, 0);
  const totalIncomes = movements.reduce((acc, m) => m.type === 'INCOME' ? acc + Number(m.amount) : acc, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/cash-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          category: formData.category,
          description: formData.description,
          amount: Number(formData.amount)
        })
      });

      if (!res.ok) throw new Error('Error al registrar movimiento');

      setIsModalOpen(false);
      setFormData({
        type: 'EXPENSE',
        category: 'PROVEEDOR',
        description: '',
        amount: ''
      });
      loadMovements();
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
            <h1 className="text-lg font-bold leading-tight">Gastos y Movimientos de Caja</h1>
            <p className="text-xs text-slate-400">Control de egresos, pagos a proveedores e ingresos extras</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl text-sm font-bold text-white transition active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Movimiento</span>
        </button>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">Total Egresos / Gastos Hoy</span>
              <p className="text-2xl font-black text-rose-600 mt-1">$ {totalExpenses.toLocaleString('es-AR')}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">Total Ingresos Extras Hoy</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">$ {totalIncomes.toLocaleString('es-AR')}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Hora</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Motivo / Descripción</th>
                <th className="p-3.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Cargando...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">No hay movimientos registrados hoy</td></tr>
              ) : (
                movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 text-slate-500">
                      {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        m.type === 'EXPENSE' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.type === 'EXPENSE' ? 'Egreso / Retiro' : 'Ingreso Extra'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{m.category}</td>
                    <td className="p-3.5 text-slate-600">{m.description || '-'}</td>
                    <td className={`p-3.5 text-right font-black text-sm ${
                      m.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {m.type === 'EXPENSE' ? '-' : '+'}$ {Number(m.amount).toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modal Nuevo Movimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Registrar Movimiento de Dinero</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-amber-500"
                  >
                    <option value="EXPENSE">Egreso / Gasto</option>
                    <option value="INCOME">Ingreso Extra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-amber-500"
                  >
                    <option value="PROVEEDOR">Pago a Proveedor</option>
                    <option value="SERVICIOS">Servicios / Limpieza</option>
                    <option value="RETIRO">Retiro del Dueño</option>
                    <option value="CAMBIO">Fondo / Cambio Extra</option>
                    <option value="VARIOS">Gastos Varios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto en Efectivo ($)</label>
                <input 
                  type="number"
                  required
                  placeholder="0"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-black text-slate-800 outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Detalle</label>
                <input 
                  type="text"
                  placeholder="Ej: Pago de panadería o factura de luz..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-amber-500"
                />
              </div>

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
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 font-bold text-white rounded-xl text-sm transition shadow-sm"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}