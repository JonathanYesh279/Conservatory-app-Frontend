// src/cmps/RehearsalDeleteDialog.tsx
import { useState } from 'react';
import { AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { ModalPortal } from './ModalPortal';

interface RehearsalDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orchestraName: string;
  orchestraRehearsalsCount: number;
  onDeleteSingle: () => void;
  onDeleteAll: () => void;
}

export function RehearsalDeleteDialog({
  isOpen,
  onClose,
  orchestraName,
  orchestraRehearsalsCount,
  onDeleteSingle,
  onDeleteAll,
}: RehearsalDeleteDialogProps) {
  const [deleteType, setDeleteType] = useState<'single' | 'all' | null>(null);

  const handleDeleteSingle = () => {
    setDeleteType('single');
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
  };

  const handleConfirmDelete = () => {
    if (deleteType === 'single') {
      onDeleteSingle();
    } else if (deleteType === 'all') {
      onDeleteAll();
    }
    setDeleteType(null);
    onClose();
  };

  const handleCancel = () => {
    setDeleteType(null);
    onClose();
  };

  // If a delete type is selected, show the confirmation dialog
  if (deleteType) {
    const isDeleteAll = deleteType === 'all';
    return (
      <ConfirmDialog
        isOpen={true}
        onClose={() => setDeleteType(null)}
        onConfirm={handleConfirmDelete}
        title={isDeleteAll ? 'מחיקת כל החזרות' : 'מחיקת חזרה'}
        message={
          isDeleteAll
            ? `האם אתה בטוח שברצונך למחוק את כל ${orchestraRehearsalsCount} החזרות של "${orchestraName}"? פעולה זו לא ניתנת לביטול.`
            : 'האם אתה בטוח שברצונך למחוק חזרה זו? פעולה זו לא ניתנת לביטול.'
        }
        confirmText={isDeleteAll ? `מחק ${orchestraRehearsalsCount} חזרות` : 'מחק חזרה'}
        cancelText="ביטול"
        type="danger"
      />
    );
  }

  // Main selection dialog
  return (
    <ModalPortal isOpen={isOpen} onClose={handleCancel}>
      <div className="rehearsal-delete-dialog">
        <div className="dialog-header">
          <AlertTriangle size={24} className="warning-icon" />
          <h3>מחיקת חזרה</h3>
        </div>

        <div className="dialog-content">
          <p>בחר את סוג המחיקה שברצונך לבצע:</p>
          
          <div className="delete-options">
            <button
              className="delete-option-btn single"
              onClick={handleDeleteSingle}
            >
              <Trash2 size={20} />
              <div className="option-content">
                <div className="option-title">מחק חזרה זו בלבד</div>
                <div className="option-description">מחיקה של חזרה יחידה זו</div>
              </div>
            </button>

            <button
              className="delete-option-btn bulk"
              onClick={handleDeleteAll}
            >
              <Calendar size={20} />
              <div className="option-content">
                <div className="option-title">מחק את כל החזרות של "{orchestraName}"</div>
                <div className="option-description">
                  מחיקה של כל {orchestraRehearsalsCount} החזרות של התזמורת
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn secondary" onClick={handleCancel}>
            ביטול
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}