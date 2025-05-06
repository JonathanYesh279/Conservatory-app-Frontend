// src/components/StudentDetails/StatusDropdown.tsx
import { useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface StatusDropdownProps {
  isOpen: boolean
  onToggle: () => void
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
  selectedValue?: string
  className?: string
}

export function StatusDropdown({
  isOpen,
  onToggle,
  options,
  onSelect,
  selectedValue,
  className = ''
}: StatusDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Position the dropdown when it's opened
  useEffect(() => {
    if (isOpen && dropdownRef.current && menuRef.current) {
    
     menuRef.current.style.top = '301px';
     menuRef.current.style.left = '14px';
    }
  }, [isOpen])
  
  return (
    <div ref={dropdownRef} className={`status-dropdown ${className}`}>
      <div className="dropdown-header" onClick={onToggle}>
        <ChevronDown size={14} className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && (
        <div ref={menuRef} className="dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`dropdown-item ${selectedValue === option.value ? 'selected' : ''}`}
              onClick={() => onSelect(option.value)}
            >
              {selectedValue === option.value && <Check size={12} />}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}