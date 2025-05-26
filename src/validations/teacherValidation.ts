// src/validations/teacherValidation.ts
import * as Yup from 'yup';

// Constants for validation
export const VALID_ROLES = [
  'מורה',
  'מנצח',
  'מדריך הרכב',
  'מנהל',
  'מורה תאוריה',
];

export const VALID_INSTRUMENTS = [
  'חצוצרה',
  'חליל צד',
  'קלרינט',
  'קרן יער',
  'בריטון',
  'טרומבון',
  'סקסופון',
  'אבוב',
  'כינור',
  'צ׳לו',
  'ויולה',
  'קונטרבס',
  'פסנתר',
  'גיטרה',
  'מדרימבה',
  'תופים',
  'הקשה',
];

export const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
export const LESSON_DURATIONS = [30, 45, 60];

// Helper function to conditionally apply validation based on roles
const validateBasedOnRoles = (rolesToCheck: string[], schema: any) => {
  return Yup.mixed().when('roles', {
    is: (roles: string[]) => 
      roles && Array.isArray(roles) && 
      rolesToCheck.some(role => roles.includes(role)),
    then: () => schema,
    otherwise: () => Yup.mixed().notRequired(),
  });
};

// Schedule item validation schema
const scheduleItemSchema = Yup.object().shape({
  studentId: Yup.string().required('קוד תלמיד הוא שדה חובה'),
  day: Yup.string()
    .required('יום הוא שדה חובה')
    .oneOf(DAYS_OF_WEEK, 'יום לא תקין'),
  time: Yup.string()
    .required('שעה היא שדה חובה')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'פורמט זמן לא תקין (HH:MM)'),
  duration: Yup.number()
    .required('משך הוא שדה חובה')
    .oneOf(LESSON_DURATIONS, 'משך שיעור לא תקין'),
  isActive: Yup.boolean().default(true),
});

// Base validation schema
export const teacherValidationSchema = Yup.object().shape({
  // Personal information
  personalInfo: Yup.object().shape({
    fullName: Yup.string().required('שם מלא הוא שדה חובה'),
    phone: Yup.string()
      .required('טלפון הוא שדה חובה')
      .matches(
        /^05\d{8}$/,
        'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)'
      ),
    email: Yup.string()
      .required('דוא"ל הוא שדה חובה')
      .email('כתובת דוא"ל לא תקינה'),
    address: Yup.string().required('כתובת היא שדה חובה'),
  }),

  // Roles
  roles: Yup.array()
    .of(Yup.string().oneOf(VALID_ROLES))
    .min(1, 'יש לבחור לפחות תפקיד אחד')
    .required('תפקידים הם שדה חובה'),

  // Professional info - conditional on role
  professionalInfo: Yup.object().shape({
    instrument: validateBasedOnRoles(
      ['מורה', 'מורה תאוריה'],
      Yup.string()
        .required('כלי נגינה הוא שדה חובה למורה')
        .oneOf(VALID_INSTRUMENTS, 'כלי נגינה לא תקין')
    ),
    isActive: Yup.boolean().default(true),
  }),

  // Teaching information - conditional on role
  teaching: Yup.object().shape({
    studentIds: Yup.array().of(Yup.string()),
    schedule: Yup.array().of(scheduleItemSchema),
  }),

  // Conducting information - conditional on role
  conducting: Yup.object().shape({
    orchestraIds: validateBasedOnRoles(['מנצח'], Yup.array().of(Yup.string())),
  }),

  // Additional info
  ensemblesIds: Yup.array().of(Yup.string()),
  schoolYears: Yup.array().of(
    Yup.object().shape({
      schoolYearId: Yup.string().required('קוד שנת לימוד הוא שדה חובה'),
      isActive: Yup.boolean().default(true),
    })
  ),

  // Credentials - only validated for new teachers
  credentials: Yup.object().when('_id', {
    is: (id: string) => !id, // Only apply when _id is not present (new teacher)
    then: () =>
      Yup.object().shape({
        email: Yup.string()
          .required('דוא"ל הוא שדה חובה')
          .email('כתובת דוא"ל לא תקינה'),
        password: Yup.string()
          .required('סיסמה היא שדה חובה')
          .min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
      }),
    otherwise: () => Yup.object(), // No validation for existing teachers
  }),

  isActive: Yup.boolean().default(true),
});

// Type definition for the form data
export interface TeacherFormData {
  _id?: string;
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
  roles: string[];
  professionalInfo: {
    instrument: string;
    isActive: boolean;
  };
  teaching: {
    studentIds: string[];
    schedule: Array<{
      studentId: string;
      day: string;
      time: string;
      duration: number;
      isActive: boolean;
    }>;
  };
  conducting: {
    orchestraIds: string[];
  };
  ensemblesIds: string[];
  schoolYears: Array<{
    schoolYearId: string;
    isActive: boolean;
  }>;
  credentials: {
    email: string;
    password: string;
  };
  isActive: boolean;
}

// Initial values for new teacher form
export const initialTeacherFormValues: TeacherFormData = {
  personalInfo: {
    fullName: '',
    phone: '',
    email: '',
    address: '',
  },
  roles: ['מורה'],
  professionalInfo: {
    instrument: '',
    isActive: true,
  },
  teaching: {
    studentIds: [],
    schedule: [],
  },
  conducting: {
    orchestraIds: [],
  },
  ensemblesIds: [],
  schoolYears: [],
  credentials: {
    email: '',
    password: '',
  },
  isActive: true,
};