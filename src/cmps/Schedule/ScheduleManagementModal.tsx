import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { ScheduleSlot } from '../../services/scheduleService';
import { WeeklyScheduleView } from './index';
import CreateTimeSlotForm from './CreateTimeSlotForm';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [selectedDayForNewSlot, setSelectedDayForNewSlot] = useState<number | null>(null);
  
  // Handle slot selection
  const handleSlotSelect = (slot: ScheduleSlot) => {
    selectSlot(slot);
  };
  
  // Handle slot editing
  const handleSlotEdit = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setShowCreateForm(true);
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
  
  // Handle adding a new slot
  const handleAddSlot = (dayOfWeek: number) => {
    setSelectedDayForNewSlot(dayOfWeek);
    setEditingSlot(null);
    setShowCreateForm(true);
  };
  
  // Handle form submission
  const handleFormSubmit = (slot: ScheduleSlot) => {
    setShowCreateForm(false);
    
    // Call the callback if provided
    if (onScheduleChange) {
      onScheduleChange();
    }
  };
  
  // Handle student assignment completion
  const handleStudentAssigned = (slot: ScheduleSlot) => {
    setShowAssignModal(false);
    
    // Call the callback if provided
    if (onScheduleChange) {
      onScheduleChange();
    }
  };
  
  // Render create/edit form
  const renderCreateForm = () => {
    if (!showCreateForm) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <CreateTimeSlotForm
            teacherId={teacherId}
            initialSlot={editingSlot || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      </div>
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
            <span>הוספת שעת לימוד חדשה</span>
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
      {renderCreateForm()}
      {renderAssignModal()}
    </div>
  );
};

export default ScheduleManagementModal;