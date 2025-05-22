// src/validations/rehearsalValidation.ts
import * as Yup from 'yup';
import { Rehearsal } from '../services/rehearsalService';
import { VALID_LOCATIONS, DAY_OF_WEEK_OPTIONS, getDayName } from './constants';

// Validation schema for single rehearsal form
export const RehearsalValidationSchema = Yup.object().shape({
  groupId: Yup.string().required('יש לבחור תזמורת'),
  date: Yup.string().required('תאריך חובה'),
  startTime: Yup.string().required('שעת התחלה חובה'),
  endTime: Yup.string()
    .required('שעת סיום חובה')
    .test('is-after-start', 'שעת סיום חייבת להיות אחרי שעת התחלה', function (value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;
      return value > startTime;
    }),
  location: Yup.string().required('מיקום חובה'),
  notes: Yup.string(),
  isActive: Yup.boolean().default(true),
  schoolYearId: Yup.string().required('שנת לימודים חובה'),
  type: Yup.string().default('תזמורת'),
  dayOfWeek: Yup.number().min(0).max(6),
});

// Validation schema for bulk rehearsal form
export const BulkRehearsalValidationSchema = Yup.object().shape({
  orchestraId: Yup.string().required('יש לבחור תזמורת'),
  startDate: Yup.string().required('תאריך התחלה חובה'),
  endDate: Yup.string()
    .required('תאריך סיום חובה')
    .test('is-after-start', 'תאריך סיום חייב להיות אחרי תאריך התחלה', function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  dayOfWeek: Yup.number().min(0).max(6).required('יום בשבוע חובה'),
  startTime: Yup.string().required('שעת התחלה חובה'),
  endTime: Yup.string()
    .required('שעת סיום חובה')
    .test('is-after-start', 'שעת סיום חייבת להיות אחרי שעת התחלה', function (value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;
      return value > startTime;
    }),
  location: Yup.string().required('מיקום חובה'),
  notes: Yup.string(),
  excludeDates: Yup.array().of(Yup.string()),
  schoolYearId: Yup.string().required('שנת לימודים חובה'),
});

// Helper function to format date for input
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Initial values for single rehearsal form
export const getInitialRehearsalValues = (
  rehearsal: Partial<Rehearsal> | null,
  orchestraId: string = '',
  currentSchoolYearId: string = ''
): RehearsalFormValues => {
  const today = new Date();
  
  if (rehearsal?._id) {
    return {
      _id: rehearsal._id,
      groupId: rehearsal.groupId || orchestraId,
      date: rehearsal.date || formatDateForInput(today),
      startTime: rehearsal.startTime || '16:00',
      endTime: rehearsal.endTime || '18:00',
      location: rehearsal.location || VALID_LOCATIONS[0],
      notes: rehearsal.notes || '',
      isActive: rehearsal.isActive !== false,
      schoolYearId: rehearsal.schoolYearId || currentSchoolYearId,
      type: rehearsal.type || 'תזמורת',
      dayOfWeek: rehearsal.dayOfWeek || today.getDay(),
    };
  }

  return {
    _id: undefined,
    groupId: orchestraId,
    date: formatDateForInput(today),
    startTime: '16:00',
    endTime: '18:00',
    location: VALID_LOCATIONS[0],
    notes: '',
    isActive: true,
    schoolYearId: currentSchoolYearId,
    type: 'תזמורת',
    dayOfWeek: today.getDay(),
  };
};

// Initial values for bulk rehearsal form
export const getInitialBulkRehearsalValues = (
  orchestraId: string = '',
  currentSchoolYearId: string = ''
): BulkRehearsalFormValues => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30); // 30 days later

  return {
    orchestraId,
    startDate: formatDateForInput(today),
    endDate: formatDateForInput(endDate),
    dayOfWeek: today.getDay(),
    startTime: '16:00',
    endTime: '18:00',
    location: VALID_LOCATIONS[0],
    notes: '',
    excludeDates: [],
    schoolYearId: currentSchoolYearId,
    excludedDate: '', // This is for UI only, not part of the API
  };
};

// Types for form values
export interface RehearsalFormValues {
  _id?: string;
  groupId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  isActive: boolean;
  schoolYearId: string;
  type: string;
  dayOfWeek: number;
}

export interface BulkRehearsalFormValues {
  orchestraId: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  excludeDates: string[];
  schoolYearId: string;
  excludedDate?: string; // This is for UI only, not part of the API
}

// Day of week options and other common constants are imported from constants.ts