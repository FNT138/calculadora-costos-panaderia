import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Printer, 
  FileSpreadsheet, 
  Package, 
  Tag, 
  Check, 
  X, 
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Sparkles,
  Layers,
  Percent,
  Lock,
  PackageCheck
} from 'lucide-react';
import { api } from '../api';
import ListaPreciosModal from './ListaPreciosModal';

export default function VentasView({ onNotify, isAdmin, onRequirePin }) {
  const [presentaciones, setPresentaciones] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [packagingInsumos, setPackagingInsumos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroRedondeo, setFiltroRedondeo] = useState('todos');
  const [mostrarEnMiles, setMostrarEnMiles] = useState(false); // Alternar entre $30.000 y $30

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListaPreciosOpen, setIsListaPreciosOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Formulario de armado de pack / presentación
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Packs & Bandejas',
    packaging_id: '',
    cantidad_packaging: 1,
    margen_adicional: 0,
    precio_venta_fijado: '',
    redondeo_multiplo: 1000, // Por defecto al millar ($1.000: ej. $23.654 -> $24.000 / 24 mil)
    items: [],
    packagings: []
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [presData, recData, insData] = await Promise.all([
        api.getPresentaciones({ 
          buscar: busqueda || undefined, 
          categoria: filtroCategoria || undefined 
        }),
        api.getRecetas(),
        api.getInsumos()
      ]);
      setPresentaciones(presData);
      setRecetas(recData);
      setPackagingInsumos(insData.filter(i => i.categoria === 'packaging'));
    } catch (err) {
      onNotify('Error al cargar datos de ventas: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroCategoria]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleOpenModal = (pres = null) => {
    if (!isAdmin) {
      onRequirePin();
      return;
    }

    if (pres) {
      setEditingId(pres.id);
      
      // Armamos la lista de packagings (soporta tanto múltiples packagings como el legacy singular)
      let initialPackagings = [];
      if (pres.packagings && pres.packagings.length > 0) {
        initialPackagings = pres.packagings.map(pkg => ({
          insumo_id: pkg.insumo_id,
          cantidad: pkg.cantidad,
          notas: pkg.notas || ''
        }));
      } else if (pres.packaging_id) {
        initialPackagings = [{
          insumo_id: pres.packaging_id,
          cantidad: pres.cantidad_packaging || 1,
          notas: ''
        }];
      }

      setFormData({
        nombre: pres.nombre,
        descripcion: pres.descripcion || '',
        categoria: pres.categoria || 'Packs & Bandejas',
        packaging_id: pres.packaging_id ? String(pres.packaging_id) : '',
        cantidad_packaging: pres.cantidad_packaging ?? 1,
        margen_adicional: pres.margen_adicional ?? 0,
        precio_venta_fijado: pres.precio_venta_fijado ?? '',
        redondeo_multiplo: pres.redondeo_multiplo ?? 1000,
        items: pres.items && pres.items.length > 0 
          ? pres.items.map(it => ({
              receta_id: it.receta_id,
              cantidad: it.cantidad,
              notas: it.notas || ''
            }))
          : [],
        packagings: initialPackagings
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: 'Packs & Bandejas',
        packaging_id: '',
        cantidad_packaging: 1,
        margen_adicional: 0,
        precio_venta_fijado: '',
        redondeo_multiplo: 1000,
        items: recetas.length > 0 ? [{ receta_id: recetas[0].id, cantidad: 1, notas: '' }] : [],
        packagings: packagingInsumos.length > 0 ? [{ insumo_id: packagingInsumos[0].id, cantidad: 1, notas: '' }] : []
      });
    }
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (recetas.length === 0) {
      onNotify('Primero debes registrar alguna receta en el sistema', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { receta_id: recetas[0].id, cantidad: 1, notas: '' }
      ]
    }));
  };

  const handleRemoveItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdateItemRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleAddPackagingRow = () => {
    if (packagingInsumos.length === 0) {
      onNotify('No hay insumos creados con la categoría "packaging". Creá uno en Insumos.', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      packagings: [
        ...(prev.packagings || []),
        { insumo_id: packagingInsumos[0].id, cantidad: 1, notas: '' }
      ]
    }));
  };

  const handleRemovePackagingRow = (index) => {
    setFormData(prev => ({
      ...prev,
      packagings: (prev.packagings || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdatePackagingRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.packagings || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, packagings: updated };
    });
  };

  // Cálculo en vivo del modal (Opción 1: Incluye Mano de Obra Prorrateada desde Stock)
  const calcularResumenEnVivo = () => {
    let costoPuroProductos = 0;
    let costoManoObra = 0;
    let costoProductos = 0;
    let precioBaseProductos = 0;

    formData.items.forEach(it => {
      const rec = recetas.find(r => r.id === Number(it.receta_id));
      if (rec && rec.costos) {
        const cant = Number(it.cantidad) || 0;
        const puroUnit = rec.costos.costo_total_unitario || 0;
        const moUnit = rec.costos.costo_mano_obra_prorrateada || 0;
        const totalUnitConMo = rec.costos.costo_total_con_mo_prorrateada || (puroUnit + moUnit);

        costoPuroProductos += puroUnit * cant;
        costoManoObra += moUnit * cant;
        costoProductos += totalUnitConMo * cant;

        const pUnit = rec.precio_venta_fijado && rec.precio_venta_fijado > 0 
          ? rec.precio_venta_fijado 
          : (rec.costos.precio_sugerido_con_mo_prorrateada || rec.costos.precio_sugerido || 0);
        precioBaseProductos += pUnit * cant;
      }
    });

    let costoPkg = 0;
    if (formData.packagings && formData.packagings.length > 0) {
      formData.packagings.forEach(pRow => {
        const pkg = packagingInsumos.find(p => p.id === Number(pRow.insumo_id));
        if (pkg) {
          const cantPkg = Number(pRow.cantidad) || 1;
          const costoUnit = pkg.costo_por_unidad_base || 0;
          costoPkg += costoUnit * cantPkg;
        }
      });
    } else if (formData.packaging_id) {
      const pkg = packagingInsumos.find(p => p.id === Number(formData.packaging_id));
      if (pkg) {
        const cantPkg = Number(formData.cantidad_packaging) || 1;
        costoPkg = (pkg.costo_por_unidad_base || 0) * cantPkg;
      }
    }

    const costoTotal = costoProductos + costoPkg;
    const margenExtra = (Number(formData.margen_adicional) || 0) / 100;
    let precioBase = (precioBaseProductos + (costoPkg * 1.5)) * (1 + margenExtra);
    if (precioBase <= 0) precioBase = costoTotal * 1.6;

    const mult = Number(formData.redondeo_multiplo) || 1000;
    const precioRedondeado = mult > 0 ? Math.ceil(precioBase / mult) * mult : Math.ceil(precioBase);
    
    const precioFijadoNum = Number(formData.precio_venta_fijado);
    const precioFinal = (precioFijadoNum && precioFijadoNum > 0) ? precioFijadoNum : precioRedondeado;
    const gananciaNeta = precioFinal - costoTotal;
    const margenPct = costoTotal > 0 ? (gananciaNeta / costoTotal) * 100 : 0;

    return {
      costoPuroProductos,
      costoManoObra,
      costoProductos,
      costoPkg,
      costoTotal,
      precioBase,
      precioRedondeado,
      precioFinal,
      gananciaNeta,
      margenPct
    };
  };

  const resumenVivo = calcularResumenEnVivo();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      onNotify('Ingresá un nombre para la presentación o pack', 'warning');
      return;
    }
    if (formData.items.length === 0) {
      onNotify('Agregá al menos un producto o receta al pack', 'warning');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        categoria: formData.categoria.trim() || 'Packs & Bandejas',
        packaging_id: null,
        cantidad_packaging: 1.0,
        margen_adicional: Number(formData.margen_adicional) || 0.0,
        precio_venta_fijado: formData.precio_venta_fijado ? Number(formData.precio_venta_fijado) : null,
        redondeo_multiplo: Number(formData.redondeo_multiplo) || 1000,
        items: formData.items.map(it => ({
          receta_id: Number(it.receta_id),
          cantidad: Number(it.cantidad) || 1.0,
          notas: it.notas || null
        })),
        packagings: (formData.packagings || []).map(pRow => ({
          insumo_id: Number(pRow.insumo_id),
          cantidad: Number(pRow.cantidad) || 1.0,
          notas: pRow.notas || null
        }))
      };

      if (editingId) {
        await api.updatePresentacion(editingId, payload);
        onNotify('Presentación comercial actualizada con éxito', 'success');
      } else {
        await api.createPresentacion(payload);
        onNotify('Nueva presentación creada y lista de precios actualizada', 'success');
      }

      setIsModalOpen(false);
      cargarDatos();
    } catch (err) {
      onNotify('Error al guardar presentación: ' + err.message, 'error');
    }
  };

  const handleDelete = async (pres) => {
    if (!isAdmin) {
      onRequirePin();
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar la presentación "${pres.nombre}"?`)) {
      return;
    }
    try {
      await api.deletePresentacion(pres.id);
      onNotify('Presentación eliminada', 'info');
      cargarDatos();
    } catch (err) {
      onNotify('Error al eliminar: ' + err.message, 'error');
    }
  };

  // Filtrado final de cards
  const presentacionesFiltradas = presentaciones.filter(p => {
    if (filtroRedondeo !== 'todos' && p.redondeo_multiplo !== Number(filtroRedondeo)) {
      return false;
    }
    return true;
  });

  const categoriasDisponibles = Array.from(new Set(presentaciones.map(p => p.categoria || 'Packs & Bandejas')));

  return (
    <div className="space-y-6">
      
      {/* Encabezado Principal */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Ventas & Presentaciones Comerciales</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Combos, Packs & Precios Redondeados
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
            Armá bandejas surtidas, cajas y promos (ej. <i>2 alfajores + 1 cañoncito + 1 bolsita de palmeritas</i>), calculá el costo con packaging y aplicá <b>redondeo comercial hacia arriba ($5, $10, $50 o $100)</b> para una lista de precios impecable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsListaPreciosOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            title="Generar la carta oficial de precios lista para imprimir o guardar en PDF"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Carta de Precios (PDF)</span>
          </button>

          <a
            href={api.exportListaPreciosCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center space-x-2 shadow-2xs transition-all"
            title="Descargar lista completa en Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </a>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Presentación</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Input búsqueda */}
        <form onSubmit={handleBuscar} className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Buscar pack, bandeja o receta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Filtros de Categoría, Redondeo y Formato de Precio */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Alternar formato $30.000 vs $30 (en miles) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMostrarEnMiles(false)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                !mostrarEnMiles 
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Mostrar precios completos en pesos (ej. $30.000)"
            >
              $30.000
            </button>
            <button
              type="button"
              onClick={() => setMostrarEnMiles(true)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mostrarEnMiles 
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Mostrar precios abreviados en miles (ej. $30)"
            >
              $30 (miles)
            </button>
          </div>

          {/* Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Todas las Categorías</option>
            {categoriasDisponibles.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Múltiplo de Redondeo */}
          <select
            value={filtroRedondeo}
            onChange={(e) => setFiltroRedondeo(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="todos">Todos los Redondeos</option>
            <option value="1000">Al millar ($1.000)</option>
            <option value="500">Al medio millar ($500)</option>
            <option value="5000">Múltiplo de $5.000</option>
            <option value="100">Múltiplo de $100</option>
            <option value="50">Múltiplo de $50</option>
          </select>
        </div>
      </div>

      {/* Grid de Presentaciones Comerciales */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-xs text-slate-500 mt-3">Calculando costos y precios de venta redondeados...</p>
        </div>
      ) : presentacionesFiltradas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">
              {busqueda || filtroCategoria ? 'No se encontraron presentaciones con los filtros aplicados' : 'Aún no tenés presentaciones o packs creados'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Creá combos y bandejas combinando alfajores, cañoncitos, budines y palmeritas en una bandeja dorada o caja, para calcular el precio de venta redondeado hacia arriba listo para vender.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 inline-flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primera Presentación Comercial</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentacionesFiltradas.map((p) => {
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Parte Superior de la Tarjeta */}
                <div className="p-6 space-y-4">
                  {/* Badge y Categoría */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100 flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>{p.categoria || 'Packs & Bandejas'}</span>
                    </span>

                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {p.redondeo_multiplo >= 1000 ? `Al millar ($${p.redondeo_multiplo})` : `Redondeo $${p.redondeo_multiplo}`}
                    </span>
                  </div>

                  {/* Nombre y Descripción */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {p.nombre}
                    </h3>
                    {p.descripcion && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {p.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Lista de Componentes / Productos incluidos */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Productos incluidos en el pack:
                    </span>
                    <div className="space-y-1.5">
                      {p.items && p.items.length > 0 ? (
                        p.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                              <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                                {it.cantidad}
                              </span>
                              <span>{it.receta_nombre}</span>
                            </span>
                            <span className="text-slate-400 font-medium">
                              ${it.costo_total_item?.toLocaleString('es-AR')} costo
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin productos asociados</span>
                      )}
                    </div>

                    {/* Mano de Obra Prorrateada desde Stock */}
                    {p.costo_mano_obra_total > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-800 flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black">MO</span>
                          <span>Tu Mano de Obra (Stock):</span>
                        </span>
                        <span className="font-bold text-amber-800">
                          +${p.costo_mano_obra_total?.toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}

                    {/* Packaging múltiple o singular */}
                    {p.packagings && p.packagings.length > 0 ? (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center space-x-1 text-emerald-700">
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Packaging ({p.packagings.length}):</span>
                          </span>
                          <span className="font-semibold text-slate-500">
                            ${p.costo_packaging_total?.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {p.packagings.map((pkg, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-600 bg-white/80 px-2 py-1 rounded-lg border border-slate-100">
                              <span className="flex items-center space-x-1.5 font-medium truncate">
                                <span className="font-bold text-emerald-800 text-[11px] bg-emerald-50 px-1 rounded">{pkg.cantidad}x</span>
                                <span className="truncate">{pkg.insumo_nombre}</span>
                              </span>
                              <span className="text-slate-400 font-medium ml-2 text-[11px] whitespace-nowrap">
                                ${pkg.costo_total_item?.toLocaleString('es-AR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : p.packaging_nombre ? (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center space-x-1.5 font-medium">
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{p.packaging_nombre}</span>
                        </span>
                        <span className="text-slate-400 font-medium">
                          ${p.costo_packaging_total?.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 italic">
                        Sin packaging extra
                      </div>
                    )}
                  </div>

                  {/* Comparativa de Costo vs Precio Base */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Costo Total (c/Tu Sueldo)</span>
                      <span className="font-bold text-slate-700 text-sm">
                        ${p.costo_total_presentacion?.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Precio Base Sin Redondear</span>
                      <span className="font-bold text-slate-500 text-sm line-through">
                        ${p.precio_base_calculado?.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Precio de Venta Redondeado al Público (Caja Verde Prominente) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                      <span>Precio al Público</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20">
                        {p.precio_venta_fijado ? 'Precio Manual' : (p.redondeo_multiplo >= 1000 ? 'Al millar' : `Redondeo $${p.redondeo_multiplo}`)}
                      </span>
                    </div>
                    
                    {mostrarEnMiles ? (
                      <div>
                        <div className="text-3xl font-black tracking-tight text-white flex items-baseline space-x-1">
                          <span>$ {Math.round(p.precio_venta_final / 1000)}</span>
                          <span className="text-sm font-bold text-emerald-200">mil</span>
                        </div>
                        <span className="text-[10px] text-emerald-100 font-medium block">
                          ${p.precio_venta_final?.toLocaleString('es-AR')} exactos · sin cambio
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl font-black tracking-tight text-white flex items-baseline space-x-2">
                          <span>$ {p.precio_venta_final?.toLocaleString('es-AR')}</span>
                        </div>
                        <span className="text-[11px] text-emerald-100 font-bold block">
                          ({Math.round(p.precio_venta_final / 1000)} mil) · sin cambio chico
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-emerald-100 pt-1.5 border-t border-white/20 font-medium">
                      <div>
                        <span className="block">Ganancia neta: <b>${p.ganancia_neta?.toLocaleString('es-AR')}</b></span>
                        {p.costo_mano_obra_total > 0 && (
                          <span className="text-[10px] text-emerald-200 block">
                            + Tu sueldo (MO): <b>${p.costo_mano_obra_total?.toLocaleString('es-AR')}</b>
                          </span>
                        )}
                      </div>
                      <span className="bg-emerald-950/30 px-2 py-0.5 rounded-lg font-black text-emerald-200">
                        +{p.margen_porcentaje}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Edición y Borrado */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    ID #{p.id}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                      title="Editar presentación y cantidades"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Eliminar presentación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Armado / Edición de Presentación Comercial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[92vh]">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingId ? 'Editar Presentación Comercial' : 'Nueva Presentación / Pack'}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Armá la combinación de productos, packaging y regla de redondeo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5 flex-1">
              
              {/* Datos Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Pack / Presentación *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Bandeja Merienda, Caja x 6 Alfajores, Promo Palmeritas..."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoría Comercial
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Packs & Bandejas">Packs & Bandejas</option>
                    <option value="Cajas & Docenas">Cajas & Docenas</option>
                    <option value="Promociones">Promociones</option>
                    <option value="Individual">Individual</option>
                    <option value="Eventos">Eventos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Regla de Redondeo Hacia Arriba
                  </label>
                  <select
                    value={formData.redondeo_multiplo}
                    onChange={(e) => setFormData({ ...formData, redondeo_multiplo: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1000">Al millar ($1.000) ➔ ej. 23.654 ➔ 24 ($24.000 / 24 mil) [Recomendado]</option>
                    <option value="500">Al medio millar ($500) ➔ ej. 23.100 ➔ $23.500</option>
                    <option value="5000">A cinco mil ($5.000) ➔ ej. 23.654 ➔ $25.000</option>
                    <option value="100">A la centena ($100) ➔ ej. 23.654 ➔ $23.700</option>
                    <option value="50">A cincuenta ($50) ➔ ej. 23.654 ➔ $23.700</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Descripción / Ocasión de consumo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ideal para la merienda o compartir en la oficina..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Packaging Múltiple de la Presentación (Bandejas, Bolsas, Stickers, Cajas, etc.) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>Packaging & Presentación (Bandeja, Bolsa, Sticker, etc.)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPackagingRow}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Packaging</span>
                  </button>
                </div>

                {(!formData.packagings || formData.packagings.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    Sin packaging adicional configurado. Podés agregar varios elementos (ej. 1x Bandejita + 1x Bolsita + 1x Sticker) haciendo clic en "+ Agregar Packaging".
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.packagings.map((pkgRow, idx) => {
                      const ins = packagingInsumos.find(p => p.id === Number(pkgRow.insumo_id));
                      const costoUnit = ins?.costo_por_unidad_base || 0;
                      const subtotCosto = costoUnit * (Number(pkgRow.cantidad) || 0);

                      return (
                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                          {/* Selector de insumo de packaging */}
                          <div className="flex-1">
                            <select
                              value={pkgRow.insumo_id}
                              onChange={(e) => handleUpdatePackagingRow(idx, 'insumo_id', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {packagingInsumos.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre} (${p.costo_por_unidad_base?.toLocaleString('es-AR')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cantidad */}
                          <div className="w-24">
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                placeholder="Cant."
                                value={pkgRow.cantidad}
                                onChange={(e) => handleUpdatePackagingRow(idx, 'cantidad', e.target.value)}
                                className="w-full px-2.5 py-1.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-semibold pointer-events-none">
                                u
                              </span>
                            </div>
                          </div>

                          {/* Subtotal costo estimado */}
                          <div className="w-20 text-right text-xs font-bold text-slate-600 hidden sm:block">
                            ${Math.round(subtotCosto).toLocaleString('es-AR')}
                          </div>

                          {/* Botón eliminar fila */}
                          <button
                            type="button"
                            onClick={() => handleRemovePackagingRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Quitar este packaging"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lista dinámica de Recetas / Productos incluidos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Productos incluidos en la presentación *</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Producto</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((it, idx) => {
                    const rec = recetas.find(r => r.id === Number(it.receta_id));
                    const costoUnit = rec?.costos?.costo_total_con_mo_prorrateada || rec?.costos?.costo_total_unitario || 0;
                    const subtotCosto = costoUnit * (Number(it.cantidad) || 0);

                    return (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        {/* Receta */}
                        <div className="flex-1">
                          <select
                            value={it.receta_id}
                            onChange={(e) => handleUpdateItemRow(idx, 'receta_id', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {recetas.map(r => {
                              const cTotal = r.costos?.costo_total_con_mo_prorrateada || r.costos?.costo_total_unitario || 0;
                              const cMo = r.costos?.costo_mano_obra_prorrateada || 0;
                              return (
                                <option key={r.id} value={r.id}>
                                  {r.nombre} (Costo c/MO: ${cTotal.toLocaleString('es-AR')}{cMo > 0 ? ` · inc. $${cMo.toLocaleString('es-AR')} MO Stock` : ''})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Cantidad de unidades */}
                        <div className="w-24">
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            required
                            placeholder="Cant."
                            value={it.cantidad}
                            onChange={(e) => handleUpdateItemRow(idx, 'cantidad', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            title="Cantidad de unidades incluidas de este producto"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="w-20 text-right text-xs font-bold text-slate-700">
                          ${subtotCosto.toLocaleString('es-AR')}
                        </div>

                        {/* Eliminar Fila */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ajustes Avanzados de Precio (Margen extra o Precio manual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Margen Adicional sobre el Pack (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0 (Usa los márgenes de las recetas)"
                    value={formData.margen_adicional}
                    onChange={(e) => setFormData({ ...formData, margen_adicional: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Porcentaje de ganancia extra por armar el combo.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Precio Manual Fijado (Opcional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Dejar vacío para cálculo automático"
                    value={formData.precio_venta_fijado}
                    onChange={(e) => setFormData({ ...formData, precio_venta_fijado: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Si ponés un valor, se cobrará exactamente ese precio sin redondear.
                  </span>
                </div>
              </div>

              {/* Caja de Cálculo en Vivo */}
              <div className="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Cálculo en Vivo (Inc. Mano de Obra de Stock)</span>
                  </span>
                  <span>Múltiplo: ${formData.redondeo_multiplo}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block">Costo Puro Prod.</span>
                    <span className="font-bold text-slate-800">${resumenVivo.costoPuroProductos.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-semibold block">+ Tu Mano de Obra</span>
                    <span className="font-bold text-amber-900">+${resumenVivo.costoManoObra.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block">+ Packaging</span>
                    <span className="font-bold text-slate-800">${resumenVivo.costoPkg.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 block">Costo Total Pack</span>
                    <span className="font-bold text-slate-800">${resumenVivo.costoTotal.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="bg-emerald-700 text-white rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                      Precio de Venta Redondeado al Público:
                    </span>
                    <div className="text-2xl font-black flex items-baseline space-x-2">
                      <span>$ {resumenVivo.precioFinal.toLocaleString('es-AR')}</span>
                      <span className="text-base font-bold text-emerald-200">
                        ({Math.round(resumenVivo.precioFinal / 1000)} mil)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-200 block mt-0.5">
                      Para cobrar redondo y no lidiar con cambio chico.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                      Ganancia Neta:
                    </span>
                    <div className="text-base font-black text-emerald-100">
                      ${resumenVivo.gananciaNeta.toLocaleString('es-AR')} ({resumenVivo.margenPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition-all cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Presentación'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal de Carta de Precios Oficial (PDF / Impresión) */}
      {isListaPreciosOpen && (
        <ListaPreciosModal
          presentaciones={presentaciones}
          onClose={() => setIsListaPreciosOpen(false)}
        />
      )}

    </div>
  );
}
