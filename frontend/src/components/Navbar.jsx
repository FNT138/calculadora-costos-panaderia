import React from 'react';
import { 
  UtensilsCrossed, 
  Package, 
  Clock, 
  TrendingUp, 
  Settings,
  Flame
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenConfig }) {
  const navItems = [
    { id: 'recetas', label: 'Recetas & Costos', icon: UtensilsCrossed },
    { id: 'insumos', label: 'Insumos & Packaging', icon: Package },
    { id: 'produccion', label: 'Mano de Obra & Horas', icon: Clock },
    { id: 'simulador', label: 'Simulador de Ganancia', icon: TrendingUp },
  ];

  return (
    <header className="bg-white border-b border-amber-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('recetas')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-200">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-800 tracking-tight">Panadería Costos</span>
                <span className="hidden sm:inline-block text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                  Artesanal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Costeo y maximización de precios de venta</p>
            </div>
          </div>

          {/* Menú de navegación desktop */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Botón de configuración */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenConfig}
              className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center space-x-1 text-sm"
              title="Configurar valor hora y márgenes"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-medium">Ajustes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de navegación inferior / responsive para celular */}
      <div className="md:hidden border-t border-slate-100 bg-white grid grid-cols-4 px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors ${
                isActive ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight text-center">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
