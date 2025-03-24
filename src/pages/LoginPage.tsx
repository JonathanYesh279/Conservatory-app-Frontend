import { useState, FormEvent } from 'react'
import { Mail, Lock, Sun, Moon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Navigate } from 'react-router-dom'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />  
  }

  // Handle form submission
  function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (!email || !password) return
    login(email, password)
  }
  
  // Handle input changes
  function handleEmailChange(ev: React.ChangeEvent<HTMLInputElement>) {
    clearError()
    setEmail(ev.target.value) 
  }
  
  function handlePasswordChange(ev: React.ChangeEvent<HTMLInputElement>) {
    clearError()
    setPassword(ev.target.value) 
  }
  
  return (
    <div className='login-page'>
      <div className='login-form'>
        <button 
          className='theme-toggle' 
          onClick={toggleTheme}
          aria-label='Toggle theme'
        >
          {theme === 'dark' ? (
            <Sun className='icon' />
          ) : (
            <Moon className='icon' />
          )}
        </button>
        
        <h1>התחברות</h1>

        {error && <div className="error-message">{error}</div>}

        <form className='form-section' onSubmit={handleSubmit}>
          <div className='input-container'>
            <input
              type='email'
              id='email'
              className={email ? 'has-value' : ''}
              placeholder=''
              autoComplete='off'
              required
              value={email}
              onChange={handleEmailChange}
            />
            <label htmlFor='email'>מייל</label>
            <Mail className='input-icon' />
          </div>

          <div className='input-container'>
            <input
              type='password'
              id='password'
              className={password ? 'has-value' : ''}
              placeholder=''
              required
              value={password}
              onChange={handlePasswordChange}
            />
            <label htmlFor='password'>סיסמה</label>
            <Lock className='input-icon' />
          </div>

          <button
            className='btn'
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? 'מתחבר...' : 'התחבר'}
          </button>

          <div className='forgot-password'>
            <p>שכחת סיסמה?</p>
            <a href='#'>לחץ כאן</a>
          </div>
        </form>
      </div>
    </div>
  )
}