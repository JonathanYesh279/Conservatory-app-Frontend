// src/hooks/useStudentApiService.ts
import { useState, useCallback } from 'react';
import { Student, studentService } from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { useStudentStore } from '../store/studentStore';

interface UseStudentApiServiceProps {
  onClose: () => void;
  onStudentCreated?: (student: Student) => void;
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

export function useStudentApiService({
  onClose,
  onStudentCreated,
  newTeacherInfo,
}: UseStudentApiServiceProps) {
  const { saveStudent, loadStudents } = useStudentStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle saving a student and all related data
  const saveStudentData = useCallback(
    async (studentData: Partial<Student>, formData: any) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // Handle new or existing student
        let savedStudent: Student;

        if (studentData._id) {
          // Update existing student
          savedStudent = await studentService.updateStudent(
            studentData._id,
            studentData
          );
        } else {
          // Create new student
          savedStudent = await saveStudent(studentData);
        }

        console.log('Student saved successfully:', savedStudent);

        // Process teacher assignments after student is saved
        const teacherPromises = formData.teacherAssignments
          .filter((a: any) => a.teacherId !== 'new-teacher') // Filter out new teacher for now
          .map(async (assignment: any) => {
            try {
              const { teacherId, day, time, duration } = assignment;

              // Ensure all required fields have valid values
              if (!teacherId || !day || !time || !duration) {
                console.warn(
                  `Skipping invalid schedule for teacher ${teacherId} and student ${savedStudent._id}: Missing required fields`
                );
                return;
              }

              console.log(
                `Updating teacher ${teacherId} schedule with student ${savedStudent._id}`
              );

              // Update teacher schedule with student assignment
              await studentService.updateTeacherSchedule(teacherId, {
                studentId: savedStudent._id,
                day,
                time,
                duration,
              });

              // Also update the teacher's studentIds array to include this student
              try {
                const teacher = await teacherService.getTeacherById(teacherId);

                // Only add if not already in the array
                if (!teacher.teaching?.studentIds?.includes(savedStudent._id)) {
                  // Add student to teacher's studentIds
                  const updatedTeacher = await teacherService.updateTeacher(
                    teacherId,
                    {
                      teaching: {
                        studentIds: [
                          ...(teacher.teaching?.studentIds || []),
                          savedStudent._id,
                        ],
                        schedule: teacher.teaching?.schedule || [],
                      },
                    }
                  );

                  console.log(
                    'Updated teacher with student reference:',
                    updatedTeacher
                  );
                }
              } catch (err) {
                console.error('Failed to update teacher studentIds:', err);
              }
            } catch (err) {
              console.error('Failed to update teacher schedule:', err);
            }
          });

        // Wait for all teacher assignments to complete
        await Promise.all(teacherPromises);

        // Refresh student list
        await loadStudents();

        // Special handling for new teacher case
        if (
          newTeacherInfo?._id &&
          formData.teacherAssignments.some(
            (a: any) =>
              a.teacherId === 'new-teacher' ||
              a.teacherId === newTeacherInfo._id
          )
        ) {
          // Get the new teacher assignment
          const newTeacherAssignment = formData.teacherAssignments.find(
            (a: any) =>
              a.teacherId === 'new-teacher' ||
              a.teacherId === newTeacherInfo._id
          );

          if (newTeacherAssignment) {
            try {
              // Update the schedule for the new teacher
              await studentService.updateTeacherSchedule(newTeacherInfo._id, {
                studentId: savedStudent._id,
                day: newTeacherAssignment.day,
                time: newTeacherAssignment.time,
                duration: newTeacherAssignment.duration,
              });

              // Update the teacher's studentIds array
              const teacher = await teacherService.getTeacherById(
                newTeacherInfo._id
              );
              await teacherService.updateTeacher(newTeacherInfo._id, {
                teaching: {
                  studentIds: [
                    ...(teacher.teaching?.studentIds || []),
                    savedStudent._id,
                  ],
                  schedule: teacher.teaching?.schedule || [],
                },
              });

              console.log('Updated new teacher with student reference');
            } catch (err) {
              console.error('Failed to update new teacher with student:', err);
            }
          }

          // Prepare student with additional data for teacher creation
          const studentWithTeacherData = {
            ...savedStudent,
            _newTeacherAssociation: true,
            _lessonDetails: newTeacherAssignment
              ? {
                  lessonDay: newTeacherAssignment.day,
                  lessonTime: newTeacherAssignment.time,
                  lessonDuration: newTeacherAssignment.duration,
                }
              : undefined,
          };

          // Call the callback with enhanced student data
          if (onStudentCreated) {
            onStudentCreated(studentWithTeacherData);
            return savedStudent;
          }
        }

        // Close form on successful save
        onClose();
        return savedStudent;
      } catch (err) {
        console.error('Error saving student:', err);
        setError(err instanceof Error ? err.message : 'שגיאה בשמירת תלמיד');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [saveStudent, loadStudents, onStudentCreated, onClose, newTeacherInfo]
  );

  return {
    saveStudentData,
    isSubmitting,
    error,
  };
}
