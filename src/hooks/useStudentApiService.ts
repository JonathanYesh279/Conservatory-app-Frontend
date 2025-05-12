// src/hooks/useStudentApiService.ts
import { useState } from 'react';
import { StudentFormData } from './useStudentForm';
import { studentService } from '../services/studentService';

interface UseStudentApiServiceProps {
  onError?: (error: Error) => void;
}

export const useStudentApiService = ({
  onError,
}: UseStudentApiServiceProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveStudentData = async (data: {
    studentId?: string;
    formData: StudentFormData;
    hasTeacherAssignments?: boolean;
    teacherAssignments?: any[];
    teacherIds?: string[];
  }) => {
    const {
      studentId,
      formData,
      hasTeacherAssignments = false,
      teacherAssignments = [],
      teacherIds = [],
    } = data;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting saveStudentData with:', {
        studentId,
        hasTeacherAssignments,
        teacherAssignments: Array.isArray(teacherAssignments)
          ? teacherAssignments.length
          : 0,
        teacherIds: Array.isArray(teacherIds) ? teacherIds : [],
      });

      // Process teacherIds to ensure it's an array with unique values
      const processedTeacherIds = Array.isArray(teacherIds)
        ? [...new Set(teacherIds.filter(Boolean))] // Remove duplicates and null/undefined
        : [];

      console.log('TeacherIds after processing:', processedTeacherIds);

      // Prepare student data for API
      const studentData = {
        personalInfo: formData.personalInfo || {},
        academicInfo: formData.academicInfo || {},
        teacherIds: processedTeacherIds,
        // Add any other fields needed for the API
        enrollments: formData.enrollments || {},
      };

      // Create or update student based on whether we have an ID
      let savedStudent;
      if (studentId) {
        console.log(`UPDATING existing student with ID: ${studentId}`);
        // Update existing student
        savedStudent = await studentService.updateStudent(
          studentId,
          studentData
        );
      } else {
        console.log('Creating NEW student');
        // Create new student
        savedStudent = await studentService.addStudent(studentData);
      }

      console.log(
        `${studentId ? 'Updated' : 'New'} student ${
          savedStudent._id
        } created successfully:`,
        savedStudent
      );

      setIsLoading(false);
      return savedStudent;
    } catch (err) {
      console.error('Error saving student data:', err);
      const error =
        err instanceof Error ? err : new Error('Failed to save student data');

      setError(error);
      setIsLoading(false);

      if (onError) {
        onError(error);
      }

      throw error;
    }
  };

  return {
    isLoading,
    error,
    saveStudentData,
  };
};
