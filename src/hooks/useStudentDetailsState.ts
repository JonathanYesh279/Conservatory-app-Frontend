// src/hooks/useStudentDetailsState.ts
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentService, Student } from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { orchestraService } from '../services/orchestraService';
import { theoryService, TheoryLesson } from '../services/theoryService';
import { TestStatus } from '../services/studentService';
import { useStudentStore } from '../store/studentStore';

export function useStudentDetailsState() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  
  // Get the student store update function for cross-page state consistency
  const { updateStudentStage: updateStoreStage } = useStudentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [isUpdatingTest, setIsUpdatingTest] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  
  // Store local stage changes that haven't been persisted to backend yet
  const [localStageChanges, setLocalStageChanges] = useState<Record<string, number>>({});

  // Function to merge student data with local stage changes
  const mergeStudentWithLocalChanges = (studentData: Student): Student => {
    if (Object.keys(localStageChanges).length === 0) {
      return studentData;
    }

    return {
      ...studentData,
      academicInfo: {
        ...studentData.academicInfo,
        instrumentProgress: studentData.academicInfo.instrumentProgress.map(instrument => {
          const localStage = localStageChanges[instrument.instrumentName];
          if (localStage !== undefined) {
            return { ...instrument, currentStage: localStage };
          }
          return instrument;
        })
      }
    };
  };

  // Teachers data - simplified without assignments
  const [teachersData, setTeachersData] = useState<{
    teachers: any[];
    assignments: any[]; // Keep for backward compatibility but empty
  }>({
    teachers: [],
    assignments: [],
  });
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // Orchestras data
  const [orchestras, setOrchestras] = useState<any[]>([]);
  const [orchestrasLoading, setOrchestrasLoading] = useState(false);

  // Theory lessons data
  const [theoryLessons, setTheoryLessons] = useState<TheoryLesson[]>([]);
  const [theoryLessonsLoading, setTheoryLessonsLoading] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    instruments: false,
    teachers: false,
    orchestras: false,
    tests: false,
    attendance: false,
    personalInfo: true,
    parentInfo: true,
    theoryLessons: false,
    schedule: true,
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
        
        // First, try to get the student from the store (which has local changes applied)
        const { students, selectedStudent } = useStudentStore.getState();
        const storeStudent = students.find(s => s._id === studentId) || 
                           (selectedStudent?._id === studentId ? selectedStudent : null);
        
        let studentData: Student;
        
        if (storeStudent) {
          console.log('Using student data from store (with local changes):', storeStudent);
          studentData = storeStudent;
        } else {
          console.log('Student not found in store, fetching from API');
          const apiStudent = await studentService.getStudentById(studentId || '');
          // Apply local stage changes to the fetched data
          studentData = mergeStudentWithLocalChanges(apiStudent);
        }

        if (!isMounted) return;

        if (studentData) {
          console.log(`Student data loaded successfully:`, studentData);
          setStudent(studentData);

          // Load teachers immediately if there are teacher IDs
          if (studentData.teacherIds && studentData.teacherIds.length > 0) {
            loadTeacherData(studentData.teacherIds);
          }

          // Load orchestras immediately if there are orchestra IDs
          const orchestraIds = [
            ...(studentData.academicInfo.orchestraIds || []),
            ...(studentData.enrollments?.orchestraIds || []),
          ].filter((id) => id); // Remove any empty values

          if (orchestraIds.length > 0) {
            loadOrchestraData(orchestraIds);
          }

          // Load theory lessons immediately if the student has any
          if (
            studentData.enrollments?.theoryLessonIds &&
            studentData.enrollments.theoryLessonIds.length > 0
          ) {
            loadTheoryLessonData(studentData.enrollments.theoryLessonIds);
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
      // Load teachers
      const teachers = await teacherService.getTeachersByIds(teacherIds);

      setTeachersData({
        teachers,
        assignments: [],
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

  // Load theory lesson data
  const loadTheoryLessonData = async (theoryLessonIds: string[]) => {
    if (!theoryLessonIds || theoryLessonIds.length === 0) return;

    setTheoryLessonsLoading(true);

    try {
      const theoryLessonData = await theoryService.getTheoryLessonsByIds(
        theoryLessonIds
      );
      setTheoryLessons(theoryLessonData);
    } catch (err) {
      console.error('Error loading theory lessons:', err);
    } finally {
      setTheoryLessonsLoading(false);
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

  // Navigate to theory lesson details
  const navigateToTheoryLesson = (theoryLessonId: string) => {
    navigate(`/theory/${theoryLessonId}`);
  };

  // Navigate to student edit form
  const navigateToStudentEdit = () => {
    if (student?._id) {
      navigate('/students', { 
        state: { 
          editStudentId: student._id 
        }
      });
    }
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

  // Update student test status - IMPROVED VERSION
  const updateStudentTest = async (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ) => {
    if (!student || !studentId) {
      console.error('Cannot update test: No student or studentId available');
      return undefined;
    }

    setIsUpdatingTest(true);

    try {
      console.log(
        `Updating ${testType} for ${instrumentName} to status: ${status}`
      );

      const typedStatus = status as TestStatus;

      // Find the instrument in the student's instrumentProgress array
      const instrumentIndex = student.academicInfo.instrumentProgress.findIndex(
        (i) => i.instrumentName === instrumentName
      );

      if (instrumentIndex === -1) {
        console.error(`Instrument ${instrumentName} not found in student data`);
        return undefined;
      }

      // Get the current instrument data
      const instrument =
        student.academicInfo.instrumentProgress[instrumentIndex];

      // Get previous test status
      const previousStatus = instrument.tests?.[testType]?.status || 'לא נבחן';

      console.log(`Previous status: ${previousStatus}, New status: ${status}`);

      // Optimistic update for UI - create a deep copy to avoid modifying state directly
      const updatedStudent = JSON.parse(JSON.stringify(student));

      // Ensure tests object structure exists
      if (
        !updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests
      ) {
        updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests =
          {};
      }

      if (
        !updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
          testType
        ]
      ) {
        updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
          testType
        ] = {
          status: 'לא נבחן',
          notes: '',
        };
      }

      // Update the test status
      updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
        testType
      ].status = status;
      updatedStudent.academicInfo.instrumentProgress[instrumentIndex].tests[
        testType
      ].lastTestDate = new Date().toISOString();

      // Increment stage if:
      // 1. This is a stage test
      // 2. New status indicates passing (עבר/ה or higher)
      // 3. Previous status was non-passing (לא נבחן or לא עבר/ה)
      // 4. Current stage is less than 8
      const passingStatuses = [
        'עבר/ה',
        'עבר/ה בהצטיינות',
        'עבר/ה בהצטיינות יתרה',
      ];
      const failingStatuses = ['לא נבחן', 'לא עבר/ה'];

      // Get the current stage
      const currentStage =
        updatedStudent.academicInfo.instrumentProgress[instrumentIndex]
          .currentStage;

      if (
        testType === 'stageTest' &&
        passingStatuses.includes(status) &&
        failingStatuses.includes(previousStatus) &&
        currentStage < 8 // This ensures we don't increment beyond 8
      ) {
        console.log(
          `Incrementing stage for ${instrumentName} from ${
            updatedStudent.academicInfo.instrumentProgress[instrumentIndex]
              .currentStage
          } to ${
            updatedStudent.academicInfo.instrumentProgress[instrumentIndex]
              .currentStage + 1
          }`
        );
        // Increment the stage
        updatedStudent.academicInfo.instrumentProgress[
          instrumentIndex
        ].currentStage += 1;
      }

      // Update local state for immediate feedback
      setStudent(updatedStudent);

      // Call the API
      const result = await studentService.updateStudentTest(
        studentId,
        instrumentName,
        testType,
        typedStatus
      );

      // Update with server response to ensure consistency
      if (result) {
        console.log(
          'Server update successful, updating component state',
          result
        );
        setStudent(result);
        return result;
      } else {
        console.warn('Server returned empty result for test update');
        return updatedStudent;
      }
    } catch (err) {
      console.error('Error updating test status:', err);
      return undefined;
    } finally {
      setIsUpdatingTest(false);
    }
  };

  // Update student instrument stage
  const updateStudentStage = async (
    instrumentName: string,
    newStage: number
  ) => {
    if (!student || !studentId) {
      console.error('Cannot update stage: No student or studentId available');
      return undefined;
    }

    setIsUpdatingStage(true);

    try {
      console.log(
        `Updating stage for ${instrumentName} to ${newStage}`
      );

      // Find the instrument in the student's instrumentProgress array
      const instrumentIndex = student.academicInfo.instrumentProgress.findIndex(
        (i) => i.instrumentName === instrumentName
      );

      if (instrumentIndex === -1) {
        console.error(`Instrument ${instrumentName} not found in student data`);
        return undefined;
      }

      // Get the current instrument data
      const instrument =
        student.academicInfo.instrumentProgress[instrumentIndex];

      // Get previous stage
      const previousStage = instrument.currentStage;

      console.log(`Previous stage: ${previousStage}, New stage: ${newStage}`);

      // Store the local stage change
      setLocalStageChanges(prev => ({
        ...prev,
        [instrumentName]: newStage
      }));

      // Also update the student store for cross-page consistency
      if (studentId) {
        updateStoreStage(studentId, instrumentName, newStage);
      }

      // Apply the change to current student data immediately
      const updatedStudent = mergeStudentWithLocalChanges({
        ...student,
        academicInfo: {
          ...student.academicInfo,
          instrumentProgress: student.academicInfo.instrumentProgress.map(instr => {
            if (instr.instrumentName === instrumentName) {
              return { ...instr, currentStage: newStage };
            }
            return instr;
          })
        }
      });

      // Update the UI immediately
      setStudent(updatedStudent);

      // Call the backend API to update the instrument stage
      const result = await studentService.updateStudentStage(
        studentId,
        instrumentName,
        newStage
      );

      console.log('Stage update successful:', result);

      // If the backend update was successful, clear the local change
      // (For now this won't happen since we're using local update only)
      setLocalStageChanges(prev => {
        const updated = { ...prev };
        delete updated[instrumentName];
        return updated;
      });

      // Update with the actual response from the server (merged with any remaining local changes)
      const finalStudent = mergeStudentWithLocalChanges(result);
      setStudent(finalStudent);

      return finalStudent;
    } catch (error) {
      console.error('Failed to update instrument stage:', error);

      // Revert the local stage change on error
      setLocalStageChanges(prev => {
        const updated = { ...prev };
        delete updated[instrumentName];
        return updated;
      });

      // Also revert the store change
      if (studentId) {
        const originalInstrument = student.academicInfo.instrumentProgress.find(
          (i) => i.instrumentName === instrumentName
        );
        if (originalInstrument) {
          updateStoreStage(studentId, instrumentName, originalInstrument.currentStage);
        }
      }

      // Revert the UI to show the original stage
      const revertedStudent = mergeStudentWithLocalChanges(student);
      setStudent(revertedStudent);

      console.log('Reverted stage change due to error');

      return undefined;
    } finally {
      setIsUpdatingStage(false);
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
    navigateToTheoryLesson,
    navigateToStudentEdit,
    teachersData,
    teachersLoading,
    teachersError,
    orchestras,
    orchestrasLoading,
    theoryLessons,
    theoryLessonsLoading,
    retryLoadTeachers,
    updateStudentTest,
    isUpdatingTest,
    updateStudentStage,
    isUpdatingStage,
  };
}
