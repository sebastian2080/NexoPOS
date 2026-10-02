import { 
  ShoppingCart, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  Package, 
  Percent, 
  ArrowDownRight, 
  PercentCircle, 
  Settings, 
  TrendingUp,
  ArrowRight,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';

export default function DashboardMenu({ onNavigate, currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none pb-12">
      
      {/* Barra superior */}
      <header className="bg-slate-900 text-white px-8 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg shadow-sm">
              N
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight tracking-tight">NEXO POS</h1>
              <p className="text-[11px] text-slate-400">Punto de Venta & Gestión Comercial</p>
            </div>
          </div>

          {/* Estado de Caja + Info Usuario + Botón Salir */}
          <div className="flex items-center gap-3 text-xs">
            
            {/* Badge de Usuario Actual */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-200">
              {currentUser?.role === 'ADMIN' ? (
                <Shield className="w-4 h-4 text-blue-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="font-bold">{currentUser?.name || 'Usuario'}</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">
                {currentUser?.role === 'ADMIN' ? 'Admin' : 'Caja'}
              </span>
            </div>

            {/* Botón de Cerrar Sesión */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold transition active:scale-95 cursor-pointer"
              title="Cerrar sesión / Cambiar usuario"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cambiar Usuario</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl w-full mx-auto px-6 pt-6 flex flex-col gap-6">
        
        {/* BANNER PRINCIPAL: TERMINAL POS */}
        <div>
          <button
            onClick={() => onNavigate('POS')}
            className="w-full bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white p-6 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-between transition duration-200 active:scale-[0.99] group border border-blue-400/30 cursor-pointer"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xs group-hover:scale-105 transition shadow-inner">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black tracking-tight">ABRIR TERMINAL DE VENTAS (POS)</h2>
                  <span className="bg-white/20 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/30">
                    F1
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-1">Cobro ágil, lector de código de barras, medios de pago y tickets térmicos</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white text-blue-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs shrink-0 group-hover:translate-x-1 transition">
              <span>Ir al Mostrador</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 1. SECCIÓN GESTIÓN COMERCIAL & REPORTES */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Gestión Comercial & Ventas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <button
              onClick={() => onNavigate('ANALYTICS')}
              className="bg-white hover:border-blue-500 hover:bg-blue-50/20 border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Métricas & Estadísticas</h4>
                <p className="text-xs text-slate-400 mt-0.5">Facturación, ganancias y ranking</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('SALES_HISTORY')}
              className="bg-white hover:border-emerald-500 hover:bg-emerald-50/20 border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Historial de Ventas</h4>
                <p className="text-xs text-slate-400 mt-0.5">Comprobantes y reimpresión</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('WEB_ORDERS')}
              className="bg-white hover:border-indigo-500 hover:bg-indigo-50/20 border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Pedidos Online</h4>
                <p className="text-xs text-slate-400 mt-0.5">Integración eCommerce web</p>
              </div>
            </button>

          </div>
        </div>

        {/* 2. SECCIÓN MERCADERÍA & FINANZAS */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Catálogo, Caja & Administración
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            <button
              onClick={() => onNavigate('INVENTORY')}
              className="bg-white hover:border-blue-500 hover:bg-blue-50/20 border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between h-32 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit group-hover:scale-105 transition">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Inventario & Precios</h4>
                <p className="text-[11px] text-slate-400">Stock, costos y listas</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('PROMOTIONS')}
              className="bg-white hover:border-rose-500 hover:bg-rose-50/20 border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between h-32 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl w-fit group-hover:scale-105 transition">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Promociones</h4>
                <p className="text-[11px] text-slate-400">Descuentos y combos</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('CASH_REGISTER')}
              className="bg-white hover:border-emerald-500 hover:bg-emerald-50/20 border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between h-32 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:scale-105 transition">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Cierre de Caja</h4>
                <p className="text-[11px] text-slate-400">Arqueo físico y turnos</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('CASH_MOVEMENTS')}
              className="bg-white hover:border-orange-500 hover:bg-orange-50/20 border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between h-32 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl w-fit group-hover:scale-105 transition">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Gastos / Retiros</h4>
                <p className="text-[11px] text-slate-400">Caja chica y egresos</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('COMMISSIONS')}
              className="bg-white hover:border-violet-500 hover:bg-violet-50/20 border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between h-32 transition active:scale-[0.98] text-left group cursor-pointer"
            >
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl w-fit group-hover:scale-105 transition">
                <PercentCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Comisiones</h4>
                <p className="text-[11px] text-slate-400">Vendedores y premios</p>
              </div>
            </button>

          </div>
        </div>

        {/* 3. CONFIGURACIÓN */}
        <div className="pt-2 border-t border-slate-200/60 flex justify-end">
          <button
            onClick={() => onNavigate('SETTINGS')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Ajustes del Local & Ticket</span>
          </button>
        </div>

      </main>

    </div>
  );
}