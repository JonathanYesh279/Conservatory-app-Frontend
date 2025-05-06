// src/hooks/useStudentDetailsState.ts
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../store/studentStore';
import { useTeacherStore } from '../store/teacherStore'; // Import the teacher store
import { orchestraService } from '../services/orchestraService';
import {
  studentService,
  AttendanceStats,
  Student,
} from '../services/studentService';

// Define teacher data type
export interface TeacherData {
  id: string;
  name: string;
  instrument?: string;
}

export interface UseStudentDetailsResult {
  student: Student | null;
  isLoading: boolean;
  error: string | null;
  flipped: boolean;
  teachersData: TeacherData[];
  teachersLoading: boolean;
  teachersError: string | null;
  teachersFetched: boolean;
  orchestras: any[];
  orchestrasLoading: boolean;
  attendanceStats: AttendanceStats | null;
  loadingAttendance: boolean;
  openSections: {
    teachers: boolean;
    orchestras: boolean;
    tests: boolean;
    attendance: boolean;
    personalInfo: boolean;
    parentInfo: boolean;
  };
  toggleSection: (section: keyof typeof openSections) => void;
  toggleFlip: () => void;
  goBack: () => void;
  navigateToTeacher: (teacherId: string) => void;
  navigateToOrchestra: (orchestraId: string) => void;
  formatDate: (date: string) => string;
  getInitials: (name: string) => string;
  getStageColor: (stage: number) => string;
  retryLoadTeachers: () => void;
}

export function useStudentDetailsState(): UseStudentDetailsResult {
  const { studentId } = useParams<{ studentId: string }>();
  const {
    selectedStudent,
    loadStudentById,
    isLoading: studentLoading,
    error: studentError,
  } = useStudentStore();

  // Get teacher data from the store
  const {
    teachers: allTeachers,
    loadBasicTeacherData,
    isLoading: teacherStoreLoading,
    error: teacherStoreError,
  } = useTeacherStore();

  const [flipped, setFlipped] = useState(false);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);
  const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [teachersFetched, setTeachersFetched] = useState(false);
  const [orchestras, setOrchestras] = useState<any[]>([]);
  const [orchestrasLoading, setOrchestrasLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const navigate = useNavigate();

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    teachers: false,
    orchestras: false,
    tests: false,
    attendance: false,
    personalInfo: false,
    parentInfo: false,
  });

  // First, ensure basic teacher data is loaded on component mount
  useEffect(() => {
    loadBasicTeacherData();
  }, [loadBasicTeacherData]);

  // Load student data when component mounts
  useEffect(() => {
    if (studentId) {
      loadStudentById(studentId);
    }
  }, [studentId, loadStudentById]);

  // Toggle section visibility
  // Update the toggleSection function
  const toggleSection = useCallback(
    (section: keyof typeof openSections) => {
      setOpenSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));

      // If we're opening the teachers section, trigger a refresh
      if (!openSections[section] && section === 'teachers') {
        setTeachersFetched(false);
      }
    },
    [openSections]
  );

  // Function to flip the card
  const toggleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  // Function to reload teachers data
  const retryLoadTeachers = useCallback(() => {
    setTeachersFetched(false);
  }, []);

  // Get teacher data from the store when student is loaded
  useEffect(() => {
    if (selectedStudent?.teacherIds?.length && !teachersFetched) {
      setTeachersLoading(true);
      setTeachersError(null);

      try {
        // Extract relevant teachers from the store
        const relevantTeachers = allTeachers.filter((teacher) =>
          selectedStudent.teacherIds.includes(teacher._id)
        );

        // If we found all teachers, use them directly
        if (relevantTeachers.length === selectedStudent.teacherIds.length) {
          const teacherDataItems: TeacherData[] = relevantTeachers.map(
            (teacher) => ({
              id: teacher._id,
              name: teacher.personalInfo.fullName,
              instrument: teacher.professionalInfo?.instrument,
            })
          );

          setTeachersData(teacherDataItems);
          setTeachersFetched(true);
          setTeachersLoading(false);
        } else {
          // If we're missing some teachers, load them individually
          const loadMissingTeachers = async () => {
            try {
              const missingTeacherIds = selectedStudent.teacherIds.filter(
                (id) => !relevantTeachers.find((t) => t._id === id)
              );

              console.log(
                `Loading ${missingTeacherIds.length} missing teachers`
              );

              const teacherPromises = missingTeacherIds.map((teacherId) =>
                useTeacherStore
                  .getState()
                  .loadTeacherById(teacherId)
                  .catch((err) => {
                    console.error(`Failed to load teacher ${teacherId}:`, err);
                    return null;
                  })
              );

              const results = await Promise.allSettled(teacherPromises);

              // Combine loaded teachers with existing ones from the store
              const loadedTeachers = results
                .filter(
                  (result) =>
                    result.status === 'fulfilled' && result.value !== null
                )
                .map((result) => (result as PromiseFulfilledResult<any>).value);

              const allRelevantTeachers = [
                ...relevantTeachers,
                ...loadedTeachers,
              ];

              const teacherDataItems: TeacherData[] = allRelevantTeachers.map(
                (teacher) => ({
                  id: teacher._id,
                  name: teacher.personalInfo.fullName,
                  instrument: teacher.professionalInfo?.instrument,
                })
              );

              setTeachersData(teacherDataItems);

              // Check if we got all the teachers we expected
              if (teacherDataItems.length < selectedStudent.teacherIds.length) {
                setTeachersError('Some teacher data could not be loaded');
              }
            } catch (error) {
              console.error('Failed to fetch missing teachers:', error);
              setTeachersError('Failed to load teacher data');
            } finally {
              setTeachersLoading(false);
              setTeachersFetched(true);
            }
          };

          loadMissingTeachers();
        }
      } catch (error) {
        console.error('Error processing teacher data:', error);
        setTeachersError('Failed to process teacher data');
        setTeachersLoading(false);
        setTeachersFetched(true);
      }
    } else if (!selectedStudent?.teacherIds?.length) {
      // No teachers to load
      setTeachersData([]);
      setTeachersFetched(true);
      setTeachersLoading(false);
    }
  }, [selectedStudent, allTeachers, teachersFetched]);

  // Load orchestra data when student is loaded
  useEffect(() => {
    if (
      selectedStudent?.enrollments?.orchestraIds &&
      selectedStudent.enrollments.orchestraIds.length > 0
    ) {
      setOrchestrasLoading(true);
      const fetchOrchestras = async () => {
        try {
          const orchestraIds = selectedStudent.enrollments.orchestraIds;
          const orchestraData = await orchestraService.getOrchestrasByIds(
            orchestraIds
          );
          setOrchestras(orchestraData);
        } catch (error) {
          console.error('Failed to fetch orchestra data:', error);
        } finally {
          setOrchestrasLoading(false);
        }
      };

      fetchOrchestras();
    }
  }, [selectedStudent]);

  // Fetch attendance data
  useEffect(() => {
    if (
      selectedStudent &&
      selectedStudent.enrollments?.orchestraIds?.length > 0 &&
      openSections.attendance // Only fetch when section is open
    ) {
      setLoadingAttendance(true);
      const fetchAttendance = async () => {
        // For now, get attendance for the first orchestra
        const orchestraId = selectedStudent.enrollments.orchestraIds[0];
        try {
          const stats = await studentService.getStudentAttendanceStats(
            orchestraId,
            selectedStudent._id
          );
          setAttendanceStats(stats);
        } catch (error) {
          console.error('Failed to fetch attendance stats:', error);
          setAttendanceStats({
            attendanceRate: 0,
            attended: 0,
            totalRehearsals: 0,
            recentHistory: [],
            message: 'Failed to load attendance data',
          });
        } finally {
          setLoadingAttendance(false);
        }
      };

      fetchAttendance();
    }
  }, [selectedStudent, openSections.attendance]);

  // Navigate back to students list
  const goBack = useCallback(() => {
    navigate('/students');
  }, [navigate]);

  // Navigate to teacher details
  const navigateToTeacher = useCallback(
    (teacherId: string) => {
      navigate(`/teachers/${teacherId}`);
    },
    [navigate]
  );

  // Navigate to orchestra details
  const navigateToOrchestra = useCallback(
    (orchestraId: string) => {
      navigate(`/orchestras/${orchestraId}`);
    },
    [navigate]
  );

  // Format a date string
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'לא זמין';

    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  }, []);

  // Get initials for avatar
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Get stage color based on stage number
  const getStageColor = useCallback((stage: number) => {
    const colors = [
      'var(--stage-1)',
      'var(--stage-2)',
      'var(--stage-3)',
      'var(--stage-4)',
      'var(--stage-5)',
      'var(--stage-6)',
      'var(--stage-7)',
      'var(--stage-8)',
    ];
    return colors[stage - 1] || colors[0];
  }, []);

  return {
    student: selectedStudent,
    isLoading: studentLoading || teacherStoreLoading,
    error: studentError || teacherStoreError,
    flipped,
    teachersData,
    teachersLoading,
    teachersError,
    teachersFetched,
    orchestras,
    orchestrasLoading,
    attendanceStats,
    loadingAttendance,
    openSections,
    toggleSection,
    toggleFlip,
    goBack,
    navigateToTeacher,
    navigateToOrchestra,
    formatDate,
    getInitials,
    getStageColor,
    retryLoadTeachers,
  };
}
