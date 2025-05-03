// src/hooks/useStudentTests.ts
import { useState } from 'react';
import { useStudentStore } from '../store/studentStore';
import { Student } from '../services/studentService';

type TestType = 'stageTest' | 'technicalTest';
type TestStatus =
  | 'לא נבחן'
  | 'עבר/ה'
  | 'לא עבר/ה'
  | 'עבר/ה בהצלחה'
  | 'עבר/ה בהצטיינות';

interface UseStudentTestsResult {
  isUpdating: boolean;
  updateError: string | null;
  showStageTestOptions: boolean;
  showStageSuccessOptions: boolean;
  handleTestStatusChange: (testType: TestType, status: TestStatus) => void;
  toggleStageTestOptions: () => void;
  toggleStageSuccessOptions: () => void;
}

export function useStudentTests(
  student: Student | null
): UseStudentTestsResult {
  const { saveStudent } = useStudentStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showStageTestOptions, setShowStageTestOptions] = useState(false);
  const [showStageSuccessOptions, setShowStageSuccessOptions] = useState(false);

  const toggleStageTestOptions = () => {
    setShowStageTestOptions((prev) => !prev);
    if (showStageSuccessOptions) setShowStageSuccessOptions(false);
  };

  const toggleStageSuccessOptions = () => {
    setShowStageSuccessOptions((prev) => !prev);
  };

 const handleTestStatusChange = async (
   testType: TestType,
   status: TestStatus
 ) => {
   if (!student) return;

   setIsUpdating(true);
   setUpdateError(null);

   try {
     // Create properly typed updated student data
     const updatedStudent: Partial<Student> = {
       _id: student._id, // Add the ID to ensure it's an update operation
       academicInfo: {
         // Include the required properties of academicInfo
         instrument: student.academicInfo.instrument,
         currentStage: student.academicInfo.currentStage,
         class: student.academicInfo.class,
         tests: {
           // Include only the test you're updating
           [testType]: {
             status,
             lastTestDate: new Date().toISOString(),
           },
         },
       },
     };

     // Save the updated student
     await saveStudent(updatedStudent);

     // Close dropdowns
     setShowStageTestOptions(false);
     setShowStageSuccessOptions(false);
   } catch (error) {
     console.error('Failed to update test status:', error);
     setUpdateError('Failed to update test status');
   } finally {
     setIsUpdating(false);
   }
 };

  return {
    isUpdating,
    updateError,
    showStageTestOptions,
    showStageSuccessOptions,
    handleTestStatusChange,
    toggleStageTestOptions,
    toggleStageSuccessOptions,
  };
}
