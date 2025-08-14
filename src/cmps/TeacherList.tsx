// src/cmps/TeacherList.tsx
import { useEffect, useState } from 'react';
import { Teacher } from '../services/teacherService';
import { studentService } from '../services/studentService';
import { TeacherPreview } from './TeacherPreview.tsx';
<<<<<<< Updated upstream
import { AuthorizationContext } from '../utils/authorization';
=======
>>>>>>> Stashed changes

interface TeacherListProps {
  teachers: Teacher[];
  isLoading: boolean;
  onEdit: (teacherId: string) => void;
  onView?: (teacherId: string) => void;
  onRemove?: (teacherId: string) => void;
<<<<<<< Updated upstream
  authContext?: AuthorizationContext;
=======
>>>>>>> Stashed changes
}

export function TeacherList({
  teachers,
  isLoading,
  onEdit,
  onView,
  onRemove,
<<<<<<< Updated upstream
  authContext,
=======
>>>>>>> Stashed changes
}: TeacherListProps) {
  // State to track student counts for each teacher
  const [teacherStudentCounts, setTeacherStudentCounts] = useState<Record<string, number>>({});
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Load all students and calculate counts for each teacher
  useEffect(() => {
    if (teachers.length > 0 && !studentsLoaded) {
      loadStudentCounts();
    }
  }, [teachers, studentsLoaded]);

  const loadStudentCounts = async () => {
    try {
      console.log('Loading student counts for teachers...');
      
      // Get all students
      const allStudents = await studentService.getStudents();
      console.log('Total students loaded for count calculation:', allStudents.length);
      
      // Calculate count for each teacher
      const counts: Record<string, number> = {};
      
      teachers.forEach(teacher => {
        // Count students who have this teacher assigned
        const studentCount = allStudents.filter(student => {
          // Check if student has this teacher in teacherIds
          const hasTeacherInIds = student.teacherIds && student.teacherIds.includes(teacher._id);
          
          // Check if student has assignments with this teacher
          const hasTeacherAssignments = student.teacherAssignments && 
            student.teacherAssignments.some((assignment: any) => assignment.teacherId === teacher._id);
            
          return hasTeacherInIds || hasTeacherAssignments;
        }).length;
        
        counts[teacher._id] = studentCount;
        
        if (studentCount > 0) {
          console.log(`Teacher ${teacher.personalInfo.fullName}: ${studentCount} students`);
        }
      });
      
      setTeacherStudentCounts(counts);
      setStudentsLoaded(true);
    } catch (error) {
      console.error('Failed to load student counts:', error);
    }
  };

  // Add defensive check for array
  if (!Array.isArray(teachers)) {
    console.error(
      'Expected teachers to be an array but got:',
      typeof teachers,
      teachers
    );
    return <div className='error-state'>שגיאה בטעינת נתונים</div>;
  }

  if (isLoading && teachers.length === 0) {
    return <div className='loading-state'>טוען מורים...</div>;
  }

  if (teachers.length === 0) {
    return (
      <div className='empty-state'>
        <p>לא נמצאו מורים להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף מורים חדשים</p>
      </div>
    );
  }

  return (
    <div className='teacher-grid'>
<<<<<<< Updated upstream
      {teachers
        .filter(teacher => teacher && teacher._id && teacher.personalInfo)
        .map((teacher) => (
          <TeacherPreview
            key={teacher._id}
            teacher={teacher}
            onEdit={onEdit}
            onView={onView || onEdit}
            onRemove={onRemove}
            studentCount={teacherStudentCounts[teacher._id] || 0}
            authContext={authContext}
          />
        ))}
=======
      {teachers.map((teacher) => (
        <TeacherPreview
          key={teacher._id}
          teacher={teacher}
          onEdit={onEdit}
          onView={onView || onEdit}
          onRemove={onRemove}
          studentCount={teacherStudentCounts[teacher._id] || 0}
        />
      ))}
>>>>>>> Stashed changes
    </div>
  );
}
