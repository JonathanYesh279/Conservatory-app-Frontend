// src/validations/orchestraValidation.ts
import * as Yup from 'yup';
import { VALID_TYPES, VALID_LOCATIONS } from './constants';

// Helper function for name validation against existing names
const validateUniqueName = (
  existingNames: string[] = [],
  currentName?: string
) => {
  return Yup.string()
    .required('שם הוא שדה חובה')
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .test(
      'unique-name',
      'שם זהה כבר קיים',
      function (value) {
        if (!value) return true;
        
        // Skip validation if name hasn't changed from original
        if (currentName && currentName === value) {
          return true;
        }

        const normalizedNewName = value.trim().toLowerCase();
        
        // Get list of names to check against (excluding the original name)
        const namesToCompare = currentName
          ? existingNames.filter(
              (existingName) =>
                existingName.toLowerCase() !== currentName.toLowerCase()
            )
          : existingNames;

        // Check for exact match (case-insensitive)
        const exactMatch = namesToCompare.find(
          (existingName) => existingName.toLowerCase() === normalizedNewName
        );

        if (exactMatch) {
          return this.createError({
            message: `שם זהה כבר קיים: "${exactMatch}"`,
          });
        }

        // Check for similarity (ignoring spaces)
        const noSpacesNewName = normalizedNewName.replace(/\s+/g, '');
        const similarName = namesToCompare.find((existingName) => {
          const noSpacesExisting = existingName.toLowerCase().replace(/\s+/g, '');
          return noSpacesExisting === noSpacesNewName;
        });

        if (similarName) {
          return this.createError({
            message: `שם דומה כבר קיים (הבדלי רווחים): "${similarName}"`,
          });
        }

        return true;
      }
    );
};

// Orchestra form data type
export interface OrchestraFormData {
  _id?: string;
  name: string;
  type: string;
  conductorId: string;
  memberIds: string[];
  rehearsalIds: string[];
  schoolYearId: string;
  location: string;
  isActive: boolean;
}

// Default initial values
export const initialOrchestraFormValues: OrchestraFormData = {
  name: '',
  type: 'תזמורת',
  conductorId: '',
  memberIds: [],
  rehearsalIds: [],
  schoolYearId: '',
  location: 'חדר 1',
  isActive: true,
};

// Create the validation schema factory function
export const createOrchestraValidationSchema = (
  existingNames: string[] = [],
  currentName?: string
) => {
  return Yup.object().shape({
    _id: Yup.string(),
    name: validateUniqueName(existingNames, currentName),
    type: Yup.string()
      .required('סוג הוא שדה חובה')
      .oneOf(VALID_TYPES, 'סוג לא תקין'),
    conductorId: Yup.string().required('מנצח/מדריך הוא שדה חובה'),
    memberIds: Yup.array().of(Yup.string()),
    rehearsalIds: Yup.array().of(Yup.string()),
    schoolYearId: Yup.string().required('שנת לימודים היא שדה חובה'),
    location: Yup.string()
      .required('מקום הוא שדה חובה')
      .oneOf(VALID_LOCATIONS, 'מקום לא תקין'),
    isActive: Yup.boolean().default(true),
  });
};