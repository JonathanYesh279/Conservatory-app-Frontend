// src/cmps/TeacherList.tsx
import { Teacher } from '../services/teacherService';
import { TeacherPreview } from './TeacherPreview';

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
          onView={onView || onEdit} // Use view handler or fall back to edit
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
