import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Sun, Moon, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { invitationService, InvitationValidationResponse } from '../services/invitationService';
import { useToast } from '../cmps/Toast';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Component state
  const [teacherInfo, setTeacherInfo] = useState<InvitationValidationResponse['teacher'] | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validation state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    match: false
  });

  // Validate invitation on mount
  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setValidationError('קישור ההזמנה לא תקין');
      setIsValidating(false);
    }
  }, [token]);

  // Validate password in real-time
  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 6,
      match: password === confirmPassword && password.length > 0
    });
  }, [password, confirmPassword]);

  async function validateInvitation() {
    if (!token) return;

    try {
      setIsValidating(true);
      const response = await invitationService.validateInvitation(token);
      setTeacherInfo(response.teacher);
      setValidationError(null);
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      const errorMessage = error?.response?.data?.message || 'הזמנה לא תקפה או פג תוקפה';
      setValidationError(errorMessage);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?error=invalid_invitation');
      }, 3000);
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    
    if (!token || !teacherInfo) return;
    
    // Validate passwords
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await invitationService.acceptInvitation(token, {
        password
      });

      // Validate response structure
      if (!response || !response.teacher || !response.accessToken) {
        throw new Error('Invalid response structure from server');
      }

      // Store authentication tokens
      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.teacher));

      // Show success message with safe access to teacher name
      const teacherName = response.teacher?.personalInfo?.fullName || 'מורה';
      showSuccess(`ברוכים הבאים, ${teacherName}! החשבון שלך הוקם בהצלחה.`);

      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      // Handle different error types
      let errorMessage = 'אירעה שגיאה בהגדרת הסיסמה';
      
      if (error?.message) {
        // Direct error message from our error handler
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        // API error message
        errorMessage = error.response.data.message;
      }
      
      // Map specific error messages to Hebrew
      if (errorMessage.includes('Invalid or expired invitation token')) {
        errorMessage = 'קישור ההזמנה לא תקף או פג תוקפו';
      } else if (errorMessage.includes('Password')) {
        errorMessage = 'בעיה בהגדרת הסיסמה';
      }
      
      setError(errorMessage);
      showError(new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle input changes
  function handlePasswordChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setPassword(ev.target.value);
  }

  function handleConfirmPasswordChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setConfirmPassword(ev.target.value);
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="login-page">
        <div className="login-form compact-form">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
          </button>
          
          <h1>בודק הזמנה...</h1>
          <div className="subtitle">אנא המתן בזמן שאנו מאמתים את ההזמנה</div>
          
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (validationError) {
    return (
      <div className="login-page">
        <div className="login-form compact-form">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
          </button>
          
          <h1>שגיאה בהזמנה</h1>
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{validationError}</span>
          </div>
          <div className="subtitle">מעביר אותך לדף ההתחברות...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-form compact-form">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
        
        <h1>הגדרת סיסמה</h1>
        <div className="subtitle">
          {teacherInfo?.personalInfo?.fullName}<br />
          אנא הגדירו את הסיסמה שלכם
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form className="form-section" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={password ? 'has-value' : ''}
              placeholder=""
              required
              value={password}
              onChange={handlePasswordChange}
              minLength={6}
            />
            <label htmlFor="password">סיסמה</label>
            <Lock className="input-icon" />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="input-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              className={confirmPassword ? 'has-value' : ''}
              placeholder=""
              required
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              minLength={6}
            />
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <Lock className="input-icon" />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password validation indicators */}
          {(password || confirmPassword) && (
            <div className="password-validation">
              <div className={`validation-item ${passwordValidation.length ? 'valid' : 'invalid'}`}>
                <CheckCircle size={16} />
                <span>לפחות 6 תווים</span>
              </div>
              <div className={`validation-item ${passwordValidation.match ? 'valid' : 'invalid'}`}>
                <CheckCircle size={16} />
                <span>הסיסמאות תואמות</span>
              </div>
            </div>
          )}

          <button
            className="btn"
            type="submit"
            disabled={isSubmitting || !passwordValidation.length || !passwordValidation.match}
          >
            {isSubmitting ? 'מגדיר סיסמה...' : 'הגדר סיסמה והתחבר'}
          </button>

          <div className="invitation-info">
            <p>לאחר הגדרת הסיסמה תועבר לדף הראשי</p>
          </div>
        </form>
      </div>
    </div>
  );
}