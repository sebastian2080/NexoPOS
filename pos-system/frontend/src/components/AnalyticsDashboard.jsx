import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Receipt, PieChart, Award, RefreshCw } from 'lucide-react';

export default function AnalyticsDashboard({ onBackToMenu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/sales/metrics/dashboard')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 font-bold text-sm">Calculando métricas del negocio...</p>
      </div>
    );
  }

  const { summary, last7Days, topProducts, paymentMethods } = data;

  // Calcular valor máximo para escalar las barras de los últimos 7 días
  const maxDayValue = Math.max(...last7Days.map(d => d.daily_total), 1);

  // Total de pagos para porcentajes
  const totalPaymentSum = paymentMethods.reduce((sum, p) => sum + p.total, 0) || 1;

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
            <h1 className="text-lg font-bold leading-tight">Métricas & Estadísticas</h1>
            <p className="text-xs text-slate-400">Rendimiento, facturación y productos destacados</p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facturación Total</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">$ {summary.totalRevenue.toLocaleString('es-AR')}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ganancia Bruta</p>
              <h3 className="text-xl font-black text-blue-600 mt-0.5">$ {summary.totalProfit.toLocaleString('es-AR')}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets Emitidos</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{summary.totalTickets} ventas</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">$ {summary.averageTicket.toLocaleString('es-AR')}</h3>
            </div>
          </div>

        </div>

        {/* Gráfico de Barras: Facturación de los últimos 7 días */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ventas de los Últimos 7 Días</h3>
              <p className="text-xs text-slate-400">Comparativa de ingresos diarios</p>
            </div>
          </div>

          {last7Days.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No hay registros de ventas en la última semana.</p>
          ) : (
            <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
              {last7Days.map((day, idx) => {
                const heightPercent = Math.max(12, Math.round((day.daily_total / maxDayValue) * 100));
                const dateObj = new Date(day.sale_date + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'short' });
                const dayNum = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' });

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-black text-slate-700 opacity-0 group-hover:opacity-100 transition">
                      ${day.daily_total.toLocaleString('es-AR')}
                    </span>
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[50px] bg-blue-500 group-hover:bg-blue-600 rounded-t-xl transition-all shadow-xs"
                    />
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-700 capitalize">{dayName}</p>
                      <p className="text-[10px] text-slate-400">{dayNum}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sección Doble: Top 5 Productos y Medios de Pago */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Top 5 Productos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Top 5 Artículos Más Vendidos</h3>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aún no hay ventas registradas.</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{p.name || 'Sin nombre'}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{p.category || 'Varios'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900 text-xs">{p.units_sold} unid.</p>
                      <p className="text-[11px] font-bold text-emerald-600">$ {p.total_generated.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desglose por Medio de Pago */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">Canales de Cobro</h3>
            </div>

            <div className="space-y-4 pt-2">
              {paymentMethods.map((pm, idx) => {
                const pct = Math.round((pm.total / totalPaymentSum) * 100);
                const label = pm.payment_method === 'CASH' ? 'Efectivo' : pm.payment_method === 'QR_TRANSFER' ? 'QR / Transferencia' : 'Tarjeta';
                const barColor = pm.payment_method === 'CASH' ? 'bg-emerald-500' : pm.payment_method === 'QR_TRANSFER' ? 'bg-blue-500' : 'bg-purple-500';

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{label} ({pm.count} ops)</span>
                      <span className="text-slate-900">${pm.total.toLocaleString('es-AR')} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={`h-full rounded-full ${barColor}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}