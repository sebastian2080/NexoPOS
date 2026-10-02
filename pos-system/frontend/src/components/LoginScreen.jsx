import { useState, useEffect } from 'react';
import { Shield, UserCheck, Delete, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    setError('');
    fetch('http://localhost:4000/api/auth/users')
      .then(async res => {
        if (!res.ok) throw new Error('No se pudo conectar con el servidor de autenticación');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          setSelectedUser(data[0]);
        } else {
          setError('No hay usuarios creados en la base de datos.');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error de conexión con el backend: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Soporte para teclado físico (teclado superior y teclado numérico / Numpad)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Convertir teclas de Numpad (Numpad0 -> '0', etc.) o números estándar
      let digit = null;
      if (/^[0-9]$/.test(e.key)) {
        digit = e.key;
      } else if (e.code && e.code.startsWith('Numpad') && /^[0-9]$/.test(e.code.replace('Numpad', ''))) {
        digit = e.code.replace('Numpad', '');
      }

      if (digit !== null) {
        if (pin.length < 6) {
          const nextPin = pin + digit;
          setPin(nextPin);
          setError('');
          if (nextPin.length === 4) {
            submitLogin(nextPin);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitLogin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedUser]);

  const submitLogin = async (currentPin) => {
    if (!selectedUser) {
      setError('Seleccioná un perfil de usuario primero');
      return;
    }
    if (!currentPin) {
      setError('Ingresá tu PIN de 4 dígitos');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, pin: currentPin })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN incorrecto');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (digit) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        submitLogin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-white">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-400 font-bold text-sm">Cargando perfiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-600/30 mb-3">
          N
        </div>
        <h1 className="text-xl font-black text-white">NEXO POS</h1>
        <p className="text-xs text-slate-400 mb-6">Seleccioná tu usuario e ingresá tu PIN</p>

        {/* Mensaje de Error / Conexión */}
        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Selector de Usuarios */}
        <div className="w-full flex gap-2 mb-6">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUser(u);
                setPin('');
                setError('');
              }}
              className={`flex-1 py-3 px-2 rounded-2xl border flex flex-col items-center gap-1 transition ${
                selectedUser?.id === u.id
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {u.role === 'ADMIN' ? <Shield className="w-5 h-5 text-blue-400" /> : <UserCheck className="w-5 h-5 text-emerald-400" />}
              <span className="text-xs font-bold truncate max-w-full">{u.name}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-60 font-semibold">
                {u.role === 'ADMIN' ? 'Dueño' : 'Cajero'}
              </span>
            </button>
          ))}
        </div>

        {/* Indicadores de PIN */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pin.length > idx ? 'bg-blue-500 border-blue-500 scale-110' : 'border-slate-700 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={submitting}
              className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-2xl font-black text-xl text-white transition active:scale-95 border border-slate-700/50 disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="h-14 bg-slate-800/40 hover:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={submitting}
            className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-2xl font-black text-xl text-white transition active:scale-95 border border-slate-700/50 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={() => submitLogin(pin)}
            disabled={pin.length === 0 || submitting}
            className="h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800/40 disabled:text-slate-600 rounded-2xl flex items-center justify-center text-white transition active:scale-95"
          >
            {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
          </button>
        </div>

        <p className="text-[10px] text-slate-500 mt-6 text-center">
          Admin: <strong className="text-slate-400">1234</strong> | Cajero: <strong className="text-slate-400">0000</strong>
        </p>

      </div>
    </div>
  );
}