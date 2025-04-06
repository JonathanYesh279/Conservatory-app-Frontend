// src/cmps/TeacherList.tsx
import { Teacher } from '../services/teacherService';
import { TeacherPreview } from './TeacherPreview.tsx';

interface TeacherListProps {
  teachers: Teacher[];
  isLoading: boolean;
  onEdit: (teacherId: string) => void;
  onView?: (teacherId: string) => void;
  onRemove?: (teacherId: string) => void;
}

export function TeacherList({
  teachers,
  isLoading,
  onEdit,
  onView,
  onRemove,
}: TeacherListProps) {
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
      {teachers.map((teacher) => (
        <TeacherPreview
          key={teacher._id}
          teacher={teacher}
          onEdit={onEdit}
          onView={onView || onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
