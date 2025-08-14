// src/context/NavbarContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
<<<<<<< Updated upstream
import { mobileUIController } from '../utils/mobileUIUtils';
=======
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  // Handle scroll-based navbar and browser UI hiding
  useEffect(() => {

    // Check if we're on mobile
    const isMobile = () => {
      const debugMobile = localStorage.getItem('debug-mobile-ui') === 'true';
      return debugMobile || 
             /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             (window.innerWidth <= 768 && 'ontouchstart' in window);
    };

    if (!isMobile()) {
      setScrollHidden(false);
      return;
    }

    // Find the main scrollable container
    const getScrollContainer = () => {
      return document.querySelector('.app-container') || 
             document.querySelector('main') || 
             document.documentElement;
    };

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    let lastScrollY = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = scrollContainer.scrollTop || window.pageYOffset;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY);
          
          // Only trigger on significant scroll movement
          if (scrollDifference > 10) {
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
              // Scrolling DOWN - hide navbar and browser UI
              if (localStorage.getItem('debug-mobile-ui') === 'true') {
                console.log('📱 Scroll DOWN detected, hiding navbar');
              }
              setScrollHidden(true);
              mobileUIController.hideBrowserUI();
            } else if (currentScrollY < lastScrollY) {
              // Scrolling UP - show navbar and browser UI
              if (localStorage.getItem('debug-mobile-ui') === 'true') {
                console.log('📱 Scroll UP detected, showing navbar');
              }
              setScrollHidden(false);
              mobileUIController.showBrowserUI();
            }
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener to both window and container
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollContainer !== document.documentElement) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Touch event handling for mobile
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      touchStartY = touchEvent.changedTouches[0].screenY;
    };

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent;
      touchEndY = touchEvent.changedTouches[0].screenY;
      const touchDifference = Math.abs(touchEndY - touchStartY);
      
      if (touchDifference > 30) {
        if (touchEndY < touchStartY) {
          // Swiping UP (scrolling down) - hide
          setScrollHidden(true);
          mobileUIController.hideBrowserUI();
        } else {
          // Swiping DOWN (scrolling up) - show
          setScrollHidden(false);
          mobileUIController.showBrowserUI();
        }
      }
    };

    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer !== document.documentElement) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      mobileUIController.showBrowserUI();
=======
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
>>>>>>> Stashed changes
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
