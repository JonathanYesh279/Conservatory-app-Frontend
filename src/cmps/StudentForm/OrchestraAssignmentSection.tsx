import { useOrchestraAssignmentSection } from '../../hooks/useOrchestraAssignmentSection';
import { StudentFormData } from '../../hooks/useStudentForm.tsx';
import { Music, X } from 'lucide-react';

interface OrchestraAssignmentSectionProps {
  formData: StudentFormData;
  addOrchestraAssignment: (orchestraId: string) => void;
  removeOrchestraAssignment: (orchestraId: string) => void;
  errors: Record<string, string>;
}

export function OrchestraAssignmentSection({
  formData,
  addOrchestraAssignment,
  removeOrchestraAssignment,
  errors,
}: OrchestraAssignmentSectionProps) {
  const {
    orchestras,
    isLoadingOrchestras,
    selectedOrchestraId,
    assignedOrchestras,
    handleOrchestraChange,
    handleRemoveOrchestraAssignment,
  } = useOrchestraAssignmentSection({
    formData,
    addOrchestraAssignment,
    removeOrchestraAssignment,
    errors,
  });

  return (
    <div className='form-section'>
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
                    <Music size={16} />
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
                  >
                    <X size={16} />
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
              disabled={isLoadingOrchestras}
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
