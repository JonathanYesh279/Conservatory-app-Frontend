// src/hooks/useAcademicInfoSection.ts
import { useCallback } from 'react';
import {
  StudentFormData,
  VALID_CLASSES,
  VALID_STAGES,
  TEST_STATUSES,
  EXTENDED_TEST_STATUSES,
} from './useStudentForm.tsx';

interface UseAcademicInfoSectionProps {
  formData: StudentFormData;
  updateAcademicInfo: (field: string, value: any) => void;
  updateTestInfo: (
    testType: 'stageTest' | 'technicalTest',
    field: string,
    value: any
  ) => void;
  errors: Record<string, string>;
}

export function useAcademicInfoSection({
  formData,
  updateAcademicInfo,
  updateTestInfo,
  errors,
}: UseAcademicInfoSectionProps) {
  // Handle academic info changes
  const handleAcademicInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      // Convert to number for number inputs, otherwise use string value
      const processedValue =
        type === 'number' ? (value ? parseInt(value) : undefined) : value;

      updateAcademicInfo(name, processedValue);
    },
    [updateAcademicInfo]
  );

  // Handle test info changes
  const handleTestChange = useCallback(
    (
      testType: 'stageTest' | 'technicalTest',
      field: string,
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      updateTestInfo(testType, field, e.target.value);
    },
    [updateTestInfo]
  );

  return {
    academicInfo: formData.academicInfo,
    errors,
    validClasses: VALID_CLASSES,
    validStages: VALID_STAGES,
    testStatuses: TEST_STATUSES,
    extendedTestStatuses: EXTENDED_TEST_STATUSES,
    handleAcademicInfoChange,
    handleTestChange,
  };
}
