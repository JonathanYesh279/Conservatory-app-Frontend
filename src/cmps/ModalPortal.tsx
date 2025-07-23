import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ModalPortal({ isOpen, onClose, children, className = '' }: ModalPortalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Create or get the portal container
  useEffect(() => {
    let container = document.getElementById('modal-portal-root');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-portal-root';
      container.className = 'modal-portal';
      document.body.appendChild(container);
    }
    
    setPortalContainer(container);
    
    return () => {
      // Clean up if this is the last modal
      const existingContainer = document.getElementById('modal-portal-root');
      if (existingContainer && !existingContainer.hasChildNodes()) {
        document.body.removeChild(existingContainer);
      }
    };
  }, []);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.classList.add('modal-open');
      
      // Add active class to portal
      const container = document.getElementById('modal-portal-root');
      if (container) {
        container.classList.add('modal-active');
      }
      
      // Trigger fade in animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      // Start fade out
      setIsVisible(false);
      
      // Remove active class from portal
      const container = document.getElementById('modal-portal-root');
      if (container) {
        container.classList.remove('modal-active');
      }
      
      // Restore body scroll after animation completes
      const timeoutId = setTimeout(() => {
        document.body.classList.remove('modal-open');
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !portalContainer) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not its children
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className={`modal-overlay ${isVisible ? 'modal-overlay-visible' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`modal-content ${className}`}>
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, portalContainer);
}