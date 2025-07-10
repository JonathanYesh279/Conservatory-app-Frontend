// src/validations/constants.ts
// Common constants used across validation files

export const VALID_TYPES = ['הרכב', 'תזמורת'];

export const VALID_LOCATIONS = [
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

// Get Hebrew day name
export const getDayName = (dayIndex: number): string => {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[dayIndex];
};

// Day of week options
export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'יום ראשון' },
  { value: 1, label: 'יום שני' },
  { value: 2, label: 'יום שלישי' },
  { value: 3, label: 'יום רביעי' },
  { value: 4, label: 'יום חמישי' },
  { value: 5, label: 'יום שישי' },
  { value: 6, label: 'יום שבת' },
];