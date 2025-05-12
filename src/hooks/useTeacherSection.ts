// src/hooks/useTeacherSection.ts
import { useCallback } from 'react';

interface TeacherAssignment {
  teacherId: string;
  day: string;
  time: string;
  duration: number | null | undefined;
}
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

      console.log('Adding teacher assignment:', assignment);

      updateFormData((prev) => {
        // Check if this assignment already exists
        const existingAssignment = prev.teacherAssignments.find(
          (a: TeacherAssignment) =>
            a.teacherId === assignment.teacherId &&
            a.day === assignment.day &&
            a.time === assignment.time
        );

        if (existingAssignment) {
          console.log('Assignment already exists, skipping:', assignment);
          return prev; // Skip if already exists
        }

        // Add new assignment
        const updatedAssignments = [...prev.teacherAssignments, assignment];

        // Make sure teacherIds contains unique teacher IDs from all assignments
        const uniqueTeacherIds = Array.from(
          new Set(
            [...prev.teacherIds, assignment.teacherId].filter(
              (id) => id !== undefined && id !== null && id !== ''
            )
          )
        );

        console.log('Updated teacher IDs:', uniqueTeacherIds);

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
      console.log('Removing teacher assignment:', { teacherId, day, time });

      updateFormData((prev) => {
        // Remove the specific assignment with matching teacherId, day and time
        const updatedAssignments = prev.teacherAssignments.filter(
          (a: TeacherAssignment) =>
            !(a.teacherId === teacherId && a.day === day && a.time === time)
        );

        // Get remaining assignments for this teacher
        const remainingTeacherAssignments = updatedAssignments.filter(
          (a: TeacherAssignment) => a.teacherId === teacherId
        );

        // Only remove teacherId if there are no more assignments for this teacher
        let updatedTeacherIds = [...prev.teacherIds];
        if (remainingTeacherAssignments.length === 0) {
          updatedTeacherIds = prev.teacherIds.filter((id) => id !== teacherId);
          console.log('Removed teacher ID as no more assignments:', teacherId);
        }

        return {
          ...prev,
          teacherAssignments: updatedAssignments,
          teacherIds: updatedTeacherIds,
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
