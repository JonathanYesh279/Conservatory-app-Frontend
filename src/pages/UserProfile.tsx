import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { httpService } from '../services/httpService';
import { passwordService } from '../services/passwordService';
import { Teacher } from '../types/teacher';
import { sanitizeError } from '../utils/errorHandler';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Music, 
  Calendar, 
  Shield, 
  Edit2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Lock,
  ArrowLeft
} from 'lucide-react';

interface UserProfileData {
  _id: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
  };
  roles: string[];
  professionalInfo?: {
    instrument: string;
    isActive: boolean;
  };
  credentials?: {
    email: string;
    lastLogin?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfileData | null>(null);
  const [saving, setSaving] = useState(false);

  // Get role badge color (matching TeacherPreview)
  const getRoleBadgeColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      מורה: '#4D55CC', // Primary color
      מנצח: '#28A745', // Success color
      'מדריך הרכב': '#FFC107', // Warning color
      מנהל: '#DC3545', // Danger color
      'מורה תאוריה': '#6F42C1', // Purple color
    };
    return roleColors[role] || '#6c757d'; // Default color
  };
  
  // Initialize profile data from user store
  const initializeFromUser = () => {
    if (user) {
      const initialData: UserProfileData = {
        _id: user._id,
        personalInfo: {
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || ''
        },
        roles: user.roles || [],
        professionalInfo: user.professionalInfo ? {
          instrument: user.professionalInfo.instrument || '',
          isActive: true // Default to true since User interface doesn't have isActive
        } : undefined,
        credentials: {
          email: user.email || ''
        }
      };
      
      setProfileData(initialData);
      setEditData(initialData);
    }
  };
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeFromUser();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await httpService.get<UserProfileData>(`teachers/${user._id}`);
      // Merge API data with user data, prioritizing API data
      const mergedData: UserProfileData = {
        _id: response._id || user._id,
        personalInfo: {
          fullName: response.personalInfo?.fullName || user.fullName || '',
          email: response.personalInfo?.email || user.email || '',
          phone: response.personalInfo?.phone || user.phone || '',
          address: response.personalInfo?.address || user.address || ''
        },
        roles: response.roles || user.roles || [],
        professionalInfo: response.professionalInfo || (user.professionalInfo ? {
          instrument: user.professionalInfo.instrument || '',
          isActive: true // Default to true since User interface doesn't have isActive
        } : undefined),
        credentials: response.credentials || {
          email: user.email || ''
        },
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
      setProfileData(mergedData);
      setEditData(mergedData);
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized.userMessage);
      // Keep the initialized data from user store if API fails
      console.log('API failed, using user store data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData);
    setError(null);
  };

  const handleSave = async () => {
    if (!editData || !profileData) return;
    
    try {
      setSaving(true);
      
      // Only send the fields that should be updated
      const updateData = {
        personalInfo: editData.personalInfo,
        roles: editData.roles,
        professionalInfo: editData.professionalInfo
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await httpService.put<{success: boolean, data: UserProfileData}>(`teachers/profile/me`, updateData);
      setProfileData(response.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      const sanitized = sanitizeError(err);
      setError(sanitized.userMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof UserProfileData, field: string, value: string) => {
    if (!editData) return;
    
    setEditData(prev => {
      if (!prev) return prev;
      
      const currentSection = prev[section];
      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('יש למלא את כל השדות');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('הסיסמאות החדשות אינן תואמות');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית');
      return;
    }

    try {
      setPasswordLoading(true);
      await passwordService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordSuccess('הסיסמה שונתה בהצלחה. תתבקש להתחבר מחדש.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000);
      
    } catch (err) {
      const sanitized = sanitizeError(err);
      setPasswordError(sanitized.userMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (!profileData && !loading) {
    return (
      <div className="page-container">
        <div className="error-container">
          <p>שגיאה בטעינת הפרופיל</p>
          <button onClick={loadUserProfile} className="retry-btn">
            נסה שוב
          </button>
        </div>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>טוען פרופיל...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="page-container">
      <div className="page-header">
        <button 
          onClick={handleGoBack}
          className="close-btn"
          aria-label="חזרה לעמוד הקודם"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="header-content">
          {profileData?.personalInfo?.fullName && (
            <h1 className="user-name">
              {profileData.personalInfo.fullName}
            </h1>
          )}
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button onClick={handleEdit} className="btn btn-primary">
              <Edit2 size={20} />
              עריכה
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <div className="spinner-small"></div>
                    שומר...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    שמירה
                  </>
                )}
              </button>
              <button 
                onClick={handleCancel} 
                disabled={saving}
                className="btn btn-secondary"
              >
                <X size={20} />
                ביטול
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {passwordSuccess && (
        <div className="success-message">
          {passwordSuccess}
        </div>
      )}

      <div className="profile-content">
        {/* Main Information Card */}
        <div className="main-section">
          <div className="card">
            <div className="card-header">
              <User size={20} />
              <h2>פרטים אישיים</h2>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fullName">
                    <User size={16} />
                    שם מלא
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={isEditing ? (editData?.personalInfo?.fullName || '') : (profileData?.personalInfo?.fullName || '')}
                    onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="הזן שם מלא"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    כתובת אימייל
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={isEditing ? (editData?.personalInfo?.email || '') : (profileData?.personalInfo?.email || '')}
                    onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="הזן כתובת אימייל"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <Phone size={16} />
                    טלפון
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={isEditing ? (editData?.personalInfo?.phone || '') : (profileData?.personalInfo?.phone || '')}
                    onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="הזן מספר טלפון"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    <MapPin size={16} />
                    כתובת
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={isEditing ? (editData?.personalInfo?.address || '') : (profileData?.personalInfo?.address || '')}
                    onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="הזן כתובת"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information in same card */}
          {profileData.professionalInfo && (
            <div className="card">
              <div className="card-header">
                <Music size={20} />
                <h2>מידע מקצועי</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="instrument">
                      <Music size={16} />
                      כלי נגינה
                    </label>
                    <input
                      type="text"
                      id="instrument"
                      value={isEditing ? (editData?.professionalInfo?.instrument || '') : (profileData?.professionalInfo?.instrument || '')}
                      onChange={(e) => handleInputChange('professionalInfo', 'instrument', e.target.value)}
                      disabled={!isEditing}
                      className="form-input"
                      placeholder="הזן כלי נגינה"
                    />
                  </div>

                  <div className="form-group">
                    <label>סטטוס פעילות</label>
                    <div className="status-badge">
                      {profileData.professionalInfo.isActive ? 'פעיל' : 'לא פעיל'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar-section">
          {/* Account Information Card */}
          <div className="card">
            <div className="card-header">
              <Shield size={20} />
              <h2>מידע חשבון</h2>
            </div>
            <div className="card-body">
              <div className="form-grid single-column">
                <div className="form-group">
                  <label>תפקידים</label>
                  <div className="roles-container">
                    {profileData.roles?.map((role, index) => (
                      <span 
                        key={index} 
                        className="role-badge"
                        style={{ 
                          backgroundColor: getRoleBadgeColor(role)
                        } as React.CSSProperties}
                      >
                        {role}
                      </span>
                    )) || <span className="role-badge">לא זמין</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    התחברות אחרונה
                  </label>
                  <input
                    type="text"
                    value={profileData.credentials?.lastLogin 
                      ? new Date(profileData.credentials.lastLogin).toLocaleDateString('he-IL')
                      : 'לא זמין'
                    }
                    disabled
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    תאריך יצירה
                  </label>
                  <input
                    type="text"
                    value={profileData.createdAt 
                      ? new Date(profileData.createdAt).toLocaleDateString('he-IL')
                      : 'לא זמין'
                    }
                    disabled
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="card">
            <div className="card-header">
              <Lock size={24} />
              <h2>שינוי סיסמה</h2>
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn btn-outline"
              >
                {showPasswordForm ? 'ביטול' : 'שינוי סיסמה'}
              </button>
            </div>
            
            {showPasswordForm && (
              <div className="card-body">
                <form onSubmit={handlePasswordChange}>
                  {passwordError && (
                    <div className="error-message">
                      {passwordError}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="currentPassword">סיסמה נוכחית</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        id="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="form-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="password-toggle"
                      >
                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">סיסמה חדשה</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        id="newPassword"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="form-input"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="password-toggle"
                      >
                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">אישור סיסמה חדשה</label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        id="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="form-input"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="password-toggle"
                      >
                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      disabled={passwordLoading}
                      className="btn btn-primary"
                    >
                      {passwordLoading ? (
                        <>
                          <div className="spinner-small"></div>
                          משנה סיסמה...
                        </>
                      ) : (
                        <>
                          <Lock size={20} />
                          שינוי סיסמה
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}