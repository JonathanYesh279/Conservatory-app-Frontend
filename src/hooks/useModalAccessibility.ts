import { useEffect, useRef, useCallback } from 'react';

interface UseModalAccessibilityProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  restoreFocusOnClose?: boolean;
}

export const useModalAccessibility = ({
  isOpen,
  onClose,
  modalId = 'modal',
  restoreFocusOnClose = true
}: UseModalAccessibilityProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);
  const isInitialMount = useRef(true);

  // Store the element that had focus before the modal opened
  useEffect(() => {
    if (isOpen && isInitialMount.current) {
      previousActiveElementRef.current = document.activeElement;
      isInitialMount.current = false;
    }
  }, [isOpen]);

  // Handle ESC key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      onClose();
    }
  }, [isOpen, onClose]);

  // Focus trap functionality
  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !modalRef.current) return;

    if (event.key === 'Tab') {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [isOpen]);

  // Set up event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', trapFocus);
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      // Focus the modal container or first focusable element
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown, trapFocus]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && restoreFocusOnClose && previousActiveElementRef.current) {
      const elementToFocus = previousActiveElementRef.current as HTMLElement;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        setTimeout(() => {
          elementToFocus.focus();
        }, 100);
      }
      previousActiveElementRef.current = null;
      isInitialMount.current = true;
    }
  }, [isOpen, restoreFocusOnClose]);

  // Return modal props with accessibility attributes
  const modalProps = {
    ref: modalRef,
    role: 'dialog' as const,
    'aria-modal': true,
    'aria-labelledby': `${modalId}-title`,
    'aria-describedby': `${modalId}-description`,
    tabIndex: -1
  };

  const titleProps = {
    id: `${modalId}-title`
  };

  const descriptionProps = {
    id: `${modalId}-description`
  };

  return {
    modalProps,
    titleProps,
    descriptionProps,
    modalRef
  };
};