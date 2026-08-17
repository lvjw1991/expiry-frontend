import { http } from './http'

export interface LoginUser {
  id: number
  username: string
  realName: string
  email: string
  phone: string
  role: 'ADMIN' | 'STAFF' | string
  token: string
}

export async function login(username: string, password: string): Promise<LoginUser> {
  const result: any = await http.post<any>('/auth/login', { username, password })

  // 兼容后端标准响应 {code,message,data:{...token}}，
  // 以及开发环境可能出现的 data.data / 直接返回用户对象。
  const user = result?.data?.data ?? result?.data ?? result
  const token = user?.token ?? user?.accessToken ?? user?.access_token

  if (!token) {
    console.error('Login response without token:', result)
    throw new Error('登录接口未返回 token，请检查后端登录响应')
  }

  return { ...user, token } as LoginUser
}

export function getCurrentUser() {
  return http.get<LoginUser>('/auth/me')
}

export function logout() {
  window.localStorage.removeItem('access_token')
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('login_user')
}


export function saveAuth(user: LoginUser, platform: 'pc' | 'mobile') {
  const key = platform === 'mobile' ? 'mobile_access_token' : 'access_token'
  const userKey = platform === 'mobile' ? 'mobile_login_user' : 'login_user'
  window.localStorage.setItem(key, user.token)
  window.localStorage.setItem(userKey, JSON.stringify(user))
  return user.token
}

export function getToken(platform: 'pc' | 'mobile') {
  return window.localStorage.getItem(platform === 'mobile' ? 'mobile_access_token' : 'access_token')
}

export function clearAuth(platform: 'pc' | 'mobile') {
  window.localStorage.removeItem(platform === 'mobile' ? 'mobile_access_token' : 'access_token')
  window.localStorage.removeItem(platform === 'mobile' ? 'mobile_login_user' : 'login_user')
}
