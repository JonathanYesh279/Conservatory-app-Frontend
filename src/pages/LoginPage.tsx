import { useState, FormEvent } from 'react'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { passwordService } from '../services/passwordService'
import { sanitizeError } from '../utils/errorHandler'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string | null>(null)
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

  // Handle forgot password
  async function handleForgotPassword(ev: FormEvent) {
    ev.preventDefault()
    if (!forgotPasswordEmail) return

    setForgotPasswordLoading(true)
    setForgotPasswordError(null)
    setForgotPasswordSuccess(null)

    try {
      await passwordService.forgotPassword({ email: forgotPasswordEmail })
      setForgotPasswordSuccess('נשלח אימייל עם הוראות לאיפוס סיסמה')
      setForgotPasswordEmail('')
    } catch (err) {
      const sanitized = sanitizeError(err)
      setForgotPasswordError(sanitized.userMessage)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  function handleShowForgotPassword() {
    setShowForgotPassword(true)
    setForgotPasswordEmail(email) // Pre-fill with login email
    setForgotPasswordError(null)
    setForgotPasswordSuccess(null)
  }

  function handleBackToLogin() {
    setShowForgotPassword(false)
    setForgotPasswordError(null)
    setForgotPasswordSuccess(null)
    setForgotPasswordEmail('')
  }
  
  return (
    <div className='login-page' data-theme='dark'>
      <div className='login-form'>
        {!showForgotPassword ? (
          <>
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
                <button 
                  type='button'
                  onClick={handleShowForgotPassword}
                  className='forgot-password-link'
                >
                  לחץ כאן
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className='back-button-container'>
              <button 
                type='button'
                onClick={handleBackToLogin}
                className='back-button'
              >
                <ArrowLeft className='icon' />
                חזרה להתחברות
              </button>
            </div>
            
            <h1>שכחת סיסמה?</h1>
            <p className='forgot-password-description'>
              הזן את כתובת המייל שלך ונשלח לך הוראות לאיפוס הסיסמה
            </p>

            {forgotPasswordError && (
              <div className="error-message">{forgotPasswordError}</div>
            )}

            {forgotPasswordSuccess && (
              <div className="success-message">{forgotPasswordSuccess}</div>
            )}

            <form className='form-section' onSubmit={handleForgotPassword}>
              <div className='input-container'>
                <input
                  type='email'
                  id='forgot-email'
                  className={forgotPasswordEmail ? 'has-value' : ''}
                  placeholder=''
                  autoComplete='off'
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                />
                <label htmlFor='forgot-email'>כתובת מייל</label>
                <Mail className='input-icon' />
              </div>

              <button
                className='btn'
                type='submit'
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? 'שולח...' : 'שלח הוראות איפוס'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}