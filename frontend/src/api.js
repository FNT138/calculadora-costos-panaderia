const API_BASE = '/api';
const TOKEN_KEY = 'admin_pin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { isAdmin: true } }));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { isAdmin: false } }));
  }
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { isAdmin: false } }));
}

export function hasAdminToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAdminToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['X-Admin-Token'] = token;
  }
  return headers;
}

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

    if (response.status === 401) {
      clearAdminToken();
      window.dispatchEvent(new CustomEvent('admin-auth-required', { detail: { message: errorMsg } }));
    }

    throw new Error(errorMsg);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  // Autenticación por PIN
  async loginPin(pin) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await handleResponse(res);
    if (data && data.token) {
      setAdminToken(data.token);
    }
    return data;
  },

  async verifyAuth() {
    const token = getAdminToken();
    if (!token) return { authenticated: false };
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(res);
      if (!data.authenticated) {
        clearAdminToken();
      }
      return data;
    } catch {
      clearAdminToken();
      return { authenticated: false };
    }
  },

  async changePin(currentPin, newPin) {
    const res = await fetch(`${API_BASE}/auth/change-pin`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
    });
    const data = await handleResponse(res);
    if (data && data.token) {
      setAdminToken(data.token);
    }
    return data;
  },

  logout() {
    clearAdminToken();
  },

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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateInsumo(id, data) {
    const res = await fetch(`${API_BASE}/insumos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteInsumo(id) {
    const res = await fetch(`${API_BASE}/insumos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateReceta(id, data) {
    const res = await fetch(`${API_BASE}/recetas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteReceta(id) {
    const res = await fetch(`${API_BASE}/recetas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateSesion(id, data) {
    const res = await fetch(`${API_BASE}/produccion/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteSesion(id) {
    const res = await fetch(`${API_BASE}/produccion/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async importBackup(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    return handleResponse(res);
  },

  exportBackupUrl() {
    return `${API_BASE}/backup/export`;
  }
};
