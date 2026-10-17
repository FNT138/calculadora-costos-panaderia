import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  HelpCircle, 
  PieChart, 
  CheckCircle2, 
  Sparkles, 
  Package, 
  Clock, 
  Flame, 
  Sliders, 
  ArrowUpRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Legend
} from 'recharts';
import { api } from '../api';

export default function SimuladorView({ recetaIdInicial, onNotify }) {
  const [recetas, setRecetas] = useState([]);
  const [selectedRecetaId, setSelectedRecetaId] = useState(recetaIdInicial || null);
  const [analisis, setAnalisis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Controles dinámicos de simulación (Por defecto incluye Mano de Obra Prorrateada desde Stock)
  const [incluirMoStock, setIncluirMoStock] = useState(true);
  const [valorHoraSimulado, setValorHoraSimulado] = useState(0);
  const [margenSimulado, setMargenSimulado] = useState(60);

  // Simulador de volumen personalizado
  const [precioPrueba, setPrecioPrueba] = useState('');
  const [unidadesPrueba, setUnidadesPrueba] = useState(80);

  // Cargar lista de recetas
  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const data = await api.getRecetas();
        setRecetas(data);
        if (data.length > 0 && !selectedRecetaId) {
          setSelectedRecetaId(data[0].id);
        }
      } catch (err) {
        onNotify('Error al cargar recetas: ' + err.message, 'error');
      }
    };
    fetchRecetas();
  }, []);

  // Cargar análisis para la receta seleccionada
  const cargarAnalisis = async (id, vHora, margen, incMoStock) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getSimulacion(id, {
        valor_hora: vHora,
        margen_override: margen,
        incluir_mo_stock: incMoStock
      });
      setAnalisis(res);
      setPrecioPrueba(res.precio_recomendado);
    } catch (err) {
      onNotify('Error en el simulador: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRecetaId) {
      cargarAnalisis(selectedRecetaId, valorHoraSimulado, margenSimulado, incluirMoStock);
    }
  }, [selectedRecetaId, valorHoraSimulado, margenSimulado, incluirMoStock]);

  if (recetas.length === 0 && !loading) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-2" />
        <p className="text-slate-600 font-medium">No hay recetas para simular</p>
        <p className="text-xs text-slate-400 mt-1">Crea primero una receta en la pestaña "Recetas & Costos".</p>
      </div>
    );
  }

  const recetaActual = recetas.find(r => r.id === Number(selectedRecetaId));
  const unidadLabel = recetaActual?.unidad_rendimiento || 'unidad';
  const rendTanda = recetaActual?.rendimiento_unidades || 1;
  const redondearAlMillar = (val) => Math.ceil((Number(val) || 0) / 1000) * 1000;

  const d = analisis?.desglose || {};
  const costoTotal = analisis?.costo_total_unitario || 1;
  const precioSim = Number(precioPrueba) || (analisis?.precio_recomendado || 0);
  const gananciaUnitariaPrueba = Math.max(0, precioSim - costoTotal);
  const gananciaMensualPrueba = gananciaUnitariaPrueba * (Number(unidadesPrueba) || 0) * 4;

  // Porcentajes para la barra de composición
  const pctIng = ((d.costo_ingredientes_unitario || 0) / costoTotal) * 100;
  const pctPack = ((d.costo_packaging_unitario || 0) / costoTotal) * 100;
  const pctMo = ((d.costo_mano_obra_unitario || 0) / costoTotal) * 100;
  const pctInd = ((d.costo_indirectos_unitario || 0) / costoTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Selector de Receta y Controles Interactivos */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
              Simulador Estratégico Conectado al Stock
            </span>
            <h2 className="text-lg font-black text-slate-800 mt-1">
              Maximización de Precios & Sensibilidad de Ganancia
            </h2>
          </div>

          <div className="sm:w-72">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Producto a analizar:
            </label>
            <select
              value={selectedRecetaId || ''}
              onChange={(e) => {
                setSelectedRecetaId(Number(e.target.value));
                setPrecioPrueba('');
              }}
              className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              {recetas.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({r.rendimiento_unidades} × {r.unidad_rendimiento || 'u'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sliders y Selector de Mano de Obra para simulación interactiva */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Modo de Mano de Obra en Simulación:</span>
              </span>
              <span className="font-bold text-amber-700 text-xs">
                {valorHoraSimulado > 0
                  ? `Manual ($${valorHoraSimulado.toLocaleString('es-AR')}/h)`
                  : incluirMoStock
                  ? `Stock Real (+$${d.costo_mano_obra_prorrateada || 0}/u)`
                  : 'Escandallo Puro ($0 MO)'}
              </span>
            </div>

            {/* Botones rápidos de Modo de Mano de Obra */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setValorHoraSimulado(0);
                  setIncluirMoStock(true);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  valorHoraSimulado === 0 && incluirMoStock
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                }`}
              >
                Con MO de Stock (+${d.costo_mano_obra_prorrateada || 0}/u)
              </button>
              <button
                type="button"
                onClick={() => {
                  setValorHoraSimulado(0);
                  setIncluirMoStock(false);
                }}
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  valorHoraSimulado === 0 && !incluirMoStock
                    ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                Solo Escandallo Puro ($0)
              </button>
            </div>

            <div>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={valorHoraSimulado}
                onChange={(e) => setValorHoraSimulado(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$0 (Usar botón superior)</span>
                <span>Simular $/h manual: $25.000/h</span>
                <span>$50.000/h</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Margen de Ganancia Objetivo:</span>
              </span>
              <span className="font-bold text-amber-700 text-sm">
                +{margenSimulado}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={margenSimulado}
              onChange={(e) => setMargenSimulado(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer my-auto"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10% (Bajo)</span>
              <span>60% (Recomendado)</span>
              <span>150% (Gourmet)</span>
            </div>
          </div>
        </div>
      </div>

      {loading || !analisis ? (
        <div className="text-center py-12 text-slate-400">Calculando curvas de elasticidad y costos...</div>
      ) : (
        <>
          {/* Desglose de Costo Unitario */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-amber-600" />
                <span>Estructura de Costos por 1 {unidadLabel} ({analisis.receta_nombre})</span>
              </h3>
              <div className="text-sm font-semibold text-slate-600">
                Costo Total por 1 {unidadLabel}: <span className="text-base font-black text-slate-900">${d.costo_total_unitario}</span>
              </div>
            </div>

            {/* Tarjetas de componentes de costo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Ingredientes</span>
                <span className="text-base font-extrabold text-amber-900">${d.costo_ingredientes_unitario}</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">{pctIng.toFixed(0)}% del costo</span>
              </div>

              <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100">
                <span className="text-[10px] font-bold uppercase text-sky-800 block">Packaging</span>
                <span className="text-base font-extrabold text-sky-900">${d.costo_packaging_unitario}</span>
                <span className="text-[10px] text-sky-700 block mt-0.5">{pctPack.toFixed(0)}% del costo</span>
              </div>

              <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
                <span className="text-[10px] font-bold uppercase text-orange-800 block">Mano de Obra</span>
                <span className="text-base font-extrabold text-orange-900">${d.costo_mano_obra_unitario}</span>
                <span className="text-[10px] text-orange-700 block mt-0.5">{pctMo.toFixed(0)}% del costo</span>
              </div>

              <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-700 block">Gas, Luz & Indirectos</span>
                <span className="text-base font-extrabold text-slate-900">${d.costo_indirectos_unitario}</span>
                <span className="text-[10px] text-slate-600 block mt-0.5">{pctInd.toFixed(0)}% del costo</span>
              </div>
            </div>

            {/* Barra visual de distribución */}
            <div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${pctIng}%` }} className="bg-amber-500" title={`Ingredientes ${pctIng.toFixed(1)}%`}></div>
                <div style={{ width: `${pctPack}%` }} className="bg-sky-500" title={`Packaging ${pctPack.toFixed(1)}%`}></div>
                <div style={{ width: `${pctMo}%` }} className="bg-orange-500" title={`Mano de Obra ${pctMo.toFixed(1)}%`}></div>
                <div style={{ width: `${pctInd}%` }} className="bg-slate-400" title={`Indirectos ${pctInd.toFixed(1)}%`}></div>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 mt-1.5 justify-center sm:justify-start">
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span>Ingredientes</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span><span>Packaging</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span><span>Mano de Obra</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span><span>Gas / Luz</span></span>
              </div>
            </div>
          </div>

          {/* Hitos Estratégicos de Precios (Por 1 Unidad + Tanda Redondeada al Millar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Punto de Equilibrio */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-bold uppercase mb-1">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Punto de Equilibrio</span>
                </div>
                <div className="text-xl font-black text-slate-700">
                  ${analisis.precio_minimo_equilibrio?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">/ {unidadLabel}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Costo al límite ($0 ganancia extra).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Tanda ({rendTanda} u) al millar:</span>
                <span className="font-black text-slate-800">
                  ${redondearAlMillar((analisis.precio_minimo_equilibrio || 0) * rendTanda).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Precio Económico */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-blue-600 text-xs font-bold uppercase mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Económico / Promo</span>
                </div>
                <div className="text-xl font-black text-blue-700">
                  ${analisis.precio_economico?.toLocaleString('es-AR')} <span className="text-xs font-normal text-blue-400">/ {unidadLabel}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  +30% margen. Ideal para promos por cantidad.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Tanda ({rendTanda} u) al millar:</span>
                <span className="font-black text-blue-800">
                  ${redondearAlMillar((analisis.precio_economico || 0) * rendTanda).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Precio Recomendado Competitivo */}
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-md relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
                    Recomendado (+{margenSimulado}%)
                  </span>
                  <Award className="w-4 h-4 text-amber-200" />
                </div>
                <div className="text-2xl font-black">
                  ${analisis.precio_recomendado?.toLocaleString('es-AR')} <span className="text-xs font-normal text-amber-100">/ {unidadLabel}</span>
                </div>
                <p className="text-[11px] text-amber-100 mt-1">
                  Equilibrio óptimo entre rotación y ganancia.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-400/50 flex justify-between items-center text-[11px]">
                <span className="text-amber-100">Tanda ({rendTanda} u) al millar:</span>
                <span className="font-black text-white bg-amber-900/40 px-2 py-0.5 rounded-lg">
                  ${redondearAlMillar((analisis.precio_recomendado || 0) * rendTanda).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Precio de Máxima Ganancia */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold uppercase mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Pico de Ganancia</span>
                </div>
                <div className="text-xl font-black text-emerald-700">
                  ${analisis.precio_optimo_ganancia?.toLocaleString('es-AR')} <span className="text-xs font-normal text-emerald-600">/ {unidadLabel}</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Maximiza ingreso total según demanda.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-200/70 flex justify-between items-center text-[11px]">
                <span className="text-emerald-800">Tanda ({rendTanda} u) al millar:</span>
                <span className="font-black text-emerald-900">
                  ${redondearAlMillar((analisis.precio_optimo_ganancia || 0) * rendTanda).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico de Curva de Ganancia y Sensibilidad */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Curva de Maximización de Beneficios
                </h3>
                <p className="text-xs text-slate-400">
                  Relación entre el precio de venta, la demanda esperada y la ganancia neta total.
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1 font-semibold text-emerald-700">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                  <span>Ganancia Neta Total ($)</span>
                </span>
                <span className="flex items-center space-x-1 font-semibold text-blue-600">
                  <span className="w-3 h-0.5 bg-blue-500 inline-block"></span>
                  <span>Volumen Vendido (u)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analisis.curva_sensibilidad}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="precio" 
                    tickFormatter={(val) => `$${val}`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#10b981' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tickFormatter={(val) => `${val}u`}
                    tick={{ fontSize: 11, fill: '#3b82f6' }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Ganancia Neta Total') return [`$${Number(value).toLocaleString('es-AR')}`, name];
                      if (name === 'Volumen Estimado') return [`${value} unidades`, name];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Precio de Venta: $${label}`}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <ReferenceLine 
                    yAxisId="left" 
                    x={analisis.precio_optimo_ganancia} 
                    stroke="#059669" 
                    strokeDasharray="4 4"
                    label={{ value: 'Máxima Ganancia', fill: '#059669', fontSize: 10, position: 'top' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="ganancia_total"
                    name="Ganancia Neta Total"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGanancia)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="volumen_estimado"
                    name="Volumen Estimado"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simulador Personalizado de Proyección de Ventas */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-3xl p-5 border border-amber-200/60 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold text-slate-800 text-sm">
                Calculadora Rápida de Ganancia Mensual Proyectada
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Si vendo cada uno a ($):
                </label>
                <input
                  type="number"
                  step="50"
                  value={precioPrueba}
                  onChange={(e) => setPrecioPrueba(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-amber-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ventas estimadas por semana (unidades):
                </label>
                <input
                  type="number"
                  step="5"
                  value={unidadesPrueba}
                  onChange={(e) => setUnidadesPrueba(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-amber-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="bg-white p-3 rounded-2xl border border-amber-200/80 flex flex-col justify-center text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">
                  Ganancia Neta Limpia al Mes (4 semanas)
                </span>
                <span className="text-xl font-black text-emerald-700">
                  ${gananciaMensualPrueba.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-slate-400">
                  Ganas +${gananciaUnitariaPrueba.toFixed(0)} por cañoncito/producto
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
