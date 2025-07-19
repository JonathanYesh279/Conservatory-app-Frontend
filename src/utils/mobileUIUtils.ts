// Utility functions for hiding/showing mobile browser UI

export class MobileUIController {
  private isHidden = false;
  private originalViewport = '';
  private timeoutId: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    // Store original viewport meta tag
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      this.originalViewport = viewport.getAttribute('content') || '';
    }
  }

  // Check if device is mobile
  private isMobile(): boolean {
    // Debug mode: force mobile detection for testing
    const debugMobile = localStorage.getItem('debug-mobile-ui') === 'true';
    
    return debugMobile || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  // Check if iOS Safari
  private isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && 
           !(window as any).MSStream && 
           (/Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua));
  }

  // Check if Android Chrome
  private isAndroidChrome(): boolean {
    const ua = navigator.userAgent;
    return /Android/.test(ua) && /Chrome/.test(ua) && !/Edge|Samsung/.test(ua);
  }

  // Hide browser UI
  hideBrowserUI(): void {
    if (!this.isMobile()) return;

    this.isHidden = true;

    // Debug logging
    if (localStorage.getItem('debug-mobile-ui') === 'true') {
      console.log('🔽 Hiding mobile UI');
    }

    // Method 1: Viewport manipulation for address bar hiding
    this.setMinimalViewport();

    // Method 2: Platform-specific tricks
    if (this.isIOSSafari()) {
      this.hideIOSSafariUI();
    } else if (this.isAndroidChrome()) {
      this.hideAndroidChromeUI();
    }

    // Method 3: Add CSS class for custom styling
    document.body.classList.add('mobile-ui-hidden');

    // Method 4: Simple scroll trick to hide address bar
    this.triggerScrollHide();
  }


  // Show browser UI
  showBrowserUI(): void {
    if (!this.isMobile()) return;

    this.isHidden = false;

    // Debug logging
    if (localStorage.getItem('debug-mobile-ui') === 'true') {
      console.log('🔼 Showing mobile UI');
    }

    // Restore original viewport
    this.restoreViewport();

    // Remove platform-specific styles
    if (this.isIOSSafari()) {
      this.restoreIOSSafariUI();
    } else if (this.isAndroidChrome()) {
      this.restoreAndroidChromeUI();
    }

    // Remove CSS class
    document.body.classList.remove('mobile-ui-hidden');

    // Clear any pending timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  // Simple scroll trigger to hide browser UI
  private triggerScrollHide(): void {
    const currentY = window.pageYOffset;
    
    // Force a minimal scroll to trigger browser UI hiding
    window.scrollTo(0, Math.max(1, currentY + 1));
    
    setTimeout(() => {
      window.scrollTo(0, currentY);
    }, 50);
  }


  private setMinimalViewport(): void {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui'
      );
    }
  }

  private restoreViewport(): void {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport && this.originalViewport) {
      viewport.setAttribute('content', this.originalViewport);
    }
  }

  private hideIOSSafariUI(): void {
    // Force Safari to hide its UI by scrolling
    const currentScroll = window.pageYOffset;
    
    // Set fixed height to prevent content jump
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    
    // Trigger Safari UI hide
    this.timeoutId = setTimeout(() => {
      window.scrollTo(0, Math.max(currentScroll, 1));
      
      // Additional timeout to ensure UI is hidden
      setTimeout(() => {
        window.scrollTo(0, currentScroll);
      }, 100);
    }, 50);
  }

  private restoreIOSSafariUI(): void {
    document.body.style.height = '';
    document.documentElement.style.height = '';
  }

  private hideAndroidChromeUI(): void {
    // Android Chrome specific hiding
    const currentScroll = window.pageYOffset;
    
    // Set full viewport height
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    
    // Force Chrome to hide address bar
    this.timeoutId = setTimeout(() => {
      window.scrollTo(0, Math.max(currentScroll, 1));
      
      // Additional scroll to ensure UI is hidden
      setTimeout(() => {
        window.scrollTo(0, currentScroll);
        // Add body class to trigger CSS
        document.body.classList.add('chrome-ui-hidden');
      }, 100);
    }, 50);
  }

  private restoreAndroidChromeUI(): void {
    document.body.style.height = '';
    document.documentElement.style.height = '';
    document.body.classList.remove('chrome-ui-hidden');
  }


  private forceLayoutUpdate(): void {
    // Force browser to recalculate layout
    const dummy = document.createElement('div');
    dummy.style.position = 'absolute';
    dummy.style.top = '-9999px';
    dummy.style.height = '1px';
    document.body.appendChild(dummy);
    
    // Remove after a frame
    requestAnimationFrame(() => {
      document.body.removeChild(dummy);
    });
  }

  // Check if browser UI is currently hidden
  isUIHidden(): boolean {
    return this.isHidden;
  }

  // Initialize CSS for mobile UI hiding
  initializeCSS(): void {
    if (!this.isMobile()) return;

    const style = document.createElement('style');
    style.id = 'mobile-ui-controller-styles';
    style.textContent = `
      /* Minimal mobile UI styles for browser hiding */
      .mobile-ui-hidden {
        min-height: 100vh;
        min-height: 100dvh;
      }
      
      /* iOS Safari specific */
      @supports (-webkit-touch-callout: none) {
        .mobile-ui-hidden .bottom-nav {
          bottom: max(0.5rem, env(safe-area-inset-bottom, 0.5rem)) !important;
        }
      }
      
      /* Android Chrome specific */
      .chrome-ui-hidden .bottom-nav {
        bottom: 0.5rem !important;
      }
      
      /* Ensure bottom nav stays visible and positioned correctly */
      .mobile-ui-hidden .bottom-nav {
        position: fixed !important;
        bottom: 0.5rem !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 9999 !important;
      }

      /* PWA mode adjustments */
      @media (display-mode: standalone) {
        .mobile-ui-hidden .bottom-nav {
          bottom: max(1rem, env(safe-area-inset-bottom, 1rem)) !important;
        }
      }

      /* Landscape orientation specific */
      @media (orientation: landscape) and (max-height: 500px) {
        .mobile-ui-hidden .bottom-nav {
          bottom: 0.25rem !important;
          padding: 0.25rem 0.5rem !important;
        }
      }
    `;
    
    // Remove existing styles if any
    const existing = document.getElementById('mobile-ui-controller-styles');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(style);
  }

  // Cleanup method
  destroy(): void {
    this.showBrowserUI();
    
    const styles = document.getElementById('mobile-ui-controller-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// Create singleton instance
export const mobileUIController = new MobileUIController();