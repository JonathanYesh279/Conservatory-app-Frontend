// src/hooks/useStudentApiService.ts
import { useState } from 'react';
import { StudentFormData } from '../constants/formConstants';
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

      // Prepare student data for API (include teacherAssignments - backend now supports this field)
      const apiStudentData = {
        ...studentData,
        teacherIds: processedTeacherIds,
        teacherAssignments: formData.teacherAssignments || [],
        enrollments: {
          ...formData.enrollments,
          orchestraIds: formData.orchestraAssignments.map((a) => a.orchestraId),
        },
      } as any;
      
      console.log('API data being sent:', {
        teacherIds: apiStudentData.teacherIds,
        teacherAssignments: apiStudentData.teacherAssignments,
        teacherAssignmentsLength: formData.teacherAssignments.length,
        note: 'teacherAssignments included in API - backend now supports this field'
      });

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
