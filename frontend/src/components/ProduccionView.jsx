import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Calendar, 
  DollarSign, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  X,
  Layers,
  ArrowRight,
  Lock
} from 'lucide-react';
import { api } from '../api';

export default function ProduccionView({ onNotify, isAdmin, onRequirePin }) {
  const [sesiones, setSesiones] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    horas_trabajadas: 3.0,
    costo_hora_mano_obra: 20000.0,
    notas: '',
    items: []
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [sesionesData, recetasData, configData] = await Promise.all([
        api.getSesiones(),
        api.getRecetas(),
        api.getConfig()
      ]);
      setSesiones(sesionesData);
      setRecetas(recetasData);
      setConfig(configData);
    } catch (err) {
      onNotify('Error al cargar sesiones: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenModal = () => {
    if (!isAdmin) {
      if (onRequirePin) onRequirePin();
      return;
    }
    const valorHora = config ? config.costo_hora_defecto : 20000.0;
    setFormData({
      titulo: 'Hornada del día',
      horas_trabajadas: 3.0,
      costo_hora_mano_obra: valorHora,
      notas: '',
      items: recetas.length > 0 ? [{ receta_id: recetas[0].id, unidades_producidas: 30, factor_dificultad: 1.0 }] : []
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddItemRow = () => {
    if (recetas.length === 0) {
      onNotify('Primero debes tener recetas registradas', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { receta_id: recetas[0].id, unidades_producidas: 20, factor_dificultad: 1.0 }
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      onNotify('Ingresa un título para la sesión', 'warning');
      return;
    }
    if (formData.items.length === 0) {
      onNotify('Agrega los productos horneados en esta ventana de tiempo', 'warning');
      return;
    }

    try {
      const payload = {
        titulo: formData.titulo.trim(),
        horas_trabajadas: Number(formData.horas_trabajadas) || 1,
        costo_hora_mano_obra: Number(formData.costo_hora_mano_obra) || 20000,
        notas: formData.notas.trim(),
        items: formData.items.map(it => ({
          receta_id: Number(it.receta_id),
          unidades_producidas: Number(it.unidades_producidas) || 1,
          factor_dificultad: Number(it.factor_dificultad) || 1.0
        }))
      };

      await api.createSesion(payload);
      onNotify('Sesión de producción y mano de obra guardada con éxito', 'success');
      handleCloseModal();
      cargarDatos();
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleDelete = async (id, titulo) => {
    if (!isAdmin) {
      if (onRequirePin) onRequirePin();
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar el registro de la sesión '${titulo}'?`)) return;
    try {
      await api.deleteSesion(id);
      onNotify(`Sesión '${titulo}' eliminada`, 'success');
      cargarDatos();
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  // Cálculo en vivo del prorrateo
  const calcularProrrateoEnVivo = () => {
    const horas = Number(formData.horas_trabajadas) || 0;
    const valorHora = Number(formData.costo_hora_mano_obra) || 0;
    const totalMO = horas * valorHora;

    let totalPonderado = 0;
    formData.items.forEach(it => {
      totalPonderado += (Number(it.unidades_producidas) || 0) * (Number(it.factor_dificultad) || 1.0);
    });

    const costoPorUnidadPonderada = totalPonderado > 0 ? (totalMO / totalPonderado) : 0;
    return {
      totalMO: totalMO.toFixed(2),
      totalPonderado: totalPonderado.toFixed(1),
      costoPorUnidadPonderada: costoPorUnidadPonderada.toFixed(2)
    };
  };

  const prorrateo = calcularProrrateoEnVivo();

  return (
    <div className="space-y-6">
      {/* Banner explicativo del prorrateo por ventana */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center space-x-2 text-amber-200 text-xs uppercase font-bold tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Mano de Obra & Ventana Temporal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Prorrateo de Horas entre Productos Reales
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-2 leading-relaxed">
            Si dedicas una ventana de 3 horas cobrando $20.000/hora ($60.000 en total) y en ese tiempo horneas cañoncitos y alfajores, el sistema divide el costo laboral exactamente entre todas las unidades producidas y guarda el histórico para futuras ventas.
          </p>

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <button
              onClick={handleOpenModal}
              className="bg-white text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
            >
              {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-700" />}
              <span>Registrar Sesión de Trabajo</span>
            </button>
            <span className="text-xs text-amber-100">
              Valor hora configurado: <b>${config?.costo_hora_defecto?.toLocaleString('es-AR')}/h</b>
            </span>
          </div>
        </div>
      </div>

      {/* Historial de sesiones registradas */}
      <div>
        <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Historial de Producción y Costos de Mano de Obra</span>
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando histórico de sesiones...</div>
        ) : sesiones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <Clock className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-600 font-medium">No hay sesiones de producción registradas</p>
            <p className="text-xs text-slate-400 mt-1">
              Haz clic en "Registrar Sesión de Trabajo" para prorratear tus horas entre lo que horneaste.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion) => {
              const fechaStr = new Date(sesion.fecha).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={sesion.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                          {fechaStr}
                        </span>
                        <h4 className="font-bold text-slate-800 text-base">{sesion.titulo}</h4>
                      </div>
                      {sesion.notas && (
                        <p className="text-xs text-slate-500 mt-1">{sesion.notas}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Mano de Obra Total</span>
                        <span className="text-sm font-extrabold text-amber-700">
                          {sesion.horas_trabajadas}h @ ${sesion.costo_hora_mano_obra?.toLocaleString('es-AR')} = ${sesion.costo_total_mano_obra?.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(sesion.id, sesion.titulo)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tabla de productos en esta sesión */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 pb-2">
                          <th className="py-2 font-medium">Producto</th>
                          <th className="py-2 font-medium text-center">Unidades</th>
                          <th className="py-2 font-medium text-right">Materia Prima / u</th>
                          <th className="py-2 font-medium text-right text-amber-700 font-bold">Mano de Obra / u</th>
                          <th className="py-2 font-medium text-right">Indirectos / u</th>
                          <th className="py-2 font-bold text-right text-slate-800">Costo Unitario Real</th>
                          <th className="py-2 font-bold text-right text-slate-800">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sesion.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-bold text-slate-800 flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span>{item.receta_nombre}</span>
                            </td>
                            <td className="py-2.5 text-center font-semibold text-slate-700">
                              {item.unidades_producidas} u
                            </td>
                            <td className="py-2.5 text-right text-slate-600">
                              ${(item.costo_ingredientes_unitario + item.costo_packaging_unitario).toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-bold text-amber-700">
                              ${item.costo_mano_obra_unitario.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right text-slate-600">
                              ${item.costo_indirectos_unitario.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-black text-slate-900">
                              ${item.costo_total_unitario.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right font-bold text-slate-800">
                              ${item.costo_total_item.toLocaleString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumen al pie de la sesión */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs text-slate-500">
                    <div>
                      Total horneado: <b>{sesion.total_unidades_producidas} unidades</b>
                    </div>
                    <div className="text-right font-semibold text-slate-800">
                      Costo total de producción de la hornada: <span className="text-sm font-black text-slate-900">${sesion.costo_total_sesion.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Registrar Sesión */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">Registrar Jornada de Horneado</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Sesión</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Producción sábado de 8 a 11 hs..."
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horas Trabajadas</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={formData.horas_trabajadas}
                    onChange={(e) => setFormData({ ...formData, horas_trabajadas: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor por Hora ($)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    value={formData.costo_hora_mano_obra}
                    onChange={(e) => setFormData({ ...formData, costo_hora_mano_obra: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Productos elaborados */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Productos Horneados en Esta Ventana
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Producto</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <select
                          value={it.receta_id}
                          onChange={(e) => handleUpdateItemRow(idx, 'receta_id', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                        >
                          {recetas.map(r => (
                            <option key={r.id} value={r.id}>{r.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Unidades"
                          value={it.unidades_producidas}
                          onChange={(e) => handleUpdateItemRow(idx, 'unidades_producidas', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-800 outline-none text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caja de cálculo del prorrateo en vivo */}
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/60 text-xs space-y-1">
                <div className="flex justify-between text-amber-900 font-semibold">
                  <span>Costo total de mano de obra de la sesión:</span>
                  <span>${Number(prorrateo.totalMO).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Unidades producidas totales:</span>
                  <span>{prorrateo.totalPonderado} unidades</span>
                </div>
                <div className="flex justify-between text-amber-900 font-black pt-1 border-t border-amber-200/60 text-sm">
                  <span>Mano de obra asignada por unidad:</span>
                  <span>${Number(prorrateo.costoPorUnidadPonderada).toLocaleString('es-AR')} / u</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                <textarea
                  rows="2"
                  placeholder="Detalles de la producción, pedidos de clientes..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                ></textarea>
              </div>

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
                  Registrar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
