import React, { useState, useRef, useEffect } from 'react';
import { User, Search, ChevronDown, Check } from 'lucide-react';

interface Teacher {
  _id: string;
  personalInfo: {
    fullName: string;
  };
  professionalInfo?: {
    instrument?: string;
  };
  isActive: boolean;
}

interface NewTeacherInfo {
  _id?: string;
  fullName: string;
  instrument?: string;
}

interface SearchableTeacherSelectProps {
  teachers: Teacher[];
  selectedTeacherId: string;
  onSelect: (teacherId: string) => void;
  newTeacherInfo?: NewTeacherInfo | null;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchableTeacherSelect({
  teachers,
  selectedTeacherId,
  onSelect,
  newTeacherInfo,
  isLoading = false,
  disabled = false,
  placeholder = "בחר מורה",
  className = ""
}: SearchableTeacherSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prepare all teacher options including new teacher
  const allTeachers = React.useMemo(() => {
    const teacherOptions = teachers
      .filter(teacher => teacher.isActive)
      .map(teacher => ({
        id: teacher._id,
        name: teacher.personalInfo.fullName,
        instrument: teacher.professionalInfo?.instrument,
        isNew: false
      }));

    if (newTeacherInfo) {
      teacherOptions.unshift({
        id: 'new-teacher',
        name: newTeacherInfo.fullName,
        instrument: newTeacherInfo.instrument,
        isNew: true
      });
    }

    return teacherOptions;
  }, [teachers, newTeacherInfo]);

  // Filter teachers based on search term
  const filteredTeachers = React.useMemo(() => {
    if (!searchTerm.trim()) return allTeachers;
    
    const searchLower = searchTerm.toLowerCase();
    return allTeachers.filter(teacher => 
      teacher.name.toLowerCase().includes(searchLower) ||
      (teacher.instrument && teacher.instrument.toLowerCase().includes(searchLower))
    );
  }, [allTeachers, searchTerm]);

  // Get selected teacher display name
  const selectedTeacher = allTeachers.find(t => t.id === selectedTeacherId);
  const displayValue = selectedTeacher ? selectedTeacher.name : '';

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredTeachers.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredTeachers.length - 1
          );
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredTeachers[highlightedIndex]) {
          handleSelect(filteredTeachers[highlightedIndex].id);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle teacher selection
  const handleSelect = (teacherId: string) => {
    onSelect(teacherId);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHighlightedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div 
      className={`searchable-teacher-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
      ref={containerRef}
    >
      <div className="select-input-container">
        <div className="select-input-wrapper">
          <User size={16} className="input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="select-input"
            value={isOpen ? searchTerm : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={selectedTeacherId ? displayValue : placeholder}
            disabled={disabled || isLoading}
            autoComplete="off"
          />
          <button
            type="button"
            className="dropdown-toggle"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled || isLoading}
            aria-label="פתח רשימת מורים"
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <ChevronDown 
                size={16} 
                className={`chevron ${isOpen ? 'rotated' : ''}`} 
              />
            )}
          </button>
        </div>
        
        {isOpen && (
          <div className="dropdown-menu" ref={dropdownRef}>
            {filteredTeachers.length === 0 ? (
              <div className="no-results">
                {searchTerm ? 'לא נמצאו מורים התואמים לחיפוש' : 'אין מורים זמינים'}
              </div>
            ) : (
              <>
                {!selectedTeacherId && (
                  <div 
                    className="dropdown-item placeholder-item"
                    onClick={() => handleSelect('')}
                  >
                    {placeholder}
                  </div>
                )}
                {filteredTeachers.map((teacher, index) => (
                  <div
                    key={teacher.id}
                    className={`dropdown-item ${
                      teacher.id === selectedTeacherId ? 'selected' : ''
                    } ${
                      index === highlightedIndex ? 'highlighted' : ''
                    } ${
                      teacher.isNew ? 'new-teacher' : ''
                    }`}
                    onClick={() => handleSelect(teacher.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="teacher-info">
                      <span className="teacher-name">{teacher.name}</span>
                      {teacher.instrument && (
                        <span className="teacher-instrument">({teacher.instrument})</span>
                      )}
                      {teacher.isNew && (
                        <span className="new-badge">מורה חדש</span>
                      )}
                    </div>
                    {teacher.id === selectedTeacherId && (
                      <Check size={16} className="check-icon" />
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      
      {searchTerm && isOpen && (
        <div className="search-info">
          <Search size={12} />
          <span>מחפש: "{searchTerm}" ({filteredTeachers.length} תוצאות)</span>
        </div>
      )}
    </div>
  );
}