// src/hooks/useStudentSelection.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Student } from '../services/studentService';
import { useStudentStore } from '../store/studentStore';

interface UseStudentSelectionProps {
  initialMemberIds: string[];
  onMemberIdsChange?: (memberIds: string[]) => void;
}

export const useStudentSelection = ({
  initialMemberIds = [],
  onMemberIdsChange,
}: UseStudentSelectionProps) => {
  const { students, loadStudents } = useStudentStore();

  const [selectedMembers, setSelectedMembers] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reference for click outside detection
  const searchRef = useRef<HTMLDivElement>(null);

  // Use refs to track previous state to avoid infinite loops
  const prevInitialMemberIdsRef = useRef<string>('');
  const initialMembersLoaded = useRef<boolean>(false);

  // Load students if needed - only once
  useEffect(() => {
    if (students.length === 0) {
      loadStudents({ isActive: true });
    }
  }, []); // Empty dependency array to run only once

  // Initialize with initial member IDs - with proper dependency tracking
  useEffect(() => {
    // Only process if students are loaded and we haven't processed these IDs yet
    const memberIdsKey = JSON.stringify(initialMemberIds.sort());

    if (
      students.length > 0 &&
      (prevInitialMemberIdsRef.current !== memberIdsKey ||
        !initialMembersLoaded.current)
    ) {
      prevInitialMemberIdsRef.current = memberIdsKey;
      initialMembersLoaded.current = true;

      if (initialMemberIds.length > 0) {
        // Find matching students
        setIsLoading(true);
        const members = students.filter((student) =>
          initialMemberIds.includes(student._id)
        );
        setSelectedMembers(members);
        setIsLoading(false);
      } else {
        setSelectedMembers([]);
      }
    }
  }, [initialMemberIds, students]); // Only depends on initialMemberIds and students

  // Handle search input change - standard event handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setIsSearchOpen(e.target.value.length > 0);
    },
    []
  );

  // Get filtered students - memoize the function
  const getFilteredStudents = useCallback(() => {
    if (!searchQuery) return [];

    return students
      .filter(
        (student) =>
          // Filter by name match
          student.personalInfo.fullName.includes(searchQuery) &&
          // Filter out already selected students
          !selectedMembers.some((member) => member._id === student._id)
      )
      .slice(0, 10); // Limit to 10 results for performance
  }, [searchQuery, students, selectedMembers]);

  // Add a student to selection - with callback
  const handleAddMember = useCallback(
    (student: Student) => {
      setSelectedMembers((prev) => {
        const updatedMembers = [...prev, student];

        // Notify parent component about member ID changes
        if (onMemberIdsChange) {
          onMemberIdsChange(updatedMembers.map((member) => member._id));
        }

        return updatedMembers;
      });

      setSearchQuery('');
      setIsSearchOpen(false);
    },
    [onMemberIdsChange]
  );

  // Remove a student from selection - with callback
  const handleRemoveMember = useCallback(
    (studentId: string) => {
      setSelectedMembers((prev) => {
        const updatedMembers = prev.filter(
          (member) => member._id !== studentId
        );

        // Notify parent component about member ID changes
        if (onMemberIdsChange) {
          onMemberIdsChange(updatedMembers.map((member) => member._id));
        }

        return updatedMembers;
      });
    },
    [onMemberIdsChange]
  );

  // Get current member IDs - memoized function
  const getMemberIds = useCallback((): string[] => {
    return selectedMembers.map((member) => member._id);
  }, [selectedMembers]);

  return {
    selectedMembers,
    searchQuery,
    isSearchOpen,
    isLoading,
    searchRef,
    handleSearchChange,
    getFilteredStudents,
    handleAddMember,
    handleRemoveMember,
    getMemberIds,
  };
};
