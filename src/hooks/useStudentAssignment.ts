import { useState, useEffect, useCallback } from 'react';
import { ScheduleSlot, AssignStudentRequest as AssignStudentData } from '../types/schedule';
import { Student } from '../types/student';
import { useScheduleStore } from '../store/scheduleStore';
import { validateStudentAssignment } from '../utils/scheduleValidation';

interface UseStudentAssignmentProps {
  selectedSlot?: ScheduleSlot | null;
  teacherId?: string;
}

interface UseStudentAssignmentReturn {
  // Data
  assignedStudent: Student | null;
  isSlotAssigned: boolean;
  
  // UI State
  isLoading: boolean;
  isAssigning: boolean;
  error: string | null;
  
  // Actions
  assignStudent: (studentId: string) => Promise<boolean>;
  removeStudent: () => Promise<boolean>;
  checkAssignmentConflicts: (studentId: string, studentSchedule: ScheduleSlot[]) => string | null;
  clearErrors: () => void;
}

/**
 * Hook for managing student assignments to schedule slots
 */
const useStudentAssignment = ({
  selectedSlot = null,
  teacherId
}: UseStudentAssignmentProps = {}): UseStudentAssignmentReturn => {
  // Get store state and actions
  const {
    isAssigningStudent,
    error,
    assignStudent: storeAssignStudent,
    removeStudent: storeRemoveStudent,
    clearErrors: storeClearErrors,
    loadTeacherSchedule
  } = useScheduleStore();
  
  // Local state for assigned student info
  const [assignedStudent, setAssignedStudent] = useState<Student | null>(null);
  
  // Effect to update assigned student when selected slot changes
  useEffect(() => {
    if (selectedSlot?.studentId) {
      // In a real implementation, you would fetch the student details
      // For now, we'll create a simplified student object
      setAssignedStudent({
        _id: selectedSlot.studentId,
        personalInfo: {
          fullName: selectedSlot.studentName || '',
        },
        academicInfo: {
          instrumentProgress: [],
          class: ''
        },
        enrollments: {
          orchestraIds: [],
          ensembleIds: [],
          schoolYears: []
        },
        teacherIds: [],
        isActive: true,
        createdAt: '',
        updatedAt: ''
      } as any);
    } else {
      setAssignedStudent(null);
    }
  }, [selectedSlot]);
  
  // Check if the selected slot has a student assigned
  const isSlotAssigned = Boolean(selectedSlot?.studentId);
  
  // Assign a student to the selected slot
  const assignStudent = useCallback(
    async (studentId: string): Promise<boolean> => {
      if (!selectedSlot) {
        console.error('No slot selected for assignment');
        return false;
      }
      
      const assignmentData: AssignStudentData = {
        scheduleSlotId: selectedSlot.id,
        studentId
      };
      
      const result = await storeAssignStudent(assignmentData);
      
      // Reload the teacher schedule to get updated data
      if (result && teacherId) {
        await loadTeacherSchedule(teacherId);
      }
      
      return Boolean(result);
    },
    [selectedSlot, storeAssignStudent, teacherId, loadTeacherSchedule]
  );
  
  // Remove a student from the selected slot
  const removeStudent = useCallback(
    async (): Promise<boolean> => {
      if (!selectedSlot) {
        console.error('No slot selected for removal');
        return false;
      }
      
      if (!selectedSlot.studentId) {
        console.error('No student assigned to the selected slot');
        return false;
      }
      
      const result = await storeRemoveStudent(selectedSlot.id);
      
      // Reload the teacher schedule to get updated data
      if (result && teacherId) {
        await loadTeacherSchedule(teacherId);
      }
      
      return Boolean(result);
    },
    [selectedSlot, storeRemoveStudent, teacherId, loadTeacherSchedule]
  );
  
  // Check for conflicts with student's existing schedule
  const checkAssignmentConflicts = useCallback(
    (studentId: string, studentSchedule: ScheduleSlot[]): string | null => {
      if (!selectedSlot) {
        return 'No slot selected for assignment';
      }
      
      return validateStudentAssignment(
        selectedSlot.id,
        studentId,
        selectedSlot,
        studentSchedule
      );
    },
    [selectedSlot]
  );
  
  // Clear errors
  const clearErrors = useCallback(() => {
    storeClearErrors();
  }, [storeClearErrors]);
  
  return {
    assignedStudent,
    isSlotAssigned,
    isLoading: false, // This would be true when loading student data
    isAssigning: isAssigningStudent,
    error,
    assignStudent,
    removeStudent,
    checkAssignmentConflicts,
    clearErrors
  };
};

export { useStudentAssignment };