import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Sparkles, 
  AlertCircle,
  ChefHat
} from 'lucide-react';

export default function InformeProduccionModal({ sesion, onClose }) {
  if (!sesion) return null;

  const fechaStr = new Date(sesion.fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const horasTaller = Number(sesion.horas_trabajadas) || 1;
  const horasActivas = Number(sesion.horas_activas) || 0.5;
  const horasPasivas = Math.max(0, horasTaller - horasActivas);

  const handlePrint = () => {
    // Resetear el scroll al tope antes de imprimir para que el navegador no capture el scroll desplazado
    const modalEl = document.getElementById('informe-produccion-modal');
    if (modalEl) modalEl.scrollTop = 0;
    const scrollEl = document.querySelector('.print-scroll-container');
    if (scrollEl) scrollEl.scrollTop = 0;

    setTimeout(() => {
      window.print();
    }, 120);
  };

  return createPortal(
    <div 
      id="informe-produccion-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto print-root"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[94vh] print-card">
        
        {/* Cabecera para Pantalla (Oculta en Impresión) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-200">
                Informe Oficial de Producción & Costos
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                {sesion.titulo}
              </h2>
              <p className="text-xs text-amber-100 capitalize">
                {fechaStr}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Imprimir informe o guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cabecera Exclusiva para Impresión / PDF */}
        <div className="hidden print:block p-4 border-b-2 border-amber-600 mb-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700 block">
                Panadería & Pastelería Artesanal
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Informe Oficial de Producción & Costos
              </h1>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {sesion.titulo}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 space-y-0.5">
              <div>Fecha: <b className="capitalize text-slate-800">{fechaStr}</b></div>
              <div>Valor Hora Taller: <b className="text-slate-800">${sesion.costo_hora_mano_obra?.toLocaleString('es-AR')}/h</b></div>
              <div>Producción Total: <b className="text-slate-800">{sesion.total_unidades_producidas} unidades</b></div>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable en pantalla / expandido en papel */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto print-scroll-container">
          
          {/* 1. Métricas Financieras Principales (KPIs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 avoid-break">
            
            {/* Inversión en Insumos */}
            <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-2xl print:bg-white print:border-slate-300 print:rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Inversión Insumos</span>
                <ShoppingBag className="w-4 h-4 text-slate-400 no-print" />
              </div>
              <div className="text-base sm:text-xl font-black text-slate-900">
                ${Number(sesion.inversion_total_insumos || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                Ingredientes + Packaging
              </p>
            </div>

            {/* Salario Ganado */}
            <div className="bg-amber-50/70 border border-amber-200/70 p-3 sm:p-4 rounded-2xl print:bg-white print:border-slate-300 print:rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-900 print:text-slate-600">Salario Ganado</span>
                <Clock className="w-4 h-4 text-amber-600 no-print" />
              </div>
              <div className="text-base sm:text-xl font-black text-amber-950 print:text-slate-900">
                ${Number(sesion.costo_mano_obra_activa || (horasActivas * sesion.costo_hora_mano_obra)).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[9px] sm:text-[10px] text-amber-800/90 print:text-slate-500 mt-0.5">
                Por {horasActivas.toFixed(1)}h de trabajo activo
              </p>
            </div>

            {/* Venta Proyectada */}
            <div className="bg-blue-50/70 border border-blue-200/70 p-3 sm:p-4 rounded-2xl print:bg-white print:border-slate-300 print:rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-900 print:text-slate-600">Venta Estimada</span>
                <DollarSign className="w-4 h-4 text-blue-600 no-print" />
              </div>
              <div className="text-base sm:text-xl font-black text-blue-950 print:text-slate-900">
                ${Number(sesion.ingreso_estimado_sugerido || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[9px] sm:text-[10px] text-blue-800/90 print:text-slate-500 mt-0.5">
                Total por {sesion.total_unidades_producidas} unidades
              </p>
            </div>

            {/* Ganancia Neta Limpia */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 sm:p-4 rounded-2xl print:bg-white print:border-slate-300 print:rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-900 print:text-slate-600">Ganancia Neta</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 no-print" />
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-900 print:text-slate-900">
                ${Number(sesion.ganancia_neta_estimada || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[9px] sm:text-[10px] text-emerald-800/90 print:text-slate-500 mt-0.5">
                Beneficio limpio de bolsillo
              </p>
            </div>

          </div>

          {/* 2. Balance de Tiempos: Tiempo Activo vs Horas de Taller */}
          <div className="bg-amber-50/50 rounded-2xl p-3.5 sm:p-4 border border-amber-200/60 space-y-2.5 avoid-break print:bg-slate-50/60 print:border-slate-300 print:rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-600 no-print" />
                <span>Balance de Tiempos: Mano de Obra Activa vs. Taller & Horneado</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-lg print:border print:border-slate-300">
                ${sesion.costo_hora_mano_obra?.toLocaleString('es-AR')}/h
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 text-center sm:text-left print:border-slate-300">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">Horas Taller</span>
                <div className="text-sm sm:text-base font-black text-slate-800 mt-0.5">{horasTaller} hs</div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Jornada declarada</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200/70 text-center sm:text-left print:border-slate-300">
                <span className="text-[9px] sm:text-[10px] text-emerald-700 uppercase font-bold block">Tiempo Activo</span>
                <div className="text-sm sm:text-base font-black text-emerald-900 mt-0.5">{horasActivas.toFixed(1)} hs ({Math.round(horasActivas * 60)} min)</div>
                <span className="text-[10px] text-emerald-600 hidden sm:inline">Batido / amasado</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 text-center sm:text-left print:border-slate-300">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">Horno / Espera</span>
                <div className="text-sm sm:text-base font-black text-slate-700 mt-0.5">{horasPasivas.toFixed(1)} hs ({Math.round(horasPasivas * 60)} min)</div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Cocción pasiva</span>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-600 leading-snug">
              <b>Cálculo justo de mercado:</b> La mano de obra se calcula con el <b>tiempo activo de la tanda</b> (no se multiplica innecesariamente si se batieron juntos en una sola preparación en lote, ni absorbe ciegamente horas pasivas de cocción). Esto garantiza precios unitarios reales y altamente competitivos.
            </p>
          </div>

          {/* 3. Tabla Detallada por Producto Elaborado */}
          <div className="space-y-2 avoid-break">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-amber-600 no-print" />
              <span>Costos Unitarios y Precios Sugeridos por Producto</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-slate-300">
              <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 print:bg-slate-100">
                    <th className="py-2.5 px-3">Producto & Tanda</th>
                    <th className="py-2.5 px-2 text-center">Cant.</th>
                    <th className="py-2.5 px-2 text-right">Insumos/u</th>
                    <th className="py-2.5 px-2 text-right text-amber-900 font-bold print:text-slate-800">M. Obra/u</th>
                    <th className="py-2.5 px-2 text-right">Indirect./u</th>
                    <th className="py-2.5 px-2 text-right font-black text-slate-900 bg-amber-50/70 print:bg-slate-50">Costo Total</th>
                    <th className="py-2.5 px-2 text-right font-black text-emerald-800 bg-emerald-50/70 print:bg-slate-100 print:text-slate-900">P. Sugerido</th>
                    <th className="py-2.5 px-2 text-right text-emerald-700 font-bold print:text-slate-800">Ganancia/u</th>
                    <th className="py-2.5 px-3 text-right font-black text-slate-900">Total Lote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
                  {sesion.items.map((item) => {
                    const insumosUnit = item.costo_ingredientes_unitario + item.costo_packaging_unitario;
                    const precioSugerido = item.precio_sugerido_unitario || (item.costo_total_unitario * 1.6);
                    const gananciaUnit = precioSugerido - item.costo_total_unitario;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors print:hover:bg-white">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div className="text-slate-900 font-bold">{item.receta_nombre}</div>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {item.tandas || 1} tanda ({item.tiempo_activo_minutos || 30} min activos)
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                          {item.unidades_producidas} u
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-600">
                          ${insumosUnit.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-amber-800 print:text-slate-800">
                          ${item.costo_mano_obra_unitario.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-600">
                          ${item.costo_indirectos_unitario.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-slate-900 bg-amber-50/40 print:bg-slate-50">
                          ${item.costo_total_unitario.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-emerald-800 bg-emerald-50/40 print:bg-slate-100 print:text-slate-900">
                          ${precioSugerido.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-600 print:text-slate-700">
                          +${gananciaUnit.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ${item.costo_total_item?.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Tips & Recomendaciones para Rentabilizar el Taller (Oculto en impresión si no hay notas) */}
          {horasPasivas > 2 && (
            <div className="no-print bg-blue-50/50 border border-blue-200/60 rounded-2xl p-3.5 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span>Oportunidad de Eficiencia en Taller</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Tuviste <b>{horasPasivas.toFixed(1)} horas pasivas</b> de cocción o espera en el taller. Para maximizar la rentabilidad de las {horasTaller} horas declaradas, podés aprovechar el calor del horno horneando más unidades en simultáneo o preparando alfajores/galletitas en paralelo sin sumar más tiempo en la cocina.
              </p>
            </div>
          )}

          {/* Notas de la Sesión si existen */}
          {sesion.notas && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 avoid-break print:bg-white print:border-slate-300">
              <span className="font-bold text-slate-800 block mb-0.5">Notas registradas:</span>
              <p className="italic">{sesion.notas}</p>
            </div>
          )}

          {/* Pie de Impresión */}
          <div className="hidden print:flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-200 mt-2">
            <span>Calculadora de Costos de Panadería Artesanal</span>
            <span>Total hornada: ${sesion.costo_total_sesion?.toLocaleString('es-AR')} · Fecha de impresión: {new Date().toLocaleDateString('es-AR')}</span>
          </div>

        </div>

        {/* Footer con acciones en Pantalla */}
        <div className="no-print px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Total producción: <b>{sesion.total_unidades_producidas} unidades</b> · Costo total hornada: <b>${sesion.costo_total_sesion?.toLocaleString('es-AR')}</b>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Informe</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all cursor-pointer"
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
