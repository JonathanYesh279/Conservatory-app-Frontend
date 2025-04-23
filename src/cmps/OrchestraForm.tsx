// src/cmps/OrchestraForm.tsx
import { useRef } from 'react';
import { X, User, Search, X as XIcon, AlertCircle } from 'lucide-react';
import { Orchestra } from '../services/orchestraService';
import { useOrchestraForm } from '../hooks/useOrchestraForm';
import { useStudentSelection } from '../hooks/useStudentSelection';
import { useNameValidation } from '../hooks/useNameValidation';
import { useOrchestraStore } from '../store/orchestraStore';

// Constants
const VALID_TYPES = ['הרכב', 'תזמורת'];
const VALID_LOCATIONS = [
  'אולם ערן',
  'סטודיו קאמרי 1',
  'סטודיו קאמרי 2',
  'אולפן הקלטות',
  'חדר חזרות 1',
  'חדר חזרות 2',
  'חדר מחשבים',
  'חדר 1',
  'חדר 2',
  'חדר חזרות',
  'חדר 5',
  'חדר 6',
  'חדר 7',
  'חדר 8',
  'חדר 9',
  'חדר 10',
  'חדר 11',
  'חדר 12',
  'חדר 13',
  'חדר 14',
  'חדר 15',
  'חדר 16',
  'חדר 17',
  'חדר 18',
  'חדר 19',
  'חדר 20',
  'חדר 21',
  'חדר 22',
  'חדר 23',
  'חדר 24',
  'חדר 25',
  'חדר 26',
];

interface OrchestraFormProps {
  isOpen: boolean;
  onClose: () => void;
  orchestra: Orchestra | null;
  onSave?: () => void;
}

export function OrchestraForm({
  isOpen,
  onClose,
  orchestra,
  onSave,
}: OrchestraFormProps) {
  // Get all existing orchestra names for validation
  const { orchestras } = useOrchestraStore();
  const existingOrchestraNames = orchestras.map((o) => o.name);

  // Create form with main business logic in a custom hook
  const {
    formData,
    conductors,
    errors,
    isLoading,
    isSubmitting,
    isLoadingConductors,
    error,
    handleInputChange,
    handleSubmit: submitForm,
    isOrchestra,
  } = useOrchestraForm({
    initialOrchestra: orchestra,
    onClose,
    onSave,
  });

  // Name validation with dedicated hook
  const nameValidation = useNameValidation({
    name: formData.name,
    existingNames: existingOrchestraNames,
    type: formData.type,
    originalName: orchestra?.name,
    isSubmitting, // Pass submission state to prevent validation during submit
  });

  // Student selection with dedicated hook
  const {
    selectedMembers,
    searchQuery,
    isSearchOpen,
    isLoading: isLoadingStudents,
    searchRef,
    handleSearchChange,
    getFilteredStudents,
    handleAddMember,
    handleRemoveMember,
  } = useStudentSelection({
    initialMemberIds: orchestra?.memberIds || [],
    onMemberIdsChange: (memberIds) => {
      // Update the formData.memberIds whenever student selection changes
      handleInputChange({
        target: { name: 'memberIds', value: memberIds },
      } as React.ChangeEvent<HTMLInputElement>);
    },
  });

  // Handle form submission with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if name validation passes
    if (!nameValidation.isValid && nameValidation.message) {
      // Add name validation error to form errors
      handleInputChange({
        target: {
          name: 'name',
          value: formData.name,
          dataset: { error: nameValidation.message },
        },
      } as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    // Submit the form
    submitForm(e);
  };

  // Don't render if not open
  if (!isOpen) return null;

  const filteredStudents = getFilteredStudents();

  return (
    <div className='orchestra-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>
          {orchestra?._id
            ? isOrchestra
              ? 'עריכת תזמורת'
              : 'עריכת הרכב'
            : isOrchestra
            ? 'הוספת תזמורת חדשה'
            : 'הוספת הרכב חדש'}
        </h2>

        {error && <div className='error-message'>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Orchestra/Ensemble Information */}
          <div className='form-section'>
            <h3>{isOrchestra ? 'פרטי תזמורת' : 'פרטי הרכב'}</h3>

            {/* Type Selection - First field */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='type'>סוג *</label>
                <select
                  id='type'
                  name='type'
                  value={formData.type}
                  onChange={handleInputChange}
                  className={errors.type ? 'is-invalid' : ''}
                  required
                  disabled={isSubmitting}
                >
                  <option value=''>בחר סוג</option>
                  {VALID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && <div className='form-error'>{errors.type}</div>}
              </div>
            </div>

            {/* Name with validation */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='name'>
                  {isOrchestra ? 'שם התזמורת *' : 'שם ההרכב *'}
                </label>
                <div className='name-input-container'>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    className={
                      errors.name || (!nameValidation.isValid && !isSubmitting)
                        ? 'is-invalid'
                        : ''
                    }
                    placeholder={
                      isOrchestra ? 'הכנס שם תזמורת...' : 'הכנס שם הרכב...'
                    }
                    required
                    disabled={isSubmitting}
                  />
                  {!nameValidation.isValid &&
                    nameValidation.message &&
                    !errors.name &&
                    !isSubmitting && (
                      <div className='name-validation-warning'>
                        <AlertCircle size={16} />
                        <span>{nameValidation.message}</span>
                      </div>
                    )}
                </div>
                {errors.name && <div className='form-error'>{errors.name}</div>}
              </div>
            </div>

            {/* Location */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='location'>מקום *</label>
                <select
                  id='location'
                  name='location'
                  value={formData.location}
                  onChange={handleInputChange}
                  className={errors.location ? 'is-invalid' : ''}
                  required
                  disabled={isSubmitting}
                >
                  <option value=''>בחר מקום</option>
                  {VALID_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <div className='form-error'>{errors.location}</div>
                )}
              </div>
            </div>

            {/* Conductor/Instructor - changes based on type */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='conductorId'>
                  {isOrchestra ? 'מנצח *' : 'מדריך הרכב *'}
                </label>
                <select
                  id='conductorId'
                  name='conductorId'
                  value={formData.conductorId}
                  onChange={handleInputChange}
                  className={errors.conductorId ? 'is-invalid' : ''}
                  required
                  disabled={isLoadingConductors || isSubmitting}
                >
                  <option value=''>
                    {isOrchestra ? 'בחר מנצח' : 'בחר מדריך הרכב'}
                  </option>
                  {conductors.map((conductor) => (
                    <option key={conductor._id} value={conductor._id}>
                      {conductor.personalInfo.fullName}
                    </option>
                  ))}
                </select>
                {isLoadingConductors && (
                  <div className='loading-text'>
                    {isOrchestra ? 'טוען מנצחים...' : 'טוען מדריכים...'}
                  </div>
                )}
                {errors.conductorId && (
                  <div className='form-error'>{errors.conductorId}</div>
                )}
              </div>
            </div>

            {/* Members - changes based on type */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label>
                  {isOrchestra
                    ? 'תלמידים (חברי התזמורת)'
                    : 'תלמידים (חברי ההרכב)'}
                </label>

                {/* Student search input */}
                <div ref={searchRef} className='search-container'>
                  <div className='search-input-wrapper'>
                    <Search className='search-icon' size={16} />
                    <input
                      type='text'
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder='חפש תלמידים להוספה...'
                      className='search-input'
                      onClick={() => searchQuery.length > 0}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Search results dropdown */}
                  {isSearchOpen &&
                    filteredStudents.length > 0 &&
                    !isSubmitting && (
                      <div className='search-results-dropdown'>
                        {filteredStudents.map((student) => (
                          <div
                            key={student._id}
                            className='search-result-item'
                            onClick={() => handleAddMember(student)}
                          >
                            <User size={16} className='student-icon' />
                            <span>{student.personalInfo.fullName}</span>
                            <span className='student-instrument'>
                              {student.academicInfo.instrument}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* Selected members list */}
                <div className='selected-members-list'>
                  {isLoadingStudents ? (
                    <div className='loading-text'>טוען תלמידים...</div>
                  ) : selectedMembers.length > 0 ? (
                    selectedMembers.map((member) => (
                      <div key={member._id} className='member-badge'>
                        <span>{member.personalInfo.fullName}</span>
                        <button
                          type='button'
                          className='remove-btn'
                          onClick={() => handleRemoveMember(member._id)}
                          aria-label={`הסר את ${member.personalInfo.fullName}`}
                          disabled={isSubmitting}
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className='no-members-message'>
                      לא נבחרו תלמידים. השתמש בחיפוש כדי להוסיף תלמידים{' '}
                      {isOrchestra ? 'לתזמורת' : 'להרכב'}.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden school year field */}
            <input
              type='hidden'
              name='schoolYearId'
              value={formData.schoolYearId}
            />
          </div>

          {/* Form Actions */}
          <div className='form-actions'>
            <button
              type='submit'
              className='btn primary'
              disabled={
                isLoading ||
                isSubmitting ||
                (!nameValidation.isValid && !!formData.name)
              }
            >
              {isSubmitting
                ? 'שומר...'
                : isLoading
                ? 'טוען...'
                : orchestra?._id
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
