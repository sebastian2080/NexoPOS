import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Printer, Calendar, RefreshCw, Receipt } from 'lucide-react';
import ReceiptModal from './ReceiptModal';

export default function SalesHistory({ onBackToMenu }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Vacío = muestra las últimas 100

  // Modal para reimprimir
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadHistory = () => {
    setLoading(true);
    const queryParam = selectedDate ? `?date=${selectedDate}` : '';
    fetch(`http://localhost:4000/api/sales/history${queryParam}`)
      .then(res => res.json())
      .then(data => {
        setSales(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  const handleReprint = (sale) => {
    setSelectedReceipt(sale);
    setIsReceiptOpen(true);
  };

  const filteredSales = sales.filter(s => {
    const ticketNumber = `#${s.id.toString().padStart(6, '0')}`;
    const seller = (s.seller_name || s.seller_code || '').toLowerCase();
    const query = search.toLowerCase();
    return ticketNumber.includes(query) || seller.includes(query) || s.id.toString().includes(query);
  });

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
            <h1 className="text-lg font-bold leading-tight">Historial de Ventas y Comprobantes</h1>
            <p className="text-xs text-slate-400">Búsqueda, detalle y reimpresión de tickets</p>
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-4">
        
        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[280px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por # ticket (ej: 000001) o vendedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs font-semibold w-full text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs font-bold text-blue-600 hover:underline px-2"
              >
                Ver Todas
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Historial */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5"># Ticket</th>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Vendedor</th>
                <th className="p-3.5">Método de Pago</th>
                <th className="p-3.5">Artículos</th>
                <th className="p-3.5 text-right">Total</th>
                <th className="p-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-400">Cargando historial...</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-400">No se encontraron ventas</td></tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-800 text-sm">
                      #{sale.id.toString().padStart(6, '0')}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {new Date(sale.created_at).toLocaleDateString('es-AR')} {new Date(sale.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      {sale.seller_name ? `${sale.seller_name} (${sale.seller_code})` : (sale.seller_code || '-')}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        sale.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-800' :
                        sale.payment_method === 'QR_TRANSFER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {sale.payment_method === 'CASH' ? 'Efectivo' : sale.payment_method === 'QR_TRANSFER' ? 'QR' : 'Tarjeta'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {sale.items?.length || 0} {sale.items?.length === 1 ? 'producto' : 'productos'}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                      $ {Number(sale.total_amount).toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleReprint(sale)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition inline-flex items-center gap-1.5 font-bold active:scale-95"
                        title="Reimprimir Ticket"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ticket</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modal de Impresión */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={selectedReceipt}
      />

    </div>
  );
}