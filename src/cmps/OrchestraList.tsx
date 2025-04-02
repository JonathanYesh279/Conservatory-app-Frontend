// src/cmps/OrchestraList.tsx
import { Orchestra } from '../services/orchestraService';
import { OrchestraPreview } from './OrchestraPreview';

interface OrchestraListProps {
  orchestras: Orchestra[];
  isLoading: boolean;
  onEdit?: (orchestraId: string) => void;
  onView: (orchestraId: string) => void;
  onRemove?: (orchestraId: string) => void;
}

export function OrchestraList({
  orchestras,
  isLoading,
  onEdit,
  onView,
  onRemove,
}: OrchestraListProps) {
  if (isLoading && orchestras.length === 0) {
    return <div className='loading-state'>טוען תזמורות...</div>;
  }

  if (orchestras.length === 0) {
    return (
      <div className='empty-state'>
        <p>לא נמצאו תזמורות להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף תזמורות חדשות</p>
      </div>
    );
  }

  return (
    <div className='orchestra-grid'>
      {orchestras.map((orchestra) => (
        <OrchestraPreview
          key={orchestra._id}
          orchestra={orchestra}
          onEdit={onEdit}
          onView={onView}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
