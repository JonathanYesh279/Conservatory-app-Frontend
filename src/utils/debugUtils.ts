// Debug utilities for development
export const debugUtils = {
  /**
   * Clear all authentication data and force a re-login
   * Useful for testing authentication flow changes
   */
  clearAuthAndReload() {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Clearing authentication data for testing...')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.reload()
    } else {
      console.warn('Debug utils only available in development mode')
    }
  },

  /**
   * Check what user data is currently stored
   */
  inspectStoredUser() {
    const userJson = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    console.log('🔍 Current authentication state:', {
      user: userJson ? JSON.parse(userJson) : null,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : null
    })
  },

  /**
   * Test the avatar initials logic
   */
  testAvatarInitials(fullName: string) {
    const initials = fullName
      .trim()
      .split(' ')
      .filter(name => name.length > 0)
      .map(name => name[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
    
    console.log(`Avatar test for "${fullName}":`, initials)
    return initials
  }
}

// Make it available globally in development
if (process.env.NODE_ENV === 'development') {
  ;(window as any).debugUtils = debugUtils
}