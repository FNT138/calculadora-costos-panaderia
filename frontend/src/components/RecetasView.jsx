import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  Clock, 
  Box, 
  Wheat, 
  Check, 
  X, 
  Eye, 
  DollarSign,
  ChevronRight,
  Flame,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function RecetasView({ onNotify, onSelectParaSimulador }) {
  const [recetas, setRecetas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Facturas / Masas',
    descripcion: '',
    rendimiento_unidades: 24,
    tiempo_preparacion_minutos: 60,
    porcentaje_costos_indirectos: 10,
    margen_ganancia_sugerido: 60,
    precio_venta_fijado: '',
    ingredientes: []
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [recetasData, insumosData] = await Promise.all([
        api.getRecetas({ buscar: busqueda || undefined, categoria: filtroCategoria || undefined }),
        api.getInsumos()
      ]);
      setRecetas(recetasData);
      setInsumos(insumosData);
    } catch (err) {
      onNotify('Error al cargar datos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      cargarDatos();
    }, 200);
    return () => clearTimeout(delay);
  }, [busqueda, filtroCategoria]);

  const handleOpenModal = (receta = null) => {
    if (receta) {
      setEditingId(receta.id);
      setFormData({
        nombre: receta.nombre,
        categoria: receta.categoria || 'General',
        descripcion: receta.descripcion || '',
        rendimiento_unidades: receta.rendimiento_unidades,
        tiempo_preparacion_minutos: receta.tiempo_preparacion_minutos,
        porcentaje_costos_indirectos: receta.porcentaje_costos_indirectos,
        margen_ganancia_sugerido: receta.margen_ganancia_sugerido,
        precio_venta_fijado: receta.precio_venta_fijado || '',
        ingredientes: receta.ingredientes.map(i => ({
          insumo_id: i.insumo_id,
          cantidad: i.cantidad,
          notas: i.notas || ''
        }))
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        categoria: 'Facturas / Masas',
        descripcion: '',
        rendimiento_unidades: 24,
        tiempo_preparacion_minutos: 60,
        porcentaje_costos_indirectos: 10,
        margen_ganancia_sugerido: 60,
        precio_venta_fijado: '',
        ingredientes: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAddIngredienteRow = () => {
    if (insumos.length === 0) {
      onNotify('Primero debes cargar insumos en la pestaña de Insumos', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      ingredientes: [
        ...prev.ingredientes,
        { insumo_id: insumos[0].id, cantidad: 100, notas: '' }
      ]
    }));
  };

  const handleRemoveIngredienteRow = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdateIngredienteRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.ingredientes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredientes: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      onNotify('Ingresa un nombre para la receta', 'warning');
      return;
    }
    if (formData.ingredientes.length === 0) {
      onNotify('Agrega al menos un ingrediente o packaging a la receta', 'warning');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria.trim(),
        descripcion: formData.descripcion.trim(),
        rendimiento_unidades: Number(formData.rendimiento_unidades) || 1,
        tiempo_preparacion_minutos: Number(formData.tiempo_preparacion_minutos) || 0,
        porcentaje_costos_indirectos: Number(formData.porcentaje_costos_indirectos) || 0,
        margen_ganancia_sugerido: Number(formData.margen_ganancia_sugerido) || 0,
        precio_venta_fijado: formData.precio_venta_fijado ? Number(formData.precio_venta_fijado) : null,
        ingredientes: formData.ingredientes.map(i => ({
          insumo_id: Number(i.insumo_id),
          cantidad: Number(i.cantidad),
          notas: i.notas || ''
        }))
      };

      if (editingId) {
        await api.updateReceta(editingId, payload);
        onNotify(`Receta '${payload.nombre}' actualizada`, 'success');
      } else {
        await api.createReceta(payload);
        onNotify(`Receta '${payload.nombre}' creada con éxito`, 'success');
      }
      handleCloseModal();
      cargarDatos();
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la receta '${nombre}'?`)) return;
    try {
      await api.deleteReceta(id);
      onNotify(`Receta '${nombre}' eliminada`, 'success');
      cargarDatos();
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleViewDetail = (receta) => {
    setSelectedReceta(receta);
    setIsDetailOpen(true);
  };

  // Cálculo en vivo de costos para el modal creador
  const calcularCostosEnVivo = () => {
    let mpTanda = 0;
    formData.ingredientes.forEach(row => {
      const ins = insumos.find(i => i.id === Number(row.insumo_id));
      if (ins) {
        mpTanda += (ins.costo_por_unidad_base || 0) * (Number(row.cantidad) || 0);
      }
    });

    const rendimiento = Number(formData.rendimiento_unidades) > 0 ? Number(formData.rendimiento_unidades) : 1;
    const mpUnit = mpTanda / rendimiento;

    // Mano de obra estimada ($20.000/h base)
    const horas = (Number(formData.tiempo_preparacion_minutos) || 0) / 60;
    const moTanda = horas * 20000;
    const moUnit = moTanda / rendimiento;

    // Indirectos
    const indPorc = (Number(formData.porcentaje_costos_indirectos) || 0) / 100;
    const indUnit = (mpUnit + moUnit) * indPorc;

    const costoTotalUnit = mpUnit + moUnit + indUnit;
    const margenPorc = (Number(formData.margen_ganancia_sugerido) || 0) / 100;
    const precioSugerido = costoTotalUnit * (1 + margenPorc);

    return {
      mpTanda: mpTanda.toFixed(2),
      mpUnit: mpUnit.toFixed(2),
      moUnit: moUnit.toFixed(2),
      indUnit: indUnit.toFixed(2),
      costoTotalUnit: costoTotalUnit.toFixed(2),
      precioSugerido: precioSugerido.toFixed(2)
    };
  };

  const preview = calcularCostosEnVivo();

  return (
    <div className="space-y-6">
      {/* Barra superior con filtros y acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar receta (ej. Cañoncitos)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Receta</span>
        </button>
      </div>

      {/* Grid de Recetas */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando recetario y escandallos...</div>
      ) : recetas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-600 font-medium">No hay recetas cargadas</p>
          <p className="text-xs text-slate-400 mt-1">Crea tu primera receta con sus ingredientes y packaging.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recetas.map((receta) => {
            const c = receta.costos || {};
            const tienePrecioFijado = receta.precio_venta_fijado && receta.precio_venta_fijado > 0;
            return (
              <div
                key={receta.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {receta.categoria}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base mt-1 leading-snug">
                        {receta.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenModal(receta)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar receta e ingredientes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(receta.id, receta.nombre)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar receta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {receta.descripcion && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {receta.descripcion}
                    </p>
                  )}

                  {/* Métricas clave de la tanda */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-slate-50 p-2.5 rounded-2xl text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rendimiento tanda</span>
                      <span className="font-bold text-slate-700">{receta.rendimiento_unidades} unidades</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tiempo estimado</span>
                      <span className="font-bold text-slate-700">{receta.tiempo_preparacion_minutos} min</span>
                    </div>
                  </div>

                  {/* Desglose de costo unitario */}
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Ingredientes (unitario):</span>
                      <span className="font-medium text-slate-700">${c.costo_ingredientes_unitario}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Packaging (unitario):</span>
                      <span className="font-medium text-sky-700">${c.costo_packaging_unitario}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Mano de obra estimada:</span>
                      <span className="font-medium text-amber-700">${c.costo_mano_obra_unitario}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Gas / Luz / Indirectos ({receta.porcentaje_costos_indirectos}%):</span>
                      <span className="font-medium text-slate-700">${c.costo_indirectos_unitario}</span>
                    </div>
                  </div>
                </div>

                {/* Pie de tarjeta con costo total y precios sugeridos */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-semibold text-slate-600">Costo total unitario:</span>
                    <span className="text-base font-extrabold text-slate-800">
                      ${c.costo_total_unitario?.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-2xl border border-amber-200/60 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[11px] font-bold text-amber-900 block">
                          Precio sugerido (+{receta.margen_ganancia_sugerido}%):
                        </span>
                        <span className="text-[10px] text-amber-700">
                          Ganancia: +${c.ganancia_unitaria_sugerida} / u
                        </span>
                      </div>
                      <span className="text-lg font-black text-amber-600">
                        ${c.precio_sugerido?.toLocaleString('es-AR')}
                      </span>
                    </div>

                    {tienePrecioFijado && (
                      <div className="mt-2 pt-2 border-t border-amber-200/50 flex justify-between items-center text-xs">
                        <span className="text-slate-600">Cobrado actual:</span>
                        <span className="font-bold text-emerald-700">
                          ${receta.precio_venta_fijado?.toLocaleString('es-AR')}
                          <span className="text-[10px] ml-1 font-semibold text-emerald-600">
                            (+{c.margen_fijado}%)
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetail(receta)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Escandallo</span>
                    </button>
                    <button
                      onClick={() => onSelectParaSimulador(receta.id)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Simular Precio</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Constructor / Editor de Receta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingId ? 'Editar Receta & Escandallo' : 'Crear Nueva Receta'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Información básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cañoncitos de Dulce de Leche, Medialunas de manteca..."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    placeholder="Facturas, Tartas, Panadería..."
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rendimiento de la Tanda (unidades)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formData.rendimiento_unidades}
                    onChange={(e) => setFormData({ ...formData, rendimiento_unidades: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiempo de trabajo tanda (minutos)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.tiempo_preparacion_minutos}
                    onChange={(e) => setFormData({ ...formData, tiempo_preparacion_minutos: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gastos Indirectos / Servicios (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.porcentaje_costos_indirectos}
                    onChange={(e) => setFormData({ ...formData, porcentaje_costos_indirectos: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Margen de Ganancia Deseado (%)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.margen_ganancia_sugerido}
                    onChange={(e) => setFormData({ ...formData, margen_ganancia_sugerido: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio que cobras hoy ($) <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 1400"
                    value={formData.precio_venta_fijado}
                    onChange={(e) => setFormData({ ...formData, precio_venta_fijado: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Sección de Ingredientes y Packaging */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Ingredientes y Packaging de la Tanda</h4>
                    <p className="text-[11px] text-slate-400">
                      Carga las cantidades totales necesarias para producir las {formData.rendimiento_unidades} unidades.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredienteRow}
                    className="flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Insumo</span>
                  </button>
                </div>

                {formData.ingredientes.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                    Aún no agregaste insumos a esta receta. Pulsa "+ Agregar Insumo".
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {formData.ingredientes.map((row, idx) => {
                      const insSeleccionado = insumos.find(i => i.id === Number(row.insumo_id));
                      const subtotal = insSeleccionado ? ((insSeleccionado.costo_por_unidad_base || 0) * (Number(row.cantidad) || 0)) : 0;
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          {/* Selector de insumo */}
                          <div className="flex-1">
                            <select
                              value={row.insumo_id}
                              onChange={(e) => handleUpdateIngredienteRow(idx, 'insumo_id', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                            >
                              {insumos.map(ins => (
                                <option key={ins.id} value={ins.id}>
                                  {ins.categoria === 'packaging' ? '📦 ' : '🥖 '}
                                  {ins.nombre} (${ins.costo_por_unidad_base}/{ins.unidad_base})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cantidad en unidad base */}
                          <div className="flex items-center space-x-1 w-36">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder="Cant."
                              value={row.cantidad}
                              onChange={(e) => handleUpdateIngredienteRow(idx, 'cantidad', e.target.value)}
                              className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 outline-none"
                            />
                            <span className="text-[11px] text-slate-500 font-medium">
                              {insSeleccionado?.unidad_base || 'u'}
                            </span>
                          </div>

                          {/* Subtotal en pesos */}
                          <div className="w-24 text-right text-xs font-bold text-slate-700">
                            ${subtotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                          </div>

                          {/* Botón eliminar fila */}
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredienteRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 self-end sm:self-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resumen dinámico en vivo */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-amber-800 uppercase font-bold block">Materia Prima / u</span>
                  <span className="text-sm font-extrabold text-amber-900">${preview.mpUnit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 uppercase font-bold block">Mano de Obra / u</span>
                  <span className="text-sm font-extrabold text-amber-900">${preview.moUnit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 uppercase font-bold block">Costo Total / u</span>
                  <span className="text-base font-black text-slate-900">${preview.costoTotalUnit}</span>
                </div>
                <div className="bg-amber-600 text-white rounded-xl p-1.5">
                  <span className="text-[9px] uppercase font-bold block text-amber-100">Precio Sugerido</span>
                  <span className="text-base font-black">${preview.precioSugerido}</span>
                </div>
              </div>

              {/* Botones de acción del formulario */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle / Escandallo Completo */}
      {isDetailOpen && selectedReceta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                  Escandallo Detallado
                </span>
                <h3 className="font-bold text-slate-800 text-base">{selectedReceta.nombre}</h3>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="text-xs text-slate-500 flex justify-between bg-slate-50 p-3 rounded-2xl">
                <span>Rendimiento: <b>{selectedReceta.rendimiento_unidades} unidades</b></span>
                <span>Tiempo: <b>{selectedReceta.tiempo_preparacion_minutos} min</b></span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lista de Insumos y Packaging
                </h4>
                <div className="space-y-1.5">
                  {selectedReceta.ingredientes.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                      <div>
                        <span className="font-medium text-slate-800">{item.insumo_nombre}</span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          ({item.cantidad} {item.unidad_base} x ${item.costo_unitario_insumo})
                        </span>
                      </div>
                      <span className="font-bold text-slate-700">${item.subtotal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose resumido */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Costo Materia Prima Tanda:</span>
                  <span className="font-bold">${selectedReceta.costos?.costo_materia_prima_tanda}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Materia Prima Unitario:</span>
                  <span className="font-bold">${selectedReceta.costos?.costo_materia_prima_unitario}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mano de Obra Unitaria:</span>
                  <span className="font-bold text-amber-700">${selectedReceta.costos?.costo_mano_obra_unitario}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gastos Indirectos ({selectedReceta.porcentaje_costos_indirectos}%):</span>
                  <span className="font-bold">${selectedReceta.costos?.costo_indirectos_unitario}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Costo Total Unitario:</span>
                  <span>${selectedReceta.costos?.costo_total_unitario}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-amber-600">
                  <span>Precio Sugerido (+{selectedReceta.margen_ganancia_sugerido}%):</span>
                  <span>${selectedReceta.costos?.precio_sugerido}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
