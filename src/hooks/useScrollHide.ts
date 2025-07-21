import { useEffect, useState, useRef } from 'react';
import { mobileUIController } from '../utils/mobileUIUtils';

export function useScrollHide() {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const lastTouchY = useRef(0);
  const scrollDirection = useRef(0);
  const touchStartTime = useRef(0);

  useEffect(() => {
    // Enhanced iOS Safari detection
    const isIOSSafari = () => {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|OPiOS|mercury/i.test(ua);
      const isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
      return isIOS && (isSafari || isWebView);
    };

    const isMobile = () => {
      return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    if (!isMobile()) {
      return;
    }

    // Debug mode - disable for production
    const debug = false;
    
    // Simple timer-based approach for iOS Safari
    let hideTimer: NodeJS.Timeout | null = null;
    let lastActivity = Date.now();
    if (debug) {
      console.log('🔧 useScrollHide: Setup started');
      console.log('📱 iOS Safari detected:', isIOSSafari());
      console.log('📏 Screen dimensions:', window.innerWidth, 'x', window.innerHeight);
    }

    // Get the actual scrollable container - check multiple possibilities
    const getScrollContainer = () => {
      // Try multiple selectors to find the real scrollable element
      const containers = [
        document.querySelector('.app-container'),
        document.querySelector('.main-content'), 
        document.querySelector('main'),
        document.querySelector('[data-scroll="true"]'),
        document.documentElement
      ];
      
      for (const container of containers) {
        if (container && container.scrollHeight > container.clientHeight) {
          return container;
        }
      }
      
      return document.documentElement;
    };

    // More aggressive scroll detection for iOS Safari
    const handleScroll = (e?: Event) => {
      const scrollContainer = getScrollContainer();
      const currentScrollY = scrollContainer?.scrollTop || window.pageYOffset || document.documentElement.scrollTop;
      const scrollDiff = currentScrollY - lastScrollY.current;
      
      if (debug) {
        console.log('📊 SCROLL:', {
          container: scrollContainer?.className || 'window',
          current: currentScrollY,
          last: lastScrollY.current,
          diff: scrollDiff,
          hidden: isHidden
        });
      }
      
      // Ultra sensitive thresholds - trigger on ANY scroll movement
      const threshold = 5;
      const sensitivity = 1;
      
      if (Math.abs(scrollDiff) > sensitivity && currentScrollY > threshold) {
        const shouldHide = scrollDiff > 0;
        
        if (shouldHide !== isHidden) {
          if (debug) {
            console.log(shouldHide ? '⬇️ SCROLL HIDING NAVBAR' : '⬆️ SCROLL SHOWING NAVBAR');
          }
          
          setIsHidden(shouldHide);
          
          if (shouldHide) {
            mobileUIController.hideBrowserUI();
          } else {
            mobileUIController.showBrowserUI();
          }
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    // Simplified touch detection - hide navbar on any downward swipe
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (touchEvent.touches && touchEvent.touches.length > 0) {
        lastTouchY.current = touchEvent.touches[0].clientY;
        touchStartTime.current = Date.now();
        lastActivity = Date.now();
        
        // Clear any existing hide timer
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        
        if (debug) {
          console.log('👆 TOUCH START:', lastTouchY.current);
        }
      }
    };

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (touchEvent.touches && touchEvent.touches.length > 0) {
        const currentTouchY = touchEvent.touches[0].clientY;
        const touchDiff = lastTouchY.current - currentTouchY;
        lastActivity = Date.now();
        
        if (debug) {
          console.log('👆 TOUCH MOVE:', {
            start: lastTouchY.current,
            current: currentTouchY,
            diff: touchDiff,
            isHidden: isHidden
          });
        }
        
        // Immediate hiding on downward swipe
        if (touchDiff > 10) {
          if (debug) {
            console.log('👆⬇️ IMMEDIATE TOUCH HIDING');
          }
          
          setIsHidden(true);
          mobileUIController.hideBrowserUI();
        }
        // Show on upward swipe
        else if (touchDiff < -10) {
          if (debug) {
            console.log('👆⬆️ IMMEDIATE TOUCH SHOWING');
          }
          
          setIsHidden(false);
          mobileUIController.showBrowserUI();
        }
        
        lastTouchY.current = currentTouchY;
      }
    };

    const handleTouchEnd = () => {
      if (debug) {
        console.log('👆 TOUCH END');
      }
      
      // Set timer to show navbar after inactivity
      hideTimer = setTimeout(() => {
        if (Date.now() - lastActivity > 3000) { // 3 seconds of inactivity
          if (debug) {
            console.log('⏰ INACTIVITY TIMER: Showing navbar');
          }
          setIsHidden(false);
          mobileUIController.showBrowserUI();
        }
      }, 3000);
    };

    // Special handling for iOS Safari momentum scrolling
    const handleScrollEnd = () => {
      if (debug) {
        console.log('📊 SCROLL END');
      }
    };

    // Add event listeners specifically targeting the app container
    const scrollContainer = getScrollContainer();
    
    if (scrollContainer) {
      // Primary scroll listener on the actual scrollable container
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      if (debug) {
        console.log('🎯 Scroll listener added to:', scrollContainer.className || scrollContainer.tagName);
      }
    }
    
    // Fallback scroll listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Touch listeners for iOS Safari
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Also add touch listeners to the scroll container
    if (scrollContainer) {
      scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
    
    // Find ALL potentially scrollable elements
    const allElements = document.querySelectorAll('*');
    const scrollableElements: Element[] = [];
    
    // Check every element for scrollability
    allElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const hasOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll';
      const isScrollable = element.scrollHeight > element.clientHeight;
      
      if (hasOverflow || isScrollable) {
        scrollableElements.push(element);
        element.addEventListener('scroll', handleScroll, { passive: true });
        
        if (debug) {
          console.log('🔍 Found scrollable element:', {
            tag: element.tagName,
            class: element.className,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            overflowY: style.overflowY,
            canScroll: isScrollable
          });
        }
      }
    });
    
    if (debug) {
      console.log('🎯 All scroll & touch events registered');
      console.log('📊 Primary container:', scrollContainer?.className || scrollContainer?.tagName || 'not found');
      console.log('📊 Found', scrollableElements.length, 'scrollable elements');
      
      // Detailed container analysis
      const appContainer = document.querySelector('.app-container');
      const mainContent = document.querySelector('.main-content');
      
      if (appContainer) {
        console.log('📏 App Container:', {
          scrollHeight: appContainer.scrollHeight,
          clientHeight: appContainer.clientHeight,
          scrollTop: appContainer.scrollTop,
          canScroll: appContainer.scrollHeight > appContainer.clientHeight
        });
      }
      
      if (mainContent) {
        console.log('📏 Main Content:', {
          scrollHeight: mainContent.scrollHeight,
          clientHeight: mainContent.clientHeight,
          scrollTop: mainContent.scrollTop,
          canScroll: mainContent.scrollHeight > mainContent.clientHeight
        });
      }
      
      console.log('📏 Document:', {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollTop: document.documentElement.scrollTop,
        canScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
      });
      
      console.log('📏 Body:', {
        scrollHeight: document.body.scrollHeight,
        clientHeight: document.body.clientHeight,
        scrollTop: document.body.scrollTop,
        canScroll: document.body.scrollHeight > document.body.clientHeight
      });
    }
    
    return () => {
      // Cleanup event listeners from the primary container
      const scrollContainer = getScrollContainer();
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.removeEventListener('touchstart', handleTouchStart);
        scrollContainer.removeEventListener('touchmove', handleTouchMove);
      }
      
      // Cleanup fallback listeners
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // Remove listeners from all scrollable elements
      const scrollableElements = document.querySelectorAll('.app-container, .main-content, main, [style*="overflow"]');
      scrollableElements.forEach(element => {
        element.removeEventListener('scroll', handleScroll);
      });
      
      // Always show UI on cleanup
      mobileUIController.showBrowserUI();
      
      if (debug) {
        console.log('🧹 Cleanup completed');
      }
    };
  }, [isHidden]); // Add isHidden as dependency for better state tracking

  return isHidden;
}