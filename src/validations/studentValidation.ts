// src/validations/studentValidation.ts
import * as Yup from 'yup';
import {
  VALID_CLASSES,
  VALID_INSTRUMENTS,
  TEST_STATUSES,
  DAYS_OF_WEEK,
  LESSON_DURATIONS,
} from '../constants/formConstants';

// Define common validation patterns
const phoneRegExp = /^05\d{8}$/;
const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Instrument progress validation schema - NOT required
const instrumentProgressSchema = Yup.object({
  instrumentName: Yup.string().oneOf(VALID_INSTRUMENTS, 'כלי נגינה לא תקין'),
  isPrimary: Yup.boolean(),
  currentStage: Yup.number()
    .min(1, 'שלב חייב להיות מספר בין 1 ל-8')
    .max(8, 'שלב חייב להיות מספר בין 1 ל-8'),
  tests: Yup.object({
    stageTest: Yup.object({
      status: Yup.string().oneOf(TEST_STATUSES, 'סטטוס מבחן לא תקין'),
      notes: Yup.string(),
      lastTestDate: Yup.date().nullable(),
      nextTestDate: Yup.date().nullable(),
    }),
    technicalTest: Yup.object({
      status: Yup.string().oneOf(TEST_STATUSES, 'סטטוס מבחן לא תקין'),
      notes: Yup.string(),
      lastTestDate: Yup.date().nullable(),
      nextTestDate: Yup.date().nullable(),
    }),
  }),
});

// Teacher assignment validation schema
const teacherAssignmentSchema = Yup.object({
  teacherId: Yup.string(),
  day: Yup.string().oneOf(DAYS_OF_WEEK, 'יום לא תקין'),
  time: Yup.string().matches(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    'פורמט שעה לא תקין'
  ),
  duration: Yup.number().oneOf(LESSON_DURATIONS, 'משך שיעור לא תקין'),
});

// Main validation schema for the entire student form
export const studentValidationSchema = Yup.object({
  personalInfo: Yup.object({
    fullName: Yup.string().required('שם מלא הוא שדה חובה'),
    phone: Yup.string().required('טלפון הוא שדה חובה').matches(phoneRegExp, {
      message: 'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)',
      excludeEmptyString: true,
    }),
    age: Yup.number()
      .nullable()
      .transform((value, originalValue) => {
        // Handle empty string or null/undefined
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        return value;
      })
      .min(5, 'גיל מינימלי הוא 5')
      .max(99, 'גיל מקסימלי הוא 99'),
    address: Yup.string().required('כתובת היא שדה חובה'),
    parentName: Yup.string(),
    parentPhone: Yup.string()
      .nullable()
      .transform((value) => (!value ? null : value))
      .matches(phoneRegExp, {
        message: 'מספר טלפון הורה לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)',
        excludeEmptyString: true,
      }),
    parentEmail: Yup.string()
      .nullable()
      .transform((value) => (!value ? null : value))
      .matches(emailRegExp, {
        message: 'כתובת אימייל הורה לא תקינה',
        excludeEmptyString: true,
      }),
    studentEmail: Yup.string()
      .nullable()
      .transform((value) => (!value ? null : value))
      .matches(emailRegExp, {
        message: 'כתובת אימייל תלמיד לא תקינה',
        excludeEmptyString: true,
      }),
  }),

  academicInfo: Yup.object({
    instrumentProgress: Yup.array()
      .of(instrumentProgressSchema), // Removed min(1) requirement
    class: Yup.string()
      .required('כיתה היא שדה חובה')
      .oneOf(VALID_CLASSES, 'כיתה לא תקינה'),
  }),

  teacherAssignments: Yup.array().of(teacherAssignmentSchema),

  orchestraAssignments: Yup.array().of(
    Yup.object({
      orchestraId: Yup.string(),
    })
  ),

  isActive: Yup.boolean(),
});

export default studentValidationSchema;