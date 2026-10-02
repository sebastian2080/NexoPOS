import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Trash2, ShoppingCart, CreditCard, Plus, Minus, X, ArrowLeft, UserCheck, Keyboard, LogOut, Shield } from 'lucide-react';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import QuickProductModal from './QuickProductModal';
import { useBarcodeAndShortcuts } from '../hooks/useBarcodeAndShortcuts';

export default function PosTerminal({ onBackToMenu, currentUser, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para alta rápida con lector
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const searchInputRef = useRef(null);

  // Estados para Vendedores
  const [sellerCode, setSellerCode] = useState('');
  const [isSellerModuleEnabled, setIsSellerModuleEnabled] = useState(false);

  const fetchProducts = () => {
    fetch('http://localhost:4000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al conectar con la API:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();

    fetch('http://localhost:4000/api/sellers/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg && typeof cfg.enabled === 'boolean') {
          setIsSellerModuleEnabled(cfg.enabled);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddToCart = useCallback((product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Manejo de lectura automática del scanner USB
  const handleBarcodeScanned = useCallback((code) => {
    if (isPaymentOpen || isReceiptOpen || isQuickAddOpen) return;

    const trimmedCode = code.trim();
    const found = products.find(p => String(p.barcode) === trimmedCode || String(p.id) === trimmedCode);

    if (found) {
      handleAddToCart(found);
    } else {
      setScannedBarcode(trimmedCode);
      setIsQuickAddOpen(true);
    }
  }, [products, isPaymentOpen, isReceiptOpen, isQuickAddOpen, handleAddToCart]);

  const handleEscapeKey = useCallback(() => {
    if (isQuickAddOpen) setIsQuickAddOpen(false);
    else if (isReceiptOpen) setIsReceiptOpen(false);
    else if (isPaymentOpen) setIsPaymentOpen(false);
  }, [isQuickAddOpen, isReceiptOpen, isPaymentOpen]);

  // Hook global de atajos y lectura de barras
  useBarcodeAndShortcuts({
    onBarcodeScan: handleBarcodeScanned,
    onFocusSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onQuickCheckout: () => {
      if (cartItems.length > 0 && !isPaymentOpen && !isReceiptOpen && !isQuickAddOpen) {
        setIsPaymentOpen(true);
      }
    },
    onClearCart: handleClearCart,
    onEscape: handleEscapeKey
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      const exactMatch = products.find(p => p.barcode === query || p.name.toLowerCase() === query.toLowerCase());

      if (exactMatch) {
        handleAddToCart(exactMatch);
        setSearchQuery('');
      } else {
        setScannedBarcode(query);
        setIsQuickAddOpen(true);
      }
    }
  };

  const handleProductCreatedQuickly = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    handleAddToCart(newProduct);
    setSearchQuery('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const handleUpdateQuantity = (id, delta) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirmSale = async (paymentData) => {
    setIsProcessing(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.sale_price
        })),
        payment_method: paymentData.payment_method,
        amount_paid: paymentData.amount_paid,
        change_returned: paymentData.change_returned,
        seller_code: isSellerModuleEnabled && sellerCode ? sellerCode.trim().toUpperCase() : null,
        cashier_name: currentUser?.name || 'Cajero'
      };

      const res = await fetch('http://localhost:4000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al registrar la venta');
      const responseData = await res.json();

      setLastSaleReceipt({
        id: responseData.saleId,
        items: [...cartItems],
        total: totalAmount,
        payment_method: paymentData.payment_method,
        amount_paid: paymentData.amount_paid,
        change_returned: paymentData.change_returned,
        seller_code: isSellerModuleEnabled && sellerCode ? sellerCode.trim().toUpperCase() : null,
        cashier_name: currentUser?.name || 'Cajero'
      });

      setCartItems([]);
      setSellerCode('');
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);
      fetchProducts();
    } catch (error) {
      alert('Hubo un error al procesar el cobro: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans select-none">
      
      {/* PANEL IZQUIERDO */}
      <div className="w-[60%] flex flex-col p-4">
        
        <div className="flex items-center gap-3 mb-4">
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={onBackToMenu}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition flex items-center gap-2 font-bold text-sm shadow-sm active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Menú</span>
            </button>
          )}

          <div className="flex-1 bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-slate-200">
            <Search className="text-slate-400 w-5 h-5" />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Buscar o escanear código (F2 / Scanner USB)..."
              className="w-full text-base outline-none bg-transparent font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
          </div>

          {/* Badge de Usuario y Botón de Salir */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                {currentUser.role === 'ADMIN' ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span>{currentUser.name}</span>
              </div>
            )}

            <button
              onClick={onLogout}
              className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95 cursor-pointer"
              title="Cerrar sesión / Cambiar usuario"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Grilla */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-4 overflow-y-auto border border-slate-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Productos disponibles</h2>
          
          {loading ? (
            <p className="text-slate-400">Cargando catálogo...</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button 
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="p-3 border rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition text-left flex flex-col justify-between h-28 active:scale-95 bg-slate-50 border-slate-200 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">{product.category}</span>
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-base font-bold text-blue-600">$ {product.sale_price.toLocaleString('es-AR')}</span>
                    <span className={`text-xs ${product.stock < 5 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Barra Inferior de Atajos */}
        <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Keyboard className="w-4 h-4 text-blue-600" />
            <span>Atajos POS:</span>
          </div>
          <div className="flex gap-4">
            <span><strong className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F2</strong> Buscar</span>
            <span><strong className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F4</strong> Vaciar</span>
            <span><strong className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F12</strong> Cobrar</span>
            <span><strong className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Esc</strong> Cerrar Modal</span>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: Carrito */}
      <div className="w-[40%] bg-white border-l border-slate-300 flex flex-col shadow-lg">
        
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-xl font-bold">Ticket Actual</h2>
          </div>
          
          <button 
            onClick={handleClearCart}
            disabled={cartItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 disabled:opacity-40 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vaciar (F4)</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Sin productos en la orden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex-1 pr-2">
                    <h4 className="font-semibold text-slate-800 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-500">$ {item.sale_price.toLocaleString('es-AR')} c/u</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold text-sm cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-slate-700 w-5 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold text-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right pl-3">
                    <p className="font-bold text-slate-800 text-sm">$ {(item.sale_price * item.quantity).toLocaleString('es-AR')}</p>
                  </div>

                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="ml-2 text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          {isSellerModuleEnabled && (
            <div className="mb-3 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <UserCheck className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Cód. Vendedor:</span>
              <input
                type="text"
                placeholder="Ej: 101"
                value={sellerCode}
                onChange={(e) => setSellerCode(e.target.value)}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase text-slate-800 outline-none focus:border-violet-500"
              />
            </div>
          )}

          <div className="flex justify-between items-baseline mb-4">
            <span className="text-slate-500 font-medium text-sm">Total:</span>
            <span className="text-3xl font-black text-slate-900">
              $ {totalAmount.toLocaleString('es-AR')}
            </span>
          </div>
          
          <button 
            disabled={cartItems.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl text-lg font-bold transition shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>COBRAR (F12)</span>
          </button>
        </div>

      </div>

      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={totalAmount}
        onConfirmSale={handleConfirmSale}
        isProcessing={isProcessing}
      />

      <ReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={lastSaleReceipt}
      />

      <QuickProductModal
        isOpen={isQuickAddOpen}
        barcode={scannedBarcode}
        onClose={() => {
          setIsQuickAddOpen(false);
          searchInputRef.current?.focus();
        }}
        onProductCreated={handleProductCreatedQuickly}
      />

    </div>
  );
}