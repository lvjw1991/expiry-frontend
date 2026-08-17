export interface ApiResponse<T> {
  code?: number
  message?: string
  data?: T
  [key: string]: unknown
}

// 部署到 Spring Boot 后整个应用挂在 server.servlet.context-path=/ia 下，
// import.meta.env.BASE_URL 会自动等于 vite.config.ts 里配置的 base（'/ia/'），本地开发时也是同一个值
const BASE = import.meta.env.BASE_URL // 形如 '/ia/'，一定以斜杠结尾
const API_PREFIX = `${BASE}api` // '/ia/api'

// location.pathname / location.href 是浏览器原生 API，不会自动帮你带上 /ia 前缀，
// 所以凡是要跟路由路径比较或者做整页跳转的地方，都要先把 /ia 这段去掉/加上，手动处理
function stripBase(pathname: string): string {
  return pathname.startsWith(BASE) ? '/' + pathname.slice(BASE.length) : pathname
}
function withBase(path: string): string {
  return BASE.slice(0, -1) + path // BASE 以 '/' 结尾，path 以 '/' 开头，拼接时去掉一个斜杠
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isMobile = stripBase(window.location.pathname).startsWith('/m/')
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
    const loginPath = withBase(isMobile ? '/m/login' : '/login')
    if (location.pathname !== loginPath) location.href = loginPath
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
  const isMobile = stripBase(window.location.pathname).startsWith('/m/')
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
    const loginPath = withBase(isMobile ? '/m/login' : '/login')
    if (location.pathname !== loginPath) location.href = loginPath
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
