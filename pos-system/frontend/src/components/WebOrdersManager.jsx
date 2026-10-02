import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2, Truck, Store, RefreshCw } from 'lucide-react';

export default function WebOrdersManager({ onBackToMenu }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/web-orders')
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      await fetch(`http://localhost:4000/api/web-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      loadOrders();
    } catch (err) {
      alert('Error al actualizar estado del pedido');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs">Nuevo Pedido</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs">En Preparación</span>;
      case 'READY':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full font-bold text-xs">Listo p/ Entrega</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">Entregado</span>;
      default:
        return null;
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
            <h1 className="text-lg font-bold leading-tight">Bandeja de Pedidos Web</h1>
            <p className="text-xs text-slate-400">Integración con tienda online y despachos</p>
          </div>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6">
        
        {loading ? (
          <p className="text-center text-slate-400 py-10">Cargando órdenes online...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-bold">No hay pedidos web entrantes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
                
                {/* Cabecera de la tarjeta */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 text-base">Orden #{order.id.toString().padStart(5, '0')}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </p>
                  </div>
                  <span className="text-lg font-black text-slate-900">$ {Number(order.total_amount).toLocaleString('es-AR')}</span>
                </div>

                {/* Info del Cliente */}
                <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-700">{order.customer_name} ({order.customer_phone})</p>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    {order.delivery_type === 'STORE_PICKUP' ? <Store className="w-3.5 h-3.5 text-indigo-600" /> : <Truck className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{order.delivery_type === 'STORE_PICKUP' ? 'Retira por Local' : `Envío a: ${order.customer_address}`}</span>
                  </div>
                </div>

                {/* Ítems del Pedido */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Productos:</span>
                  {order.items?.map(it => (
                    <div key={it.id} className="flex justify-between text-slate-700 font-medium">
                      <span>{it.quantity}x {it.product_name}</span>
                      <span className="font-bold text-slate-900">$ {Number(it.unit_price * it.quantity).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>

                {/* Acciones de Estado */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Tomar y Preparar
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Marcar Listo para Entrega
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completar / Entregar</span>
                    </button>
                  )}

                  {order.status === 'DELIVERED' && (
                    <div className="w-full text-center py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl">
                      ✓ Pedido finalizado
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

    </div>
  );
}