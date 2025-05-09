// src/cmps/StudentDetails/StudentHeader.tsx
import React from 'react';
import { ArrowLeft, Edit, Trash2, Music } from 'lucide-react';
import { useStudentDetailsState } from '../../hooks/useStudentDetailsState';

interface StudentHeaderProps {
  onEdit?: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
}

export function StudentHeader({ onEdit, onRemove }: StudentHeaderProps) {
  const {
    student,
    isLoading,
    goBack,
    toggleFlip,
    getInitials,
    getStageColor,
    primaryInstrument,
  } = useStudentDetailsState();

  if (isLoading || !student) {
    return (
      <div className='student-header skeleton'>
        <div className='back-button'>
          <ArrowLeft size={20} />
        </div>
        <div className='header-content'>
          <div className='avatar skeleton-avatar'></div>
          <div className='student-info'>
            <div className='skeleton-text skeleton-title'></div>
            <div className='skeleton-text'></div>
          </div>
        </div>
      </div>
    );
  }

  // Get current stage from primary instrument
  const currentStage = primaryInstrument?.currentStage || 1;

  return (
    <div className='card-header'>
      <div className='student-identity'>
        <div
          className='avatar avatar-clickable'
          style={{ backgroundColor: getStageColor(currentStage) }}
          onClick={toggleFlip}
        >
          {getInitials(student.personalInfo.fullName)}
        </div>

        <div className='header-text'>
          <h1 className='student-name'>{student.personalInfo.fullName}</h1>

          <div className='instrument'>
            {primaryInstrument ? (
              <>
                <Music size={14} />
                <span>
                  {primaryInstrument.instrumentName} - שלב {currentStage}
                </span>
              </>
            ) : (
              <span>כיתה {student.academicInfo.class}</span>
            )}
          </div>
        </div>
      </div>

      <div className='header-badges'>
        <div className='class-badge'>כיתה {student.academicInfo.class}</div>

        {(onEdit || onRemove) && (
          <div className='header-actions'>
            {onEdit && (
              <button
                className='action-btn edit'
                onClick={() => onEdit(student._id)}
                aria-label='ערוך תלמיד'
              >
                <Edit size={18} />
              </button>
            )}

            {onRemove && (
              <button
                className='action-btn delete'
                onClick={() => onRemove(student._id)}
                aria-label='מחק תלמיד'
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}

        <button className='back-button' onClick={goBack} aria-label='חזרה'>
          <ArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
