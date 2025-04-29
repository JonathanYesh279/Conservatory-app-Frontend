// src/hooks/usePersonalInfoSection.ts
import { useCallback } from 'react';
import { StudentFormData } from './useStudentForm.tsx';

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

      // Convert to number for number inputs, otherwise use string value
      const processedValue =
        type === 'number' ? (value ? parseInt(value) : undefined) : value;

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
