// src/hooks/useOrchestraAssignmentSection.ts
import { useState, useEffect, useCallback } from 'react';
import { StudentFormData } from './useStudentForm.tsx';
import { Orchestra, orchestraService } from '../services/orchestraService';

interface UseOrchestraAssignmentSectionProps {
  formData: StudentFormData;
  addOrchestraAssignment: (orchestraId: string) => void;
  removeOrchestraAssignment: (orchestraId: string) => void;
  errors: Record<string, string>;
}

export function useOrchestraAssignmentSection({
  formData,
  addOrchestraAssignment,
  removeOrchestraAssignment,
  errors,
}: UseOrchestraAssignmentSectionProps) {
  // State to track available orchestras
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [isLoadingOrchestras, setIsLoadingOrchestras] = useState(false);

  // Track currently selected orchestra for the UI
  const [selectedOrchestraId, setSelectedOrchestraId] = useState<string>('');

  // Load orchestras on component mount
  useEffect(() => {
    const fetchOrchestras = async () => {
      setIsLoadingOrchestras(true);
      try {
        const orchestraData = await orchestraService.getOrchestras({
          isActive: true,
        });
        setOrchestras(orchestraData);
      } catch (err) {
        console.error('Failed to fetch orchestras:', err);
      } finally {
        setIsLoadingOrchestras(false);
      }
    };

    fetchOrchestras();
  }, []);

  // Handle orchestra selection
  const handleOrchestraChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const orchestraId = e.target.value;
      setSelectedOrchestraId(orchestraId);
    },
    []
  );

  // Add currently selected orchestra to assignments
  const handleAddOrchestraAssignment = useCallback(() => {
    if (!selectedOrchestraId) return;

    addOrchestraAssignment(selectedOrchestraId);

    // Reset selection after adding
    setSelectedOrchestraId('');
  }, [selectedOrchestraId, addOrchestraAssignment]);

  // Handler to remove an orchestra assignment
  const handleRemoveOrchestraAssignment = useCallback(
    (orchestraId: string) => {
      removeOrchestraAssignment(orchestraId);
    },
    [removeOrchestraAssignment]
  );

  // Get orchestra name by ID
  const getOrchestraName = useCallback(
    (orchestraId: string) => {
      const orchestra = orchestras.find((o) => o._id === orchestraId);
      return orchestra
        ? `${orchestra.name} (${orchestra.type})`
        : 'תזמורת לא ידועה';
    },
    [orchestras]
  );

  // Get assigned orchestras with data
  const getAssignedOrchestras = useCallback(() => {
    return formData.orchestraAssignments.map((assignment) => {
      const orchestra = orchestras.find(
        (o) => o._id === assignment.orchestraId
      );
      return {
        id: assignment.orchestraId,
        name: orchestra?.name || 'תזמורת לא ידועה',
        type: orchestra?.type || '',
      };
    });
  }, [formData.orchestraAssignments, orchestras]);

  return {
    orchestras,
    isLoadingOrchestras,
    selectedOrchestraId,
    orchestraAssignments: formData.orchestraAssignments,
    assignedOrchestras: getAssignedOrchestras(),
    errors,

    handleOrchestraChange,
    handleAddOrchestraAssignment,
    handleRemoveOrchestraAssignment,
    getOrchestraName,
  };
}
