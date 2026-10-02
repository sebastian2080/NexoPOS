import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Check, Database, Download, ShieldCheck, Store, Printer } from 'lucide-react';

export default function SettingsManager({ onBackToMenu }) {
  const [formData, setFormData] = useState({
    name: 'MI COMERCIO',
    cuit: '20-12345678-9',
    address: 'Av. Principal 1234',
    phone: '11 2345-6789',
    footer_text: '¡Gracias por su compra!'
  });

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4000/api/settings/business-info')
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setFormData({
            name: data.name || '',
            cuit: data.cuit || '',
            address: data.address || '',
            phone: data.phone || '',
            footer_text: data.footer_text || ''
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/settings/business-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Error al guardar ajustes');

      setNotice('¡Datos del comercio actualizados con éxito!');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadBackup = () => {
    setDownloadingBackup(true);
    // Dispara la descarga directa desde el navegador
    window.location.href = 'http://localhost:4000/api/settings/backup';
    setTimeout(() => {
      setDownloadingBackup(false);
    }, 1500);
  };

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
            <h1 className="text-lg font-bold leading-tight">Ajustes & Configuración</h1>
            <p className="text-xs text-slate-400">Datos comerciales, ticket térmico y copias de seguridad</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto p-6 space-y-6">
        
        {notice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}

        {/* 1. Datos del Comercio y Ticket */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Información del Negocio (Cabecera de Ticket)</h3>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Comercial / Razón Social</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CUIT / Identificación Fiscal</label>
                <input
                  type="text"
                  value={formData.cuit}
                  onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección / Sucursal</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono / WhatsApp de Contacto</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensaje al Pie del Ticket</label>
              <input
                type="text"
                value={formData.footer_text}
                onChange={e => setFormData({ ...formData, footer_text: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Sección Copia de Seguridad */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Respaldo & Base de Datos</h3>
          </div>

          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-800 text-sm">Copia de Seguridad Local (SQLite)</h4>
              </div>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Descargá una copia idéntica y completa de todos tus productos, ventas, clientes, registros de caja y gastos. Guardá este archivo en un pendrive o en Google Drive periódicamente.
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95 shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingBackup ? 'Descargando...' : 'Descargar Backup (.sqlite)'}</span>
            </button>
          </div>
        </div>

      </main>

    </div>
  );
}