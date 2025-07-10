// src/validations/theoryValidation.ts
import * as Yup from 'yup';
import { TheoryLesson, THEORY_CATEGORIES, THEORY_LOCATIONS } from '../services/theoryService';
// DAY_OF_WEEK_OPTIONS is used in TheoryForm.tsx but not here

// Validation schema for single theory lesson form
export const TheoryLessonValidationSchema = Yup.object().shape({
  category: Yup.string().required('קטגוריה היא שדה חובה'),
  teacherId: Yup.string().required('יש לבחור מורה תאוריה'),
  date: Yup.date().required('תאריך הוא שדה חובה'),
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
  notes: Yup.string(),
  syllabus: Yup.string(),
  homework: Yup.string(),
  schoolYearId: Yup.string().required('שנת לימודים חובה'),
  dayOfWeek: Yup.number().min(0).max(6),
});

// Validation schema for bulk theory lesson form
export const TheoryBulkValidationSchema = Yup.object().shape({
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
  notes: Yup.string(),
  syllabus: Yup.string(),
  excludeDates: Yup.array().of(Yup.string()),
  schoolYearId: Yup.string().required('שנת לימודים חובה'),
});

// Helper function to format date for input
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Initial values for single theory lesson form
export const getInitialTheoryLessonValues = (
  theoryLesson: Partial<TheoryLesson> | null,
  currentSchoolYearId: string = ''
): TheoryFormValues => {
  const today = new Date();
  
  if (theoryLesson?._id) {
    return {
      _id: theoryLesson._id,
      category: theoryLesson.category || THEORY_CATEGORIES[0],
      teacherId: theoryLesson.teacherId || '',
      date: theoryLesson.date || formatDateForInput(today),
      startTime: theoryLesson.startTime || '14:00',
      endTime: theoryLesson.endTime || '15:00',
      location: theoryLesson.location || THEORY_LOCATIONS[0],
      notes: theoryLesson.notes || '',
      syllabus: theoryLesson.syllabus || '',
      homework: theoryLesson.homework || '',
      schoolYearId: theoryLesson.schoolYearId || currentSchoolYearId,
      dayOfWeek: theoryLesson.dayOfWeek || today.getDay(),
      studentIds: theoryLesson.studentIds || [],
    };
  }

  return {
    _id: undefined,
    category: THEORY_CATEGORIES[0],
    teacherId: '',
    date: formatDateForInput(today),
    startTime: '14:00',
    endTime: '15:00',
    location: THEORY_LOCATIONS[0],
    notes: '',
    syllabus: '',
    homework: '',
    schoolYearId: currentSchoolYearId,
    dayOfWeek: today.getDay(),
    studentIds: [],
  };
};

// Initial values for bulk theory lesson form
export const getInitialBulkTheoryLessonValues = (
  currentSchoolYearId: string = ''
): BulkTheoryFormValues => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + 3); // 3 months later

  return {
    category: THEORY_CATEGORIES[0],
    teacherId: '',
    startDate: formatDateForInput(today),
    endDate: formatDateForInput(endDate),
    dayOfWeek: today.getDay(),
    startTime: '14:00',
    endTime: '15:00',
    location: THEORY_LOCATIONS[0],
    notes: '',
    syllabus: '',
    excludeDates: [],
    schoolYearId: currentSchoolYearId,
    studentIds: [],
  };
};

// Types for form values
export interface TheoryFormValues {
  _id?: string;
  category: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  syllabus: string;
  homework: string;
  schoolYearId: string;
  dayOfWeek: number;
  studentIds: string[];
}

export interface BulkTheoryFormValues {
  category: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  syllabus: string;
  excludeDates: string[];
  schoolYearId: string;
  studentIds: string[];
}