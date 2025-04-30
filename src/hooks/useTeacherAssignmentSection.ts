// src/hooks/useTeacherAssignmentSection.ts
import { useState, useEffect, useCallback } from 'react';
import {
  StudentFormData,
  TeacherAssignment,
  DAYS_OF_WEEK,
  LESSON_DURATIONS,
} from './useStudentForm';
import { Teacher, teacherService } from '../services/teacherService';

// Interface for lesson schedule
interface LessonSchedule {
  day: string;
  time: string;
  duration: number;
}

// Interface for teacher selection with multiple lesson schedules
interface TeacherSelection {
  teacherId: string;
  lessonSchedules: LessonSchedule[];
}

interface UseTeacherAssignmentSectionProps {
  formData: StudentFormData;
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
  addTeacherAssignment: (assignment: TeacherAssignment) => void;
  removeTeacherAssignment: (
    teacherId: string,
    lessonDay: string,
    lessonTime: string
  ) => void;
  errors: Record<string, string>;
}

export function useTeacherAssignmentSection({
  formData,
  newTeacherInfo,
  addTeacherAssignment,
  removeTeacherAssignment,
  errors,
}: UseTeacherAssignmentSectionProps) {
  // State to track available teachers
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // New approach: track multiple teacher selections with their lesson schedules
  const [teacherSelections, setTeacherSelections] = useState<
    TeacherSelection[]
  >([]);
  const [activeTeacherIndex, setActiveTeacherIndex] = useState<number | null>(
    null
  );

  // Load teachers on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const teacherData = await teacherService.getTeachers({
          isActive: true,
        });
        setTeachers(teacherData);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  // Initialize the teacher selections from formData when component mounts
  useEffect(() => {
    // Group assignments by teacher ID to initialize our teacher selections
    const teacherAssignmentsByTeacher = getTeacherAssignmentsByTeacher();

    if (Object.keys(teacherAssignmentsByTeacher).length > 0) {
      // Map existing teacher assignments to our new structure
      const initialTeacherSelections = Object.entries(
        teacherAssignmentsByTeacher
      ).map(([teacherId, assignments]) => {
        // Map each assignment to a lesson schedule
        const lessonSchedules = assignments.map((assignment) => ({
          day: assignment.day,
          time: assignment.time,
          duration: assignment.duration,
        }));

        return {
          teacherId,
          lessonSchedules,
        };
      });

      setTeacherSelections(initialTeacherSelections);
      // Set the first teacher as active
      setActiveTeacherIndex(0);
    } else if (newTeacherInfo) {
      // If we have a new teacher info but no selections yet, initialize with that
      addNewTeacherSelection('new-teacher');
    } else {
      // Otherwise, if we have no selections yet, add an empty one
      addNewTeacherSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new teacher selection
  const addNewTeacherSelection = useCallback(
    (initialTeacherId: string = '') => {
      const newSelection: TeacherSelection = {
        teacherId: initialTeacherId,
        lessonSchedules: [
          {
            day: DAYS_OF_WEEK[0],
            time: '08:00',
            duration: 45,
          },
        ],
      };

      setTeacherSelections((prev) => [...prev, newSelection]);
      // Set the newly added teacher as active
      setActiveTeacherIndex((prev) => {
        const newIndex = prev === null ? 0 : prev + 1;
        return newIndex >= 0 ? newIndex : 0;
      });
    },
    []
  );

  // Remove a teacher selection
  const removeTeacherSelection = useCallback((index: number) => {
    setTeacherSelections((prev) => {
      const newSelections = [...prev];
      // Remove the selection at the given index
      newSelections.splice(index, 1);
      return newSelections;
    });

    // Update active teacher index if needed
    setActiveTeacherIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) {
        // If we're removing the active teacher, set the previous one as active
        return Math.max(0, prev - 1);
      }
      if (prev > index) {
        // If we're removing a teacher before the active one, decrement the active index
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Handle teacher selection change
  const handleTeacherChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLSelectElement>) => {
      const teacherId = e.target.value;

      setTeacherSelections((prev) => {
        const newSelections = [...prev];
        newSelections[index] = {
          ...newSelections[index],
          teacherId,
        };
        return newSelections;
      });
    },
    []
  );

  // Handle lesson schedule changes
  const handleLessonDetailChange = useCallback(
    (
      teacherIndex: number,
      lessonIndex: number,
      e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
      const { name, value } = e.target;

      setTeacherSelections((prev) => {
        const newSelections = [...prev];
        if (!newSelections[teacherIndex]) return prev;

        const lessonSchedules = [
          ...newSelections[teacherIndex].lessonSchedules,
        ];
        if (!lessonSchedules[lessonIndex]) return prev;

        lessonSchedules[lessonIndex] = {
          ...lessonSchedules[lessonIndex],
          [name]: name === 'lessonDuration' ? parseInt(value) : value,
        };

        newSelections[teacherIndex] = {
          ...newSelections[teacherIndex],
          lessonSchedules,
        };

        return newSelections;
      });
    },
    []
  );

  // Add all lessons for the current teacher selection to assignments
  const handleAddLesson = useCallback(
    (teacherIndex: number) => {
      const selection = teacherSelections[teacherIndex];
      if (!selection || !selection.teacherId) return;

      // Add each lesson schedule as a separate assignment
      selection.lessonSchedules.forEach((schedule) => {
        addTeacherAssignment({
          teacherId: selection.teacherId,
          day: schedule.day,
          time: schedule.time,
          duration: schedule.duration,
        });
      });

      // Optionally, after adding the lessons, you can:
      // 1. Clear the lesson schedules array and replace with a new empty one
      // 2. Keep the selection as is
      // 3. Remove this teacher selection entirely

      // For now, let's keep the selection as is, which allows the user to make adjustments if needed
    },
    [teacherSelections, addTeacherAssignment]
  );

  // Handler to remove a specific teacher lesson directly from assignments
  const handleRemoveLesson = useCallback(
    (teacherId: string, lessonDay: string, lessonTime: string) => {
      removeTeacherAssignment(teacherId, lessonDay, lessonTime);
    },
    [removeTeacherAssignment]
  );

  // Get teacher name by ID
  const getTeacherName = useCallback(
    (teacherId: string) => {
      if (teacherId === 'new-teacher' && newTeacherInfo) {
        return `${newTeacherInfo.fullName} ${
          newTeacherInfo.instrument ? `(${newTeacherInfo.instrument})` : ''
        } (המורה החדש)`;
      }

      const teacher = teachers.find((t) => t._id === teacherId);
      return teacher
        ? `${teacher.personalInfo.fullName} ${
            teacher.professionalInfo?.instrument
              ? `(${teacher.professionalInfo.instrument})`
              : ''
          }`
        : 'מורה לא ידוע';
    },
    [teachers, newTeacherInfo]
  );

  // Group teacher assignments by teacher ID
  const getTeacherAssignmentsByTeacher = useCallback(() => {
    const groupedAssignments: Record<string, TeacherAssignment[]> = {};

    formData.teacherAssignments.forEach((assignment) => {
      if (!groupedAssignments[assignment.teacherId]) {
        groupedAssignments[assignment.teacherId] = [];
      }

      groupedAssignments[assignment.teacherId].push(assignment);
    });

    return groupedAssignments;
  }, [formData.teacherAssignments]);

  return {
    teachers,
    isLoadingTeachers,
    teacherSelections,
    activeTeacherIndex,
    teacherAssignmentsByTeacher: getTeacherAssignmentsByTeacher(),
    daysOfWeek: DAYS_OF_WEEK,
    lessonDurations: LESSON_DURATIONS,
    errors,
    newTeacherInfo,

    // Teacher selection management
    addNewTeacherSelection,
    removeTeacherSelection,
    setActiveTeacherIndex,
    handleTeacherChange,

    // Lesson management
    handleLessonDetailChange,
    handleAddLesson,
    handleRemoveLesson,

    // Utility functions
    getTeacherName,
  };
}
