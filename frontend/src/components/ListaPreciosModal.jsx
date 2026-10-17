import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  ShoppingBag, 
  Sparkles, 
  ChefHat,
  Tag,
  PackageCheck
} from 'lucide-react';
import { api } from '../api';

export default function ListaPreciosModal({ presentaciones, onClose }) {
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  if (!presentaciones) return null;

  const categorias = ['todas', ...Array.from(new Set(presentaciones.map(p => p.categoria || 'Packs & Bandejas')))];

  const listaFiltrada = categoriaFiltro === 'todas'
    ? presentaciones
    : presentaciones.filter(p => (p.categoria || 'Packs & Bandejas') === categoriaFiltro);

  // Agrupado por categoría para la carta
  const gruposPorCategoria = listaFiltrada.reduce((acc, p) => {
    const cat = p.categoria || 'Packs & Bandejas';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const handlePrint = () => {
    const modalEl = document.getElementById('lista-precios-modal');
    if (modalEl) modalEl.scrollTop = 0;
    const scrollEl = document.querySelector('.print-scroll-container');
    if (scrollEl) scrollEl.scrollTop = 0;

    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleExportCsv = () => {
    window.open(api.exportListaPreciosCsvUrl(), '_blank');
  };

  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return createPortal(
    <div 
      id="lista-precios-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto print-root"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[94vh] print-card">
        
        {/* Barra superior de acciones para Pantalla (Oculta en Impresión) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200">
                Lista Oficial de Precios Redondeados
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                Carta Comercial para Clientes & Mostrador
              </h2>
              <p className="text-xs text-emerald-100">
                Precios listos para imprimir, feria o compartir por WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Descargar archivo Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de Categoría en Pantalla */}
        <div className="no-print px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-500 whitespace-nowrap">Filtrar vista:</span>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1 rounded-full font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                categoriaFiltro === cat
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Contenido Imprimible de la Carta de Precios */}
        <div className="print-scroll-container overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 text-slate-800 bg-white">
          
          {/* Header de la Panadería */}
          <div className="border-b-2 border-emerald-700/80 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md print:border print:border-amber-600">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight print:text-xl">
                  PANADERÍA ARTESANAL
                </h1>
                <p className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
                  Lista de Precios & Presentaciones Comerciales
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Fecha de vigencia
              </span>
              <span className="text-xs font-bold text-slate-700 capitalize">
                {fechaHoy}
              </span>
            </div>
          </div>

          {/* Listado de Productos Agrupados */}
          {Object.keys(gruposPorCategoria).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No hay presentaciones comerciales registradas en esta categoría.
            </div>
          ) : (
            Object.entries(gruposPorCategoria).map(([categoria, items]) => (
              <div key={categoria} className="space-y-3 avoid-break">
                {/* Título de la Categoría */}
                <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-200">
                  <Tag className="w-4 h-4 text-emerald-600 print:text-slate-700" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {categoria}
                  </h3>
                </div>

                {/* Tabla de Presentaciones */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2 px-3">Presentación / Pack</th>
                      <th className="py-2 px-3">Contenido & Elaboración</th>
                      <th className="py-2 px-3 text-right">Precio de Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {items.map((p) => {
                      const componentesStr = p.items && p.items.length > 0
                        ? p.items.map(it => `${it.cantidad}x ${it.receta_nombre}`).join(' + ')
                        : 'Receta individual';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 align-top font-bold text-slate-900 text-sm">
                            <div className="flex items-center space-x-1.5">
                              <span>{p.nombre}</span>
                            </div>
                            {p.packaging_nombre && (
                              <div className="text-[11px] font-normal text-slate-500 mt-0.5 flex items-center space-x-1">
                                <PackageCheck className="w-3 h-3 text-emerald-600" />
                                <span>{p.cantidad_packaging > 1 ? `${p.cantidad_packaging}x ` : ''}{p.packaging_nombre}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 align-top text-slate-600">
                            <p className="font-medium text-slate-800 text-xs">{componentesStr}</p>
                            {p.descripcion && (
                              <p className="text-[11px] text-slate-400 italic mt-0.5">{p.descripcion}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                            <span className="inline-block px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-base print:bg-white print:border-slate-800 print:text-slate-900">
                              $ {p.precio_venta_final?.toLocaleString('es-AR')}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              redondeo mult. ${p.redondeo_multiplo}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}

          {/* Información al pie de la Carta */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center space-y-1 text-slate-500 text-xs avoid-break">
            <p className="font-semibold text-slate-700">
              Elaboración 100% casera con ingredientes seleccionados de primera calidad.
            </p>
            <p className="text-[11px] text-slate-400">
              Precios expresados en pesos argentinos (ARS). Consultá por opciones surtidas y pedidos para eventos.
            </p>
          </div>

        </div>

        {/* Footer en Pantalla */}
        <div className="no-print px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total presentaciones disponibles: <b>{listaFiltrada.length}</b>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
