import { useEffect, useState } from 'react';

interface UseScrollHideOptions {
  threshold?: number;
  hideDelay?: number;
}

export const useScrollHide = (options: UseScrollHideOptions = {}) => {
  const { threshold = 5, hideDelay = 100 } = options;
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        // Only trigger if scroll difference exceeds threshold
        if (Math.abs(currentScrollY - lastScrollY) > threshold) {
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down and past initial scroll
            setIsHidden(true);
            // Hide browser UI by scrolling slightly
            if (window.innerHeight > 500) { // Only on mobile-like viewports
              window.scrollTo({
                top: currentScrollY + 1,
                behavior: 'smooth'
              });
            }
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up
            setIsHidden(false);
          }
          setLastScrollY(currentScrollY);
        }
      }, hideDelay);
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY, threshold, hideDelay]);

  return { isHidden };
};