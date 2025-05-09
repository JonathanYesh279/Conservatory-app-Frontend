// src/hooks/useFormValidation.ts
import { useCallback } from 'react';
import { StudentFormData } from './useStudentForm';

export function useFormValidation() {
  // Validate student form
  const validateStudentForm = useCallback(
    (formData: StudentFormData): Record<string, string> => {
      const errors: Record<string, string> = {};

      // Required fields validation
      if (!formData.personalInfo?.fullName) {
        errors['personalInfo.fullName'] = 'שם מלא הוא שדה חובה';
      }

      if (
        formData.personalInfo?.phone &&
        !/^05\d{8}$/.test(formData.personalInfo.phone)
      ) {
        errors['personalInfo.phone'] =
          'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)';
      }

      if (
        formData.personalInfo?.parentPhone &&
        !/^05\d{8}$/.test(formData.personalInfo.parentPhone)
      ) {
        errors['personalInfo.parentPhone'] =
          'מספר טלפון הורה לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)';
      }

      if (
        formData.personalInfo?.parentEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.parentEmail)
      ) {
        errors['personalInfo.parentEmail'] = 'כתובת אימייל הורה לא תקינה';
      }

      if (
        formData.personalInfo?.studentEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.studentEmail)
      ) {
        errors['personalInfo.studentEmail'] = 'כתובת אימייל תלמיד לא תקינה';
      }

      // Check instruments - must have at least one
      if (
        !formData.academicInfo?.instrumentProgress ||
        formData.academicInfo.instrumentProgress.length === 0
      ) {
        errors['academicInfo.instrumentProgress'] =
          'יש לבחור לפחות כלי נגינה אחד';
      }

      // Check for a primary instrument only if there are instruments
      if (
        formData.academicInfo?.instrumentProgress &&
        formData.academicInfo.instrumentProgress.length > 0 &&
        !formData.academicInfo.instrumentProgress.some((i) => i.isPrimary)
      ) {
        errors['academicInfo.instrumentProgress.primary'] =
          'יש לבחור כלי נגינה ראשי';
      }

      if (!formData.academicInfo?.class) {
        errors['academicInfo.class'] = 'כיתה היא שדה חובה';
      }

      // Validate teacher assignments
      formData.teacherAssignments.forEach((assignment, index) => {
        if (!assignment.day) {
          errors[`teacherAssignment.${index}.day`] = 'יש לבחור יום לשיעור';
        }

        if (!assignment.time) {
          errors[`teacherAssignment.${index}.time`] = 'יש לבחור שעה לשיעור';
        }

        if (!assignment.duration) {
          errors[`teacherAssignment.${index}.duration`] = 'יש לבחור משך שיעור';
        }
      });

      return errors;
    },
    []
  );

  return {
    validateStudentForm,
  };
}
