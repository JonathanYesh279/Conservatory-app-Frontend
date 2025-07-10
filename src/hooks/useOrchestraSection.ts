// src/hooks/useOrchestraSection.ts
import { useCallback } from 'react';

// Define interfaces for the orchestra-related data
interface OrchestraAssignment {
  orchestraId: string;
  // Add other properties if needed
}

interface UseOrchestraSectionProps {
  updateFormData: (setter: (prev: any) => any) => void;
}

export function useOrchestraSection({
  updateFormData,
}: UseOrchestraSectionProps) {
  // Add orchestra assignment
  const addOrchestraAssignment = useCallback(
    (orchestraId: string) => {
      updateFormData((prev) => {
        // Check if orchestra already exists
        const exists = prev.orchestraAssignments.some(
          (a: OrchestraAssignment) => a.orchestraId === orchestraId
        );

        if (exists) return prev; // Already assigned

        return {
          ...prev,
          orchestraAssignments: [...prev.orchestraAssignments, { orchestraId }],
          enrollments: {
            ...prev.enrollments,
            orchestraIds: Array.from(
              new Set([...prev.enrollments.orchestraIds, orchestraId])
            ),
          },
        };
      });
    },
    [updateFormData]
  );

  // Remove orchestra assignment
  const removeOrchestraAssignment = useCallback(
    (orchestraId: string) => {
      updateFormData((prev) => {
        const updatedAssignments = prev.orchestraAssignments.filter(
          (a: OrchestraAssignment) => a.orchestraId !== orchestraId
        );

        // Also remove from orchestraIds in enrollments
        const updatedOrchestraIds = prev.enrollments.orchestraIds.filter(
          (id: string) => id !== orchestraId
        );

        return {
          ...prev,
          orchestraAssignments: updatedAssignments,
          enrollments: {
            ...prev.enrollments,
            orchestraIds: updatedOrchestraIds,
          },
        };
      });
    },
    [updateFormData]
  );

  return {
    addOrchestraAssignment,
    removeOrchestraAssignment,
  };
}
