// src/hooks/useTeacherSection.ts
import { useCallback } from 'react';
import { TeacherAssignment } from './useStudentForm';

interface UseTeacherSectionProps {
  updateFormData: (setter: (prev: any) => any) => void;
}

export function useTeacherSection({ updateFormData }: UseTeacherSectionProps) {
  // Add teacher assignment
  const addTeacherAssignment = useCallback(
    (assignment: TeacherAssignment) => {
      // Validate that all required fields are present
      if (
        !assignment.teacherId ||
        !assignment.day ||
        !assignment.time ||
        assignment.duration === undefined ||
        assignment.duration === null
      ) {
        console.error('Invalid teacher assignment data:', assignment);
        return; // Don't add invalid assignments
      }

      updateFormData((prev) => {
        // Add new assignment
        const updatedAssignments = [...prev.teacherAssignments, assignment];

        // Make sure teacherIds contains unique teacher IDs from all assignments
        const uniqueTeacherIds = Array.from(
          new Set(updatedAssignments.map((a) => a.teacherId))
        );

        return {
          ...prev,
          teacherAssignments: updatedAssignments,
          teacherIds: uniqueTeacherIds,
        };
      });
    },
    [updateFormData]
  );

  // Remove teacher assignment
  const removeTeacherAssignment = useCallback(
    (teacherId: string, day: string, time: string) => {
      updateFormData((prev) => {
        // Remove the specific assignment with matching teacherId, day and time
        const updatedAssignments = prev.teacherAssignments.filter(
          (a) =>
            !(a.teacherId === teacherId && a.day === day && a.time === time)
        );

        // Get unique teacher IDs from remaining assignments
        const remainingTeacherIds = Array.from(
          new Set(updatedAssignments.map((a) => a.teacherId))
        );

        return {
          ...prev,
          teacherAssignments: updatedAssignments,
          teacherIds: remainingTeacherIds,
        };
      });
    },
    [updateFormData]
  );

  return {
    addTeacherAssignment,
    removeTeacherAssignment,
  };
}
