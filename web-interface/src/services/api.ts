import { useAuthStore } from '../store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const token = useAuthStore.getState().token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await useAuthStore.getState().refreshSession()
      if (!refreshed) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
      throw new Error('Session expired')
    }

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Erro desconhecido' }
    }

    return { success: true, data }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
}

export const api = new ApiService()

// Specific API functions
export const instancesApi = {
  list: () => api.get<{ instances: any[] }>('/api/instances'),
  get: (id: string) => api.get<{ instance: any }>(`/api/instances/${id}`),
  create: (name: string) => api.post<{ instance: any }>('/api/instances', { name }),
  connect: (id: string) => api.post(`/api/instances/${id}/connect`),
  disconnect: (id: string) => api.post(`/api/instances/${id}/disconnect`),
  delete: (id: string) => api.delete(`/api/instances/${id}`),
  getQR: (id: string) => api.get<{ qrCode: string }>(`/api/instances/${id}/qr`),
  getStats: () => api.get<any>('/api/whatsapp/stats'),
}

export const conversationsApi = {
  list: (instanceId: string) =>
    api.get<{ conversations: any[] }>(`/api/instances/${instanceId}/conversations`),
  get: (instanceId: string, conversationId: string) =>
    api.get<{ conversation: any }>(`/api/instances/${instanceId}/conversations/${conversationId}`),
  getMessages: (instanceId: string, conversationId: string, limit = 50, before?: string) => {
    let url = `/api/instances/${instanceId}/conversations/${conversationId}/messages?limit=${limit}`
    if (before) url += `&before=${before}`
    return api.get<{ messages: any[] }>(url)
  },
  sendMessage: (instanceId: string, conversationId: string, content: string, type = 'text') =>
    api.post(`/api/instances/${instanceId}/conversations/${conversationId}/messages`, { content, type }),
  markAsRead: (instanceId: string, conversationId: string) =>
    api.post(`/api/instances/${instanceId}/conversations/${conversationId}/read`),
  archive: (instanceId: string, conversationId: string, archived: boolean) =>
    api.put(`/api/instances/${instanceId}/conversations/${conversationId}/archive`, { archived }),
  pin: (instanceId: string, conversationId: string, pinned: boolean) =>
    api.put(`/api/instances/${instanceId}/conversations/${conversationId}/pin`, { pinned }),
  updateLabels: (instanceId: string, conversationId: string, labelIds: string[]) =>
    api.put(`/api/instances/${instanceId}/conversations/${conversationId}/labels`, { labelIds }),
  starMessage: (instanceId: string, conversationId: string, messageId: string, starred: boolean) =>
    api.post(`/api/instances/${instanceId}/conversations/${conversationId}/messages/${messageId}/star`, { starred }),
}

export const usersApi = {
  list: (tenantId?: string) => api.get<{ users: any[] }>(`/api/users${tenantId ? `?tenantId=${tenantId}` : ''}`),
  get: (id: string) => api.get<{ user: any }>(`/api/users/${id}`),
  create: (data: any) => api.post<{ user: any }>('/api/users', data),
  update: (id: string, data: any) => api.put<{ user: any }>(`/api/users/${id}`, data),
  delete: (id: string) => api.delete(`/api/users/${id}`),
  forceLogout: (id: string) => api.post(`/api/users/${id}/logout`),
  updateStatus: (id: string, status: string, message?: string) => api.put(`/api/users/${id}/status`, { status, message }),
  importUsers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}/api/users/import`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await response.json();
    return { success: response.ok, data };
  },
}

export const customersApi = {
  list: (search?: string, limit = 50, offset = 0) => {
    let url = `/api/customers?limit=${limit}&offset=${offset}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    return api.get<{ customers: any[], total: number }>(url)
  },
  get: (id: string) => api.get<{ customer: any }>(`/api/customers/${id}`),
  update: (id: string, data: any) => api.put(`/api/customers/${id}`, data),
  create: (data: any) => api.post(`/api/customers`, data),
  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}/api/customers/import`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await response.json();
    return { success: response.ok, data };
  },
}

export const tenantsApi = {
  list: () => api.get<{ tenants: any[] }>('/api/tenants'),
  create: (data: any) => api.post<{ tenantId: string }>('/api/tenants', data),
  update: (id: string, data: any) => api.put(`/api/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/api/tenants/${id}`),
  exportData: async () => {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_BASE}/api/tenants/me/export`, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error('Falha no download')
    return response.blob()
  },
}

export const schedulingApi = {
  getConfig: () => api.get<{ config: any }>('/api/scheduling/config'),
  saveConfig: (config: any) => api.post('/api/scheduling/config', config),
  getSlots: (date: string) => api.get<{ slots: string[] }>(`/api/scheduling/slots?date=${date}`),
  listAppointments: (start?: string, end?: string) => {
    let url = '/api/scheduling/appointments'
    if (start && end) url += `?start=${start}&end=${end}`
    return api.get<{ appointments: any[] }>(url)
  },
  createAppointment: (data: any) => api.post('/api/scheduling/appointments', data),
  cancelAppointment: (id: string) => api.delete(`/api/scheduling/appointments/${id}`),
}

export const authApi = {
  changePassword: (data: any) => api.post('/api/auth/change-password', data),
  generate2FA: () => api.post<{ secret: string; qrCode: string }>('/api/auth/2fa/generate'),
  activate2FA: (token: string) => api.post<{ message: string }>('/api/auth/2fa/activate', { token }),
  disable2FA: () => api.post<{ message: string }>('/api/auth/2fa/disable'),
}

export const auditApi = {
  getLogs: (limit = 50, offset = 0) => api.get<any[]>(`/api/audit-logs?limit=${limit}&offset=${offset}`),
}

export const labelsApi = {
  list: () => api.get<{ data: any[] }>('/api/labels'),
  create: (name: string, color: string) => api.post<{ id: string }>('/api/labels', { name, color }),
  delete: (id: string) => api.delete(`/api/labels/${id}`),
}

export const quickMessagesApi = {
  list: () => api.get<{ data: any[] }>('/api/quick-messages'),
  create: (data: any) => api.post<{ id: string }>('/api/quick-messages', data),
  update: (id: string, data: any) => api.put(`/api/quick-messages/${id}`, data),
  delete: (id: string) => api.delete(`/api/quick-messages/${id}`),
}

// Media API
export interface MediaUploadResult {
  id: string
  originalName: string
  filename: string
  mimetype: string
  size: number
  width?: number
  height?: number
  url: string
  thumbnailUrl?: string | null
}

export const mediaApi = {
  upload: async (file: File, options?: { generateThumbnail?: boolean }): Promise<{ success: boolean; media?: MediaUploadResult; error?: string }> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (options?.generateThumbnail !== undefined) {
        formData.append('generateThumbnail', String(options.generateThumbnail))
      }

      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE}/api/media/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Erro no upload' }
      }

      return { success: true, media: data.media }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  uploadMultiple: async (files: File[]): Promise<{ success: boolean; results?: any[]; error?: string }> => {
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE}/api/media/upload/multiple`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'Erro no upload' }
      }

      return { success: true, results: data.results }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  },

  getUrl: (mediaId: string) => `${API_BASE}/api/media/${mediaId}`,
  getThumbnailUrl: (mediaId: string) => `${API_BASE}/api/media/${mediaId}/thumbnail`,
  getDownloadUrl: (mediaId: string) => `${API_BASE}/api/media/${mediaId}/download`,

  delete: (mediaId: string) => api.delete(`/api/media/${mediaId}`),
  getStats: () => api.get<{ totalFiles: number; totalSize: number; byType: Record<string, number> }>('/api/media/stats/summary'),
}
