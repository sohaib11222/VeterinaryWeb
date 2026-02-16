/**
 * Veterinary API client
 * Axios instance + small wrapper helpers used by TanStack Query.
 */

import axios from 'axios'
import API_BASE_URL from './apiConfig'

// Core axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

// Attach auth token on each request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Normalize responses & handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        // Hard redirect keeps it simple; can be improved later
        window.location.href = '/login'
      }

      return Promise.reject({
        status,
        message: data?.message || error.message,
        data,
      })
    }

    if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        data: null,
      })
    }

    return Promise.reject({
      status: 0,
      message: error.message || 'An unexpected error occurred',
      data: null,
    })
  }
)

// Simple helpers returning response.data
export const api = {
  get: async (url, config = {}) => {
    const res = await apiClient.get(url, config)
    return res.data
  },
  post: async (url, data = {}, config = {}) => {
    const res = await apiClient.post(url, data, config)
    return res.data
  },
  put: async (url, data = {}, config = {}) => {
    const res = await apiClient.put(url, data, config)
    return res.data
  },
  patch: async (url, data = {}, config = {}) => {
    const res = await apiClient.patch(url, data, config)
    return res.data
  },
  delete: async (url, config = {}) => {
    const res = await apiClient.delete(url, config)
    return res.data
  },
  upload: async (url, formData, config = {}) => {
    const res = await apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config.headers || {}),
      },
    })
    return res.data
  },
}

export default apiClient

