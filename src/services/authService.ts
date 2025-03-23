import { httpService } from './httpService.ts'

interface LoginResponse {
  accessToken: string
  teacher: {
    _id: string
    fullName: string
    email: string
    roles: string[]
  }
}

interface User {
  _id: string
  fullName: string
  email: string
  roles: string[]
}

export const authService = {
  login, 
  logout,
  getCurrentUser, 
  isLoggedIn
}

async function login(email: string, password: string): Promise<User> {
  try {
    const response = await httpService.post<LoginResponse>('auth/login', { email, password })

    // store accessToken in localStorage
    localStorage.setItem('accessToken', response.accessToken)

    // store user info in localStorage
    localStorage.setItem('user', JSON.stringify(response.teacher))

    return response.teacher
  } catch (err) {
    console.error('Login failed:', err)
    throw err
  }
}

function logout(): void {
  try {
    httpService.post('auth/logout')

    // clean localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  } catch (err) {
    console.error('Logout failed:', err)
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }
}

function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user')
  if (!userJson) return null

  try {
    return JSON.parse(userJson)
  } catch (err) {
    return null
  }
}

function isLoggedIn(): boolean { 
  return !!localStorage.getItem('accessToken')
}