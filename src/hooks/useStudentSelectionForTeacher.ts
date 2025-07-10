// src/hooks/useStudentSelectionForTeacher.ts
import { useState, useEffect, useCallback } from 'react';
import { Student, studentService } from '../services/studentService';

interface UseStudentSelectionForTeacherProps {
  initialStudentIds: string[];
  onStudentIdsChange: (studentIds: string[]) => void;
  onAddScheduleItem: (studentId: string) => void;
  onRemoveScheduleItem: (studentId: string) => void;
}

export const useStudentSelectionForTeacher = ({
  initialStudentIds = [],
  onStudentIdsChange,
  onAddScheduleItem,
  onRemoveScheduleItem,
}: UseStudentSelectionForTeacherProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load students for selection
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const allStudents = await studentService.getStudents({
          isActive: true,
        });
        console.log(`Loaded ${allStudents.length} students for selection`);
        setStudents(allStudents);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []); // Load once on mount

  // Load selected students from IDs whenever initialStudentIds changes
  useEffect(() => {
    const loadSelectedStudents = async () => {
      if (initialStudentIds.length > 0) {
        console.log('Loading selected students for IDs:', initialStudentIds);
        setLoadingStudents(true);
        try {
          const studentData = await studentService.getStudentsByIds(
            initialStudentIds
          );
          console.log('Loaded selected students:', studentData);
          setSelectedStudents(studentData);
        } catch (err) {
          console.error('Failed to load selected students:', err);
        } finally {
          setLoadingStudents(false);
        }
      } else {
        setSelectedStudents([]);
      }
    };

    loadSelectedStudents();
  }, [initialStudentIds]);

  // Handle search input change
  const handleStudentSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Get filtered students that match search query
  const getFilteredStudents = useCallback(() => {
    if (!searchQuery.trim()) return [];

    return students
      .filter((student) => {
        // Only include students not already selected
        if (selectedStudents.some((s) => s._id === student._id)) return false;

        // Search in name, instrument, and class
        const searchFields = [
          student.personalInfo.fullName,
          student.academicInfo.instrument,
          student.academicInfo.class,
        ];

        // Check if any field contains the search query
        return searchFields.some(
          (field) =>
            field?.toLowerCase().includes(searchQuery.toLowerCase()) || false
        );
      })
      .slice(0, 10); // Limit results for performance
  }, [searchQuery, students, selectedStudents]);

  // Handle adding a student
  const handleAddStudent = useCallback(
    (student: Student) => {
      // Check if student is already selected
      if (selectedStudents.some((s) => s._id === student._id)) {
        console.log(`Student ${student._id} already selected, skipping`);
        return;
      }

      console.log(`Adding student ${student._id} to selection`);

      // Add student to selected students
      setSelectedStudents((prev) => [...prev, student]);

      // Call the parent's callback with updated IDs before processing schedule
      const updatedIds = [...selectedStudents.map((s) => s._id), student._id];
      onStudentIdsChange(updatedIds);

      // Add schedule item for this student
      console.log(`Creating schedule for student ${student._id}`);
      onAddScheduleItem(student._id);

      // Reset search state
      setSearchQuery('');
      setShowStudentSearch(false);
    },
    [selectedStudents, onStudentIdsChange, onAddScheduleItem]
  );

  // Handle removing a student
  const handleRemoveStudent = useCallback(
    (studentId: string) => {
      console.log(`Removing student ${studentId} from selection`);

      // Remove student from selected students
      setSelectedStudents((prev) => prev.filter((s) => s._id !== studentId));

      // Call the parent's callback with updated IDs
      const updatedIds = selectedStudents
        .filter((s) => s._id !== studentId)
        .map((s) => s._id);
      onStudentIdsChange(updatedIds);

      // Remove schedule item for this student
      console.log(`Removing schedule for student ${studentId}`);
      onRemoveScheduleItem(studentId);
    },
    [selectedStudents, onStudentIdsChange, onRemoveScheduleItem]
  );

  return {
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
  };
};
