import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import InsumosView from './components/InsumosView';
import RecetasView from './components/RecetasView';
import ProduccionView from './components/ProduccionView';
import SimuladorView from './components/SimuladorView';
import VentasView from './components/VentasView';
import ConfigModal from './components/ConfigModal';
import PinModal from './components/PinModal';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { api, hasAdminToken, clearAdminToken } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('recetas');
  const [simuladorRecetaId, setSimuladorRecetaId] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(hasAdminToken());
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

  // Escuchar cambios de autenticación globales
  useEffect(() => {
    const handleAuthChanged = (e) => {
      setIsAdmin(e.detail.isAdmin);
    };

    const handleAuthRequired = (e) => {
      setIsPinModalOpen(true);
      if (e.detail?.message) {
        showNotification(e.detail.message, 'warning');
      }
    };

    window.addEventListener('admin-auth-changed', handleAuthChanged);
    window.addEventListener('admin-auth-required', handleAuthRequired);

    // Verificar validez del token en el backend
    api.verifyAuth().then((res) => {
      setIsAdmin(res.authenticated);
    });

    return () => {
      window.removeEventListener('admin-auth-changed', handleAuthChanged);
      window.removeEventListener('admin-auth-required', handleAuthRequired);
    };
  }, []);

  const handleLock = () => {
    clearAdminToken();
    showNotification('Sesión bloqueada. Ahora estás en modo solo lectura.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-10">
      {/* Toast de notificaciones flotante (abajo a la derecha para no tapar botones superiores) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom duration-200">
          <div className={`px-4 py-3.5 rounded-2xl shadow-xl border flex items-center space-x-3 text-xs sm:text-sm font-semibold ${
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
            <button onClick={() => setToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barra de navegación superior con estado de bloqueo */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenConfig={() => setIsConfigOpen(true)}
        isAdmin={isAdmin}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onLock={handleLock}
      />

      {/* Contenedor principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'recetas' && (
          <RecetasView 
            isAdmin={isAdmin}
            onRequirePin={() => setIsPinModalOpen(true)}
            onNotify={showNotification} 
            onSelectParaSimulador={handleIrASimulador} 
          />
        )}
        {activeTab === 'ventas' && (
          <VentasView 
            isAdmin={isAdmin}
            onRequirePin={() => setIsPinModalOpen(true)}
            onNotify={showNotification} 
          />
        )}
        {activeTab === 'insumos' && (
          <InsumosView 
            isAdmin={isAdmin}
            onRequirePin={() => setIsPinModalOpen(true)}
            onNotify={showNotification} 
          />
        )}
        {activeTab === 'produccion' && (
          <ProduccionView 
            isAdmin={isAdmin}
            onRequirePin={() => setIsPinModalOpen(true)}
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
        isAdmin={isAdmin}
        onRequirePin={() => setIsPinModalOpen(true)}
        onNotify={showNotification}
      />

      {/* Modal de Desbloqueo / Cambio de PIN Maestro */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onAuthSuccess={() => setIsAdmin(true)}
        onNotify={showNotification}
      />
    </div>
  );
}
