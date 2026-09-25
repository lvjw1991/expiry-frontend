
const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

function isMobilePath() {
  const pathname = window.location.pathname
  const appPath = BASE_PATH && BASE_PATH !== '/'
    ? pathname.startsWith(BASE_PATH)
      ? pathname.slice(BASE_PATH.length) || '/'
      : pathname
    : pathname

  return appPath.startsWith('/m/')
}

export interface ApiResponse<T> {
  code?: number
  message?: string
  data?: T
  [key: string]: unknown
}

const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'

export function resolveAssetUrl(value?: string): string {
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    if (url.pathname.includes('/uploads/')) {
      let path = url.pathname
      if (!path.startsWith('/ia/')) {
        path = `/ia${path.startsWith('/') ? path : `/${path}`}`
      }
      return `${window.location.origin}${path}${url.search}${url.hash}`
    }
    return url.href
  } catch {
    return value
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isMobile = isMobilePath()
  const token = isMobile
    ? window.localStorage.getItem('mobile_access_token')
    : (window.localStorage.getItem('access_token') || window.localStorage.getItem('token'))
  const response = await fetch(`${API_PREFIX}${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })

  if (response.status === 401) {
    window.localStorage.removeItem(isMobile ? 'mobile_access_token' : 'access_token')
    window.localStorage.removeItem(isMobile ? 'mobile_login_user' : 'login_user')
    const loginPath = isMobile ? '/m/login' : '/login'
    const target = `${import.meta.env.BASE_URL}${loginPath.replace(/^\/+/, '')}`
    if (location.pathname !== target) location.href = target
    throw new Error('登录已过期')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T

  const result: ApiResponse<T> = await response.json()
  if (result.code !== undefined && result.code !== 200 && result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }

  return (result.data !== undefined ? result.data : result) as T
}

async function downloadFile(url: string, params?: Record<string, unknown>): Promise<{ blob: Blob; filename?: string }> {
  const isMobile = isMobilePath()
  const token = isMobile
    ? window.localStorage.getItem('mobile_access_token')
    : (window.localStorage.getItem('access_token') || window.localStorage.getItem('token'))
  const query = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : ''

  const response = await fetch(`${API_PREFIX}${url}${query}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  if (response.status === 401) {
    window.localStorage.removeItem(isMobile ? 'mobile_access_token' : 'access_token')
    window.localStorage.removeItem(isMobile ? 'mobile_login_user' : 'login_user')
    const loginPath = isMobile ? '/m/login' : '/login'
    const target = `${import.meta.env.BASE_URL}${loginPath.replace(/^\/+/, '')}`
    if (location.pathname !== target) location.href = target
    throw new Error('登录已过期')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition')
  let filename: string | undefined
  const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^;"]+)/i)
  if (match?.[1]) filename = decodeURIComponent(match[1].replace(/^"|"$/g, ''))

  return { blob: await response.blob(), filename }
}

export const http = {
  get<T>(url: string, params?: object) {
    const query = params
      ? '?' + new URLSearchParams(
          Object.entries(params as Record<string, unknown>)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return request<T>(`${url}${query}`)
  },
  post<T>(url: string, body?: unknown) {
    return request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {})
    })
  },
  put<T>(url: string, body?: unknown) {
    return request<T>(url, { method: 'PUT', body: JSON.stringify(body ?? {}) })
  },
  delete<T>(url: string) {
    return request<T>(url, { method: 'DELETE' })
  },
  download(url: string, params?: object) {
    return downloadFile(url, params as Record<string, unknown> | undefined)
  }
}
