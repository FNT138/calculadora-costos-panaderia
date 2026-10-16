import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Check, 
  X,
  Sparkles,
  Wheat,
  Box,
  Lock
} from 'lucide-react';
import { api } from '../api';

export default function InsumosView({ onNotify, isAdmin, onRequirePin }) {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'ingrediente',
    unidad_compra: 'kg',
    cantidad_compra: 1,
    precio_compra: 0,
    merma_porcentaje: 0,
    notas: ''
  });

  const cargarInsumos = async () => {
    try {
      setLoading(true);
      const data = await api.getInsumos({
        categoria: filtroCategoria || undefined,
        buscar: busqueda || undefined
      });
      setInsumos(data);
    } catch (err) {
      onNotify('Error al cargar insumos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      cargarInsumos();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [filtroCategoria, busqueda]);

  const handleOpenModal = (insumo = null) => {
    if (!isAdmin) {
      if (onRequirePin) onRequirePin();
      return;
    }
    if (insumo) {
      setEditingInsumo(insumo);
      setFormData({
        nombre: insumo.nombre,
        categoria: insumo.categoria,
        unidad_compra: insumo.unidad_compra,
        cantidad_compra: insumo.cantidad_compra,
        precio_compra: insumo.precio_compra,
        merma_porcentaje: insumo.merma_porcentaje || 0,
        notas: insumo.notas || ''
      });
    } else {
      setEditingInsumo(null);
      setFormData({
        nombre: '',
        categoria: filtroCategoria === 'packaging' ? 'packaging' : 'ingrediente',
        unidad_compra: filtroCategoria === 'packaging' ? 'pack' : 'kg',
        cantidad_compra: 1,
        precio_compra: '',
        merma_porcentaje: 0,
        notas: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInsumo(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.precio_compra || Number(formData.precio_compra) <= 0) {
      onNotify('Por favor completa el nombre y un precio válido', 'warning');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        unidad_compra: formData.unidad_compra,
        cantidad_compra: Number(formData.cantidad_compra) || 1,
        precio_compra: Number(formData.precio_compra),
        merma_porcentaje: Number(formData.merma_porcentaje) || 0,
        notas: formData.notas
      };

      if (editingInsumo) {
        await api.updateInsumo(editingInsumo.id, payload);
        onNotify(`Insumo '${payload.nombre}' actualizado con éxito`, 'success');
      } else {
        await api.createInsumo(payload);
        onNotify(`Insumo '${payload.nombre}' creado con éxito`, 'success');
      }
      handleCloseModal();
      cargarInsumos();
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!isAdmin) {
      if (onRequirePin) onRequirePin();
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar '${nombre}'?`)) return;
    try {
      await api.deleteInsumo(id);
      onNotify(`Insumo '${nombre}' eliminado`, 'success');
      cargarInsumos();
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  // Cálculo en vivo para el preview del modal
  const calcularPreviewCosto = () => {
    const cant = Number(formData.cantidad_compra) || 1;
    const precio = Number(formData.precio_compra) || 0;
    const merma = Number(formData.merma_porcentaje) || 0;
    const u = (formData.unidad_compra || 'kg').toLowerCase().trim();

    let cantBase = cant;
    let base = 'unidad';
    let unidadHumana = 'unidades';

    if (['kg', 'kilo', 'kilos'].includes(u)) {
      cantBase = cant * 1000;
      base = 'g';
      unidadHumana = `${cant} kg (${cantBase.toLocaleString('es-AR')} g)`;
    } else if (['g', 'gr', 'gramos'].includes(u)) {
      cantBase = cant;
      base = 'g';
      unidadHumana = `${cant} g`;
    } else if (['litro', 'l', 'litros'].includes(u)) {
      cantBase = cant * 1000;
      base = 'ml';
      unidadHumana = `${cant} l (${cantBase.toLocaleString('es-AR')} ml)`;
    } else if (['ml', 'cm3'].includes(u)) {
      cantBase = cant;
      base = 'ml';
      unidadHumana = `${cant} ml`;
    } else if (['docena', 'docenas'].includes(u)) {
      cantBase = cant * 12;
      base = 'unidad';
      unidadHumana = `${cant} docenas (${cantBase} u)`;
    } else {
      cantBase = cant;
      base = 'unidad';
      unidadHumana = `${cant} unidades`;
    }

    const aprovechamiento = Math.max(0.01, 1 - (merma / 100));
    const costo = cantBase > 0 ? ((precio / cantBase) / aprovechamiento) : 0;

    const formatoPrecio = costo.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });

    return { 
      costo: formatoPrecio, 
      costoNum: costo,
      base, 
      cantBase, 
      unidadHumana,
      precio,
      merma
    };
  };

  const getEtiquetaCantidad = () => {
    const u = (formData.unidad_compra || 'kg').toLowerCase();
    if (['kg', 'kilo', 'kilos'].includes(u)) {
      return { 
        label: '¿Cuántos Kilos compraste?', 
        placeholder: 'Ej: 1 (si es 1 kg), 5 (si es balde de 5 kg)', 
        hint: 'Si compraste 1 kilo, pon 1. El sistema calculará el costo por gramo dividiendo por 1.000.' 
      };
    }
    if (['litro', 'l', 'litros'].includes(u)) {
      return { 
        label: '¿Cuántos Litros compraste?', 
        placeholder: 'Ej: 1 (si es 1 litro), 5 (si es bidón de 5 l)', 
        hint: 'Si compraste 1 litro, pon 1. El sistema calculará el costo por ml dividiendo por 1.000.' 
      };
    }
    if (['pack', 'unidad'].includes(u)) {
      return { 
        label: '¿Cuántas unidades vienen en el paquete/caja?', 
        placeholder: 'Ej: 100 (para pack de 100 bolsitas)', 
        hint: 'Cantidad total de unidades sueltas que contiene el paquete.' 
      };
    }
    if (['docena'].includes(u)) {
      return { 
        label: '¿Cuántas docenas compraste?', 
        placeholder: 'Ej: 1 (equivale a 12 unidades)', 
        hint: '1 docena = 12 unidades.' 
      };
    }
    if (['g', 'gramos'].includes(u)) {
      return { 
        label: '¿Cuántos Gramos compraste?', 
        placeholder: 'Ej: 250 (para paquete de 250 g)', 
        hint: '⚠️ ¡Atención! Si compraste por Kilo, selecciona "Kilo (kg)" arriba.' 
      };
    }
    return { label: 'Cantidad en Paquete', placeholder: 'Ej: 1', hint: '' };
  };

  const preview = calcularPreviewCosto();
  const etiquetaCantidad = getEtiquetaCantidad();

  return (
    <div className="space-y-6">
      {/* Barra superior con filtros y acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFiltroCategoria('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroCategoria === ''
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({insumos.length})
          </button>
          <button
            onClick={() => setFiltroCategoria('ingrediente')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroCategoria === 'ingrediente'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wheat className="w-3.5 h-3.5" />
            <span>Ingredientes</span>
          </button>
          <button
            onClick={() => setFiltroCategoria('packaging')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroCategoria === 'packaging'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Packaging & Cajas</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-sm font-medium shadow-sm transition-all shrink-0"
          >
            {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-200" />}
            <span className="hidden xs:inline">Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Lista de insumos en tarjetas responsive */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando catálogo...</div>
      ) : insumos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-600 font-medium">No se encontraron insumos</p>
          <p className="text-xs text-slate-400 mt-1">Crea tu primer ingrediente o packaging con el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insumos.map((ins) => {
            const isPackaging = ins.categoria === 'packaging';
            return (
              <div 
                key={ins.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isPackaging ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {isPackaging ? <Box className="w-4 h-4" /> : <Wheat className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{ins.nombre}</h4>
                        <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          isPackaging ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPackaging ? 'Packaging' : 'Ingrediente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(ins)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar precio o datos"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ins.id, ins.nombre)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar insumo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Detalle de compra */}
                  <div className="mt-3 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex justify-between">
                      <span>Compra paquete:</span>
                      <span className="font-medium text-slate-700">
                        {ins.cantidad_compra} {ins.unidad_compra}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio pagado:</span>
                      <span className="font-semibold text-slate-800">
                        ${ins.precio_compra.toLocaleString('es-AR')}
                      </span>
                    </div>
                    {ins.merma_porcentaje > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Merma/Pérdida:</span>
                        <span>{ins.merma_porcentaje}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Costo Unitario Base Destacado */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Costo por {ins.unidad_base}:</span>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-amber-600">
                      ${ins.costo_por_unidad_base.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1">/ {ins.unidad_base}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingInsumo ? 'Actualizar Precio / Insumo' : 'Nuevo Insumo o Packaging'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Harina 0000, Dulce de Leche, Bolsita 15x25..."
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  >
                    <option value="ingrediente">Ingrediente</option>
                    <option value="packaging">Packaging / Embalaje</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad de Compra</label>
                  <select
                    value={formData.unidad_compra}
                    onChange={(e) => setFormData({ ...formData, unidad_compra: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  >
                    <option value="kg">Kilo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="litro">Litro (l)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="pack">Pack / Paquete (unidades)</option>
                    <option value="docena">Docena (12 u)</option>
                    <option value="unidad">Unidad suelta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {etiquetaCantidad.label}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    placeholder={etiquetaCantidad.placeholder}
                    value={formData.cantidad_compra}
                    onChange={(e) => setFormData({ ...formData, cantidad_compra: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-slate-800"
                  />
                  {etiquetaCantidad.hint && (
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {etiquetaCantidad.hint}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Total Pagado ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Ej: 10000, 1500..."
                    value={formData.precio_compra}
                    onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    El valor total que pagaste por esa cantidad.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Merma o Pérdida (%)
                  </label>
                  <span className="text-[11px] text-slate-400">Opcional (desperdicio en cocción/envase)</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="99"
                  value={formData.merma_porcentaje}
                  onChange={(e) => setFormData({ ...formData, merma_porcentaje: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Vista previa explicativa en vivo con fórmula matemática */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-950">Costo unitario calculado:</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {preview.precio > 0 ? (
                        <>
                          ${preview.precio.toLocaleString('es-AR')} pagados ÷ {preview.cantBase.toLocaleString('es-AR')} {preview.base}
                          {preview.merma > 0 ? ` (+${preview.merma}% merma)` : ''}
                        </>
                      ) : (
                        'Ingresa precio y cantidad para ver la fórmula'
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-700">
                      ${preview.costo}
                    </p>
                    <p className="text-[10px] text-amber-800 uppercase font-bold">por cada {preview.base}</p>
                  </div>
                </div>

                {preview.precio > 0 && (
                  <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 font-medium flex items-center justify-between">
                    <span>Equivalencia:</span>
                    <span>1 {formData.unidad_compra} = {preview.cantBase.toLocaleString('es-AR')} {preview.base}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
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
                  {editingInsumo ? 'Guardar Cambios' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
