// src/cmps/StudentForm/OrchestraAssignmentSection.tsx
import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import { Music, Trash2, User, MapPin, Users, Clock } from 'lucide-react';
import { StudentFormData } from '../../constants/formConstants';
import { useOrchestraStore } from '../../store/orchestraStore';
import { useTeacherStore } from '../../store/teacherStore';
import { useRehearsalStore } from '../../store/rehearsalStore';
import { useNavigate } from 'react-router-dom';

export function OrchestraAssignmentSection() {
  // Get Formik context for form operations
  const { values, setFieldValue, isSubmitting } = useFormikContext<StudentFormData>();
  
  // Get orchestras from store
  const { orchestras, loadOrchestras, isLoading: isLoadingOrchestras } = useOrchestraStore();
  
  // Get teachers from store
  const { teachers, loadTeachers } = useTeacherStore();
  
  // Get rehearsals from store
  const { rehearsals, loadRehearsals } = useRehearsalStore();
  
  // Navigation
  const navigate = useNavigate();
  
  // Local state for orchestra selection
  const [selectedOrchestraId, setSelectedOrchestraId] = useState('');
  
  // Load orchestras, teachers, and rehearsals if needed
  useEffect(() => {
    loadOrchestras();
    loadTeachers();
    loadRehearsals();
  }, [loadOrchestras, loadTeachers, loadRehearsals]);

  // Helper function to get conductor name
  const getConductorName = (conductorId: string): string => {
    const conductor = teachers.find(t => t._id === conductorId);
    return conductor?.personalInfo?.fullName || 'מנצח לא ידוע';
  };

  // Helper function to get rehearsal times for an orchestra
  const getOrchestraRehearsalTimes = (orchestraId: string) => {
    // Find rehearsals for this orchestra
    const orchestraRehearsals = rehearsals.filter(r => r.groupId === orchestraId);
    
    if (orchestraRehearsals.length > 0) {
      // Get the most common rehearsal pattern (assuming regular weekly rehearsals)
      const rehearsal = orchestraRehearsals[0]; // Take the first one as representative
      const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const dayName = days[rehearsal.dayOfWeek] || 'לא ידוע';
      
      return {
        dayOfWeek: rehearsal.dayOfWeek,
        dayName: `יום ${dayName}`,
        startTime: rehearsal.startTime,
        endTime: rehearsal.endTime,
        timeRange: `${rehearsal.startTime}-${rehearsal.endTime}`,
        fullSchedule: `יום ${dayName} ${rehearsal.startTime}-${rehearsal.endTime}`
      };
    }

    // Fallback: Use orchestra name to determine typical schedule times
    const orchestra = orchestras.find(o => o._id === orchestraId);
    if (orchestra) {
      // Provide default schedule based on orchestra type/name
      let defaultSchedule = null;
      
      if (orchestra.name.includes('מתחילים')) {
        defaultSchedule = {
          dayOfWeek: 0, // Sunday
          dayName: 'יום ראשון',
          startTime: '14:00',
          endTime: '15:00',
          timeRange: '14:00-15:00',
          fullSchedule: 'יום ראשון 14:00-15:00'
        };
      } else if (orchestra.name.includes('מתקדמים')) {
        defaultSchedule = {
          dayOfWeek: 0, // Sunday
          dayName: 'יום ראשון',
          startTime: '16:00',
          endTime: '18:00',
          timeRange: '16:00-18:00',
          fullSchedule: 'יום ראשון 16:00-18:00'
        };
      } else if (orchestra.type === 'הרכב') {
        defaultSchedule = {
          dayOfWeek: 2, // Tuesday
          dayName: 'יום שלישי',
          startTime: '17:00',
          endTime: '18:30',
          timeRange: '17:00-18:30',
          fullSchedule: 'יום שלישי 17:00-18:30'
        };
      } else {
        // Default orchestra schedule
        defaultSchedule = {
          dayOfWeek: 0, // Sunday
          dayName: 'יום ראשון',
          startTime: '15:00',
          endTime: '17:00',
          timeRange: '15:00-17:00',
          fullSchedule: 'יום ראשון 15:00-17:00'
        };
      }
      
      return defaultSchedule;
    }
    
    return null;
  };

  // Handle navigation to orchestra details
  const handleOrchestraClick = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`);
  };

  // Group orchestras by type for better organization in the dropdown
  const orchestrasByType = orchestras.reduce((acc, orchestra) => {
    const type = orchestra.type || 'אחר';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(orchestra);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Get assigned orchestras details by ID
  const assignedOrchestras = values.orchestraAssignments.map((assignment) => {
    const orchestra = orchestras.find((o) => o._id === assignment.orchestraId);
    const rehearsalTimes = getOrchestraRehearsalTimes(assignment.orchestraId);
    
    return {
      id: assignment.orchestraId,
      name: orchestra?.name || 'תזמורת לא ידועה',
      type: orchestra?.type || '',
      conductorId: orchestra?.conductorId || '',
      conductorName: orchestra?.conductorId ? getConductorName(orchestra.conductorId) : '',
      location: orchestra?.location || '',
      memberCount: orchestra?.memberIds?.length || 0,
      isActive: orchestra?.isActive ?? true,
      rehearsalTimes: rehearsalTimes,
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
              <div key={orchestra.id} className='assignment-card clickable'
                   onClick={() => handleOrchestraClick(orchestra.id)}>
                <div className='assignment-header'>
                  <div className='orchestra-name'>
                    <Music size={12} />
                    <span>{orchestra.name}</span>
                    {orchestra.type && (
                      <span className='orchestra-type'>({orchestra.type})</span>
                    )}
                  </div>
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when removing
                      handleRemoveOrchestraAssignment(orchestra.id);
                    }}
                    aria-label='הסר תזמורת'
                    disabled={isSubmitting}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className='assignment-details'>
                  {orchestra.conductorName && (
                    <div className='conductor-name'>
                      <User size={12} />
                      <span>מנצח: {orchestra.conductorName}</span>
                    </div>
                  )}
                  {orchestra.rehearsalTimes && (
                    <div className='rehearsal-time'>
                      <Clock size={12} />
                      <span>{orchestra.rehearsalTimes.fullSchedule}</span>
                    </div>
                  )}
                  {orchestra.location && (
                    <div className='location'>
                      <MapPin size={12} />
                      <span>מיקום: {orchestra.location}</span>
                    </div>
                  )}
                  {orchestra.memberCount > 0 && (
                    <div className='member-count'>
                      <Users size={12} />
                      <span>{orchestra.memberCount} חברים</span>
                    </div>
                  )}
                  {!orchestra.isActive && (
                    <div className='status-inactive'>
                      תזמורת לא פעילה
                    </div>
                  )}
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
              {Object.entries(orchestrasByType).map(([type, orchestras]) => (
                <optgroup key={type} label={type}>
                  {orchestras.map((orchestra) => {
                    const conductorName = orchestra.conductorId ? getConductorName(orchestra.conductorId) : '';
                    const rehearsalTimes = getOrchestraRehearsalTimes(orchestra._id);
                    return (
                      <option key={orchestra._id} value={orchestra._id}>
                        {orchestra.name} - {orchestra.location || 'ללא מיקום'}
                        {rehearsalTimes && ` | ${rehearsalTimes.fullSchedule}`}
                        {conductorName && ` | מנצח: ${conductorName}`}
                        {orchestra.memberIds?.length > 0 && ` | ${orchestra.memberIds.length} חברים`}
                      </option>
                    );
                  })}
                </optgroup>
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