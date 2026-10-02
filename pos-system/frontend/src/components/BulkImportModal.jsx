import { useState, useRef } from 'react';
import { UploadCloud, Download, X, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BulkImportModal({ isOpen, onClose, onSuccess }) {
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Descargar plantilla de ejemplo
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        barcode: '7791234567890',
        name: 'Gaseosa Cola 2.25L',
        category: 'Bebidas',
        cost_price: 1800,
        sale_price: 2600,
        stock: 24
      },
      {
        barcode: '7799876543210',
        name: 'Galletitas de Chocolate 150g',
        category: 'Almacén',
        cost_price: 600,
        sale_price: 950,
        stock: 40
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PlantillaProductos');
    XLSX.writeFile(wb, 'plantilla_productos_nexo.xlsx');
  };

  // Leer archivo Excel / CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setErrorMsg('El archivo no contiene filas o datos válidos.');
          return;
        }

        // Sanitización de columnas
        const normalized = data.map(row => ({
          barcode: row.barcode || row.Codigo || row.codigo || row['Código de Barras'] || '',
          name: row.name || row.Nombre || row.nombre || row.Descripcion || row.descripcion || '',
          category: row.category || row.Categoria || row.categoria || 'Varios',
          cost_price: Number(row.cost_price || row.Costo || row.costo || 0),
          sale_price: Number(row.sale_price || row.Precio || row.precio || row['Precio Venta'] || 0),
          stock: Number(row.stock || row.Stock || row.stock || row.Cantidad || 0)
        })).filter(item => item.name && item.sale_price > 0);

        if (normalized.length === 0) {
          setErrorMsg('No se detectaron productos válidos con Nombre y Precio de Venta.');
          return;
        }

        setParsedData(normalized);
      } catch (err) {
        setErrorMsg('Error al procesar el archivo. Verifique el formato.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Enviar al Backend
  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedData })
      });

      if (!res.ok) throw new Error('Error al importar en el servidor');
      const data = await res.json();

      onSuccess(data.count);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Carga Masiva de Productos (Excel / CSV)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          
          {/* Descarga Plantilla */}
          <div className="flex justify-between items-center bg-blue-50/60 border border-blue-100 p-3 rounded-xl text-xs text-blue-900">
            <div>
              <p className="font-bold">¿Primera vez que vas a cargar mercadería?</p>
              <p className="text-blue-700">Descargá nuestra plantilla base para completar tus artículos.</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla Excel</span>
            </button>
          </div>

          {/* Zona de Drop / Carga */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition"
          >
            <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
            <p className="font-bold text-slate-700 text-sm">Hacé clic para seleccionar tu archivo Excel (.xlsx, .xls) o CSV</p>
            <p className="text-xs text-slate-400 mt-1">{fileName || 'Ningún archivo seleccionado'}</p>
            <input 
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Previsualización */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Vista Previa: {parsedData.length} productos listos para procesar</span>
                <span className="text-emerald-600">✓ Formato válido</span>
              </div>
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2">Código</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Categoría</th>
                      <th className="p-2 text-right">Costo</th>
                      <th className="p-2 text-right">Venta</th>
                      <th className="p-2 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedData.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-500">{p.barcode || '-'}</td>
                        <td className="p-2 font-bold text-slate-800">{p.name}</td>
                        <td className="p-2 text-slate-600">{p.category}</td>
                        <td className="p-2 text-right text-slate-500">${p.cost_price}</td>
                        <td className="p-2 text-right font-bold text-slate-900">${p.sale_price}</td>
                        <td className="p-2 text-center">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-[11px] text-slate-400 text-center">...y {parsedData.length - 5} productos más.</p>
              )}
            </div>
          )}

        </div>

        {/* Acciones */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 rounded-xl text-sm transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0 || loading}
            onClick={handleConfirmImport}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 font-bold text-white rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Importando...' : `Confirmar Importación (${parsedData.length})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}