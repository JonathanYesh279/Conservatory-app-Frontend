// src/hooks/usePersonalInfoSection.ts
import { useCallback } from 'react';
import { StudentFormData } from './useStudentForm';

interface UsePersonalInfoSectionProps {
  formData: StudentFormData;
  updatePersonalInfo: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function usePersonalInfoSection({
  formData,
  updatePersonalInfo,
  errors,
}: UsePersonalInfoSectionProps) {
  // Handle input changes for personal info fields
  const handlePersonalInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;

      // Process value based on input type
      let processedValue: string | number | undefined = value;

      // Convert to number for number inputs if value exists and isn't empty
      if (type === 'number' && value !== '') {
        processedValue = parseInt(value);
      }

      // Empty string for number inputs should be undefined, not 0
      if (type === 'number' && value === '') {
        processedValue = undefined;
      }

      updatePersonalInfo(name, processedValue);
    },
    [updatePersonalInfo]
  );

  return {
    personalInfo: formData.personalInfo,
    errors,
    handlePersonalInfoChange,
  };
}
