// src/cmps/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

export interface FilterOptions {
  instruments?: string[];
  sortOrder?: 'asc' | 'desc' | null;
  selectedInstruments?: string[];
}

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  availableInstruments: string[];
  currentFilters: FilterOptions;
  entityName: string; // "תלמידים", "מורים", etc.
}

export function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  availableInstruments,
  currentFilters,
  entityName
}: FilterModalProps) {
  const { modalProps, titleProps, descriptionProps } = useModalAccessibility({
    isOpen,
    onClose,
    modalId: 'filter-modal',
    restoreFocusOnClose: true
  });

  const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters);

  // Update local filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleInstrumentToggle = (instrument: string) => {
    const currentSelected = localFilters.selectedInstruments || [];
    const newSelected = currentSelected.includes(instrument)
      ? currentSelected.filter(i => i !== instrument)
      : [...currentSelected, instrument];
    
    setLocalFilters(prev => ({
      ...prev,
      selectedInstruments: newSelected
    }));
  };

  const handleSortOrderChange = (order: 'asc' | 'desc' | null) => {
    setLocalFilters(prev => ({
      ...prev,
      sortOrder: order
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterOptions = {
      selectedInstruments: [],
      sortOrder: null
    };
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  const hasActiveFilters = 
    (localFilters.selectedInstruments && localFilters.selectedInstruments.length > 0) ||
    localFilters.sortOrder !== null;

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} className="filter-modal">
      <div className="modal-content" {...modalProps}>
        {/* Hidden description for screen readers */}
        <div {...descriptionProps} className="sr-only">
          טופס סינון וסידור {entityName} במערכת
        </div>

        {/* Header */}
        <div className="modal-header">
          <button
            className="btn-icon close-btn"
            onClick={onClose}
            aria-label="סגור"
          >
            <X size={20} />
          </button>
          <h2 {...titleProps}>
            <Filter size={20} />
            סינון {entityName}
          </h2>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Instruments Filter */}
          {availableInstruments.length > 0 && (
            <div className="filter-section">
              <h3>סינון לפי כלי נגינה</h3>
              <div className="instrument-grid">
                {availableInstruments.map(instrument => (
                  <label key={instrument} className="instrument-checkbox">
                    <input
                      type="checkbox"
                      checked={localFilters.selectedInstruments?.includes(instrument) || false}
                      onChange={() => handleInstrumentToggle(instrument)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="instrument-name">{instrument}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Alphabetical Sorting */}
          <div className="filter-section">
            <h3>סידור לפי סדר א-ב</h3>
            <div className="sort-options">
              <button
                className={`sort-btn ${localFilters.sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => handleSortOrderChange(localFilters.sortOrder === 'asc' ? null : 'asc')}
              >
                <SortAsc size={18} />
                א-ת (עולה)
              </button>
              <button
                className={`sort-btn ${localFilters.sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => handleSortOrderChange(localFilters.sortOrder === 'desc' ? null : 'desc')}
              >
                <SortDesc size={18} />
                ת-א (יורד)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn secondary"
            onClick={handleClear}
            disabled={!hasActiveFilters}
          >
            נקה הכל
          </button>
          <button
            className="btn primary"
            onClick={handleApply}
          >
            החל סינון
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}