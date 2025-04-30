// src/context/NavbarContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// Define the context type
interface NavbarContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  hideNavbar: () => void;
  showNavbar: () => void;
  hideForModal: () => void;
  showAfterModal: () => void;
}

// Create context with default values
const NavbarContext = createContext<NavbarContextType>({
  isVisible: true,
  setIsVisible: () => {},
  hideNavbar: () => {},
  showNavbar: () => {},
  hideForModal: () => {},
  showAfterModal: () => {},
});

// Hook to use the context
export const useNavbar = () => useContext(NavbarContext);

interface NavbarProviderProps {
  children: ReactNode;
}

export const NavbarProvider: React.FC<NavbarProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [scrollHidden, setScrollHidden] = useState(false);

  // Track scroll position
  useEffect(() => {
    // Find the scrollable container
    const scrollContainer = document.querySelector('.app-container');
    if (!scrollContainer) return;

    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;

      // Determine scroll direction and update visibility
      if (currentScrollY > lastScrollY + 5) {
        // Scrolling DOWN - hide
        setScrollHidden(true);
      } else if (currentScrollY < lastScrollY - 5) {
        // Scrolling UP - show
        setScrollHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    // Add event listener
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Determine overall visibility based on both scroll position and modal state
  useEffect(() => {
    setIsVisible(!modalOpen && !scrollHidden);
  }, [modalOpen, scrollHidden]);

  // Functions to control navbar visibility
  const hideNavbar = () => setScrollHidden(true);
  const showNavbar = () => setScrollHidden(false);

  // Functions to handle modal state
  const hideForModal = () => setModalOpen(true);
  const showAfterModal = () => setModalOpen(false);

  const value = {
    isVisible,
    setIsVisible,
    hideNavbar,
    showNavbar,
    hideForModal,
    showAfterModal,
  };

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
};
