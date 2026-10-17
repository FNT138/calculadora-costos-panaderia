import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Wheat,
  Package,
  Printer,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  UtensilsCrossed,
  Layers
} from 'lucide-react';

export default function PlanificadorPedidoModal({
  presentaciones = [],
  recetas = [],
  onClose,
  onNotify
}) {
  // Cantidades seleccionadas por presentación: { [presentacionId]: cantidad }
  const [cantidadesPres, setCantidadesPres] = useState(() => {
    const init = {};
    // Pre-cargar un ejemplo inicial con las primeras 2 presentaciones para que el usuario vea el poder de inmediato
    if (presentaciones.length > 0) {
      init[presentaciones[0].id] = 3;
    }
    if (presentaciones.length > 1) {
      init[presentaciones[1].id] = 2;
    }
    return init;
  });

  // Cantidades adicionales de recetas sueltas (en unidades individuales): { [recetaId]: unidades }
  const [cantidadesRecetaExtra, setCantidadesRecetaExtra] = useState({});

  // Pestaña activa del selector izquierdo: 'packs' | 'recetas'
  const [selectorTab, setSelectorTab] = useState('packs');

  // Modo de cálculo de recetas: 'exacto' (proporcional exacto) | 'tandas_enteras' (redondear tandas de horno hacia arriba)
  const [modoTandasEnteras, setModoTandasEnteras] = useState(false);

  const [copied, setCopied] = useState(false);

  const updatePresQty = (id, deltaOrVal, isAbsolute = false) => {
    setCantidadesPres(prev => {
      const actual = prev[id] || 0;
      const nuevo = isAbsolute ? Math.max(0, Number(deltaOrVal) || 0) : Math.max(0, actual + deltaOrVal);
      const next = { ...prev };
      if (nuevo <= 0) {
        delete next[id];
      } else {
        next[id] = nuevo;
      }
      return next;
    });
  };

  const updateRecetaQty = (id, deltaOrVal, isAbsolute = false) => {
    setCantidadesRecetaExtra(prev => {
      const actual = prev[id] || 0;
      const nuevo = isAbsolute ? Math.max(0, Number(deltaOrVal) || 0) : Math.max(0, actual + deltaOrVal);
      const next = { ...prev };
      if (nuevo <= 0) {
        delete next[id];
      } else {
        next[id] = nuevo;
      }
      return next;
    });
  };

  const limpiarTodo = () => {
    setCantidadesPres({});
    setCantidadesRecetaExtra({});
  };

  const cargarEjemploFinde = () => {
    const demo = {};
    presentaciones.slice(0, 4).forEach((p, idx) => {
      demo[p.id] = idx === 0 ? 5 : idx === 1 ? 4 : 2;
    });
    setCantidadesPres(demo);
    setCantidadesRecetaExtra({});
  };

  // Explosión de insumos, packaging, recetas y finanzas
  const explosion = useMemo(() => {
    const mapaRecetasRequeridas = {}; // { [recetaId]: { receta, unidadesPedidas } }
    const mapaPackaging = {}; // { [insumoId]: { id, nombre, cantidad, unidad_base, costo_unitario, subtotal } }

    let recaudacionTotal = 0;
    let sueldoManoObraTotal = 0;
    let costoIndirectosTotal = 0;
    let totalPacksSeleccionados = 0;

    // 1. Procesar presentaciones seleccionadas
    Object.entries(cantidadesPres).forEach(([presIdStr, cantPack]) => {
      const cant = Number(cantPack) || 0;
      if (cant <= 0) return;
      const pres = presentaciones.find(p => p.id === Number(presIdStr));
      if (!pres) return;

      totalPacksSeleccionados += cant;
      recaudacionTotal += (pres.precio_venta_final || 0) * cant;
      sueldoManoObraTotal += (pres.costo_mano_obra_total || 0) * cant;

      // Recetas dentro del pack
      (pres.items || []).forEach(item => {
        const rec = recetas.find(r => r.id === Number(item.receta_id));
        if (!rec) return;
        const unidadesItem = (Number(item.cantidad) || 0) * cant;
        if (!mapaRecetasRequeridas[rec.id]) {
          mapaRecetasRequeridas[rec.id] = { receta: rec, unidadesPedidas: 0 };
        }
        mapaRecetasRequeridas[rec.id].unidadesPedidas += unidadesItem;
      });

      // Packagings del pack
      (pres.packagings || []).forEach(pkg => {
        const idPkg = pkg.insumo_id;
        const cantPkg = (Number(pkg.cantidad) || 0) * cant;
        const costoUnit = Number(pkg.costo_unitario) || 0;
        if (!mapaPackaging[idPkg]) {
          mapaPackaging[idPkg] = {
            id: idPkg,
            nombre: pkg.insumo_nombre || 'Packaging',
            cantidad: 0,
            unidad_base: 'u',
            costo_unitario: costoUnit,
            subtotal: 0
          };
        }
        mapaPackaging[idPkg].cantidad += cantPkg;
        mapaPackaging[idPkg].subtotal += cantPkg * costoUnit;
      });
    });

    // 2. Procesar unidades de recetas sueltas agregadas manualmente
    Object.entries(cantidadesRecetaExtra).forEach(([recIdStr, cantUnidades]) => {
      const cantU = Number(cantUnidades) || 0;
      if (cantU <= 0) return;
      const rec = recetas.find(r => r.id === Number(recIdStr));
      if (!rec) return;

      if (!mapaRecetasRequeridas[rec.id]) {
        mapaRecetasRequeridas[rec.id] = { receta: rec, unidadesPedidas: 0 };
      }
      mapaRecetasRequeridas[rec.id].unidadesPedidas += cantU;

      const precioUnit = rec.precio_venta_fijado && rec.precio_venta_fijado > 0
        ? rec.precio_venta_fijado
        : (rec.costos?.precio_sugerido_con_mo_prorrateada || rec.costos?.precio_sugerido || 0);
      recaudacionTotal += precioUnit * cantU;
      sueldoManoObraTotal += (rec.costos?.costo_mano_obra_prorrateada || 0) * cantU;
    });

    // 3. Explotar cada receta requerida en sus ingredientes y packaging de receta
    const mapaIngredientes = {};
    const detalleRecetas = [];
    let tiempoTotalMinutos = 0;

    Object.values(mapaRecetasRequeridas).forEach(({ receta, unidadesPedidas }) => {
      const rend = receta.rendimiento_unidades > 0 ? receta.rendimiento_unidades : 1;
      const tandasExactas = unidadesPedidas / rend;
      const tandasACocinar = modoTandasEnteras ? Math.ceil(tandasExactas) : tandasExactas;
      const unidadesACocinar = tandasACocinar * rend;

      tiempoTotalMinutos += (receta.tiempo_preparacion_minutos || 0) * tandasACocinar;
      costoIndirectosTotal += (receta.costos?.costo_indirectos_unitario || 0) * unidadesACocinar;

      detalleRecetas.push({
        id: receta.id,
        nombre: receta.nombre,
        unidad_rendimiento: receta.unidad_rendimiento || 'unidad',
        rendimiento_tanda: rend,
        unidadesPedidas,
        unidadesACocinar: Math.round(unidadesACocinar * 10) / 10,
        unidadesSobrantesStock: Math.max(0, Math.round((unidadesACocinar - unidadesPedidas) * 10) / 10),
        tandasExactas: Number(tandasExactas.toFixed(2)),
        tandasACocinar: Number(tandasACocinar.toFixed(2))
      });

      (receta.ingredientes || []).forEach(ing => {
        const cantNecesaria = (Number(ing.cantidad) || 0) * tandasACocinar;
        const costoUnit = Number(ing.costo_unitario_insumo) || 0;
        const subtot = cantNecesaria * costoUnit;

        if (ing.insumo_categoria === 'packaging') {
          if (!mapaPackaging[ing.insumo_id]) {
            mapaPackaging[ing.insumo_id] = {
              id: ing.insumo_id,
              nombre: ing.insumo_nombre,
              cantidad: 0,
              unidad_base: ing.unidad_base || 'u',
              costo_unitario: costoUnit,
              subtotal: 0
            };
          }
          mapaPackaging[ing.insumo_id].cantidad += cantNecesaria;
          mapaPackaging[ing.insumo_id].subtotal += subtot;
        } else {
          if (!mapaIngredientes[ing.insumo_id]) {
            mapaIngredientes[ing.insumo_id] = {
              id: ing.insumo_id,
              nombre: ing.insumo_nombre,
              cantidad: 0,
              unidad_base: ing.unidad_base || 'g',
              costo_unitario: costoUnit,
              subtotal: 0
            };
          }
          mapaIngredientes[ing.insumo_id].cantidad += cantNecesaria;
          mapaIngredientes[ing.insumo_id].subtotal += subtot;
        }
      });
    });

    const listaIngredientes = Object.values(mapaIngredientes).sort((a, b) => b.subtotal - a.subtotal);
    const listaPackaging = Object.values(mapaPackaging).sort((a, b) => b.subtotal - a.subtotal);

    const costoIngredientesTotal = listaIngredientes.reduce((acc, i) => acc + i.subtotal, 0);
    const costoPackagingTotal = listaPackaging.reduce((acc, p) => acc + p.subtotal, 0);
    const inversionMaterialesTotal = costoIngredientesTotal + costoPackagingTotal + costoIndirectosTotal;
    const costoTotalConSueldo = inversionMaterialesTotal + sueldoManoObraTotal;
    const gananciaNetaEmpresa = recaudacionTotal - costoTotalConSueldo;
    const bolsilloTotalEmprendedor = sueldoManoObraTotal + gananciaNetaEmpresa;

    return {
      listaIngredientes,
      listaPackaging,
      detalleRecetas,
      totalPacksSeleccionados,
      costoIngredientesTotal,
      costoPackagingTotal,
      costoIndirectosTotal,
      inversionMaterialesTotal,
      sueldoManoObraTotal,
      recaudacionTotal,
      gananciaNetaEmpresa,
      bolsilloTotalEmprendedor,
      tiempoTotalMinutos
    };
  }, [cantidadesPres, cantidadesRecetaExtra, presentaciones, recetas, modoTandasEnteras]);

  const formatearCantidadCompra = (cantidad, unidadBase) => {
    const cantRedondeada = Math.ceil(cantidad);
    if (unidadBase === 'g') {
      if (cantRedondeada >= 1000) {
        const kilos = (cantRedondeada / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 });
        return `${kilos} kg (${cantRedondeada.toLocaleString('es-AR')} g)`;
      }
      return `${cantRedondeada.toLocaleString('es-AR')} g`;
    }
    if (unidadBase === 'ml') {
      if (cantRedondeada >= 1000) {
        const litros = (cantRedondeada / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 });
        return `${litros} L (${cantRedondeada.toLocaleString('es-AR')} ml)`;
      }
      return `${cantRedondeada.toLocaleString('es-AR')} ml`;
    }
    return `${cantRedondeada.toLocaleString('es-AR')} ${unidadBase || 'u'}`;
  };

  const handleCopyWhatsApp = () => {
    const lines = [];
    lines.push('🛒 *LISTA DE COMPRAS Y PRODUCCIÓN — PANADERÍA*');
    lines.push('──────────────────────');

    if (explosion.detalleRecetas.length > 0) {
      lines.push('🥐 *PRODUCCIÓN A HORNEAR:*');
      explosion.detalleRecetas.forEach(r => {
        lines.push(`• ${r.nombre}: *${r.unidadesACocinar} × ${r.unidad_rendimiento}* (${r.tandasACocinar} tandas)`);
      });
      lines.push('');
    }

    if (explosion.listaIngredientes.length > 0) {
      lines.push('🌾 *MATERIA PRIMA (MAYORISTA):*');
      explosion.listaIngredientes.forEach(ing => {
        lines.push(`• ${ing.nombre}: *${formatearCantidadCompra(ing.cantidad, ing.unidad_base)}* (~$${Math.round(ing.subtotal).toLocaleString('es-AR')})`);
      });
      lines.push('');
    }

    if (explosion.listaPackaging.length > 0) {
      lines.push('📦 *PACKAGING Y ENVASES:*');
      explosion.listaPackaging.forEach(pkg => {
        lines.push(`• ${pkg.nombre}: *${Math.ceil(pkg.cantidad)} u.* (~$${Math.round(pkg.subtotal).toLocaleString('es-AR')})`);
      });
      lines.push('');
    }

    lines.push('💰 *RESUMEN FINANCIERO DEL PEDIDO:*');
    lines.push(`• Inversión Insumos + Pack: *$${Math.round(explosion.inversionMaterialesTotal).toLocaleString('es-AR')}*`);
    lines.push(`• Tu Sueldo Mano de Obra: *$${Math.round(explosion.sueldoManoObraTotal).toLocaleString('es-AR')}*`);
    lines.push(`• Recaudación Venta Total: *$${Math.round(explosion.recaudacionTotal).toLocaleString('es-AR')}*`);
    lines.push(`• Ganancia Neta + Sueldo: *$${Math.round(explosion.bolsilloTotalEmprendedor).toLocaleString('es-AR')}*`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    if (onNotify) onNotify('Lista de compras copiada para pegar en WhatsApp', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-6xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header del Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold block">
                Explosión Automática de Insumos y Finanzas
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Calculadora de Pedidos & Lista de Compras para el Mayorista
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              disabled={explosion.detalleRecetas.length === 0 && explosion.listaPackaging.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar para WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido Principal en 2 Columnas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: Selector de Packs / Recetas a producir (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 no-print">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  1. ¿Qué vas a vender o producir?
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={cargarEjemploFinde}
                    className="text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Ejemplo Finde
                  </button>
                  <button
                    type="button"
                    onClick={limpiarTodo}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>

              {/* Selector de Pestaña: Packs de Venta vs Recetas Sueltas */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectorTab('packs')}
                  className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    selectorTab === 'packs'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Packs & Bandejas ({presentaciones.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorTab('recetas')}
                  className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    selectorTab === 'recetas'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Recetas Sueltas ({recetas.length})</span>
                </button>
              </div>

              {/* Switch de Tandas Enteras vs Exacto */}
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Redondear a tandas enteras de horno</span>
                  <span className="text-[10px] text-slate-400">
                    Si necesitas 25 alfajores y la tanda rinde 20, calcula 2 tandas (40 u).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={modoTandasEnteras}
                  onChange={(e) => setModoTandasEnteras(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Lista de items seleccionables */}
            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {selectorTab === 'packs' ? (
                presentaciones.map(pres => {
                  const qty = cantidadesPres[pres.id] || 0;
                  return (
                    <div
                      key={pres.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        qty > 0
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-150 hover:border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {pres.categoria}
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            ${pres.precio_venta_final?.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate mt-0.5">
                          {pres.nombre}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {(pres.items || []).map(i => `${i.cantidad}x ${i.receta_nombre}`).join(' + ')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updatePresQty(pres.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => updatePresQty(pres.id, e.target.value, true)}
                          className="w-12 text-center font-black text-xs py-1 rounded-lg border border-slate-200 bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => updatePresQty(pres.id, 1)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                recetas.map(rec => {
                  const qty = cantidadesRecetaExtra[rec.id] || 0;
                  const uLabel = rec.unidad_rendimiento || 'unidad';
                  return (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        qty > 0
                          ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                          : 'bg-white border-slate-150 hover:border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          Tanda: {rec.rendimiento_unidades} × {uLabel}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate mt-0.5">
                          {rec.nombre}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateRecetaQty(rec.id, -rec.rendimiento_unidades)}
                          title={`Restar 1 tanda (${rec.rendimiento_unidades})`}
                          className="px-2 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-600 cursor-pointer"
                        >
                          -1 tanda
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => updateRecetaQty(rec.id, e.target.value, true)}
                          className="w-14 text-center font-black text-xs py-1 rounded-lg border border-slate-200 bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => updateRecetaQty(rec.id, rec.rendimiento_unidades)}
                          title={`Sumar 1 tanda (${rec.rendimiento_unidades})`}
                          className="px-2 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-[10px] font-bold text-white cursor-pointer"
                        >
                          +1 tanda
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Lista de Compras Consolidada y Resumen Financiero (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Tarjetas de Resumen Financiero del Pedido */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Inversión Compras
                </span>
                <span className="text-lg font-black text-white block mt-0.5">
                  ${Math.round(explosion.inversionMaterialesTotal).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Insumos + Pack + Horno
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 block">
                  Tu Sueldo (Stock)
                </span>
                <span className="text-lg font-black text-amber-900 block mt-0.5">
                  ${Math.round(explosion.sueldoManoObraTotal).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-amber-700 block">
                  ~{Math.round(explosion.tiempoTotalMinutos)} min de horneado
                </span>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase tracking-wider font-bold text-sky-800 block">
                  Venta Total (Caja)
                </span>
                <span className="text-lg font-black text-sky-900 block mt-0.5">
                  ${Math.round(explosion.recaudacionTotal).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-sky-700 block">
                  {explosion.totalPacksSeleccionados} packs seleccionados
                </span>
              </div>

              <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md shadow-emerald-600/20">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-100 block">
                  Tu Bolsillo Libre
                </span>
                <span className="text-lg font-black text-white block mt-0.5">
                  ${Math.round(explosion.bolsilloTotalEmprendedor).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-emerald-100 block">
                  Ganancia + Tu Sueldo
                </span>
              </div>
            </div>

            {/* 1. Resumen de Producción por Receta */}
            {explosion.detalleRecetas.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2.5 flex items-center space-x-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                  <span>Plan de Horneado (Unidades y Tandas Necesarias)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {explosion.detalleRecetas.map(r => (
                    <div key={r.id} className="bg-white p-2.5 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{r.nombre}</span>
                        <span className="text-[11px] text-slate-500">
                          Pedido: <b>{r.unidadesPedidas} × {r.unidad_rendimiento}</b>
                          {r.unidadesSobrantesStock > 0 && (
                            <span className="text-emerald-700 font-semibold ml-1">
                              (+{r.unidadesSobrantesStock} sobran p/ Stock)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs shrink-0">
                        {r.tandasACocinar} {r.tandasACocinar === 1 ? 'tanda' : 'tandas'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Lista de Compras de Materia Prima (Ingredientes) */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wheat className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Lista de Compras: Materia Prima ({explosion.listaIngredientes.length})
                  </h3>
                </div>
                <span className="text-xs font-extrabold text-slate-700">
                  Subtotal: ${Math.round(explosion.costoIngredientesTotal).toLocaleString('es-AR')}
                </span>
              </div>

              {explosion.listaIngredientes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Seleccioná al menos un pack o receta a la izquierda para calcular los gramos y kilos de materia prima.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {explosion.listaIngredientes.map(ing => (
                    <div key={ing.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <span className="font-bold text-slate-800">{ing.nombre}</span>
                      <div className="flex items-center space-x-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-black border border-amber-200/60">
                          {formatearCantidadCompra(ing.cantidad, ing.unidad_base)}
                        </span>
                        <span className="w-20 text-right font-semibold text-slate-600">
                          ${Math.round(ing.subtotal).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Lista de Compras de Packaging y Envases */}
            {explosion.listaPackaging.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-sky-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-sky-900">
                      Lista de Envases, Cajas, Bolsitas y Stickers ({explosion.listaPackaging.length})
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold text-sky-900">
                    Subtotal: ${Math.round(explosion.costoPackagingTotal).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {explosion.listaPackaging.map(pkg => (
                    <div key={pkg.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <span className="font-bold text-slate-800">{pkg.nombre}</span>
                      <div className="flex items-center space-x-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-900 font-black border border-sky-200">
                          {Math.ceil(pkg.cantidad)} unidades
                        </span>
                        <span className="w-20 text-right font-semibold text-slate-600">
                          ${Math.round(pkg.subtotal).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
