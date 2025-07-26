// src/cmps/RehearsalBulkUpdateDialog.tsx
import { useState } from 'react';
import { AlertTriangle, Calendar, Music } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { ModalPortal } from './ModalPortal';

interface RehearsalBulkUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orchestraName: string;
  rehearsalCount: number;
  changes: string[];
  onConfirmUpdate: () => void;
}

export function RehearsalBulkUpdateDialog({
  isOpen,
  onClose,
  orchestraName,
  rehearsalCount,
  changes,
  onConfirmUpdate,
}: RehearsalBulkUpdateDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleProceedToUpdate = () => {
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = () => {
    onConfirmUpdate();
    setShowConfirmation(false);
    onClose();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    onClose();
  };

  // If confirmation is shown, display the final confirmation dialog
  if (showConfirmation) {
    return (
      <ConfirmDialog
        isOpen={true}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmUpdate}
        title="אישור עדכון כל החזרות"
        message={
          <>
            <p><strong>פעולה זו תעדכן את כל {rehearsalCount} החזרות של "{orchestraName}"</strong></p>
            <p>השינויים יוחלו על כל החזרות הקיימות. פעולה זו לא ניתנת לביטול.</p>
            <p className="text-sm text-muted">האם אתה בטוח שברצונך להמשיך?</p>
          </>
        }
        confirmText={`עדכן ${rehearsalCount} חזרות`}
        cancelText="ביטול"
        type="warning"
      />
    );
  }

  // Main selection dialog
  return (
    <ModalPortal isOpen={isOpen} onClose={handleCancel}>
      <div className="rehearsal-bulk-update-dialog">
        <div className="dialog-header">
          <AlertTriangle size={24} className="warning-icon" />
          <h3>עדכון כל החזרות</h3>
        </div>

        <div className="dialog-content">
          <div className="orchestra-info">
            <Music size={20} />
            <div>
              <div className="orchestra-name">{orchestraName}</div>
              <div className="rehearsal-count">{rehearsalCount} חזרות</div>
            </div>
          </div>

          <div className="changes-summary">
            <h4>השינויים שיוחלו:</h4>
            <ul className="changes-list">
              {changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>

          <div className="warning-message">
            <Calendar size={18} />
            <p>
              השינויים יוחלו על כל החזרות הקיימות של התזמורת.
              פעולה זו תשפיע על {rehearsalCount} חזרות.
            </p>
          </div>
        </div>

        <div className="dialog-actions">
          <button 
            className="btn primary" 
            onClick={handleProceedToUpdate}
          >
            בצע עבור כל החזרות
          </button>
          <button 
            className="btn secondary" 
            onClick={handleCancel}
          >
            ביטול
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}