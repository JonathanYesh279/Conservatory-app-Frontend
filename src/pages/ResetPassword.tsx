import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import { passwordService } from '../services/passwordService';
import { sanitizeError } from '../utils/errorHandler';

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password || !confirmPassword) {
      setError('יש למלא את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (!token) {
      setError('טוקן לא תקין');
      return;
    }

    try {
      setLoading(true);
      await passwordService.resetPassword({
        token,
        newPassword: password
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-form">
          <div className="success-container">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h1>הסיסמה שונתה בהצלחה!</h1>
            <p>הסיסמה שלך עודכנה בהצלחה. אתה מועבר לדף ההתחברות...</p>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-form">
        <h1>איפוס סיסמה</h1>
        <p className="reset-description">
          הזן את הסיסמה החדשה שלך
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={password ? 'has-value' : ''}
              placeholder=""
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
            <label htmlFor="password">סיסמה חדשה</label>
            <Lock className="input-icon" />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
            <label htmlFor="confirmPassword">אישור סיסמה</label>
            <Lock className="input-icon" />
            <button
              type="button"
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading ? 'מאפס סיסמה...' : 'איפוס סיסמה'}
          </button>
        </form>

        <div className="back-to-login">
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="back-link"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    </div>
  );
}