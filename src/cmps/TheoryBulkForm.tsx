// src/cmps/TheoryBulkForm.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { BulkTheoryLessonData, THEORY_CATEGORIES, THEORY_LOCATIONS, DAYS_OF_WEEK } from '../services/theoryService';
import { Teacher } from '../services/teacherService';
import { useSchoolYearStore } from '../store/schoolYearStore';

// Create a Yup validation schema for bulk creation
const TheoryBulkSchema = Yup.object().shape({
  category: Yup.string().required('קטגוריה היא שדה חובה'),
  teacherId: Yup.string().required('יש לבחור מורה תאוריה'),
  startDate: Yup.date().required('תאריך התחלה הוא שדה חובה'),
  endDate: Yup.date()
    .required('תאריך סיום הוא שדה חובה')
    .min(Yup.ref('startDate'), 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה'),
  dayOfWeek: Yup.number()
    .required('יום בשבוע הוא שדה חובה')
    .min(0, 'יום בשבוע חייב להיות בין 0 ל-6')
    .max(6, 'יום בשבוע חייב להיות בין 0 ל-6'),
  startTime: Yup.string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'פורמט שעה לא תקין (HH:MM)')
    .required('שעת התחלה היא שדה חובה'),
  endTime: Yup.string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'פורמט שעה לא תקין (HH:MM)')
    .required('שעת סיום היא שדה חובה')
    .test('is-greater', 'שעת הסיום חייבת להיות אחרי שעת ההתחלה', function (value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;
      return value > startTime;
    }),
  location: Yup.string().required('מיקום הוא שדה חובה'),
  excludeDates: Yup.array().of(Yup.date()),
});

interface TheoryBulkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkTheoryLessonData) => Promise<any>;
  theoryTeachers: Teacher[];
  isLoading?: boolean;
}

export function TheoryBulkForm({
  isOpen,
  onClose,
  onSubmit,
  theoryTeachers,
  isLoading = false,
}: TheoryBulkFormProps) {
  const { currentSchoolYear } = useSchoolYearStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [excludeDates, setExcludeDates] = useState<string[]>([]);

  // If not open, don't render
  if (!isOpen) return null;

  // Initialize form values
  const initialValues: BulkTheoryLessonData = {
    category: THEORY_CATEGORIES[0],
    teacherId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
      .toISOString()
      .split('T')[0],
    dayOfWeek: new Date().getDay(),
    startTime: '14:00',
    endTime: '15:00',
    location: THEORY_LOCATIONS[0],
    studentIds: [],
    notes: '',
    syllabus: '',
    excludeDates: [],
    schoolYearId: currentSchoolYear?._id || '',
  };

  const handleSubmit = async (values: BulkTheoryLessonData) => {
    try {
      setSubmitError(null);
      // Add the excluded dates
      const formattedValues = {
        ...values,
        excludeDates: excludeDates,
      };
      await onSubmit(formattedValues);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'אירעה שגיאה ביצירת שיעורי התאוריה'
      );
    }
  };

  const handleExcludeDateAdd = (
    e: React.KeyboardEvent<HTMLInputElement>,
    push: (obj: any) => void,
    values: any
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const date = input.value;

      if (date && !values.excludeDates.includes(date)) {
        push(date);
        input.value = '';
      }
    }
  };

  return (
    <div className='theory-form-overlay'>
      <div className='theory-form-modal bulk-form'>
        <button className='close-button' onClick={onClose}>
          <X size={20} />
        </button>
        <h2>יצירת סדרת שיעורי תאוריה</h2>

        <Formik
          initialValues={initialValues}
          validationSchema={TheoryBulkSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values }) => (
            <Form className='theory-form'>
              {submitError && <div className='error-message'>{submitError}</div>}

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='category'>קטגוריה</label>
                  <Field as='select' name='category' id='category'>
                    {THEORY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name='category'
                    component='div'
                    className='error'
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor='teacherId'>מורה תאוריה</label>
                  <Field as='select' name='teacherId' id='teacherId'>
                    <option value=''>בחר מדריך...</option>
                    {theoryTeachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.personalInfo.fullName}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name='teacherId'
                    component='div'
                    className='error'
                  />
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='startDate'>תאריך התחלה</label>
                  <Field type='date' name='startDate' id='startDate' />
                  <ErrorMessage
                    name='startDate'
                    component='div'
                    className='error'
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor='endDate'>תאריך סיום</label>
                  <Field type='date' name='endDate' id='endDate' />
                  <ErrorMessage
                    name='endDate'
                    component='div'
                    className='error'
                  />
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='dayOfWeek'>יום בשבוע</label>
                  <Field as='select' name='dayOfWeek' id='dayOfWeek'>
                    {Object.entries(DAYS_OF_WEEK).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name='dayOfWeek'
                    component='div'
                    className='error'
                  />
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor='startTime'>שעת התחלה</label>
                  <Field type='time' name='startTime' id='startTime' />
                  <ErrorMessage
                    name='startTime'
                    component='div'
                    className='error'
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor='endTime'>שעת סיום</label>
                  <Field type='time' name='endTime' id='endTime' />
                  <ErrorMessage
                    name='endTime'
                    component='div'
                    className='error'
                  />
                </div>
              </div>

              <div className='form-group'>
                <label htmlFor='location'>מיקום</label>
                <Field as='select' name='location' id='location'>
                  {THEORY_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name='location'
                  component='div'
                  className='error'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='notes'>הערות</label>
                <Field as='textarea' name='notes' id='notes' rows={3} />
              </div>

              <div className='form-group'>
                <label htmlFor='syllabus'>סילבוס</label>
                <Field as='textarea' name='syllabus' id='syllabus' rows={3} />
              </div>

              <FieldArray name='excludeDates'>
                {({ push, remove }) => (
                  <div className='form-group'>
                    <label htmlFor='excludeDates'>תאריכים להוציא (חופשות, חגים)</label>
                    <div className='exclude-dates-input'>
                      <input
                        type='date'
                        id='excludeDate'
                        onKeyDown={(e) =>
                          handleExcludeDateAdd(e, push, values)
                        }
                      />
                      <button
                        type='button'
                        className='btn add-date'
                        onClick={() => {
                          const input = document.getElementById(
                            'excludeDate'
                          ) as HTMLInputElement;
                          if (
                            input.value &&
                            !values.excludeDates.includes(input.value)
                          ) {
                            push(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        הוסף
                      </button>
                    </div>
                    
                    <div className='exclude-dates-list'>
                      {values.excludeDates.length > 0 ? (
                        values.excludeDates.map((date, index) => (
                          <div key={index} className='exclude-date-item'>
                            <span>{new Date(date).toLocaleDateString('he-IL')}</span>
                            <button
                              type='button'
                              className='btn remove-date'
                              onClick={() => remove(index)}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className='no-dates'>אין תאריכים להוציא</p>
                      )}
                    </div>
                  </div>
                )}
              </FieldArray>

              <div className='form-actions'>
                <button
                  type='submit'
                  className='btn primary'
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? 'יוצר...' : 'צור שיעורים'}
                </button>
                <button
                  type='button'
                  className='btn secondary'
                  onClick={onClose}
                  disabled={isSubmitting || isLoading}
                >
                  ביטול
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}