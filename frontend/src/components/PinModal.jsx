import React, { useState } from 'react';
import { Lock, Unlock, Key, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function PinModal({ isOpen, onClose, onAuthSuccess, onNotify }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('unlock'); // 'unlock' o 'change'
  
  // Para cambio de PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  if (!isOpen) return null;

  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('Por favor ingresá el PIN.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.loginPin(pin.trim());
      onNotify('¡Modo Edición Desbloqueado con éxito!', 'success');
      setPin('');
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'PIN incorrecto. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    if (e) e.preventDefault();
    if (!currentPin.trim() || !newPin.trim()) {
      setError('Por favor completá todos los campos.');
      return;
    }
    if (newPin.trim().length < 4) {
      setError('El nuevo PIN debe tener al menos 4 caracteres o números.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('La confirmación del nuevo PIN no coincide.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.changePin(currentPin.trim(), newPin.trim());
      onNotify('¡PIN de seguridad actualizado con éxito!', 'success');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setMode('unlock');
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al cambiar PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (num) => {
    if (mode === 'unlock') {
      if (pin.length < 10) setPin((prev) => prev + num);
    }
  };

  const handleDeleteNumber = () => {
    if (mode === 'unlock') {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-100 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'unlock' ? (
          <div>
            {/* Cabecera */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Modo Administrador</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingresá el PIN maestro de la panadería para habilitar la edición de recetas, precios e insumos.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Input PIN */}
            <form onSubmit={handleUnlock}>
              <div className="mb-4">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              {/* Botón principal */}
              <button
                type="submit"
                disabled={loading || !pin}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md shadow-amber-200 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Desbloquear Edición</span>
                  </>
                )}
              </button>
            </form>

            {/* Teclado numérico táctil para celular */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNumberClick(n.toString())}
                  className="py-2.5 bg-slate-50 hover:bg-amber-50 active:bg-amber-100 text-slate-700 rounded-xl font-semibold text-lg border border-slate-100 transition-colors"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMode('change')}
                className="py-2.5 text-xs text-amber-700 hover:bg-amber-50 rounded-xl font-medium border border-transparent transition-colors flex items-center justify-center"
                title="Cambiar PIN"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="py-2.5 bg-slate-50 hover:bg-amber-50 active:bg-amber-100 text-slate-700 rounded-xl font-semibold text-lg border border-slate-100 transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteNumber}
                className="py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-500 active:text-rose-600 rounded-xl font-medium text-xs border border-slate-100 transition-colors"
              >
                Borrar
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal de cambio de PIN */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <Key className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Cambiar PIN Maestro</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingresá tu PIN actual y elegí una nueva clave de acceso de 4 o más dígitos.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PIN Actual</label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="PIN actual"
                  className="w-full text-center text-lg font-mono py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nuevo PIN (mínimo 4 dígitos)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Nuevo PIN"
                  className="w-full text-center text-lg font-mono py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar Nuevo PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Repetir nuevo PIN"
                  className="w-full text-center text-lg font-mono py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('unlock');
                    setError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading || !currentPin || !newPin || !confirmPin}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Guardar Nuevo PIN</span>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
