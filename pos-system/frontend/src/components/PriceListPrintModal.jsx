import { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';

export default function PriceListPrintModal({ isOpen, onClose, products }) {
  const [businessName, setBusinessName] = useState('NEXO POS');

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:4000/api/settings/business-info')
        .then(res => res.json())
        .then(data => {
          if (data && data.name) setBusinessName(data.name);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Agrupar productos por categoría
  const groupedProducts = products.reduce((acc, p) => {
    const cat = p.category || 'Varios';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header no imprimible */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Vista Previa - Lista de Precios Imprimible</h3>
            <p className="text-xs text-slate-400">Formato A4 optimizado para mostrador o PDF</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA DE IMPRESIÓN */}
        <div className="p-8 bg-white text-slate-900 overflow-y-auto font-sans" id="printable-price-list">
          
          {/* Encabezado del documento */}
          <div className="border-b-2 border-slate-900 pb-3 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">{businessName}</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Lista de Precios al Público</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-medium">
              <p>Fecha de emisión: {new Date().toLocaleDateString('es-AR')}</p>
              <p>{products.length} artículos listados</p>
            </div>
          </div>

          {/* Grilla de Categorías y Artículos */}
          <div className="space-y-6">
            {Object.keys(groupedProducts).map((category, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-xs uppercase text-slate-700 tracking-wider mb-2 border-l-4 border-slate-800">
                  {category}
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase">
                      <th className="py-1">Código</th>
                      <th className="py-1">Descripción</th>
                      <th className="py-1 text-right">Precio Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {groupedProducts[category].map(p => (
                      <tr key={p.id}>
                        <td className="py-1.5 font-mono text-slate-400 text-[11px] w-36">{p.barcode || '-'}</td>
                        <td className="py-1.5 text-slate-800 font-semibold">{p.name}</td>
                        <td className="py-1.5 text-right font-black text-slate-900 text-sm w-28">
                          $ {Number(p.sale_price).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Pie */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
            Precios sujetos a modificaciones sin previo aviso • {businessName}
          </div>

        </div>

        {/* Acciones no imprimibles */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-xl text-xs transition"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-black font-bold text-white rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}