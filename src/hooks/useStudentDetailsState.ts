import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  studentService,
  Student,
  InstrumentProgress,
} from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { orchestraService, Orchestra } from '../services/orchestraService';

export interface TeacherData {
  id: string;
  name: string;
  instrument: string;
}

export function useStudentDetailsState() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [orchestrasLoading, setOrchestrasLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Collapsible sections state - all sections start collapsed (false) by default
  const [openSections, setOpenSections] = useState({
    personalInfo: false,
    parentInfo: false,
    instruments: false,
    teachers: false,
    orchestras: false,
    tests: false,
    attendance: false,
  });

  const navigate = useNavigate();

  // Load student data
  useEffect(() => {
    const loadStudent = async () => {
      if (!studentId) return;

      setIsLoading(true);
      try {
        const data = await studentService.getStudentById(studentId);
        setStudent(data);

        // Load teachers if student has teacherIds
        if (data.academicInfo?.teacherIds?.length) {
          loadTeachers(data.academicInfo.teacherIds);
        }

        // Load orchestras if student has orchestraIds
        if (data.academicInfo?.orchestraIds?.length) {
          loadOrchestras(data.academicInfo.orchestraIds);
        }
      } catch (err) {
        console.error('Failed to load student:', err);
        setError(
          err instanceof Error ? err.message : 'שגיאה בטעינת פרטי התלמיד'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStudent();
  }, [studentId]);

  // Load teacher details
  const loadTeachers = async (teacherIds: string[]) => {
    setTeachersLoading(true);
    setTeachersError(null);
    try {
      const teachersList = await teacherService.getTeachersByIds(teacherIds);
      setTeachersData(
        teachersList.map((teacher) => ({
          id: teacher._id,
          name: teacher.personalInfo.fullName || 'מורה ללא שם',
          instrument: teacher.professionalInfo?.instrument || '',
        }))
      );
    } catch (err) {
      console.error('Failed to load teachers:', err);
      setTeachersError('שגיאה בטעינת פרטי המורים');
    } finally {
      setTeachersLoading(false);
    }
  };

  // Load orchestra details
  const loadOrchestras = async (orchestraIds: string[]) => {
    setOrchestrasLoading(true);
    try {
      const orchestraList = await orchestraService.getOrchestrasByIds(
        orchestraIds
      );
      setOrchestras(orchestraList);
    } catch (err) {
      console.error('Failed to load orchestras:', err);
    } finally {
      setOrchestrasLoading(false);
    }
  };

  // Function to update a test status and increment stage if needed
  const updateStudentTest = async (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ) => {
    if (!student || !studentId) return;

    try {
      // Create a deep copy of the student to update
      const updatedStudent = JSON.parse(JSON.stringify(student));

      // Find the instrument to update
      const instrumentIndex =
        updatedStudent.academicInfo.instrumentProgress.findIndex(
          (i: InstrumentProgress) => i.instrumentName === instrumentName
        );

      if (instrumentIndex === -1) return;

      // Ensure tests object exists
      if (
        !updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests
      ) {
        updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests =
          {
            stageTest: { status: 'לא נבחן', notes: '' },
            technicalTest: { status: 'לא נבחן', notes: '' },
          };
      }

      // Update the test status
      updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
        testType
      ].status = status;

      // Update last test date
      updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
        testType
      ].lastTestDate = new Date().toISOString();

      // Check if the stage should be incremented
      // Only increment if:
      // 1. It's a stage test (not technical)
      // 2. The status indicates passing (any type of עבר/ה)
      if (
        testType === 'stageTest' &&
        status.includes('עבר/ה') &&
        !status.includes('לא עבר/ה')
      ) {
        // Increment the current stage
        updatedStudent.academicInfo.instrumentProgress[
          instrumentIndex
        ].currentStage += 1;
      }

      // Update in the database
      const response = await studentService.updateStudent(
        studentId,
        updatedStudent
      );

      // Update local state
      setStudent(response);

      // Show success message or notification if needed
      console.log(`Updated ${testType} for ${instrumentName} to "${status}"`);

      return response;
    } catch (error) {
      console.error('Failed to update test status:', error);
      // Handle error (show message, etc.)
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'לא זמין';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  // Toggle section visibility
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle card flipping
  const toggleFlip = () => {
    setFlipped((prev) => !prev);
  };

  // Navigation
  const goBack = () => {
    navigate('/students');
  };

  const navigateToTeacher = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`);
  };

  const navigateToOrchestra = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`);
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

  // Get stage color for instrument level visualization
  const getStageColor = (stage: number): string => {
    const stageColors: Record<number, string> = {
      1: '#4158d0', // Blue
      2: '#28A745', // Green
      3: '#FFC107', // Yellow
      4: '#e83e8c', // Pink
      5: '#6f42c1', // Purple
      6: '#fd7e14', // Orange
    };
    return stageColors[stage] || '#6c757d'; // Default gray
  };

  // Find primary instrument (convenient helper for components)
  const primaryInstrument =
    student?.academicInfo.instrumentProgress?.find((i) => i.isPrimary) ||
    (student?.academicInfo.instrumentProgress?.length
      ? student.academicInfo.instrumentProgress[0]
      : null);

  // Retry loading teachers
  const retryLoadTeachers = () => {
    if (student?.academicInfo?.teacherIds) {
      loadTeachers(student.academicInfo.teacherIds);
    }
  };

  return {
    student,
    isLoading,
    error,
    teachersData,
    teachersLoading,
    teachersError,
    orchestras,
    orchestrasLoading,
    openSections,
    flipped,
    toggleFlip,
    toggleSection,
    formatDate,
    goBack,
    navigateToTeacher,
    navigateToOrchestra,
    getInitials,
    getStageColor,
    primaryInstrument,
    retryLoadTeachers,
    updateStudentTest,
  };
}
