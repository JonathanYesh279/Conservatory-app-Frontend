// src/hooks/useInstrumentSection.ts
import { useCallback } from 'react';
import { InstrumentAssignment } from './useStudentForm';

interface UseInstrumentSectionProps {
  instruments: InstrumentAssignment[];
  updateFormData: (setter: (prev: any) => any) => void;
  clearError: (field: string) => void;
}

// Utility to generate unique IDs
const generateId = (): string => Math.random().toString(36).substring(2, 9);

export function useInstrumentSection({
  instruments,
  updateFormData,
  clearError,
}: UseInstrumentSectionProps) {
  // Add instrument
  const addInstrument = useCallback(
    (instrumentName: string) => {
      updateFormData((prev) => {
        // Check if instrument already exists
        const exists = prev.academicInfo.instruments.some(
          (i) => i.name === instrumentName
        );

        if (exists) return prev; // Already added

        const newInstrument = {
          id: generateId(),
          name: instrumentName,
          isPrimary: prev.academicInfo.instruments.length === 0, // Set as primary if it's the first instrument
        };

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instruments: [...prev.academicInfo.instruments, newInstrument],
          },
        };
      });

      // Clear error if exists
      clearError('academicInfo.instruments');
    },
    [updateFormData, clearError]
  );

  // Remove instrument
  const removeInstrument = useCallback(
    (instrumentId: string) => {
      updateFormData((prev) => {
        // Don't allow removing the last instrument
        if (prev.academicInfo.instruments.length <= 1) {
          return prev;
        }

        const updatedInstruments = prev.academicInfo.instruments.filter(
          (i) => i.id !== instrumentId
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
            instruments: finalInstruments,
          },
        };
      });
    },
    [updateFormData]
  );

  // Set primary instrument
  const setPrimaryInstrument = useCallback(
    (instrumentId: string) => {
      updateFormData((prev) => {
        const updatedInstruments = prev.academicInfo.instruments.map(
          (instrument) => ({
            ...instrument,
            isPrimary: instrument.id === instrumentId,
          })
        );

        return {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            instruments: updatedInstruments,
          },
        };
      });
    },
    [updateFormData]
  );

  // Check if instrument is primary
  const isPrimaryInstrument = useCallback(
    (instrumentId: string) => {
      return instruments.some((i) => i.id === instrumentId && i.isPrimary);
    },
    [instruments]
  );

  return {
    addInstrument,
    removeInstrument,
    setPrimaryInstrument,
    isPrimaryInstrument,
  };
}
