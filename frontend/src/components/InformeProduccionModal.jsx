import React from 'react';
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
  CheckCircle2,
  PieChart,
  Layers,
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
  const porcentajeActivo = horasTaller > 0 ? Math.min(100, Math.round((horasActivas / horasTaller) * 100)) : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Informe */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
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
              className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              title="Imprimir informe o guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-6 overflow-y-auto print:p-0">
          
          {/* 1. Métricas Financieras Principales (KPIs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Inversión en Insumos */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inversión Insumos</span>
                <ShoppingBag className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800">
                ${Number(sesion.inversion_total_insumos || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Ingredientes + Packaging
              </p>
            </div>

            {/* Salario Ganado */}
            <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Salario Ganado</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-900">
                ${Number(sesion.costo_mano_obra_activa || (horasActivas * sesion.costo_hora_mano_obra)).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[10px] text-amber-700/80 mt-0.5">
                Por {horasActivas.toFixed(1)}h de trabajo activo
              </p>
            </div>

            {/* Venta Proyectada */}
            <div className="bg-blue-50/60 border border-blue-200/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Venta Estimada</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-blue-900">
                ${Number(sesion.ingreso_estimado_sugerido || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[10px] text-blue-700/80 mt-0.5">
                Vendiendo las {sesion.total_unidades_producidas} unidades
              </p>
            </div>

            {/* Ganancia Neta Limpia */}
            <div className="bg-emerald-50/70 border border-emerald-200/70 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Ganancia Neta</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-800">
                ${Number(sesion.ganancia_neta_estimada || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </div>
              <p className="text-[10px] text-emerald-700/80 mt-0.5">
                Beneficio limpio de bolsillo
              </p>
            </div>

          </div>

          {/* 2. Balance de Tiempos: Tiempo Activo vs Horas de Taller */}
          <div className="bg-amber-50/40 rounded-2xl p-4 sm:p-5 border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Desglose de Tiempo: Mano de Obra Activa vs. Taller & Horneado</span>
              </h3>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg">
                Valor Hora: ${sesion.costo_hora_mano_obra?.toLocaleString('es-AR')}/h
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tiempo Total en Taller</span>
                <div className="text-base font-black text-slate-800 mt-0.5">{horasTaller} horas</div>
                <span className="text-[11px] text-slate-500">Jornada declarada</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Tiempo Activo de Preparación</span>
                <div className="text-base font-black text-emerald-800 mt-0.5">{horasActivas.toFixed(1)} horas ({Math.round(horasActivas * 60)} min)</div>
                <span className="text-[11px] text-emerald-600">Manos en la masa (batido/amasado)</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tiempo Pasivo / Cocción</span>
                <div className="text-base font-black text-slate-700 mt-0.5">{horasPasivas.toFixed(1)} horas ({Math.round(horasPasivas * 60)} min)</div>
                <span className="text-[11px] text-slate-500">Horneado, enfriado o espera</span>
              </div>
            </div>

            <div className="bg-white/80 p-3 rounded-xl text-xs text-slate-600 leading-relaxed border border-amber-100 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <b>Cálculo justo de mercado:</b> La mano de obra de cada producto se calcula con el <b>tiempo activo de su preparación en tanda</b> (no se multiplica si se batieron juntos en una sola preparación, ni absorbe ciegamente horas muertas de espera). Esto asegura que tus costos unitarios sean reales y tus precios altamente competitivos.
              </div>
            </div>
          </div>

          {/* 3. Tabla Detallada por Producto Elaborado */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span>Costos Unitarios y Precios Sugeridos por Producto</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-3">Producto & Tanda</th>
                    <th className="py-3 px-2 text-center">Unidades</th>
                    <th className="py-3 px-2 text-right">Insumos / u</th>
                    <th className="py-3 px-2 text-right text-amber-700 font-bold">Mano de Obra / u</th>
                    <th className="py-3 px-2 text-right">Indirectos / u</th>
                    <th className="py-3 px-2 text-right font-black text-slate-800 bg-amber-50/50">Costo Unit. Real</th>
                    <th className="py-3 px-2 text-right font-black text-emerald-800 bg-emerald-50/40">Precio Sugerido</th>
                    <th className="py-3 px-2 text-right text-slate-700 font-bold">Ganancia / u</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-800">Total Lote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sesion.items.map((item) => {
                    const insumosUnit = item.costo_ingredientes_unitario + item.costo_packaging_unitario;
                    const precioSugerido = item.precio_sugerido_unitario || (item.costo_total_unitario * 1.6);
                    const gananciaUnit = precioSugerido - item.costo_total_unitario;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="text-slate-900 font-bold">{item.receta_nombre}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block ml-3.5">
                            {item.tandas || 1} tanda elaborada ({item.tiempo_activo_minutos || 30} min)
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-700">
                          {item.unidades_producidas} u
                        </td>
                        <td className="py-3 px-2 text-right text-slate-600">
                          ${insumosUnit.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-amber-700">
                          ${item.costo_mano_obra_unitario.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-600">
                          ${item.costo_indirectos_unitario.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-slate-900 bg-amber-50/50">
                          ${item.costo_total_unitario.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-emerald-700 bg-emerald-50/40">
                          ${precioSugerido.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-600">
                          +${gananciaUnit.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          ${item.costo_total_item?.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Tips & Recomendaciones para Rentabilizar el Taller */}
          {horasPasivas > 2 && (
            <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-900 font-bold">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span>Oportunidad de Eficiencia en Taller</span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                Tuviste <b>{horasPasivas.toFixed(1)} horas pasivas</b> de cocción o espera en el taller. Para maximizar la rentabilidad de las {horasTaller} horas declaradas, podés aprovechar el calor del horno horneando más unidades en simultáneo o preparando alfajores/galletitas en paralelo sin sumar más tiempo en la cocina.
              </p>
            </div>
          )}

          {/* Notas de la Sesión si existen */}
          {sesion.notas && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Notas registradas:</span>
              <p className="italic">{sesion.notas}</p>
            </div>
          )}

        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Total producción: <b>{sesion.total_unidades_producidas} unidades</b> · Costo total hornada: <b>${sesion.costo_total_sesion?.toLocaleString('es-AR')}</b>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Informe</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
