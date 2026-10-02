import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Plus, Search, Edit2, Check, X, Package, AlertTriangle, FileSpreadsheet, TrendingUp, Download, Printer } from 'lucide-react';
import BulkImportModal from './BulkImportModal';
import BulkPriceUpdateModal from './BulkPriceUpdateModal';
import PriceListPrintModal from './PriceListPrintModal';

export default function InventoryManager({ onBackToMenu }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para modales y avisos
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPriceUpdateModalOpen, setIsPriceUpdateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [importNotice, setImportNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'Almacén',
    cost_price: '',
    sale_price: '',
    stock: ''
  });

  const loadProducts = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        stock: product.stock
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: '',
        name: '',
        category: 'Almacén',
        cost_price: '',
        sale_price: '',
        stock: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingProduct 
      ? `http://localhost:4000/api/products/${editingProduct.id}`
      : 'http://localhost:4000/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cost_price: Number(formData.cost_price) || 0,
          sale_price: Number(formData.sale_price) || 0,
          stock: Number(formData.stock) || 0
        })
      });

      if (!res.ok) throw new Error('Error al guardar producto');

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Exportar inventario completo a Excel (.xlsx)
  const handleExportExcel = () => {
    if (products.length === 0) {
      alert('No hay productos para exportar.');
      return;
    }

    const exportData = products.map(p => ({
      'Código de Barras': p.barcode || '',
      'Nombre / Descripción': p.name,
      'Categoría': p.category,
      'Precio Costo': p.cost_price,
      'Precio Venta': p.sale_price,
      'Margen (%)': p.cost_price > 0 ? Math.round(((p.sale_price - p.cost_price) / p.cost_price) * 100) : 100,
      'Stock Actual': p.stock
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_nexopos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

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
            <h1 className="text-lg font-bold leading-tight">Inventario y Lista de Precios</h1>
            <p className="text-xs text-slate-400">Control de stock, costos y márgenes de ganancia</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Exportar a Excel */}
          <button
            onClick={handleExportExcel}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition active:scale-95 shadow-sm"
            title="Exportar inventario a Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Imprimir Lista PDF / Mostrador */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition active:scale-95 shadow-sm"
            title="Imprimir lista de precios / PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Ajustar Precios Masivamente */}
          <button
            onClick={() => setIsPriceUpdateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl text-sm font-bold text-white transition active:scale-95 shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ajustar Precios (%)</span>
          </button>

          {/* Importar Masivamente */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold text-white transition active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>

          {/* Nuevo Producto */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold text-white transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 space-y-4">
        
        {/* Aviso de confirmación */}
        {importNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Barra de Filtro */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <Search className="text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Filtrar por nombre, código de barras o categoría..."
            className="w-full text-sm outline-none bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Descripción</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5 text-right">Costo</th>
                <th className="p-3.5 text-right">Venta</th>
                <th className="p-3.5 text-right">Margen</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-400">Cargando catálogo...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-400">No se encontraron productos</td>
                </tr>
              ) : (
                filtered.map(p => {
                  const margin = p.cost_price > 0 
                    ? Math.round(((p.sale_price - p.cost_price) / p.cost_price) * 100) 
                    : 100;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono text-slate-500">{p.barcode}</td>
                      <td className="p-3.5 font-bold text-slate-800 text-sm">{p.name}</td>
                      <td className="p-3.5 text-slate-600">{p.category}</td>
                      <td className="p-3.5 text-right text-slate-500">$ {Number(p.cost_price).toLocaleString('es-AR')}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 text-sm">$ {Number(p.sale_price).toLocaleString('es-AR')}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
                          +{margin}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${
                          p.stock < 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.stock < 5 && <AlertTriangle className="w-3 h-3" />}
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modal de Alta / Edición Individual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                {editingProduct ? 'Editar Producto' : 'Cargar Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre / Descripción</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código de Barras</label>
                  <input 
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Opcional / Escaneo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                  <input 
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Costo</label>
                  <input 
                    type="number"
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Venta</label>
                  <input 
                    type="number"
                    required
                    value={formData.sale_price}
                    onChange={e => setFormData({...formData, sale_price: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Actual</label>
                  <input 
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  />
                </div>
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
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded-xl text-sm transition shadow-sm"
                >
                  Guardar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal de Carga Masiva */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(count) => {
          setImportNotice(`¡Se importaron ${count} productos con éxito!`);
          setTimeout(() => setImportNotice(''), 4000);
          loadProducts();
        }}
      />

      {/* Modal de Aumento Masivo de Precios */}
      <BulkPriceUpdateModal
        isOpen={isPriceUpdateModalOpen}
        onClose={() => setIsPriceUpdateModalOpen(false)}
        categories={uniqueCategories}
        onSuccess={(count, pct) => {
          setImportNotice(`¡Se actualizaron los precios de ${count} productos (+${pct}%) correctamente!`);
          setTimeout(() => setImportNotice(''), 4000);
          loadProducts();
        }}
      />

      {/* Modal Lista de Precios Imprimible */}
      <PriceListPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        products={filtered}
      />

    </div>
  );
}