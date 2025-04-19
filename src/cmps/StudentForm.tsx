import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Student } from '../services/studentService';
import { Teacher, teacherService } from '../services/teacherService';
import { useStudentStore } from '../store/studentStore';
import { studentService } from '../services/studentService';
import { useSchoolYearStore } from '../store/schoolYearStore.ts';

// Define type for form data structure
interface StudentFormData {
  _id?: string;
  personalInfo: {
    fullName: string;
    phone?: string;
    age?: number;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    studentEmail?: string;
  };
  academicInfo: {
    instrument: string;
    currentStage: number;
    class: string;
    tests?: {
      stageTest?: {
        status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה';
        lastTestDate?: string;
        nextTestDate?: string;
        notes?: string;
      };
      technicalTest?: {
        status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה';
        lastTestDate?: string;
        nextTestDate?: string;
        notes?: string;
      };
    };
  };
  enrollments: {
    orchestraIds: string[];
    ensembleIds: string[];
    schoolYears: Array<{
      schoolYearId: string;
      isActive: boolean;
    }>;
  };
  teacherIds: string[];
  teacherId?: string;
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: number;
  isActive: boolean;
}

// Constants for validation and form selection
const VALID_CLASSES = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'יא',
  'יב',
  'אחר',
];
const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8];
const VALID_INSTRUMENTS = [
  'חצוצרה',
  'חליל צד',
  'קלרינט',
  'קרן יער',
  'בריטון',
  'טרומבון',
  'סקסופון',
];
const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה'];
const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const LESSON_DURATIONS = [30, 45, 60];

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Partial<Student>;
  onStudentCreated?: (student: Student) => void; 
  newTeacherInfo?: { _id?: string, fullName: string, instrument?: string } | null
}

export function StudentForm({
  isOpen,
  onClose,
  student,
  onStudentCreated,
  newTeacherInfo,
}: StudentFormProps) {
  const { saveStudent, isLoading, error, clearError, loadStudents } =
    useStudentStore();
  const { currentSchoolYear } = useSchoolYearStore();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Form state with proper typing
  const [formData, setFormData] = useState<StudentFormData>({
    personalInfo: {
      fullName: '',
      phone: '',
      age: undefined,
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      studentEmail: '',
    },
    academicInfo: {
      instrument: VALID_INSTRUMENTS[0],
      currentStage: 1,
      class: VALID_CLASSES[0],
      tests: {
        stageTest: {
          status: 'לא נבחן',
          lastTestDate: undefined,
          nextTestDate: undefined,
          notes: '',
        },
        technicalTest: {
          status: 'לא נבחן',
          lastTestDate: undefined,
          nextTestDate: undefined,
          notes: '',
        },
      },
    },
    enrollments: {
      orchestraIds: [],
      ensembleIds: [],
      schoolYears: [],
    },
    teacherIds: [],
    isActive: true,
  });

  // Fetch teachers on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const teacherData = await teacherService.getTeachers({
          isActive: true,
        });
        setTeachers(teacherData);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If editing an existing student, populate form data
  useEffect(() => {
    if (student?._id) {
      setFormData({
        _id: student._id,
        personalInfo: {
          fullName: student.personalInfo?.fullName || '',
          phone: student.personalInfo?.phone,
          age: student.personalInfo?.age,
          address: student.personalInfo?.address,
          parentName: student.personalInfo?.parentName,
          parentPhone: student.personalInfo?.parentPhone,
          parentEmail: student.personalInfo?.parentEmail,
          studentEmail: student.personalInfo?.studentEmail,
        },
        academicInfo: {
          instrument: student.academicInfo?.instrument || VALID_INSTRUMENTS[0],
          currentStage: student.academicInfo?.currentStage || 1,
          class: student.academicInfo?.class || VALID_CLASSES[0],
          tests: {
            stageTest: {
              status:
                student.academicInfo?.tests?.stageTest?.status || 'לא נבחן',
              lastTestDate:
                student.academicInfo?.tests?.stageTest?.lastTestDate,
              nextTestDate:
                student.academicInfo?.tests?.stageTest?.nextTestDate,
              notes: student.academicInfo?.tests?.stageTest?.notes || '',
            },
            technicalTest: {
              status:
                student.academicInfo?.tests?.technicalTest?.status || 'לא נבחן',
              lastTestDate:
                student.academicInfo?.tests?.technicalTest?.lastTestDate,
              nextTestDate:
                student.academicInfo?.tests?.technicalTest?.nextTestDate,
              notes: student.academicInfo?.tests?.technicalTest?.notes || '',
            },
          },
        },
        enrollments: {
          orchestraIds: student.enrollments?.orchestraIds || [],
          ensembleIds: student.enrollments?.ensembleIds || [],
          schoolYears: student.enrollments?.schoolYears || [],
        },
        teacherIds: student.teacherIds || [],
        teacherId: student.teacherIds?.[0], // Set the first teacher as the current teacher
        isActive: student.isActive !== false,
      });
    } else {
      // Reset form for new student with proper defaults
      setFormData({
        personalInfo: {
          fullName: '',
          phone: '',
          age: undefined,
          address: '',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          studentEmail: '',
        },
        academicInfo: {
          instrument: VALID_INSTRUMENTS[0],
          currentStage: 1,
          class: VALID_CLASSES[0],
          tests: {
            stageTest: {
              status: 'לא נבחן',
              lastTestDate: undefined,
              nextTestDate: undefined,
              notes: '',
            },
            technicalTest: {
              status: 'לא נבחן',
              lastTestDate: undefined,
              nextTestDate: undefined,
              notes: '',
            },
          },
        },
        enrollments: {
          orchestraIds: [],
          ensembleIds: [],
          schoolYears: currentSchoolYear
            ? [
                {
                  schoolYearId: currentSchoolYear._id,
                  isActive: true,
                },
              ]
            : [],
        },
        teacherIds: [],
        teacherId: newTeacherInfo ? 'new-teacher' : undefined,
        lessonDay: '',
        lessonTime: '',
        lessonDuration: 45,
        isActive: true,
      });
    }

    setErrors({});
    clearError?.();
  }, [student, isOpen, clearError, currentSchoolYear, newTeacherInfo]);

  // Handle input changes
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        [name]:
          type === 'number' ? (value ? parseInt(value) : undefined) : value,
      },
    });

    // Clear error for this field if it exists
    if (errors[`personalInfo.${name}`]) {
      setErrors({
        ...errors,
        [`personalInfo.${name}`]: '',
      });
    }
  };

  const handleAcademicInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      academicInfo: {
        ...formData.academicInfo,
        [name]: type === 'number' ? (value ? parseInt(value) : 1) : value,
      },
    });

    if (errors[`academicInfo.${name}`]) {
      setErrors({
        ...errors,
        [`academicInfo.${name}`]: '',
      });
    }
  };

  const handleTestChange = (
    testType: 'stageTest' | 'technicalTest',
    field: string,
    value: string | Date | null
  ) => {
    setFormData({
      ...formData,
      academicInfo: {
        ...formData.academicInfo,
        tests: {
          ...formData.academicInfo?.tests,
          [testType]: {
            ...formData.academicInfo?.tests?.[testType],
            [field]: value,
          },
        },
      },
    });
  };

  // Handle teacher selection
  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = e.target.value;

    if (!teacherId) {
      // If no teacher selected, remove teacher assignments
      setFormData({
        ...formData,
        teacherId: undefined,
        lessonDay: undefined,
        lessonTime: undefined,
        lessonDuration: 45,
      });
      return;
    }

    // Find selected teacher
    const selectedTeacher = teachers.find(
      (teacher) => teacher._id === teacherId
    );

    if (selectedTeacher) {
      setFormData({
        ...formData,
        teacherId: selectedTeacher._id,
        lessonDay: '',
        lessonTime: '',
        lessonDuration: 45,
      });
    }
  };

  // Handle lesson schedule changes
  const handleLessonScheduleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'lessonDay') {
      setFormData({
        ...formData,
        lessonDay: value,
      });
    } else if (name === 'lessonTime') {
      setFormData({
        ...formData,
        lessonTime: value,
      });
    } else if (name === 'lessonDuration') {
      const duration = parseInt(value);
      setFormData({
        ...formData,
        lessonDuration: duration,
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.personalInfo?.fullName) {
      newErrors['personalInfo.fullName'] = 'שם מלא הוא שדה חובה';
    }

    if (
      formData.personalInfo?.phone &&
      !/^05\d{8}$/.test(formData.personalInfo.phone)
    ) {
      newErrors['personalInfo.phone'] =
        'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)';
    }

    if (
      formData.personalInfo?.parentPhone &&
      !/^05\d{8}$/.test(formData.personalInfo.parentPhone)
    ) {
      newErrors['personalInfo.parentPhone'] =
        'מספר טלפון הורה לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)';
    }

    if (
      formData.personalInfo?.parentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.parentEmail)
    ) {
      newErrors['personalInfo.parentEmail'] = 'כתובת אימייל הורה לא תקינה';
    }

    if (
      formData.personalInfo?.studentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.studentEmail)
    ) {
      newErrors['personalInfo.studentEmail'] = 'כתובת אימייל תלמיד לא תקינה';
    }

    if (!formData.academicInfo?.instrument) {
      newErrors['academicInfo.instrument'] = 'כלי נגינה הוא שדה חובה';
    }

    if (!formData.academicInfo?.currentStage) {
      newErrors['academicInfo.currentStage'] = 'שלב נוכחי הוא שדה חובה';
    }

    if (!formData.academicInfo?.class) {
      newErrors['academicInfo.class'] = 'כיתה היא שדה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const {
        teacherId,
        lessonDay,
        lessonTime,
        lessonDuration,
        ...restFormData
      } = formData;
      const studentId = restFormData._id;
      const { _id, ...dataWithoutId } = restFormData;

      // Special handling for "new-teacher" ID
      const finalTeacherId =
        teacherId === 'new-teacher' ? undefined : teacherId;

      // Prepare data to submit
      const dataToSubmit = {
        ...dataWithoutId,
        teacherIds: finalTeacherId ? [finalTeacherId] : [], // Add teacherIds to the submission
        personalInfo: {
          ...formData.personalInfo,
          parentName: formData.personalInfo.parentName || 'לא צוין',
          parentPhone: formData.personalInfo.parentPhone || '0500000000',
          parentEmail:
            formData.personalInfo.parentEmail || 'parent@example.com',
          studentEmail:
            formData.personalInfo.studentEmail || 'student@example.com',
        },
        enrollments: {
          orchestraIds: formData.enrollments.orchestraIds,
          ensembleIds: formData.enrollments.ensembleIds,
          schoolYears: formData.enrollments.schoolYears,
        },
      };

      // Rest of the function remains the same...

      let savedStudent;

      if (studentId) {
        // If we have a student ID, we're updating an existing student
        savedStudent = await studentService.updateStudent(
          studentId,
          dataToSubmit
        );

        await loadStudents();
      } else {
        // If no student ID, we're adding a new student
        savedStudent = await saveStudent(dataToSubmit);

        // If we have a callback and this is a new student, call it
        if (onStudentCreated) {
          // Pass back the student with the appropriate metadata to associate with new teacher
          onStudentCreated({
            ...savedStudent,
            _newTeacherAssociation: teacherId === 'new-teacher',
          });
          return; // Return early without closing the form
        }
      }

      // Only try to update teacher schedule if it's a valid existing teacher ID
      if (finalTeacherId && lessonDay && lessonTime && lessonDuration) {
        await teacherService.updateTeacherSchedule(finalTeacherId, {
          studentId: savedStudent._id,
          lessonDay,
          lessonTime,
          lessonDuration,
          isActive: true,
        });
      }

      // Close the form after successful save
      onClose();
    } catch (err) {
      console.error('Error saving student:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='student-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>{student?._id ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}</h2>

        {error && <div className='error-message'>{error}</div>}

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
                />
                {errors['personalInfo.fullName'] && (
                  <div className='form-error'>
                    {errors['personalInfo.fullName']}
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className='form-row two-columns'>
              <div className='form-group'>
                <label htmlFor='phone'>טלפון</label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.personalInfo?.phone || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.phone'] ? 'is-invalid' : ''}
                  placeholder='05XXXXXXXX'
                />
                {errors['personalInfo.phone'] && (
                  <div className='form-error'>
                    {errors['personalInfo.phone']}
                  </div>
                )}
              </div>
              <div className='form-group'>
                <label htmlFor='address'>כתובת</label>
                <input
                  type='text'
                  id='address'
                  name='address'
                  value={formData.personalInfo?.address || ''}
                  onChange={handlePersonalInfoChange}
                />
              </div>
            </div>

            {/* Age and Class in same row */}
            <div className='form-row two-columns'>
              <div className='form-group'>
                <label htmlFor='age'>גיל</label>
                <input
                  type='number'
                  id='age'
                  name='age'
                  value={formData.personalInfo?.age || ''}
                  onChange={handlePersonalInfoChange}
                  min='6'
                  max='99'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='class'>כיתה *</label>
                <select
                  id='class'
                  name='class'
                  value={formData.academicInfo?.class || ''}
                  onChange={handleAcademicInfoChange}
                  required
                >
                  {VALID_CLASSES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Email */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='studentEmail'>אימייל תלמיד</label>
                <input
                  type='email'
                  id='studentEmail'
                  name='studentEmail'
                  value={formData.personalInfo?.studentEmail || ''}
                  onChange={handlePersonalInfoChange}
                  className={
                    errors['personalInfo.studentEmail'] ? 'is-invalid' : ''
                  }
                />
                {errors['personalInfo.studentEmail'] && (
                  <div className='form-error'>
                    {errors['personalInfo.studentEmail']}
                  </div>
                )}
              </div>
            </div>

            <h4>פרטי הורה</h4>

            {/* Parent Name */}
            <div className='form-row two-columns'>
              <div className='form-group'>
                <label htmlFor='parentName'>שם הורה</label>
                <input
                  type='text'
                  id='parentName'
                  name='parentName'
                  value={formData.personalInfo?.parentName || ''}
                  onChange={handlePersonalInfoChange}
                />
              </div>

              <div className='form-group'>
                <label htmlFor='parentPhone'>טלפון הורה</label>
                <input
                  type='tel'
                  id='parentPhone'
                  name='parentPhone'
                  value={formData.personalInfo?.parentPhone || ''}
                  onChange={handlePersonalInfoChange}
                  className={
                    errors['personalInfo.parentPhone'] ? 'is-invalid' : ''
                  }
                  placeholder='05XXXXXXXX'
                />
                {errors['personalInfo.parentPhone'] && (
                  <div className='form-error'>
                    {errors['personalInfo.parentPhone']}
                  </div>
                )}
              </div>
            </div>

            {/* Parent Email */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='parentEmail'>אימייל הורה</label>
                <input
                  type='email'
                  id='parentEmail'
                  name='parentEmail'
                  value={formData.personalInfo?.parentEmail || ''}
                  onChange={handlePersonalInfoChange}
                  className={
                    errors['personalInfo.parentEmail'] ? 'is-invalid' : ''
                  }
                />
                {errors['personalInfo.parentEmail'] && (
                  <div className='form-error'>
                    {errors['personalInfo.parentEmail']}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className='form-section'>
            <h3>מידע אקדמי</h3>

            {/* Instrument */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='instrument'>כלי נגינה *</label>
                <select
                  id='instrument'
                  name='instrument'
                  value={formData.academicInfo?.instrument || ''}
                  onChange={handleAcademicInfoChange}
                  required
                >
                  {VALID_INSTRUMENTS.map((instrument) => (
                    <option key={instrument} value={instrument}>
                      {instrument}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stage, Technical Test, and Stage Test in same row */}
            <div className='form-row three-columns'>
              <div className='form-group'>
                <label htmlFor='currentStage'>שלב נוכחי *</label>
                <select
                  id='currentStage'
                  name='currentStage'
                  value={formData.academicInfo?.currentStage || 1}
                  onChange={handleAcademicInfoChange}
                  required
                >
                  {VALID_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='technicalTestStatus'>מבחן טכני</label>
                <select
                  id='technicalTestStatus'
                  name='technicalTestStatus'
                  value={
                    formData.academicInfo?.tests?.technicalTest?.status ||
                    'לא נבחן'
                  }
                  onChange={(e) =>
                    handleTestChange('technicalTest', 'status', e.target.value)
                  }
                >
                  {TEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='stageTestStatus'>מבחן שלב</label>
                <select
                  id='stageTestStatus'
                  name='stageTestStatus'
                  value={
                    formData.academicInfo?.tests?.stageTest?.status || 'לא נבחן'
                  }
                  onChange={(e) =>
                    handleTestChange('stageTest', 'status', e.target.value)
                  }
                >
                  {TEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Teacher Assignment */}
          <div className='form-section'>
            <h3>שיוך מורה</h3>

            {/* Teacher Selection */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='teacher'>מורה מלמד</label>
                <select
                  id='teacher'
                  name='teacher'
                  value={formData.teacherId || ''}
                  onChange={handleTeacherChange}
                  disabled={isLoadingTeachers}
                >
                  <option value=''>בחר מורה</option>
                  {/* Include the new teacher being created if available */}
                  {newTeacherInfo && (
                    <option value='new-teacher'>
                      {newTeacherInfo.fullName}{' '}
                      {newTeacherInfo.instrument
                        ? `(${newTeacherInfo.instrument})`
                        : ''}{' '}
                      (המורה החדש)
                    </option>
                  )}
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.personalInfo.fullName}{' '}
                      {teacher.professionalInfo?.instrument
                        ? `(${teacher.professionalInfo.instrument})`
                        : ''}
                    </option>
                  ))}
                </select>
                {isLoadingTeachers && <div>טוען מורים...</div>}
              </div>
            </div>

            {formData.teacherId && (
              <>
                <h4>מועד שיעור</h4>

                <div className='form-row lesson-schedule'>
                  <div className='form-group'>
                    <label htmlFor='lessonDay'>יום</label>
                    <select
                      id='lessonDay'
                      name='lessonDay'
                      value={formData.lessonDay || ''}
                      onChange={handleLessonScheduleChange}
                    >
                      <option value=''>בחר יום</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='form-group'>
                    <label htmlFor='lessonTime'>שעה</label>
                    <input
                      type='time'
                      id='lessonTime'
                      name='lessonTime'
                      value={formData.lessonTime || ''}
                      onChange={handleLessonScheduleChange}
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor='lessonDuration'>משך שיעור (דקות)</label>
                    <select
                      id='lessonDuration'
                      name='lessonDuration'
                      value={formData.lessonDuration || 45}
                      onChange={handleLessonScheduleChange}
                    >
                      {LESSON_DURATIONS.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Form Actions */}
          <div className='form-actions'>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'שומר...' : student?._id ? 'עדכון' : 'הוספה'}
            </button>

            <button type='button' className='btn secondary' onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
