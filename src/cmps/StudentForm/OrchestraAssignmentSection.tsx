// src/cmps/StudentForm/OrchestraAssignmentSection.tsx
import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import { Music, Trash2 } from 'lucide-react';
import { StudentFormData } from '../../constants/formConstants';
import { useOrchestraStore } from '../../store/orchestraStore';

export function OrchestraAssignmentSection() {
  // Get Formik context for form operations
  const { values, setFieldValue, isSubmitting } = useFormikContext<StudentFormData>();
  
  // Get orchestras from store
  const { orchestras, loadOrchestras, isLoading: isLoadingOrchestras } = useOrchestraStore();
  
  // Local state for orchestra selection
  const [selectedOrchestraId, setSelectedOrchestraId] = useState('');
  
  // Load orchestras if needed
  useEffect(() => {
    loadOrchestras();
  }, [loadOrchestras]);
  
  // Get assigned orchestras details by ID
  const assignedOrchestras = values.orchestraAssignments.map((assignment) => {
    const orchestra = orchestras.find((o) => o._id === assignment.orchestraId);
    return {
      id: assignment.orchestraId,
      name: orchestra?.name || 'תזמורת לא ידועה',
      type: orchestra?.type || '',
    };
  });
  
  // Handle orchestra selection change
  const handleOrchestraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orchestraId = e.target.value;
    setSelectedOrchestraId(orchestraId);
    
    // If a valid orchestra is selected, add it to the assignments
    if (orchestraId) {
      // Check if this orchestra is already assigned
      const isAlreadyAssigned = values.orchestraAssignments.some(
        (a) => a.orchestraId === orchestraId
      );
      
      // Add the orchestra assignment if not already assigned
      if (!isAlreadyAssigned) {
        const updatedAssignments = [
          ...values.orchestraAssignments,
          { orchestraId },
        ];
        
        // Update Formik values
        setFieldValue('orchestraAssignments', updatedAssignments);
        
        // Update enrollments.orchestraIds to stay in sync
        setFieldValue('enrollments.orchestraIds', [
          ...values.enrollments.orchestraIds,
          orchestraId,
        ]);
        
        // Reset selection
        setSelectedOrchestraId('');
      }
    }
  };
  
  // Remove orchestra assignment
  const handleRemoveOrchestraAssignment = (orchestraId: string) => {
    // Remove from orchestraAssignments
    const updatedAssignments = values.orchestraAssignments.filter(
      (a) => a.orchestraId !== orchestraId
    );
    setFieldValue('orchestraAssignments', updatedAssignments);
    
    // Remove from enrollments.orchestraIds to stay in sync
    const updatedOrchestras = values.enrollments.orchestraIds.filter(
      (id) => id !== orchestraId
    );
    setFieldValue('enrollments.orchestraIds', updatedOrchestras);
  };

  return (
    <div className='form-section orchestra-assignment-section'>
      <h3>שיוך לתזמורת</h3>

      {/* Display current orchestra assignments if any */}
      {assignedOrchestras.length > 0 && (
        <div className='assigned-orchestras'>
          <h4>תזמורות משוייכות</h4>
          <div className='assignments-list'>
            {assignedOrchestras.map((orchestra) => (
              <div key={orchestra.id} className='assignment-card'>
                <div className='assignment-header'>
                  <div className='orchestra-name'>
                    <Music size={12} />
                    <span>{orchestra.name}</span>
                    {orchestra.type && (
                      <span className='orchestra-type'>{orchestra.type}</span>
                    )}
                  </div>
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() =>
                      handleRemoveOrchestraAssignment(orchestra.id)
                    }
                    aria-label='הסר תזמורת'
                    disabled={isSubmitting}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new orchestra assignment */}
      <div className='add-orchestra-section'>
        <h4>הוספת תזמורת</h4>

        {/* Orchestra Selection - automatically adds when changed */}
        <div className='form-row'>
          <div className='form-group'>
            <label htmlFor='orchestra'>בחר תזמורת</label>
            <select
              id='orchestra'
              name='orchestra'
              value={selectedOrchestraId}
              onChange={handleOrchestraChange}
              disabled={isLoadingOrchestras || isSubmitting}
            >
              <option value=''>בחר תזמורת</option>
              {orchestras.map((orchestra) => (
                <option key={orchestra._id} value={orchestra._id}>
                  {orchestra.name} ({orchestra.type})
                </option>
              ))}
            </select>
            {isLoadingOrchestras && (
              <div className='loading-indicator'>טוען תזמורות...</div>
            )}
          </div>
        </div>
        {/* No "Add Orchestra" button - adding happens directly on selection */}
      </div>
    </div>
  );
}