import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
  timeout: 15000,
})

api.interceptors.request.use(
  config => {
    let token = localStorage.getItem('moneta_token')
    if (token) {
      token = token.replace(/^"|"$/g, '')
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  err => Promise.reject(err)
)

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const url = err.config?.url
    
    // Only wipe the token on 401. 
    // 500 errors (like DB issues) should let the user keep their session.
    if (status === 401) {
      console.warn(`[API] Unauthorized (401) on ${url}. Wiping session.`)
      localStorage.removeItem('moneta_token')
    } else if (status) {
      console.error(`[API] Error ${status} on ${url}`, err.response?.data)
    } else {
      console.error(`[API] Network or unknown error on ${url}`, err.message)
    }

    const msg = err.response?.data?.detail || err.message || 'Something went wrong'
    return Promise.reject(new Error(Array.isArray(msg) ? msg[0]?.msg : msg))
  }
)

// ── Auth ─────────────────────────────────────────────────────────
export const loginUser = (params) =>
  api.post('auth/token', params).then(r => r.data)

export const registerUser = (data) =>
  api.post('auth/register', data).then(r => r.data)

export const fetchMe = () =>
  api.get('auth/me').then(r => r.data)

export const updateProfile = (data) =>
  api.put('auth/profile', data).then(r => r.data)

// ── Transactions ─────────────────────────────────────────────────
export const fetchTransactions = (params = {}) =>
  api.get('transactions/', { params }).then(r => r.data)

export const fetchTransaction = (id) =>
  api.get(`transactions/${id}`).then(r => r.data)

export const createTransaction = (data) =>
  api.post('transactions/', data).then(r => r.data)

export const createTransactionWithScreenshot = (formData) =>
  api.post('transactions/with-screenshot', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const updateTransaction = (id, data) =>
  api.put(`transactions/${id}`, data).then(r => r.data)

export const updateScreenshot = (id, formData) =>
  api.patch(`transactions/${id}/screenshot`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const deleteTransaction = (id) =>
  api.delete(`transactions/${id}`)

// ── Settings ─────────────────────────────────────────────────────
export const fetchOpeningBalance = () =>
  api.get('settings/opening-balance').then(r => r.data)

export const updateOpeningBalance = (opening_balance) =>
  api.put('settings/opening-balance', { opening_balance }).then(r => r.data)

export const fetchSmtpSettings = () =>
  api.get('settings/smtp').then(r => r.data)

export const updateSmtpSettings = (data) =>
  api.put('settings/smtp', data).then(r => r.data)

// ── Reports ──────────────────────────────────────────────────────
export const fetchSummary = () =>
  api.get('reports/summary').then(r => r.data)

export const fetchMonthlyReport = (year) =>
  api.get('reports/monthly', { params: year ? { year } : {} }).then(r => r.data)

export const fetchDailyReport = (month) =>
  api.get('reports/daily', { params: month ? { month } : {} }).then(r => r.data)

export const sendReportEmail = () =>
  api.post('reports/send-email').then(r => r.data)

// ── Events ───────────────────────────────────────────────────────
export const fetchEvents = (month) =>
  api.get('events/', { params: month ? { month } : {} }).then(r => r.data)

export const createEvent = (data) =>
  api.post('events/', data).then(r => r.data)

export const updateEvent = (id, data) =>
  api.put(`events/${id}`, data).then(r => r.data)

export const deleteEvent = (id) =>
  api.delete(`events/${id}`).then(r => r.data)

// ── Tasks ────────────────────────────────────────────────────────
export const fetchTasks = (is_done) =>
  api.get('tasks/', { params: is_done !== undefined ? { is_done } : {} }).then(r => r.data)

export const createTask = (data) =>
  api.post('tasks/', data).then(r => r.data)

export const updateTask = (id, data) =>
  api.put(`tasks/${id}`, data).then(r => r.data)

export const deleteTask = (id) =>
  api.delete(`tasks/${id}`).then(r => r.data)

// ── Clients ──────────────────────────────────────────────────────
export const fetchClients = () =>
  api.get('clients/').then(r => r.data)

export const fetchClient = (id) =>
  api.get(`clients/${id}`).then(r => r.data)

export const createClient = (data) =>
  api.post('clients/', data).then(r => r.data)

export const updateClient = (id, data) =>
  api.put(`clients/${id}`, data).then(r => r.data)

export const deleteClient = (id) =>
  api.delete(`clients/${id}`).then(r => r.data)

// ── Files ────────────────────────────────────────────────────────
export const fetchSecureFile = (filename) =>
  api.get(`files/${filename}`, { responseType: 'blob' }).then(r => r.data)

// ── Budgeting ────────────────────────────────────────────────────
export const fetchBudgetSummary = (month) =>
  api.get('budget/summary', { params: { month } }).then(r => r.data)

export const setBudget = (data) =>
  api.post('budget/', data).then(r => r.data)

export default api
