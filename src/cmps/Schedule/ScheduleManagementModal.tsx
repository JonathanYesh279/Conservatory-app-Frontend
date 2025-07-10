import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { ScheduleSlot, NUMERIC_TO_HEBREW_DAYS } from '../../types/schedule';
import { WeeklyScheduleView } from './index';
import TimeBlockCreator from '../TimeBlock/TimeBlockCreator';
import StudentAssignmentModal from './StudentAssignmentModal';
import { useScheduleManagement } from '../../hooks/useScheduleManagement';

interface ScheduleManagementModalProps {
  teacherId: string;
  onClose: () => void;
  onScheduleChange?: () => void;
}

const ScheduleManagementModal: React.FC<ScheduleManagementModalProps> = ({
  teacherId,
  onClose,
  onScheduleChange
}) => {
  // Get schedule management functionality
  const {
    weeklySchedule,
    selectedSlot,
    isLoading,
    error,
    selectSlot
  } = useScheduleManagement({
    teacherId,
    autoLoad: true
  });
  
  // Local state
  const [showTimeBlockCreator, setShowTimeBlockCreator] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDayForNewSlot, setSelectedDayForNewSlot] = useState<number | null>(null);
  
  // Handle slot selection
  const handleSlotSelect = (slot: ScheduleSlot) => {
    selectSlot(slot);
  };
  
  // Handle slot editing (placeholder - not used with time blocks)
  const handleSlotEdit = (slot: ScheduleSlot) => {
    console.log('Slot editing not available with time block system:', slot);
  };
  
  // Handle student assignment
  const handleAssignStudent = (slot: ScheduleSlot) => {
    selectSlot(slot);
    setShowAssignModal(true);
  };
  
  // Handle student removal
  const handleRemoveStudent = (slot: ScheduleSlot) => {
    selectSlot(slot);
    setShowAssignModal(true);
  };
  
  // Handle adding a new time block
  const handleAddSlot = (dayOfWeek: number) => {
    setSelectedDayForNewSlot(dayOfWeek);
    setShowTimeBlockCreator(true);
  };

  // Handle time block creation
  const handleTimeBlockCreated = () => {
    setShowTimeBlockCreator(false);
    
    // Call the callback if provided
    if (onScheduleChange) {
      onScheduleChange();
    }
  };
  
  // Handle student assignment completion
  const handleStudentAssigned = () => {
    setShowAssignModal(false);
    
    // Call the callback if provided
    if (onScheduleChange) {
      onScheduleChange();
    }
  };
  

  // Render time block creator (new system)
  const renderTimeBlockCreator = () => {
    if (!showTimeBlockCreator) return null;
    
    const initialDay = selectedDayForNewSlot !== null && selectedDayForNewSlot !== 6 
      ? NUMERIC_TO_HEBREW_DAYS[selectedDayForNewSlot] 
      : undefined; // Skip Saturday (6) as it's not supported by time blocks
    
    return (
      <TimeBlockCreator
        teacherId={teacherId}
        initialData={{
          day: initialDay,
          startTime: '14:00',
          endTime: '18:00',
          isRecurring: false,
          recurringDays: []
        }}
        onBlockCreated={handleTimeBlockCreated}
        onCancel={() => setShowTimeBlockCreator(false)}
        isOpen={showTimeBlockCreator}
      />
    );
  };
  
  // Render student assignment modal
  const renderAssignModal = () => {
    if (!showAssignModal || !selectedSlot) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <StudentAssignmentModal
            slot={selectedSlot}
            teacherId={teacherId}
            onAssign={handleStudentAssigned}
            onRemove={handleStudentAssigned}
            onClose={() => setShowAssignModal(false)}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="schedule-management-modal">
      <div className="modal-header">
        <h2>ניהול שעות הוראה</h2>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="modal-body">
        <div className="schedule-actions">
          <button
            className="add-time-slot-button"
            onClick={() => handleAddSlot(new Date().getDay())}
          >
            <Plus size={16} />
            <span>הוספת יום לימוד חדש</span>
          </button>
        </div>
        
        <div className="schedule-container">
          <WeeklyScheduleView
            teacherId={teacherId}
            onSlotSelect={handleSlotSelect}
            onSlotEdit={handleSlotEdit}
            onAssignStudent={handleAssignStudent}
            onRemoveStudent={handleRemoveStudent}
            onAddSlot={handleAddSlot}
          />
        </div>
      </div>
      
      {/* Render modals */}
      {renderTimeBlockCreator()}
      {renderAssignModal()}
    </div>
  );
};

export default ScheduleManagementModal;