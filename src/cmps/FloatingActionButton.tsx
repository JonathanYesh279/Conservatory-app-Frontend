// src/cmps/FloatingActionButton.tsx
import { Plus } from 'lucide-react';
import { ReactNode } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  icon?: ReactNode;
  color?: string;
}

export function FloatingActionButton({ 
  onClick, 
  ariaLabel = "הוספה", 
  icon = <Plus size={24} />,
  color
}: FloatingActionButtonProps) {
  // Allow custom color or use the default primary color from CSS variables
  const buttonStyle = color ? { backgroundColor: color } : undefined;

  return (
    <button 
      className="floating-action-button" 
      onClick={onClick} 
      aria-label={ariaLabel}
      style={buttonStyle}
    >
      {icon}
    </button>
  );
}