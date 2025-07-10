import React from 'react';
import { useToast } from './';

const ToastTest: React.FC = () => {
  const { addToast } = useToast();

  const showSuccessToast = () => {
    addToast({
      type: 'success',
      message: 'This is a success toast',
      onUndo: () => console.log('Undo clicked'),
    });
  };

  const showWarningToast = () => {
    addToast({
      type: 'warning',
      message: 'This is a warning toast',
    });
  };

  const showDangerToast = () => {
    addToast({
      type: 'danger',
      message: 'This is a danger toast',
    });
  };

  const showInfoToast = () => {
    addToast({
      type: 'info',
      message: 'This is an info toast',
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Toast Test</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={showSuccessToast}>Success Toast</button>
        <button onClick={showWarningToast}>Warning Toast</button>
        <button onClick={showDangerToast}>Danger Toast</button>
        <button onClick={showInfoToast}>Info Toast</button>
      </div>
    </div>
  );
};

export default ToastTest;