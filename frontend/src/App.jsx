import React, { useState } from 'react';
import Navbar from './components/Navbar';
import InsumosView from './components/InsumosView';
import RecetasView from './components/RecetasView';
import ProduccionView from './components/ProduccionView';
import SimuladorView from './components/SimuladorView';
import ConfigModal from './components/ConfigModal';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('recetas');
  const [simuladorRecetaId, setSimuladorRecetaId] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleIrASimulador = (recetaId) => {
    setSimuladorRecetaId(recetaId);
    setActiveTab('simulador');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-10">
      {/* Toast de notificaciones flotante */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-top duration-200">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-center space-x-3 text-xs sm:text-sm font-medium ${
            toast.type === 'error' 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : toast.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barra de navegación superior */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenConfig={() => setIsConfigOpen(true)} 
      />

      {/* Contenedor principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'recetas' && (
          <RecetasView 
            onNotify={showNotification} 
            onSelectParaSimulador={handleIrASimulador} 
          />
        )}
        {activeTab === 'insumos' && (
          <InsumosView 
            onNotify={showNotification} 
          />
        )}
        {activeTab === 'produccion' && (
          <ProduccionView 
            onNotify={showNotification} 
          />
        )}
        {activeTab === 'simulador' && (
          <SimuladorView 
            recetaIdInicial={simuladorRecetaId} 
            onNotify={showNotification} 
          />
        )}
      </main>

      {/* Modal de Configuración */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onNotify={showNotification}
      />
    </div>
  );
}
