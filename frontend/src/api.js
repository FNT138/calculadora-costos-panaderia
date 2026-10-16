const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch (e) {
      // Usar mensaje por defecto
    }
    throw new Error(errorMsg);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  // Insumos
  async getInsumos(params = {}) {
    const query = new URLSearchParams();
    if (params.categoria) query.append('categoria', params.categoria);
    if (params.buscar) query.append('buscar', params.buscar);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/insumos${qs}`);
    return handleResponse(res);
  },

  async createInsumo(data) {
    const res = await fetch(`${API_BASE}/insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateInsumo(id, data) {
    const res = await fetch(`${API_BASE}/insumos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteInsumo(id) {
    const res = await fetch(`${API_BASE}/insumos/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Recetas
  async getRecetas(params = {}) {
    const query = new URLSearchParams();
    if (params.categoria) query.append('categoria', params.categoria);
    if (params.buscar) query.append('buscar', params.buscar);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/recetas${qs}`);
    return handleResponse(res);
  },

  async getReceta(id) {
    const res = await fetch(`${API_BASE}/recetas/${id}`);
    return handleResponse(res);
  },

  async createReceta(data) {
    const res = await fetch(`${API_BASE}/recetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateReceta(id, data) {
    const res = await fetch(`${API_BASE}/recetas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteReceta(id) {
    const res = await fetch(`${API_BASE}/recetas/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Producción (Mano de obra y ventanas de tiempo)
  async getSesiones() {
    const res = await fetch(`${API_BASE}/produccion`);
    return handleResponse(res);
  },

  async createSesion(data) {
    const res = await fetch(`${API_BASE}/produccion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteSesion(id) {
    const res = await fetch(`${API_BASE}/produccion/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Simulador de Precios y Maximización
  async getSimulacion(recetaId, params = {}) {
    const query = new URLSearchParams();
    if (params.valor_hora) query.append('valor_hora', params.valor_hora);
    if (params.margen_override) query.append('margen_override', params.margen_override);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/simulador/analisis/${recetaId}${qs}`);
    return handleResponse(res);
  },

  // Configuración
  async getConfig() {
    const res = await fetch(`${API_BASE}/configuracion`);
    return handleResponse(res);
  },

  async updateConfig(data) {
    const res = await fetch(`${API_BASE}/configuracion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Respaldos y Persistencia
  async getBackupStatus() {
    const res = await fetch(`${API_BASE}/backup/status`);
    return handleResponse(res);
  },

  async syncGithub() {
    const res = await fetch(`${API_BASE}/backup/sync-github`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async importBackup(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  exportBackupUrl() {
    return `${API_BASE}/backup/export`;
  }
};
