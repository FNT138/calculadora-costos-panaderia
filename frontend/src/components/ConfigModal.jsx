import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Save, Clock, Percent, Flame, Download, Upload, RefreshCw, Database, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function ConfigModal({ isOpen, onClose, onNotify, onSaved }) {
  const [formData, setFormData] = useState({
    costo_hora_defecto: 20000,
    margen_defecto: 60,
    porcentaje_servicios_defecto: 10
  });
  const [backupStatus, setBackupStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const fileInputRef = useRef(null);

  const cargarDatos = () => {
    api.getConfig().then(data => {
      setFormData({
        costo_hora_defecto: data.costo_hora_defecto,
        margen_defecto: data.margen_defecto,
        porcentaje_servicios_defecto: data.porcentaje_servicios_defecto
      });
    }).catch(err => {
      onNotify('Error al cargar ajustes: ' + err.message, 'error');
    });

    api.getBackupStatus().then(status => {
      setBackupStatus(status);
    }).catch(err => {
      console.warn('Error al obtener estado de backup:', err);
    });
  };

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
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

  const handleDownloadBackup = () => {
    window.location.href = api.exportBackupUrl();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      await api.importBackup(file);
      onNotify('¡Copia de seguridad restaurada exitosamente!', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      onNotify('Error al restaurar copia: ' + err.message, 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSyncGithub = async () => {
    try {
      setSyncingGithub(true);
      const res = await api.syncGithub();
      onNotify(res.message || 'Sincronizado con GitHub', 'success');
      cargarDatos();
    } catch (err) {
      onNotify('Error al sincronizar con GitHub: ' + err.message, 'error');
    } finally {
      setSyncingGithub(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">Ajustes & Copias de Seguridad</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Valores generales */}
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

          {/* Sección de Persistencia y Copias de Seguridad */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Persistencia & Copias de Seguridad
              </h4>
            </div>

            {/* Estado del motor / sync */}
            <div className={`p-3 rounded-2xl border text-xs ${
              backupStatus?.github_sync_activo
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : backupStatus?.es_permanente
                ? 'bg-sky-50 text-sky-900 border-sky-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  {backupStatus?.github_sync_activo
                    ? 'Sincronización con GitHub Activa'
                    : backupStatus?.es_permanente
                    ? 'Base de Datos Permanente Activa'
                    : 'Almacenamiento Temporal SQLite'}
                </span>
              </div>
              <p className="text-[11px] leading-tight opacity-90">
                {backupStatus?.github_sync_activo
                  ? `Tus recetas e insumos se sincronizan automáticamente con el repositorio ${backupStatus?.github_repo}. Al reiniciar en Render se restauran solos.`
                  : backupStatus?.es_permanente
                  ? `Motor conectado: ${backupStatus?.motor_base_datos}. Tus datos nunca se borrarán.`
                  : 'Render reinicia los archivos temporales al apagarse por inactividad. Puedes configurar GITHUB_TOKEN en Render para que se guarden solos en tu repo, o descargar tu copia de seguridad.'}
              </p>
            </div>

            {/* Botones de Respaldo */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-semibold transition-colors"
                title="Descargar archivo JSON con todas tus recetas e insumos"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Copia</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-semibold transition-colors"
                title="Subir un archivo JSON previamente descargado"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar Copia</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            {backupStatus?.github_sync_activo && (
              <button
                type="button"
                onClick={handleSyncGithub}
                disabled={syncingGithub}
                className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingGithub ? 'animate-spin' : ''}`} />
                <span>{syncingGithub ? 'Sincronizando...' : 'Guardar en GitHub Ahora'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cerrar
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
