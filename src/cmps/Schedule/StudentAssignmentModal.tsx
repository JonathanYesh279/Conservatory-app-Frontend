import React, { useState, useEffect } from 'react';
import { ScheduleSlot } from '../../services/scheduleService';
import { useStudentSelectionForTeacher } from '../../hooks/useStudentSelectionForTeacher';
import { useStudentAssignment } from '../../hooks/useStudentAssignment';
import { useScheduleStore } from '../../store/scheduleStore';
import { formatTimeSlot } from '../../utils/scheduleUtils';
import ScheduleConflictIndicator from './ScheduleConflictIndicator';

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
    searchStudents,
    searchQuery,
    setSearchQuery,
    selectStudent,
    deselectStudent,
    isLoading: isLoadingStudents
  } = useStudentSelectionForTeacher({ teacherId, maxSelected: 1 });
  
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
    if (isSlotAssigned && assignedStudent) {
      // Load student schedule for conflict checking
      loadStudentSchedule(assignedStudent.id);
      
      // Pre-select the assigned student
      selectStudent({
        id: assignedStudent.id,
        firstName: assignedStudent.firstName,
        lastName: assignedStudent.lastName,
        fullName: `${assignedStudent.firstName} ${assignedStudent.lastName}`
      });
    }
  }, [isSlotAssigned, assignedStudent, loadStudentSchedule, selectStudent]);
  
  // Check for conflicts when student selection changes
  useEffect(() => {
    if (selectedStudents.length > 0 && currentStudentSchedule) {
      const studentId = selectedStudents[0].id;
      
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
    setSearchQuery(e.target.value);
  };
  
  // Handle searching for students
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents();
  };
  
  // Handle student selection
  const handleSelectStudent = (studentId: string) => {
    // Find the student in the list
    const student = students.find(s => s.id === studentId);
    if (student) {
      // Clear any previous selections
      if (selectedStudents.length > 0) {
        deselectStudent(selectedStudents[0].id);
      }
      
      // Select the new student
      selectStudent(student);
      
      // Load student schedule for conflict checking
      loadStudentSchedule(student.id);
    }
  };
  
  // Handle assign button click
  const handleAssignClick = async () => {
    if (selectedStudents.length === 0) {
      return;
    }
    
    const studentId = selectedStudents[0].id;
    
    try {
      const success = await assignStudent(studentId);
      
      if (success && onAssign) {
        // Call the callback with the updated slot
        const updatedSlot: ScheduleSlot = {
          ...slot,
          studentId,
          studentName: `${selectedStudents[0].firstName} ${selectedStudents[0].lastName}`
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
            
            {isLoadingStudents ? (
              <div className="loading">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="no-results">No students found</div>
            ) : (
              <div className="student-list">
                {students.map(student => (
                  <div 
                    key={student.id} 
                    className={`student-item ${
                      selectedStudents.some(s => s.id === student.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleSelectStudent(student.id)}
                  >
                    <span className="student-name">
                      {student.firstName} {student.lastName}
                    </span>
                    {selectedStudents.some(s => s.id === student.id) && (
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