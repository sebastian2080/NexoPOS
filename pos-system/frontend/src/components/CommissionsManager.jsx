import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Award, Calendar, ToggleLeft, ToggleRight, X, TrendingUp } from 'lucide-react';

export default function CommissionsManager({ onBackToMenu }) {
  const [enabled, setEnabled] = useState(true);
  const [ranking, setRanking] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de fecha
  const [filterMode, setFilterMode] = useState('DATE'); // 'DATE' | 'MONTH'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Modal nuevo vendedor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSeller, setNewSeller] = useState({ code: '', name: '', commission_percentage: '3.0' });

  const loadConfigAndData = () => {
    setLoading(true);
    // 1. Cargar Config
    fetch('http://localhost:4000/api/sellers/config')
      .then(res => res.json())
      .then(cfg => setEnabled(cfg.enabled));

    // 2. Cargar Lista Vendedores
    fetch('http://localhost:4000/api/sellers')
      .then(res => res.json())
      .then(data => setSellers(Array.isArray(data) ? data : []));

    // 3. Cargar Reporte
    const queryParam = filterMode === 'MONTH' ? `month=${selectedMonth}` : `date=${selectedDate}`;
    fetch(`http://localhost:4000/api/sellers/report?${queryParam}`)
      .then(res => res.json())
      .then(data => {
        setRanking(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadConfigAndData();
  }, [filterMode, selectedDate, selectedMonth]);

  const handleToggleModule = async () => {
    try {
      const nextState = !enabled;
      await fetch('http://localhost:4000/api/sellers/config/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
      setEnabled(nextState);
    } catch (err) {
      alert('Error al guardar configuración');
    }
  };

  const handleCreateSeller = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeller)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear vendedor');
      }
      setIsModalOpen(false);
      setNewSeller({ code: '', name: '', commission_percentage: '3.0' });
      loadConfigAndData();
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
            <h1 className="text-lg font-bold leading-tight">Comisiones y Vendedores</h1>
            <p className="text-xs text-slate-400">Ranking comercial, metas de venta y liquidación</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Switch Activar / Desactivar */}
          <button
            onClick={handleToggleModule}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              enabled 
                ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
            <span>{enabled ? 'Módulo Activo' : 'Módulo Desactivado'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-bold text-white transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Vendedor</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {/* Barra de Filtros con Calendario */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('DATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'DATE' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Por Día Específico
            </button>
            <button
              onClick={() => setFilterMode('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'MONTH' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cierre Mensual
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {filterMode === 'DATE' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-violet-500"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-violet-500"
              />
            )}
          </div>

        </div>

        {/* Tabla de Ranking y Comisiones */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Ranking de Ventas ({filterMode === 'MONTH' ? `Mes ${selectedMonth}` : `Fecha ${selectedDate}`})</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Ordenado por mayor facturación</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center w-14"># Pos</th>
                <th className="p-3.5">Cód.</th>
                <th className="p-3.5">Vendedor</th>
                <th className="p-3.5 text-center">Tickets</th>
                <th className="p-3.5 text-right">Total Facturado</th>
                <th className="p-3.5 text-center">% Comisión</th>
                <th className="p-3.5 text-right font-black text-slate-700">Comisión a Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-400">Cargando reporte...</td></tr>
              ) : ranking.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-400">No hay ventas registradas en el período seleccionado</td></tr>
              ) : (
                ranking.map((r, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 text-center">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-600">{r.seller_code}</td>
                    <td className="p-3.5 font-bold text-slate-800 text-sm">{r.seller_name}</td>
                    <td className="p-3.5 text-center text-slate-600 font-bold">{r.total_sales_count}</td>
                    <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                      $ {Number(r.total_sold).toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 font-bold rounded">
                        {r.commission_percentage}%
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600 text-sm">
                      $ {Number(r.commission_earned).toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modal Nuevo Vendedor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Alta de Vendedor</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeller} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código Vendedor</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej: 101 o J1"
                    value={newSeller.code}
                    onChange={e => setNewSeller({...newSeller, code: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">% Comisión</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={newSeller.commission_percentage}
                    onChange={e => setNewSeller({...newSeller, commission_percentage: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-violet-600 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={newSeller.name}
                  onChange={e => setNewSeller({...newSeller, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-violet-500"
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
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 font-bold text-white rounded-xl text-sm transition shadow-sm"
                >
                  Guardar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}