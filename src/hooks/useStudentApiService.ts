// src/hooks/useStudentApiService.ts
import { useState } from 'react';
import { StudentFormData, TeacherAssignment } from '../constants/formConstants';
import { Teacher } from '../services/teacherService';
import { studentService, Student } from '../services/studentService';
import { useToast } from '../cmps/Toast';

interface UseStudentApiServiceProps {
  onClose?: () => void;
  onStudentCreated?: (student: any) => void;
  onError?: (error: Error) => void;
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

// Define a response type that might include success/message
interface ScheduleUpdateResponse extends Teacher {
  success?: boolean;
  message?: string;
}

export const useStudentApiService = ({
  onClose,
  onStudentCreated,
  onError,
}: UseStudentApiServiceProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useToast();
  const [lastSavedStudent, setLastSavedStudent] = useState<Student | null>(null);

  const saveStudentData = async (
    studentData: Partial<any>,
    formData: StudentFormData
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting saveStudentData with:', {
        studentId: studentData._id,
        teacherAssignments: formData.teacherAssignments.length,
        teacherIds: formData.teacherIds,
      });

      // Process teacherIds to ensure it's an array with unique values
      const processedTeacherIds = Array.isArray(formData.teacherIds)
        ? [...new Set(formData.teacherIds.filter(Boolean))] // Remove duplicates and null/undefined
        : [];

      console.log('TeacherIds after processing:', processedTeacherIds);

      // Prepare student data for API
      const apiStudentData = {
        ...studentData,
        teacherIds: processedTeacherIds,
        enrollments: {
          ...formData.enrollments,
          orchestraIds: formData.orchestraAssignments.map((a) => a.orchestraId),
        },
      };

      // Create or update student based on whether we have an ID
      let savedStudent;
      if (studentData._id) {
        console.log(`UPDATING existing student with ID: ${studentData._id}`);
        savedStudent = await studentService.updateStudent(
          studentData._id,
          apiStudentData
        );
      } else {
        console.log('Creating NEW student');
        savedStudent = await studentService.addStudent(apiStudentData);
      }

      console.log(
        `${studentData._id ? 'Updated' : 'New'} student ${
          savedStudent._id
        } created successfully:`,
        savedStudent
      );

      // Update teacher schedules - but don't let failures here fail the entire operation
      if (formData.teacherAssignments.length > 0) {
        try {
          await updateTeacherSchedules(
            formData.teacherAssignments,
            savedStudent._id
          );
        } catch (scheduleErr) {
          console.error(
            'Error updating teacher schedules, but student was saved:',
            scheduleErr
          );
          // Don't throw error here, we still want to consider the student creation successful
        }
      }

      // Store the saved student for potential undo operations
      setLastSavedStudent(savedStudent);

      // Notify parent component
      if (onStudentCreated) {
        onStudentCreated(savedStudent);
      }

      // Close the form
      if (onClose) {
        onClose();
      }

      // Show success toast with undo option
      const toastMessage = studentData._id 
        ? `התלמיד ${savedStudent.personalInfo?.fullName} עודכן בהצלחה` 
        : `התלמיד ${savedStudent.personalInfo?.fullName} נוסף בהצלחה`;
      
      addToast({
        type: 'success',
        message: toastMessage,
        onUndo: studentData._id ? undefined : () => handleUndoStudentCreation(savedStudent._id),
      });

      setIsSubmitting(false);
      return savedStudent;
    } catch (err) {
      console.error('Error saving student data:', err);
      const errorObj =
        err instanceof Error ? err : new Error('Failed to save student data');

      setError(errorObj);
      setIsSubmitting(false);

      if (onError) {
        onError(errorObj);
      }

      throw errorObj;
    }
  };

  // Helper function to update teacher schedules
  const updateTeacherSchedules = async (
    teacherAssignments: TeacherAssignment[],
    studentId: string
  ) => {
    console.log(
      `Updating teacher schedules for student ${studentId} with ${teacherAssignments.length} assignments`
    );

    // Process each assignment sequentially to avoid race conditions
    for (const assignment of teacherAssignments) {
      if (!assignment.teacherId || assignment.teacherId === 'new-teacher') {
        console.log('Skipping assignment with invalid teacherId:', assignment);
        continue;
      }

      try {
        const scheduleData = {
          studentId,
          day: assignment.day,
          time: assignment.time,
          duration: assignment.duration,
          isActive: true,
        };

        console.log(
          `Updating schedule for teacher ${assignment.teacherId}:`,
          scheduleData
        );

        // Cast the result to our extended interface that might have success/message
        const result = (await studentService.updateTeacherSchedule(
          assignment.teacherId,
          scheduleData
        )) as ScheduleUpdateResponse;

        // Use optional chaining and type guards to safely check properties
        if (result && 'success' in result && result.success === false) {
          console.warn(
            `Schedule update had issues for teacher ${assignment.teacherId}:`,
            result.message || 'Unknown error'
          );
        } else {
          console.log(
            `Successfully updated schedule for teacher ${assignment.teacherId}`
          );
        }
      } catch (scheduleErr) {
        console.error(
          `Error updating schedule for teacher ${assignment.teacherId}:`,
          scheduleErr
        );
        // Continue with other updates even if one fails
      }
    }

    console.log(`Completed teacher schedule updates for student ${studentId}`);
  };

  // Handle undoing student creation (removal)
  const handleUndoStudentCreation = async (studentId: string) => {
    if (!studentId) return;
    
    try {
      // Remove the student
      await studentService.removeStudent(studentId);
      
      // Show a toast notification about the successful undo
      addToast({
        type: 'info',
        message: 'הוספת התלמיד בוטלה בהצלחה',
      });
      
      // Reset the lastSavedStudent state
      setLastSavedStudent(null);
    } catch (err) {
      console.error('Error undoing student creation:', err);
      
      // Show error toast
      addToast({
        type: 'danger',
        message: 'אירעה שגיאה בעת ביטול הוספת התלמיד',
      });
    }
  };

  return {
    isSubmitting,
    error,
    saveStudentData,
    lastSavedStudent,
  };
};
