// src/cmps/FilterDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';

export interface FilterDropdownOptions {
  instruments?: string[];
  ageRange?: [number, number] | null;
  classRange?: [number, number] | null;  
  sortOrder?: 'asc' | 'desc' | null;
}

interface FilterDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onApplyFilters: (filters: FilterDropdownOptions) => void;
  availableInstruments?: string[];
  ageRange?: [number, number];
  classRange?: [number, number];
  currentFilters: FilterDropdownOptions;
  hasActiveFilters: boolean;
  entityType: 'students' | 'teachers' | 'orchestras';
}

export function FilterDropdown({
  isOpen,
  onToggle,
  onApplyFilters,
  availableInstruments = [],
  ageRange,
  classRange,
  currentFilters,
  hasActiveFilters,
  entityType
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localFilters, setLocalFilters] = useState<FilterDropdownOptions>(currentFilters);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Update local filters when current filters change
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInstrumentToggle = (instrument: string) => {
    const currentInstruments = localFilters.instruments || [];
    const newInstruments = currentInstruments.includes(instrument)
      ? currentInstruments.filter(i => i !== instrument)
      : [...currentInstruments, instrument];
    
    const newFilters = { ...localFilters, instruments: newInstruments };
    setLocalFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const handleAgeRangeChange = (range: [number, number] | null) => {
    const newFilters = { ...localFilters, ageRange: range };
    setLocalFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const handleClassRangeChange = (range: [number, number] | null) => {
    const newFilters = { ...localFilters, classRange: range };
    setLocalFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const handleSortChange = (sortOrder: 'asc' | 'desc' | null) => {
    const newFilters = { ...localFilters, sortOrder };
    setLocalFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterDropdownOptions = {
      instruments: [],
      ageRange: null,
      classRange: null,
      sortOrder: null
    };
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="filter-dropdown">
      <div className="filter-dropdown-header">
        <span className="filter-title">סינון</span>
        {hasActiveFilters && (
          <button 
            className="clear-filters-btn"
            onClick={handleClearFilters}
            title="נקה סינונים"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="filter-dropdown-content">
        {/* Instruments Filter (or Type Filter for orchestras) */}
        {availableInstruments.length > 0 && (
          <div className="filter-section">
            <div className="filter-section-title">
              {entityType === 'orchestras' ? 'סוג' : 'כלי'}
            </div>
            <div className="filter-options">
              {availableInstruments.map(instrument => (
                <div key={instrument} className="toggle-option">
                  <span className="toggle-option-text">{instrument}</span>
                  <div 
                    className={`toggle-switch ${(localFilters.instruments || []).includes(instrument) ? 'active' : ''}`}
                    onClick={() => handleInstrumentToggle(instrument)}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Age Range Filter (for students) */}
        {entityType === 'students' && ageRange && (
          <div className="filter-section">
            <div className="filter-section-title">גיל</div>
            <div className="range-slider-container">
              <div className="range-values">
                <span>מ-{localFilters.ageRange?.[0] || ageRange[0]}</span>
                <span>עד-{localFilters.ageRange?.[1] || ageRange[1]}</span>
              </div>
              <input
                type="range"
                min={ageRange[0]}
                max={ageRange[1]}
                value={localFilters.ageRange?.[0] || ageRange[0]}
                className="blue-slider age-slider"
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  const currentMax = localFilters.ageRange?.[1] || ageRange[1];
                  handleAgeRangeChange([newMin, Math.max(newMin, currentMax)]);
                }}
              />
              <input
                type="range"
                min={ageRange[0]}
                max={ageRange[1]}
                value={localFilters.ageRange?.[1] || ageRange[1]}
                className="blue-slider age-slider"
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  const currentMin = localFilters.ageRange?.[0] || ageRange[0];
                  handleAgeRangeChange([Math.min(currentMin, newMax), newMax]);
                }}
              />
            </div>
          </div>
        )}

        {/* Class Range Filter (for students) */}
        {entityType === 'students' && classRange && (
          <div className="filter-section">
            <div className="filter-section-title">כיתה</div>
            <div className="range-slider-container">
              <div className="range-values">
                <span>מ-{localFilters.classRange?.[0] || classRange[0]}</span>
                <span>עד-{localFilters.classRange?.[1] || classRange[1]}</span>
              </div>
              <input
                type="range"
                min={classRange[0]}
                max={classRange[1]}
                value={localFilters.classRange?.[0] || classRange[0]}
                className="blue-slider class-slider"
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  const currentMax = localFilters.classRange?.[1] || classRange[1];
                  handleClassRangeChange([newMin, Math.max(newMin, currentMax)]);
                }}
              />
              <input
                type="range"
                min={classRange[0]}
                max={classRange[1]}
                value={localFilters.classRange?.[1] || classRange[1]}
                className="blue-slider class-slider"
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  const currentMin = localFilters.classRange?.[0] || classRange[0];
                  handleClassRangeChange([Math.min(currentMin, newMax), newMax]);
                }}
              />
            </div>
          </div>
        )}

        {/* Sorting */}
        <div className="filter-section">
          <div className="filter-section-title">מיון א-ת</div>
          <div className="sort-options">
            <button
              className={`sort-btn ${localFilters.sortOrder === 'asc' ? 'active' : ''}`}
              onClick={() => handleSortChange(localFilters.sortOrder === 'asc' ? null : 'asc')}
            >
              עולה
            </button>
            <button
              className={`sort-btn ${localFilters.sortOrder === 'desc' ? 'active' : ''}`}
              onClick={() => handleSortChange(localFilters.sortOrder === 'desc' ? null : 'desc')}
            >
              יורד
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}