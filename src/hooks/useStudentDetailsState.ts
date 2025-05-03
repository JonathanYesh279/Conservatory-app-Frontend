// src/hooks/useStudentDetailsState.ts
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../store/studentStore';
import { orchestraService } from '../services/orchestraService';
import { teacherService } from '../services/teacherService';
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
  formatDate: (dateString: string) => string;
  getInitials: (name: string) => string;
  getStageColor: (stage: number) => string;
}

export function useStudentDetailsState(): UseStudentDetailsResult {
  const { studentId } = useParams<{ studentId: string }>();
  const { selectedStudent, loadStudentById, isLoading, error } =
    useStudentStore();

  const [flipped, setFlipped] = useState(false);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);
  const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
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

  // Toggle section visibility
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Load student data when component mounts
  useEffect(() => {
    if (studentId) {
      loadStudentById(studentId);
    }
  }, [studentId, loadStudentById]);

  // Load teachers data when student is loaded
  useEffect(() => {
    if (selectedStudent?.teacherIds?.length) {
      setTeachersLoading(true);
      const fetchTeachers = async () => {
        try {
          // Fetch all teachers assigned to this student
          const teachers = await Promise.all(
            selectedStudent.teacherIds.map(async (teacherId) => {
              try {
                const teacher = await teacherService.getTeacherById(teacherId);
                return {
                  id: teacher._id,
                  name: teacher.personalInfo.fullName,
                  instrument: teacher.professionalInfo?.instrument,
                };
              } catch (err) {
                console.error(`Failed to fetch teacher ${teacherId}:`, err);
                return null;
              }
            })
          );

          // Filter out any failed teacher fetches
          setTeachersData(teachers.filter((t) => t !== null) as TeacherData[]);
        } catch (error) {
          console.error('Failed to fetch teachers data:', error);
        } finally {
          setTeachersLoading(false);
        }
      };

      fetchTeachers();
    }
  }, [selectedStudent]);

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

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const goBack = () => {
    navigate('/students');
  };

  // Navigate to teacher details
  const navigateToTeacher = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`);
  };

  // Navigate to orchestra details
  const navigateToOrchestra = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`);
  };

  // Format a date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'לא זמין';

    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get stage color based on stage number
  const getStageColor = (stage: number) => {
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
  };

  return {
    student: selectedStudent,
    isLoading,
    error,
    flipped,
    teachersData,
    teachersLoading,
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
  };
}
