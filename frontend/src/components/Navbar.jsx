import React from 'react';
import { 
  UtensilsCrossed, 
  Package, 
  Clock, 
  TrendingUp, 
  ShoppingBag,
  Settings,
  Flame,
  Lock,
  Unlock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenConfig, isAdmin, onOpenPinModal, onLock }) {
  const navItems = [
    { id: 'recetas', label: 'Recetas & Costos', shortLabel: 'Recetas', icon: UtensilsCrossed },
    { id: 'ventas', label: 'Ventas & Packs', shortLabel: 'Ventas', icon: ShoppingBag },
    { id: 'insumos', label: 'Insumos & Packaging', shortLabel: 'Insumos', icon: Package },
    { id: 'produccion', label: 'Mano de Obra', shortLabel: 'Horas', icon: Clock },
    { id: 'simulador', label: 'Simulador', shortLabel: 'Simular', icon: TrendingUp },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3 min-h-[72px]">
          
          {/* Logo y Marca (sin recortes ni desbordes) */}
          <div 
            className="flex items-center space-x-3 cursor-pointer shrink-0 group" 
            onClick={() => setActiveTab('recetas')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center space-x-2">
                <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                  Panadería Costos
                </span>
                <span className="hidden xl:inline-block text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Artesanal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap mt-0.5">
                Escandallo puro, stock y precios de venta
              </p>
            </div>
          </div>

          {/* Menú de navegación Desktop en píldora segmentada (sin saltos de línea) */}
          <nav className="hidden lg:flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Acciones derechas: Candado Modo Admin / Lectura + Configuración */}
          <div className="flex items-center space-x-2 shrink-0">
            {isAdmin ? (
              <button
                onClick={onLock}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-rose-50 text-emerald-800 hover:text-rose-700 border border-emerald-200 hover:border-rose-200 transition-colors flex items-center space-x-1.5 text-xs font-bold whitespace-nowrap shrink-0 group cursor-pointer"
                title="Hacer clic para bloquear y volver a Solo Lectura"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600 group-hover:hidden shrink-0" />
                <Lock className="w-3.5 h-3.5 text-rose-600 hidden group-hover:block shrink-0" />
                <span className="group-hover:hidden">Admin Activo</span>
                <span className="hidden group-hover:inline">Bloquear</span>
              </button>
            ) : (
              <button
                onClick={onOpenPinModal}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition-all flex items-center space-x-1.5 text-xs font-bold whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
                title="Ingresar PIN para habilitar edición"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Solo Lectura</span>
              </button>
            )}

            <button
              onClick={onOpenConfig}
              className="px-3 py-2 text-slate-600 hover:text-amber-800 bg-slate-50 hover:bg-amber-50 border border-slate-200/80 rounded-xl transition-colors flex items-center space-x-1.5 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              title="Configurar valor hora y márgenes"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de navegación secundaria para Tablets y Celulares (< lg) */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/80 px-2 py-1.5">
        <div className="max-w-7xl mx-auto grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-amber-600 text-white font-bold shadow-2xs' 
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 font-medium'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 mb-0.5 sm:mb-0" />
                <span className="text-[11px] leading-tight text-center whitespace-nowrap">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
