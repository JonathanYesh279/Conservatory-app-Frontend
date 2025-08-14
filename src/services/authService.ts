import { httpService } from './httpService.ts'

interface LoginResponse {
  accessToken: string
<<<<<<< Updated upstream
  refreshToken?: string
  teacher: {
    _id: string
    fullName?: string
    email?: string
    roles: string[]
    personalInfo: {
      fullName: string
      email: string
      phone?: string
      address?: string
    }
    professionalInfo?: {
      instrument: string
      isActive: boolean
    }
    credentials?: {
      email: string
      requiresPasswordChange?: boolean
    }
=======
  teacher: {
    _id: string
    fullName: string
    email: string
    roles: string[]
>>>>>>> Stashed changes
  }
}

interface User {
  _id: string
  fullName: string
  email: string
<<<<<<< Updated upstream
  phone?: string
  address?: string
  roles: string[]
  professionalInfo?: {
    instrument: string
    isActive: boolean
  }
}

interface TokenPayload {
  exp: number
  sub: string
  roles: string[]
}

let refreshPromise: Promise<string> | null = null

function transformTeacherToUser(teacher: LoginResponse['teacher']): User {
  const fullName = teacher.personalInfo?.fullName || teacher.fullName || 'Unknown User'
  const email = teacher.personalInfo?.email || teacher.email || teacher.credentials?.email || ''
  const phone = teacher.personalInfo?.phone || ''
  const address = teacher.personalInfo?.address || ''
  
  return {
    _id: teacher._id,
    fullName,
    email,
    phone,
    address,
    roles: teacher.roles || [],
    professionalInfo: teacher.professionalInfo
  }
=======
  roles: string[]
>>>>>>> Stashed changes
}

export const authService = {
  login, 
  logout,
  getCurrentUser, 
<<<<<<< Updated upstream
  isLoggedIn,
  validateSession,
  isTokenExpired,
  refreshToken,
  getToken,
  setToken,
  clearAuthData
=======
  isLoggedIn
>>>>>>> Stashed changes
}

async function login(email: string, password: string): Promise<User> {
  try {
    const response = await httpService.post<LoginResponse>('auth/login', { email, password })

<<<<<<< Updated upstream
    setToken(response.accessToken)
    
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken)
    }

    // Transform teacher data to user format
    const user = transformTeacherToUser(response.teacher)
    localStorage.setItem('user', JSON.stringify(user))

    // Check if password change is required after successful login
    if (response.teacher.credentials?.requiresPasswordChange) {
      // Store flag for password change requirement
      localStorage.setItem('requiresPasswordChange', 'true')
      // Redirect to profile page with password change flag
      setTimeout(() => {
        window.location.href = '/profile?forcePasswordChange=true'
      }, 100)
    }

    return user
=======
    // store accessToken in localStorage
    localStorage.setItem('accessToken', response.accessToken)

    // store user info in localStorage
    localStorage.setItem('user', JSON.stringify(response.teacher))

    return response.teacher
>>>>>>> Stashed changes
  } catch (err) {
    console.error('Login failed:', err)
    throw err
  }
}

<<<<<<< Updated upstream
async function logout(): Promise<void> {
  try {
    await httpService.post('auth/logout')
  } catch (err) {
    console.error('Logout failed:', err)
  } finally {
    clearAuthData()
=======
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
>>>>>>> Stashed changes
  }
}

function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user')
  if (!userJson) return null

  try {
<<<<<<< Updated upstream
    const userData = JSON.parse(userJson)
    
    // If the stored data is in the old format (Teacher object), transform it
    if (userData.personalInfo && !userData.fullName) {
      return transformTeacherToUser(userData)
    }
    
    // If it's already in the correct format, return as-is
    return userData
=======
    return JSON.parse(userJson)
>>>>>>> Stashed changes
  } catch (err) {
    return null
  }
}

function isLoggedIn(): boolean { 
<<<<<<< Updated upstream
  const token = getToken()
  return !!(token && !isTokenExpired(token))
}

async function validateSession(): Promise<boolean> {
  const token = getToken()
  
  if (!token) {
    return false
  }

  if (isTokenExpired(token)) {
    try {
      await refreshToken()
      return true
    } catch {
      clearAuthData()
      return false
    }
  }

  try {
    await httpService.get('auth/validate')
    return true
  } catch (err) {
    console.error('Session validation failed:', err)
    clearAuthData()
    return false
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as TokenPayload
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

async function refreshToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  const storedRefreshToken = localStorage.getItem('refreshToken')
  if (!storedRefreshToken) {
    throw new Error('No refresh token available')
  }

  refreshPromise = (async () => {
    try {
      const response = await httpService.post<{accessToken: string}>('auth/refresh', {
        refreshToken: storedRefreshToken
      })
      
      setToken(response.accessToken)
      return response.accessToken
    } catch (err) {
      clearAuthData()
      throw err
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function getToken(): string | null {
  return localStorage.getItem('accessToken')
}

function setToken(token: string): void {
  localStorage.setItem('accessToken', token)
}

function clearAuthData(): void {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  refreshPromise = null
=======
  return !!localStorage.getItem('accessToken')
>>>>>>> Stashed changes
}