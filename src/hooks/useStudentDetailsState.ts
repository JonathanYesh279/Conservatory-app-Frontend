// src/hooks/useStudentDetailsState.ts - Partial implementation
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentService, Student } from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { orchestraService } from '../services/orchestraService';

export function useStudentDetailsState() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);

  // Teachers data
  const [teachersData, setTeachersData] = useState<{
    teachers: any[];
    assignments: any[];
  }>({
    teachers: [],
    assignments: [],
  });
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // Orchestras data
  const [orchestras, setOrchestras] = useState<any[]>([]);
  const [orchestrasLoading, setOrchestrasLoading] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    instruments: true,
    teachers: true,
    orchestras: true,
    tests: false,
    attendance: false,
    personalInfo: true,
    parentInfo: true,
  });

  const navigate = useNavigate();

  // Load student data
  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching student data for ID: ${studentId}`);
        const studentData = await studentService.getStudentById(
          studentId || ''
        );

        if (!isMounted) return;

        if (studentData) {
          console.log(`Student data fetched successfully:`, studentData);
          setStudent(studentData);

          // Load teachers immediately if there are teacher IDs
          if (studentData.teacherIds && studentData.teacherIds.length > 0) {
            loadTeacherData(studentData.teacherIds);
          }

          // Load orchestras immediately if there are orchestra IDs
          const orchestraIds = [
            ...(studentData.orchestraIds || []),
            ...(studentData.enrollments?.orchestraIds || []),
          ].filter((id) => id); // Remove any empty values

          if (orchestraIds.length > 0) {
            loadOrchestraData(orchestraIds);
          }
        } else {
          setError('לא נמצא תלמיד');
        }
      } catch (err) {
        console.error('Error fetching student:', err);
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : 'שגיאה בטעינת נתוני תלמיד'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (studentId) {
      console.log('Student fetch effect running, studentId:', studentId);
      fetchStudentData();
    } else {
      setError('חסר מספר מזהה של תלמיד');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  // Load teacher data
  const loadTeacherData = async (teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return;

    setTeachersLoading(true);
    setTeachersError(null);

    try {
      // Load teachers and their assignments for this student
      const teachers = await teacherService.getTeachersByIds(teacherIds);

      // Create assignments array from the data we have
      const assignments = teacherIds.map((teacherId) => {
        const teacher = teachers.find((t) => t && t._id === teacherId);

        // Find this student's schedule from the teacher's data if available
        let scheduleItem = null;
        if (teacher && teacher.teaching && teacher.teaching.schedule) {
          scheduleItem = teacher.teaching.schedule.find(
            (item: any) => item.studentId === studentId
          );
        }

        // Create an assignment object, either with or without schedule details
        return scheduleItem
          ? {
              teacherId,
              day: scheduleItem.day,
              time: scheduleItem.time,
              duration: scheduleItem.duration,
              isActive: scheduleItem.isActive !== false,
            }
          : {
              teacherId,
              // No schedule details available for this teacher-student pair
            };
      });

      setTeachersData({
        teachers,
        assignments,
      });
    } catch (err) {
      console.error('Error loading teachers:', err);
      setTeachersError('שגיאה בטעינת נתוני מורים');
    } finally {
      setTeachersLoading(false);
    }
  };

  // Retry loading teachers
  const retryLoadTeachers = () => {
    if (student && student.teacherIds) {
      loadTeacherData(student.teacherIds);
    }
  };

  // Load orchestra data
  const loadOrchestraData = async (orchestraIds: string[]) => {
    if (!orchestraIds || orchestraIds.length === 0) return;

    setOrchestrasLoading(true);

    try {
      const orchestraData = await orchestraService.getOrchestrasByIds(
        orchestraIds
      );
      setOrchestras(orchestraData);
    } catch (err) {
      console.error('Error loading orchestras:', err);
    } finally {
      setOrchestrasLoading(false);
    }
  };

  // Toggle card flip
  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  // Go back to student list
  const goBack = () => {
    navigate('/students');
  };

  // Toggle section visibility
  const toggleSection = (sectionKey: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Navigate to teacher details
  const navigateToTeacher = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`);
  };

  // Navigate to orchestra details
  const navigateToOrchestra = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`);
  };

  // Get initials for avatar display
  const getInitials = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2);
  };

  // Format a date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  // Get instrument stage color
  const getStageColor = (stage: number): string => {
    const colors = [
      '#4D55CC', // Stage 1 - Primary color
      '#6C63FF', // Stage 2
      '#8A84FF', // Stage 3
      '#A79DFF', // Stage 4
      '#C2BAFF', // Stage 5
      '#7952B3', // Stage 6
      '#5E3B9A', // Stage 7
      '#472980', // Stage 8
    ];

    return colors[stage - 1] || colors[0];
  };

  // Find primary instrument
  const primaryInstrument =
    student?.academicInfo?.instrumentProgress?.find(
      (instrument) => instrument.isPrimary
    ) ||
    student?.academicInfo?.instrumentProgress?.[0] ||
    null;

  // Update student test status
  const updateStudentTest = async (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ) => {
    if (!student || !studentId) return;

    try {
      // Update locally first for immediate feedback
      const updatedStudent = { ...student };
      const instrumentIndex =
        updatedStudent.academicInfo.instrumentProgress.findIndex(
          (i) => i.instrumentName === instrumentName
        );

      if (instrumentIndex >= 0) {
        updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
          testType
        ].status = status;
        setStudent(updatedStudent);
      }

      // Send update to server
      const result = await studentService.updateStudentTest(
        studentId,
        instrumentName,
        testType,
        status
      );

      return result;
    } catch (err) {
      console.error('Error updating test status:', err);
      return undefined;
    }
  };

  return {
    student,
    isLoading,
    error,
    flipped,
    toggleFlip,
    goBack,
    getInitials,
    getStageColor,
    primaryInstrument,
    openSections,
    toggleSection,
    formatDate,
    navigateToTeacher,
    navigateToOrchestra,
    teachersData,
    teachersLoading,
    teachersError,
    orchestras,
    orchestrasLoading,
    retryLoadTeachers,
    updateStudentTest,
  };
}
