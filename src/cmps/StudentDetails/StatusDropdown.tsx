// src/components/StudentDetails/StatusDropdown.tsx
import { useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface StatusDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  className?: string;
}

export function StatusDropdown({
  isOpen,
  onToggle,
  options,
  onSelect,
  selectedValue,
  className = '',
}: StatusDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the dropdown when it's opened
  useEffect(() => {
    if (isOpen && dropdownRef.current && menuRef.current) {
      // Set appropriate positioning for the dropdown menu
      const rect = dropdownRef.current.getBoundingClientRect();
      menuRef.current.style.top = `${rect.height}px`;
      menuRef.current.style.left = '0px';
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`sd-status-dropdown ${className}`}>
      <div className='sd-dropdown-header' onClick={onToggle}>
        <ChevronDown
          size={14}
          className={`sd-dropdown-icon ${isOpen ? 'open' : ''}`}
        />
      </div>

      {isOpen && (
        <div ref={menuRef} className='sd-dropdown-menu'>
          {options.map((option) => (
            <div
              key={option.value}
              className={`sd-dropdown-item ${
                selectedValue === option.value ? 'selected' : ''
              }`}
              onClick={() => onSelect(option.value)}
            >
              {selectedValue === option.value && <Check size={12} />}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
