import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { httpService } from '../services/httpService';
import { authService } from '../services/authService';
import { passwordService } from '../services/passwordService';
import { Teacher } from '../types/teacher';
import { sanitizeError } from '../utils/errorHandler';
import { TeacherTimeBlockView } from '../cmps/TimeBlock/TeacherTimeBlockView';
import { useAuthorization, createAuthorizationContext } from '../utils/authorization';
import { studentService, Student } from '../services/studentService';
import { orchestraService, Orchestra } from '../services/orchestraService';
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
  ArrowLeft,
  Users,
  Clock,
  ChevronDown,
  ChevronUp
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
  teaching?: {
    studentIds: string[];
    schedule: any[];
  };
  conducting?: {
    orchestraIds: string[];
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
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfileData | null>(null);
  const [saving, setSaving] = useState(false);

  // Teacher-specific data
  const [students, setStudents] = useState<Student[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingOrchestras, setLoadingOrchestras] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    students: false,
    orchestras: false,
    schedule: false,
  });

  // Authorization
  const authContext = createAuthorizationContext(user, isAuthenticated);
  const auth = useAuthorization(authContext);

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

  // Check if password change is forced
  const isPasswordChangeForced = searchParams.get('forcePasswordChange') === 'true' || 
                                localStorage.getItem('requiresPasswordChange') === 'true';

  useEffect(() => {
    if (user) {
      initializeFromUser();
      loadUserProfile();
    }
  }, [user]);

  // Handle auth state refresh when coming from password change
  useEffect(() => {
    const handleAuthRefresh = async () => {
      const forcePasswordChange = searchParams.get('forcePasswordChange') === 'true';
      const requiresPasswordChange = localStorage.getItem('requiresPasswordChange') === 'true';
      
      if (forcePasswordChange || requiresPasswordChange) {
        try {
          // Refresh auth state to ensure we have valid tokens
          await authService.validateSession();
        } catch (error) {
          console.error('Auth validation failed:', error);
          // If validation fails, redirect to login
          navigate('/login');
        }
      }
    };

    if (user) {
      handleAuthRefresh();
    }
  }, [user, searchParams, navigate]);

  // Load teacher data when profile data is available
  useEffect(() => {
    if (profileData && isTeacher()) {
      loadTeacherData();
    }
  }, [profileData]);

  // Check if user is a teacher
  const isTeacher = () => {
    return profileData?.roles?.some(role => 
      role === 'מורה' || role === 'מורה תאוריה' || role === 'מנצח'
    ) || false;
  };

  // Check if user is a conductor
  const isConductor = () => {
    return profileData?.roles?.includes('מנצח') || false;
  };

  // Toggle section visibility
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // Load teacher-specific data
  const loadTeacherData = async () => {
    if (!user?._id) return;

    try {
      // Load students assigned to this teacher
      if (isTeacher()) {
        setLoadingStudents(true);
        try {
          const allStudents = await studentService.getStudents();
          const teacherStudents = allStudents.filter(student => {
            const hasTeacherInIds = student.teacherIds && student.teacherIds.includes(user._id);
            const hasTeacherAssignments = student.teacherAssignments && 
              student.teacherAssignments.some((assignment: any) => assignment.teacherId === user._id);
            return hasTeacherInIds || hasTeacherAssignments;
          });
          setStudents(teacherStudents);
        } catch (err) {
          console.error('Failed to load students:', err);
        } finally {
          setLoadingStudents(false);
        }
      }

      // Load orchestras if user is a conductor
      if (isConductor() && profileData?.conducting?.orchestraIds) {
        setLoadingOrchestras(true);
        try {
          const orchestraData = await orchestraService.getOrchestrasByIds(
            profileData.conducting.orchestraIds
          );
          setOrchestras(orchestraData);
        } catch (err) {
          console.error('Failed to load orchestras:', err);
        } finally {
          setLoadingOrchestras(false);
        }
      }
    } catch (err) {
      console.error('Failed to load teacher data:', err);
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
      
      // Only send the fields that should be updated, including required backend fields
      const updateData = {
        personalInfo: editData.personalInfo,
        roles: editData.roles,
        professionalInfo: editData.professionalInfo,
        teaching: profileData.teaching || { studentIds: [], schedule: [] },
        credentials: {
          email: editData.personalInfo.email
        }
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
      const response = await passwordService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Handle new tokens if returned by backend
      if (response.accessToken) {
        authService.setToken(response.accessToken);
        console.log('Updated access token after password change');
      }
      
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
        console.log('Updated refresh token after password change');
      }
      
      setPasswordSuccess('הסיסמה שונתה בהצלחה!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);

      // Clear forced password change flags
      localStorage.removeItem('requiresPasswordChange');
      if (searchParams.get('forcePasswordChange')) {
        searchParams.delete('forcePasswordChange');
        setSearchParams(searchParams);
      }
      
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

  const handleGoBack = async () => {
    try {
      // Check if password was recently changed
      const requiresPasswordChange = localStorage.getItem('requiresPasswordChange');
      const forcePasswordChange = searchParams.get('forcePasswordChange') === 'true';
      
      if (requiresPasswordChange === 'true' || forcePasswordChange) {
        // Clear the flags
        localStorage.removeItem('requiresPasswordChange');
        if (forcePasswordChange) {
          searchParams.delete('forcePasswordChange');
          setSearchParams(searchParams);
        }
        
        // Force refresh auth state to pick up new tokens
        await authService.validateSession();
      }
      
      // Navigate back to home/dashboard safely
      navigate('/');
    } catch (error) {
      console.error('Navigation error:', error);
      // If auth validation fails, redirect to login
      navigate('/login');
    }
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
          {/* Teacher-specific sections */}
          {isTeacher() && (
            <>
            {/* Students Section */}
            <div className="card">
              <div 
                className={`card-header clickable ${openSections.students ? 'active' : ''}`}
                onClick={() => toggleSection('students')}
              >
                <Users size={20} />
                <h2>התלמידים שלי ({students.length})</h2>
                {openSections.students ? (
                  <ChevronUp size={18} className="toggle-icon" />
                ) : (
                  <ChevronDown size={18} className="toggle-icon" />
                )}
              </div>
              
              {openSections.students && (
                <div className="card-body">
                  {loadingStudents ? (
                    <div className="loading-section">
                      <div className="spinner-small"></div>
                      <span>טוען תלמידים...</span>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="students-grid">
                      {students.map(student => (
                        <div key={student._id} className="student-card">
                          <div className="student-info">
                            <div className="student-name">
                              {student.personalInfo?.fullName || 'תלמיד לא ידוע'}
                            </div>
                            <div className="student-details">
                              {student.academicInfo?.instrument && (
                                <span className="instrument">
                                  <Music size={12} />
                                  {student.academicInfo.instrument}
                                </span>
                              )}
                              {student.academicInfo?.class && (
                                <span className="class">
                                  כיתה {student.academicInfo.class}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <Users size={32} />
                      <p>אין תלמידים מוקצים</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Orchestras Section - Only for conductors */}
            {isConductor() && (
              <div className="card">
                <div 
                  className={`card-header clickable ${openSections.orchestras ? 'active' : ''}`}
                  onClick={() => toggleSection('orchestras')}
                >
                  <Music size={20} />
                  <h2>התזמורות שלי ({orchestras.length})</h2>
                  {openSections.orchestras ? (
                    <ChevronUp size={18} className="toggle-icon" />
                  ) : (
                    <ChevronDown size={18} className="toggle-icon" />
                  )}
                </div>
                
                {openSections.orchestras && (
                  <div className="card-body">
                    {loadingOrchestras ? (
                      <div className="loading-section">
                        <div className="spinner-small"></div>
                        <span>טוען תזמורות...</span>
                      </div>
                    ) : orchestras.length > 0 ? (
                      <div className="orchestras-grid">
                        {orchestras.map(orchestra => (
                          <div key={orchestra._id} className="orchestra-card">
                            <div className="orchestra-info">
                              <div className="orchestra-name">
                                {orchestra.name}
                              </div>
                              {orchestra.location && (
                                <div className="orchestra-location">
                                  <MapPin size={12} />
                                  {orchestra.location}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <Music size={32} />
                        <p>אין תזמורות מוקצות</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Schedule Section */}
            {(isTeacher() || isConductor()) && profileData && (
              <div className="card">
                <div 
                  className={`card-header clickable ${openSections.schedule ? 'active' : ''}`}
                  onClick={() => toggleSection('schedule')}
                >
                  <Calendar size={20} />
                  <h2>מערכת השעות שלי</h2>
                  {openSections.schedule ? (
                    <ChevronUp size={18} className="toggle-icon" />
                  ) : (
                    <ChevronDown size={18} className="toggle-icon" />
                  )}
                </div>
                
                {openSections.schedule && (
                  <div className="card-body">
                    <TeacherTimeBlockView
                      teacherId={user?._id || ''}
                      teacherName={profileData?.personalInfo?.fullName || 'Teacher'}
                      readOnly={!auth.canManageTeacherSchedule(profileData as any)}
                      isAdmin={auth.isAdmin()}
                      className="profile-schedule"
                    />
                  </div>
                )}
              </div>
            )}
            </>
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

          {/* Forced Password Change Warning */}
          {isPasswordChangeForced && (
            <div className="card" style={{ borderColor: '#ff6b6b', backgroundColor: '#fff5f5' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d63031' }}>
                  <Lock size={24} />
                  <div>
                    <h3 style={{ margin: 0, color: '#d63031' }}>שינוי סיסמה נדרש</h3>
                    <p style={{ margin: '8px 0 0 0', color: '#636e72' }}>
                      עליך לשנות את הסיסמה שלך לפני שתוכל להמשיך להשתמש במערכת
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Change Card */}
          <div className="card">
            <div className="card-header">
              <Lock size={24} />
              <h2>שינוי סיסמה</h2>
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn btn-outline"
                style={isPasswordChangeForced ? { display: 'none' } : {}}
              >
                {showPasswordForm ? 'ביטול' : 'שינוי סיסמה'}
              </button>
            </div>
            
            {(showPasswordForm || isPasswordChangeForced) && (
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