// src/hooks/useInstrumentSection.ts
import { useCallback } from 'react';
import { InstrumentProgress } from '../services/studentService';
import { VALID_INSTRUMENTS } from './useStudentForm';

interface UseInstrumentSectionProps {
  instrumentProgress: InstrumentProgress[];
  updateFormData: (setter: (prev: any) => any) => void;
  clearError: (field: string) => void;
}

export function useInstrumentSection({
  instrumentProgress,
  updateFormData,
  clearError,
}: UseInstrumentSectionProps) {
  // Add instrument
  const addInstrument = useCallback(
    (instrumentName: string) => {
      updateFormData((prev) => {
        // Check if instrument already exists
        const exists = prev.academicInfo.instrumentProgress.some(
          (i) => i.instrumentName === instrumentName
        );

        if (exists) return prev; // Already added

        const newInstrument = {
          instrumentName,
          isPrimary: prev.academicInfo.instrumentProgress.length === 0, // Set as primary if it's the first instrument
          currentStage: 1, // Start at stage 1
          tests: {
            stageTest: {
              status: 'לא נבחן',
              notes: '',
              lastTestDate: null,
              nextTestDate: null,
            },
            technicalTest: {
              status: 'לא נבחן',
              notes: '',
              lastTestDate: null,
              nextTestDate: null,
            },
          },
        };

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instrumentProgress: [
              ...prev.academicInfo.instrumentProgress,
              newInstrument,
            ],
          },
        };
      });

      // Clear error if exists
      clearError('academicInfo.instrumentProgress');
    },
    [updateFormData, clearError]
  );

  // Remove instrument
  const removeInstrument = useCallback(
    (instrumentName: string) => {
      updateFormData((prev) => {
        // Don't allow removing the last instrument
        if (prev.academicInfo.instrumentProgress.length <= 1) {
          return prev;
        }

        const updatedInstruments = prev.academicInfo.instrumentProgress.filter(
          (i) => i.instrumentName !== instrumentName
        );

        // If we removed the primary instrument, set the first one as primary
        let finalInstruments = [...updatedInstruments];
        if (
          !finalInstruments.some((i) => i.isPrimary) &&
          finalInstruments.length > 0
        ) {
          finalInstruments = finalInstruments.map((instrument, index) => ({
            ...instrument,
            isPrimary: index === 0,
          }));
        }

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instrumentProgress: finalInstruments,
          },
        };
      });
    },
    [updateFormData]
  );

  // Set primary instrument
  const setPrimaryInstrument = useCallback(
    (instrumentName: string) => {
      updateFormData((prev) => {
        const updatedInstruments = prev.academicInfo.instrumentProgress.map(
          (instrument) => ({
            ...instrument,
            isPrimary: instrument.instrumentName === instrumentName,
          })
        );

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instrumentProgress: updatedInstruments,
          },
        };
      });

      // Clear primary instrument error if exists
      clearError('academicInfo.instrumentProgress.primary');
    },
    [updateFormData, clearError]
  );

  // Update instrument progress (like stage level)
  const updateInstrumentProgress = useCallback(
    (instrumentName: string, field: string, value: any) => {
      updateFormData((prev) => {
        const updatedInstruments = prev.academicInfo.instrumentProgress.map(
          (instrument) => {
            if (instrument.instrumentName === instrumentName) {
              return {
                ...instrument,
                [field]: value,
              };
            }
            return instrument;
          }
        );

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instrumentProgress: updatedInstruments,
          },
        };
      });

      // Clear error if exists
      clearError(`academicInfo.instrumentProgress.${field}`);
    },
    [updateFormData, clearError]
  );

  // Update instrument test
  const updateInstrumentTest = useCallback(
    (instrumentName: string, testType: string, field: string, value: any) => {
      updateFormData((prev) => {
        const updatedInstruments = prev.academicInfo.instrumentProgress.map(
          (instrument) => {
            if (instrument.instrumentName === instrumentName) {
              // Create tests object if it doesn't exist
              const tests = instrument.tests || {};

              // Create test type object if it doesn't exist
              const testObj = tests[testType] || {};

              // Create updated test object
              const updatedTest = {
                ...testObj,
                [field]: value,
              };

              // Auto-increment stage if stage test is passed
              let currentStage = instrument.currentStage;
              if (
                testType === 'stageTest' &&
                field === 'status' &&
                (value === 'עבר/ה' ||
                  value === 'עבר/ה בהצלחה' ||
                  value === 'עבר/ה בהצטיינות') &&
                testObj.status === 'לא נבחן' &&
                currentStage < 8
              ) {
                currentStage += 1;
              }

              return {
                ...instrument,
                currentStage,
                tests: {
                  ...tests,
                  [testType]: updatedTest,
                },
              };
            }
            return instrument;
          }
        );

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instrumentProgress: updatedInstruments,
          },
        };
      });
    },
    [updateFormData]
  );

  return {
    addInstrument,
    removeInstrument,
    setPrimaryInstrument,
    updateInstrumentProgress,
    updateInstrumentTest,

    // Helper methods to get information
    getAvailableInstruments: useCallback(() => {
      const usedInstrumentNames = instrumentProgress.map(
        (i) => i.instrumentName
      );
      return VALID_INSTRUMENTS.filter(
        (name) => !usedInstrumentNames.includes(name)
      );
    }, [instrumentProgress]),

    getPrimaryInstrument: useCallback(() => {
      return instrumentProgress.find((i) => i.isPrimary) || null;
    }, [instrumentProgress]),
  };
}
