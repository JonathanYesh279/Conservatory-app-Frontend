import React, { useState, useEffect } from 'react';
import { ScheduleSlot } from '../../types/schedule';
import { useStudentSelectionForTeacher } from '../../hooks/useStudentSelectionForTeacher';
import { useStudentAssignment } from '../../hooks/useStudentAssignment';
import { useScheduleStore } from '../../store/scheduleStore';
import { formatTimeSlot } from '../../utils/scheduleUtils';
// import ScheduleConflictIndicator from './ScheduleConflictIndicator';

interface StudentAssignmentModalProps {
  slot: ScheduleSlot;
  teacherId: string;
  onAssign?: (slot: ScheduleSlot) => void;
  onRemove?: (slot: ScheduleSlot) => void;
  onClose: () => void;
}

const StudentAssignmentModal: React.FC<StudentAssignmentModalProps> = ({
  slot,
  teacherId,
  onAssign,
  onRemove,
  onClose
}) => {
  // Get student selection functionality
  const {
    students,
    selectedStudents,
    loadingStudents,
    showStudentSearch,
    searchQuery,
    setShowStudentSearch,
    handleStudentSearch,
    getFilteredStudents,
    handleAddStudent,
    handleRemoveStudent,
  } = useStudentSelectionForTeacher({
    initialStudentIds: [],
    onStudentIdsChange: () => {},
    onAddScheduleItem: () => {},
    onRemoveScheduleItem: () => {},
  });
  
  // Get student assignment functionality
  const {
    assignedStudent,
    isSlotAssigned,
    isAssigning,
    error,
    assignStudent,
    removeStudent,
    checkAssignmentConflicts,
    clearErrors
  } = useStudentAssignment({ selectedSlot: slot, teacherId });
  
  // Get student schedule state
  const { currentStudentSchedule, loadStudentSchedule, isLoadingStudentSchedule } = useScheduleStore();
  
  // Local state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Load student details if already assigned
  useEffect(() => {
    if (isSlotAssigned && assignedStudent && assignedStudent._id) {
      // Load student schedule for conflict checking
      loadStudentSchedule(assignedStudent._id);
      
      // Pre-select the assigned student
      // Pre-select the assigned student (using handleAddStudent)
      // handleAddStudent(assignedStudent);
    }
  }, [isSlotAssigned, assignedStudent, loadStudentSchedule, handleAddStudent]);
  
  // Check for conflicts when student selection changes
  useEffect(() => {
    if (selectedStudents.length > 0 && currentStudentSchedule) {
      const studentId = selectedStudents[0]._id;
      
      // Extract all slots from the student schedule
      const allSlots: ScheduleSlot[] = [];
      currentStudentSchedule.teacherSchedules.forEach(teacherSchedule => {
        allSlots.push(...teacherSchedule.slots);
      });
      
      // Check for conflicts
      const conflict = checkAssignmentConflicts(studentId, allSlots);
      setConflictWarning(conflict);
    } else {
      setConflictWarning(null);
    }
  }, [selectedStudents, currentStudentSchedule, checkAssignmentConflicts]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleStudentSearch(e.target.value);
  };
  
  // Handle searching for students
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the hook via searchQuery
  };
  
  // Handle student selection
  const handleSelectStudent = (studentId: string) => {
    // Find the student in the list
    const student = students.find(s => s._id === studentId);
    if (student) {
      // Clear any previous selections
      if (selectedStudents.length > 0) {
        handleRemoveStudent(selectedStudents[0]._id);
      }
      
      // Select the new student
      handleAddStudent(student);
      
      // Load student schedule for conflict checking
      loadStudentSchedule(student._id);
    }
  };
  

  // Handle assign button click
  const handleAssignClick = async () => {
    if (selectedStudents.length === 0) {
      return;
    }
    
    const studentId = selectedStudents[0]._id;
    
    try {
      const success = await assignStudent(studentId);
      
      if (success && onAssign) {
        // Call the callback with the updated slot
        const updatedSlot: ScheduleSlot = {
          ...slot,
          studentId,
          studentName: selectedStudents[0].personalInfo.fullName
        };
        onAssign(updatedSlot);
        onClose();
      }
    } catch (err) {
      console.error('Error assigning student:', err);
    }
  };
  
  // Handle remove button click
  const handleRemoveClick = async () => {
    if (!isSlotAssigned) {
      return;
    }
    
    setIsRemoving(true);
    
    try {
      const success = await removeStudent();
      
      if (success && onRemove) {
        // Call the callback with the updated slot
        const updatedSlot: ScheduleSlot = {
          ...slot,
          studentId: undefined,
          studentName: undefined
        };
        onRemove(updatedSlot);
        onClose();
      }
    } catch (err) {
      console.error('Error removing student:', err);
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <div className="student-assignment-modal">
      <div className="modal-header">
        <h2>{isSlotAssigned ? 'Update Student Assignment' : 'Assign Student'}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="modal-content">
        <div className="slot-info">
          <h3>Time Slot Details</h3>
          <p className="slot-time">{formatTimeSlot(slot)}</p>
          {slot.location && <p className="slot-location">Location: {slot.location}</p>}
          {slot.notes && <p className="slot-notes">Notes: {slot.notes}</p>}
        </div>
        
        {isSlotAssigned ? (
          <div className="assigned-student-section">
            <h3>Currently Assigned</h3>
            <div className="assigned-student">
              <p className="student-name">{slot.studentName}</p>
              <button 
                className="remove-button"
                onClick={handleRemoveClick}
                disabled={isRemoving}
              >
                {isRemoving ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        ) : (
          <div className="student-search-section">
            <h3>Assign a Student</h3>
            
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for students..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </form>
            
            {loadingStudents ? (
              <div className="loading">Loading students...</div>
            ) : getFilteredStudents().length === 0 ? (
              <div className="no-results">No students found</div>
            ) : (
              <div className="student-list">
                {getFilteredStudents().map(student => (
                  <div 
                    key={student._id} 
                    className={`student-item ${
                      selectedStudents.some(s => s._id === student._id) ? 'selected' : ''
                    }`}
                    onClick={() => handleSelectStudent(student._id)}
                  >
                    <span className="student-name">
                      {student.personalInfo.fullName}
                    </span>
                    {selectedStudents.some(s => s._id === student._id) && (
                      <span className="selected-indicator">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Show conflict warning if present */}
            {conflictWarning && (
              <div className="conflict-warning">
                <p className="warning-text">{conflictWarning}</p>
              </div>
            )}
            
            {/* Show error if present */}
            {error && (
              <div className="error-message">
                <p className="error-text">{error}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="assign-button"
                onClick={handleAssignClick}
                disabled={
                  selectedStudents.length === 0 || 
                  isAssigning || 
                  (conflictWarning !== null)
                }
              >
                {isAssigning ? 'Assigning...' : 'Assign Student'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentModal;