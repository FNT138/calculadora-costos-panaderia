import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Clock, Percent, Flame } from 'lucide-react';
import { api } from '../api';

export default function ConfigModal({ isOpen, onClose, onNotify, onSaved }) {
  const [formData, setFormData] = useState({
    costo_hora_defecto: 20000,
    margen_defecto: 60,
    porcentaje_servicios_defecto: 10
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getConfig().then(data => {
        setFormData({
          costo_hora_defecto: data.costo_hora_defecto,
          margen_defecto: data.margen_defecto,
          porcentaje_servicios_defecto: data.porcentaje_servicios_defecto
        });
      }).catch(err => {
        onNotify('Error al cargar ajustes: ' + err.message, 'error');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateConfig({
        costo_hora_defecto: Number(formData.costo_hora_defecto),
        margen_defecto: Number(formData.margen_defecto),
        porcentaje_servicios_defecto: Number(formData.porcentaje_servicios_defecto)
      });
      onNotify('Ajustes guardados correctamente', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      onNotify('Error al guardar ajustes: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">Ajustes Generales del Taller</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Valor Hora de Mano de Obra Deseado ($)</span>
            </label>
            <input
              type="number"
              step="500"
              min="0"
              required
              value={formData.costo_hora_defecto}
              onChange={(e) => setFormData({ ...formData, costo_hora_defecto: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ¿Cuánto quieres ganar por cada hora de horneado y amasado? (Por defecto: $20.000)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Percent className="w-3.5 h-3.5 text-amber-600" />
              <span>Margen de Ganancia por Defecto (%)</span>
            </label>
            <input
              type="number"
              step="5"
              min="0"
              max="200"
              required
              value={formData.margen_defecto}
              onChange={(e) => setFormData({ ...formData, margen_defecto: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Margen sugerido sobre el costo de producción para fijar precios de venta.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Gastos Indirectos / Servicios (%)</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="50"
              required
              value={formData.porcentaje_servicios_defecto}
              onChange={(e) => setFormData({ ...formData, porcentaje_servicios_defecto: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Porcentaje estimado para cubrir gas, electricidad, agua y desgaste del horno.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Ajustes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
