// src/cmps/StudentList.tsx
import { Student } from '../services/studentService';
import { StudentPreview } from './StudentPreview';

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
  onEdit: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
}

export function StudentList({
  students,
  isLoading,
  onEdit,
  onRemove,
}: StudentListProps) {
  if (isLoading && students.length === 0) {
    return <div className='loading-state'>טוען תלמידים...</div>;
  }

  if (students.length === 0) {
    return (
      <div className='empty-state'>
        <p>לא נמצאו תלמידים להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף תלמידים חדשים</p>
      </div>
    );
  }

  return (
    <div className='student-grid'>
      {students.map((student) => (
        <StudentPreview
          key={student._id}
          student={student}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
