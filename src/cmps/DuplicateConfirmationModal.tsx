// src/cmps/DuplicateConfirmationModal.tsx
import { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Shield,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { DuplicateDetectionInfo, DuplicateMatch } from '../utils/errorHandler';

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateInfo: DuplicateDetectionInfo;
  onConfirm: (forceCreate: boolean) => void;
  onCancel: () => void;
  isAdmin?: boolean;
  isSubmitting?: boolean;
}

export function DuplicateConfirmationModal({
  isOpen,
  onClose,
  duplicateInfo,
  onConfirm,
  onCancel,
  isAdmin = false,
  isSubmitting = false
}: DuplicateConfirmationModalProps) {
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  if (!isOpen) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'HIGH':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'MEDIUM':
        return <Info className="text-yellow-600" size={20} />;
      case 'LOW':
        return <CheckCircle className="text-blue-600" size={20} />;
      default:
        return <Info className="text-gray-600" size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-50';
      case 'HIGH':
        return 'border-orange-500 bg-orange-50';
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50';
      case 'LOW':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'fullName':
        return <User size={16} />;
      case 'phone':
        return <Phone size={16} />;
      case 'email':
        return <Mail size={16} />;
      case 'address':
        return <MapPin size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'fullName':
        return 'שם מלא';
      case 'phone':
        return 'טלפון';
      case 'email':
        return 'דוא"ל';
      case 'address':
        return 'כתובת';
      default:
        return field;
    }
  };

  const renderDuplicateMatch = (match: DuplicateMatch, index: number) => (
    <div key={index} className={`duplicate-match ${getSeverityColor(match.severity)}`}>
      <div className="match-header">
        <div className="severity-info">
          {getSeverityIcon(match.severity)}
          <span className="severity-label">{match.severity}</span>
        </div>
        <div className="match-message">{match.message}</div>
      </div>
      
      <div className="conflicting-fields">
        <span className="fields-label">שדות מתנגשים:</span>
        <div className="fields-list">
          {match.conflictingFields.map((field, i) => (
            <div key={i} className="field-item">
              {getFieldIcon(field)}
              <span>{getFieldLabel(field)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {match.note && (
        <div className="match-note">
          <Info size={14} />
          <span>{match.note}</span>
        </div>
      )}
      
      {match.matches && match.matches.length > 0 && (
        <div className="existing-matches">
          <span className="matches-label">מורים קיימים:</span>
          {match.matches.map((existingTeacher, i) => (
            <div key={i} className="existing-teacher">
              <User size={14} />
              <span>{existingTeacher.personalInfo?.fullName || 'לא מצוין'}</span>
              <span className="teacher-details">
                {existingTeacher.personalInfo?.phone} | {existingTeacher.personalInfo?.email}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleConfirm = () => {
    if (isAdmin && showAdminOverride) {
      // Admin override with reason
      onConfirm(true);
    } else if (!duplicateInfo.blocked) {
      // Normal confirmation for warnings
      onConfirm(false);
    }
  };

  const handleAdminOverride = () => {
    if (overrideReason.trim()) {
      onConfirm(true);
    }
  };

  return (
    <div className="duplicate-confirmation-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>זיהוי כפילויות</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="duplicate-summary">
            <div className="summary-icon">
              {duplicateInfo.blocked ? (
                <AlertCircle className="text-red-600" size={24} />
              ) : (
                <AlertTriangle className="text-orange-600" size={24} />
              )}
            </div>
            <div className="summary-text">
              <h3>
                {duplicateInfo.blocked ? 'יצירה חסומה' : 'אזהרת כפילות'}
              </h3>
              <p>{duplicateInfo.reason}</p>
            </div>
          </div>

          {/* Critical/High Duplicates */}
          {duplicateInfo.duplicates && duplicateInfo.duplicates.length > 0 && (
            <div className="duplicates-section">
              <h4>כפילויות זוהו:</h4>
              {duplicateInfo.duplicates.map((duplicate, index) => 
                renderDuplicateMatch(duplicate, index)
              )}
            </div>
          )}

          {/* Warnings */}
          {duplicateInfo.warnings && duplicateInfo.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>אזהרות:</h4>
              {duplicateInfo.warnings.map((warning, index) => 
                renderDuplicateMatch(warning, index)
              )}
            </div>
          )}

          {/* Admin Override Section */}
          {isAdmin && duplicateInfo.blocked && (
            <div className="admin-override-section">
              <div className="admin-header">
                <Shield className="text-blue-600" size={20} />
                <span>עקיפת מנהל</span>
              </div>
              
              {!showAdminOverride ? (
                <button 
                  className="btn secondary"
                  onClick={() => setShowAdminOverride(true)}
                  disabled={isSubmitting}
                >
                  הצג אפשרויות מנהל
                </button>
              ) : (
                <div className="override-form">
                  <label htmlFor="override-reason">סיבה לעקיפה:</label>
                  <textarea
                    id="override-reason"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="הסבר מדוע יש צורך ליצור מורה זה למרות הכפילות..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                  <div className="override-actions">
                    <button 
                      className="btn danger"
                      onClick={handleAdminOverride}
                      disabled={!overrideReason.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'יוצר...' : 'עקוף ויצור'}
                    </button>
                    <button 
                      className="btn secondary"
                      onClick={() => setShowAdminOverride(false)}
                      disabled={isSubmitting}
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {duplicateInfo.blocked && !showAdminOverride ? (
            <div className="blocked-actions">
              <button 
                className="btn secondary" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                חזור לעריכה
              </button>
              <button 
                className="btn secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                ביטול
              </button>
            </div>
          ) : (
            <div className="warning-actions">
              <button 
                className="btn primary" 
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'יוצר...' : 'המשך בכל זאת'}
              </button>
              <button 
                className="btn secondary" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                חזור לעריכה
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}