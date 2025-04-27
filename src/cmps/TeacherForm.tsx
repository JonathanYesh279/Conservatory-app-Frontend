// src/cmps/TeacherForm.tsx
import { useEffect } from 'react';
import { X, Eye, EyeOff, Search, Plus } from 'lucide-react';
import { Teacher } from '../services/teacherService';
import { Student } from '../services/studentService';
import {
  useTeacherForm,
  VALID_RULES,
  VALID_INSTRUMENTS,
  DAYS_OF_WEEK,
  LESSON_DURATIONS,
} from '../hooks/useTeacherForm';
import { useStudentSelectionForTeacher } from '../hooks/useStudentSelectionForTeacher';

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Partial<Teacher>;
  onSave?: () => void;
  onAddNewStudent?: (teacherInfo: {
    fullName: string;
    instrument: string;
  }) => void;
  newlyCreatedStudent?: Student | null;
}

export function TeacherForm({
  isOpen,
  onClose,
  teacher,
  onSave,
  onAddNewStudent,
  newlyCreatedStudent,
}: TeacherFormProps) {
  // Use our custom hook for teacher form logic
  const {
    formData,
    scheduleItems,
    errors,
    isLoading,
    isSubmitting,
    orchestras,
    loadingOrchestras,
    error,
    showPassword,
    isMobile,
    isNewTeacher,

    setShowPassword,
    handlePersonalInfoChange,
    handleProfessionalInfoChange,
    handleRolesChange,
    handleCredentialsChange,
    handleOrchestraChange,
    handleScheduleChange,
    addScheduleItem,
    removeScheduleItem,
    updateStudentIds,
    handleSubmit,
  } = useTeacherForm({
    initialTeacher: teacher || null,
    onClose,
    onSave,
  });

  // Use our custom hook for student selection
  const {
    selectedStudents,
    loadingStudents,
    showStudentSearch,
    searchQuery,
    setShowStudentSearch,
    handleStudentSearch,
    getFilteredStudents,
    handleAddStudent,
    handleRemoveStudent,
  } = useStudentSelectionForTeacher({
    initialStudentIds: formData.teaching.studentIds,
    onStudentIdsChange: updateStudentIds,
    onAddScheduleItem: addScheduleItem,
    onRemoveScheduleItem: removeScheduleItem,
  });

  // Effect to handle newly created student
  useEffect(() => {
    if (newlyCreatedStudent) {
      console.log('Adding newly created student:', newlyCreatedStudent);
      // Add the newly created student
      handleAddStudent(newlyCreatedStudent);
    }
  }, [newlyCreatedStudent, handleAddStudent]);

  // Check if teacher is conductor or teacher
  const isConductor = formData.roles.includes('מנצח');
  const isTeacher = formData.roles.includes('מורה');

  // Handle navigating to add a new student
  const handleAddNewStudent = () => {
    // Capture the current teacher information that's being entered
    const teacherInfo = {
      fullName: formData.personalInfo.fullName,
      instrument: formData.professionalInfo.instrument,
    };

    console.log(
      'Requesting to add new student with teacher info:',
      teacherInfo
    );

    // Use the callback if provided, passing the in-progress teacher info
    if (onAddNewStudent) {
      onAddNewStudent(teacherInfo);
    }
  };

  // Get filtered students for display
  const filteredStudents = getFilteredStudents();

  // Helper function to find schedule item for a student
  const getScheduleItemForStudent = (studentId: string) => {
    return (
      scheduleItems.find((item) => item.studentId === studentId) || {
        studentId,
        day: DAYS_OF_WEEK[0],
        time: '08:00',
        duration: 45,
        isActive: true,
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className='teacher-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>{teacher?._id ? 'עריכת מורה' : 'הוספת מורה חדש'}</h2>

        {error && <div className='error-message'>{error}</div>}
        {errors.form && <div className='error-message'>{errors.form}</div>}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className='form-section'>
            <h3>פרטים אישיים</h3>

            {/* Full Name */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='fullName'>שם מלא *</label>
                <input
                  type='text'
                  id='fullName'
                  name='fullName'
                  value={formData.personalInfo?.fullName || ''}
                  onChange={handlePersonalInfoChange}
                  className={
                    errors['personalInfo.fullName'] ? 'is-invalid' : ''
                  }
                  required
                  disabled={isSubmitting}
                />
                {errors['personalInfo.fullName'] && (
                  <div className='form-error'>
                    {errors['personalInfo.fullName']}
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='phone'>טלפון *</label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.personalInfo?.phone || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.phone'] ? 'is-invalid' : ''}
                  placeholder='05XXXXXXXX'
                  required
                  disabled={isSubmitting}
                />
                {errors['personalInfo.phone'] && (
                  <div className='form-error'>
                    {errors['personalInfo.phone']}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='email'>דוא"ל *</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.personalInfo?.email || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.email'] ? 'is-invalid' : ''}
                  required
                  disabled={isSubmitting}
                />
                {errors['personalInfo.email'] && (
                  <div className='form-error'>
                    {errors['personalInfo.email']}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='address'>כתובת *</label>
                <input
                  type='text'
                  id='address'
                  name='address'
                  value={formData.personalInfo?.address || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.address'] ? 'is-invalid' : ''}
                  required
                  disabled={isSubmitting}
                />
                {errors['personalInfo.address'] && (
                  <div className='form-error'>
                    {errors['personalInfo.address']}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className='form-section'>
            <h3>מידע מקצועי</h3>

            {/* Roles - Checkboxes */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label>תפקידים *</label>
                <div className='checkbox-group'>
                  {VALID_RULES.map((role) => (
                    <div key={role} className='checkbox-item'>
                      <input
                        type='checkbox'
                        id={`role-${role}`}
                        name='roles'
                        value={role}
                        checked={formData.roles.includes(role)}
                        onChange={handleRolesChange}
                        disabled={isSubmitting}
                      />
                      <label htmlFor={`role-${role}`}>{role}</label>
                    </div>
                  ))}
                </div>
                {errors['roles'] && (
                  <div className='form-error'>{errors['roles']}</div>
                )}
              </div>
            </div>

            {/* Conditional Fields based on Role */}
            {isTeacher && (
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='instrument'>כלי נגינה (למורה) *</label>
                  <select
                    id='instrument'
                    name='instrument'
                    value={formData.professionalInfo?.instrument || ''}
                    onChange={handleProfessionalInfoChange}
                    className={
                      errors['professionalInfo.instrument'] ? 'is-invalid' : ''
                    }
                    required={isTeacher}
                    disabled={isSubmitting}
                  >
                    <option value='' disabled>
                      בחר כלי נגינה
                    </option>
                    {VALID_INSTRUMENTS.map((instrument) => (
                      <option key={instrument} value={instrument}>
                        {instrument}
                      </option>
                    ))}
                  </select>
                  {errors['professionalInfo.instrument'] && (
                    <div className='form-error'>
                      {errors['professionalInfo.instrument']}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isConductor && (
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='orchestras'>תזמורות (למנצח)</label>
                  <select
                    id='orchestras'
                    name='orchestraIds'
                    multiple
                    value={formData.conducting.orchestraIds || []}
                    onChange={handleOrchestraChange}
                    className={
                      errors['conducting.orchestraIds'] ? 'is-invalid' : ''
                    }
                    disabled={isSubmitting || loadingOrchestras}
                  >
                    {loadingOrchestras ? (
                      <option disabled>טוען תזמורות...</option>
                    ) : orchestras.length > 0 ? (
                      orchestras.map((orchestra) => (
                        <option key={orchestra._id} value={orchestra._id}>
                          {orchestra.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>אין תזמורות זמינות</option>
                    )}
                  </select>
                  <small className='select-hint'>
                    {isMobile
                      ? 'לחץ והחזק על מספר אפשרויות לבחירה מרובה'
                      : 'ניתן לבחור מספר תזמורות (לחיצה על CTRL + לחיצה על תזמורת)'}
                  </small>
                  {errors['conducting.orchestraIds'] && (
                    <div className='form-error'>
                      {errors['conducting.orchestraIds']}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Students Section - Only for teachers */}
          {isTeacher && (
            <div className='form-section'>
              <h3>תלמידים</h3>

              {/* Selected Students List */}
              {selectedStudents.length > 0 && (
                <div className='selected-students'>
                  <h4>תלמידים שהוקצו למורה</h4>
                  {selectedStudents.map((student) => {
                    // Get schedule item for this student
                    const scheduleItem = getScheduleItemForStudent(student._id);

                    return (
                      <div key={student._id} className='student-schedule-item'>
                        <div className='student-info'>
                          <div className='student-name'>
                            {student.personalInfo.fullName}
                          </div>
                          <div className='student-details'>
                            <span>{student.academicInfo.instrument}</span>
                            <span>כיתה {student.academicInfo.class}</span>
                            <span>שלב {student.academicInfo.currentStage}</span>
                          </div>
                          <button
                            type='button'
                            className='remove-student-btn'
                            onClick={() => handleRemoveStudent(student._id)}
                            aria-label='הסר תלמיד'
                            disabled={isSubmitting}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Schedule fields for this student */}
                        <div className='schedule-fields'>
                          <div className='form-group'>
                            <label htmlFor={`day-${student._id}`}>יום</label>
                            <select
                              id={`day-${student._id}`}
                              value={scheduleItem.day}
                              onChange={(e) =>
                                handleScheduleChange(
                                  student._id,
                                  'day',
                                  e.target.value
                                )
                              }
                              disabled={isSubmitting}
                            >
                              {DAYS_OF_WEEK.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className='form-group'>
                            <label htmlFor={`time-${student._id}`}>שעה</label>
                            <input
                              type='time'
                              id={`time-${student._id}`}
                              value={scheduleItem.time}
                              onChange={(e) =>
                                handleScheduleChange(
                                  student._id,
                                  'time',
                                  e.target.value
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </div>

                          <div className='form-group'>
                            <label htmlFor={`duration-${student._id}`}>
                              משך (דקות)
                            </label>
                            <select
                              id={`duration-${student._id}`}
                              value={scheduleItem.duration}
                              onChange={(e) =>
                                handleScheduleChange(
                                  student._id,
                                  'duration',
                                  Number(e.target.value)
                                )
                              }
                              disabled={isSubmitting}
                            >
                              {LESSON_DURATIONS.map((duration) => (
                                <option key={duration} value={duration}>
                                  {duration}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Student Search or Add Buttons */}
              <div className='student-actions'>
                {showStudentSearch ? (
                  <div className='student-search-container'>
                    <div className='search-header'>
                      <h4>חיפוש תלמידים</h4>
                      <button
                        type='button'
                        className='btn'
                        onClick={() => setShowStudentSearch(false)}
                        disabled={isSubmitting}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className='search-box'>
                      <Search size={16} />
                      <input
                        type='text'
                        placeholder='חפש תלמיד לפי שם, כלי או כיתה...'
                        value={searchQuery}
                        onChange={(e) => handleStudentSearch(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className='search-results'>
                      {loadingStudents ? (
                        <div className='loading-message'>טוען תלמידים...</div>
                      ) : filteredStudents.length === 0 ? (
                        <div className='no-results'>לא נמצאו תלמידים</div>
                      ) : (
                        <div className='student-list'>
                          {filteredStudents.map((student) => (
                            <div
                              key={student._id}
                              className='student-search-item'
                              onClick={() =>
                                !isSubmitting && handleAddStudent(student)
                              }
                              style={{
                                cursor: isSubmitting
                                  ? 'not-allowed'
                                  : 'pointer',
                              }}
                            >
                              <div className='student-name'>
                                {student.personalInfo.fullName}
                              </div>
                              <div className='student-details'>
                                <span>{student.academicInfo.instrument}</span>
                                <span>כיתה {student.academicInfo.class}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='student-action-buttons'>
                    <button
                      type='button'
                      className='btn primary'
                      onClick={() => setShowStudentSearch(true)}
                      disabled={isSubmitting}
                    >
                      <Search size={16} />
                      <span>חיפוש תלמידים קיימים</span>
                    </button>

                    <button
                      type='button'
                      className='btn primary'
                      onClick={handleAddNewStudent}
                      disabled={isSubmitting}
                    >
                      <Plus size={16} />
                      <span>הוספת תלמיד חדש</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Authentication - Only shown for new teachers */}
          {isNewTeacher && (
            <div className='form-section'>
              <h3>הרשאות</h3>

              {/* Email (this should be disabled and synced with the personal email) */}
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='cred-email'>דוא"ל (להתחברות) *</label>
                  <input
                    type='email'
                    id='cred-email'
                    name='email'
                    value={formData.credentials.email}
                    onChange={handleCredentialsChange}
                    className={errors['credentials.email'] ? 'is-invalid' : ''}
                    disabled // This should be synced with personal email
                  />
                  {errors['credentials.email'] && (
                    <div className='form-error'>
                      {errors['credentials.email']}
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='password'>סיסמה *</label>
                  <div className='password-input-container'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id='password'
                      name='password'
                      value={formData.credentials.password}
                      onChange={handleCredentialsChange}
                      className={
                        errors['credentials.password'] ? 'is-invalid' : ''
                      }
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type='button'
                      className='toggle-password-btn'
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors['credentials.password'] && (
                    <div className='form-error'>
                      {errors['credentials.password']}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className='form-actions'>
            <button
              type='submit'
              className='btn primary'
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting
                ? 'שומר...'
                : teacher?._id
                ? 'עדכון'
                : 'הוספה'}
            </button>

            <button
              type='button'
              className='btn secondary'
              onClick={onClose}
              disabled={isSubmitting}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
