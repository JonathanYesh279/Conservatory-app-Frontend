import { useState, FormEvent } from 'react'
import { MdEmail, MdLock } from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()

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
        <h1>התחברות</h1>

        {error && <div className="error-message">{error}</div>}

        <form className='form-section' onSubmit={handleSubmit}>
          <div className='form-group form-floating glass'>
            <div className='input-icon-wrapper'>
              <input
                type='email'
                id='email'
                placeholder='מייל'
                autoComplete='off'
                required
                value={email}
                onChange={handleEmailChange}
              />
              <MdEmail className='icon' />
              <label htmlFor='email'>מייל</label>
            </div>
          </div>

          <div className='form-group form-floating glass'>
            <div className='input-icon-wrapper'>
              <input
                type='password'
                id='password'
                placeholder='סיסמה'
                required
                value={password}
                onChange={handlePasswordChange}
              />
              <MdLock className='icon' />
              <label htmlFor='password'>סיסמה</label>
            </div>
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