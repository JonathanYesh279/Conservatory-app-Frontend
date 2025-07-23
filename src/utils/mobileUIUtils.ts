// Simple browser address bar hiding utility

export class MobileUIController {
  private hideTimeout: NodeJS.Timeout | null = null;

  // Check if device is mobile
  private isMobile(): boolean {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Enhanced iOS detection
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // iOS Safari detection
  private isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    const isIOS = this.isIOS();
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|OPiOS|mercury/i.test(ua);
    const isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
    return isIOS && (isSafari || isWebView);
  }

  // iOS Chrome detection
  private isIOSChrome(): boolean {
    const ua = navigator.userAgent;
    return this.isIOS() && /CriOS|Chrome/i.test(ua);
  }

  // Android Chrome detection
  private isAndroidChrome(): boolean {
    const ua = navigator.userAgent;
    return /Android/i.test(ua) && /Chrome/i.test(ua);
  }

  // Get the actual scrollable container
  private getScrollContainer(): Element | null {
    return document.querySelector('.app-container') || 
           document.querySelector('.main-content') || 
           document.querySelector('main') || 
           document.documentElement;
  }

  // Hide browser address bar - simplified for PWA
  hideBrowserUI(): void {
    if (!this.isMobile()) return;
    
    // In PWA mode, just add CSS class without aggressive scroll manipulation
    document.body.classList.add('mobile-ui-hidden');
    document.documentElement.classList.add('mobile-ui-hidden');
  }

  // Universal scroll-based UI hiding
  private hideScrollUI(container: Element | null, className: string, debug: boolean): void {
    this.hideTimeout = setTimeout(() => {
      // Get current scroll position from the actual container
      const currentScrollY = container?.scrollTop || window.pageYOffset || 0;
      
      if (debug) {
        console.log(`📊 Current scroll position: ${currentScrollY}`);
        console.log(`📱 Container: ${container?.className || 'window'}`);
      }
      
      // Multiple aggressive approaches to trigger browser UI hiding
      this.triggerScrollHide(container, currentScrollY, className, debug);
    }, 50);
  }

  // Aggressive scroll manipulation to hide browser UI
  private triggerScrollHide(container: Element | null, currentY: number, className: string, debug: boolean): void {
    if (debug) {
      console.log(`🎯 Starting aggressive browser UI hiding...`);
    }

    // Method 1: Create fake content to enable scrolling if needed
    this.ensureScrollable();
    
    // Method 2: Multiple rapid scroll attempts
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        // Scroll down then back up to trigger UI hiding
        window.scrollTo(0, 50 + i * 10);
        if (container && container !== document.documentElement) {
          container.scrollTop = 50 + i * 10;
        }
        
        setTimeout(() => {
          window.scrollTo(0, currentY);
          if (container && container !== document.documentElement) {
            container.scrollTop = currentY;
          }
        }, 50);
      }, i * 100);
    }
    
    // Method 3: Force fullscreen using requestFullscreen API
    setTimeout(() => {
      this.attemptFullscreen(debug);
    }, 200);
    
    // Method 4: Viewport height manipulation
    setTimeout(() => {
      this.manipulateViewport(debug);
    }, 300);
    
    // Method 5: CSS class for styling
    setTimeout(() => {
      document.body.classList.add(className);
      document.documentElement.classList.add(className);
      
      if (debug) {
        console.log(`🎯 Applied ${className} class to body and html`);
      }
    }, 400);
  }

  // Ensure page is scrollable
  private ensureScrollable(): void {
    const body = document.body;
    const currentHeight = body.scrollHeight;
    const viewportHeight = window.innerHeight;
    
    if (currentHeight <= viewportHeight) {
      // Add temporary invisible content to make page scrollable
      const spacer = document.createElement('div');
      spacer.id = 'browser-ui-spacer';
      spacer.style.height = '200vh';
      spacer.style.width = '1px';
      spacer.style.position = 'absolute';
      spacer.style.top = '0';
      spacer.style.left = '-1000px';
      spacer.style.visibility = 'hidden';
      spacer.style.pointerEvents = 'none';
      
      body.appendChild(spacer);
      
      // Remove it after a delay
      setTimeout(() => {
        const existingSpacer = document.getElementById('browser-ui-spacer');
        if (existingSpacer) {
          existingSpacer.remove();
        }
      }, 2000);
    }
  }

  // Attempt to use fullscreen API
  private attemptFullscreen(debug: boolean): void {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(() => {
        if (debug) console.log('📱 Fullscreen API not available');
      });
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
    
    if (debug) {
      console.log('📱 Attempted fullscreen request');
    }
  }

  // Manipulate viewport properties
  private manipulateViewport(debug: boolean): void {
    // Change viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    const originalContent = viewport.content;
    
    // Try different viewport settings to trigger UI hiding
    const viewportSettings = [
      'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui',
      'width=device-width, initial-scale=1.0, user-scalable=no, minimal-ui',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    ];
    
    viewportSettings.forEach((setting, index) => {
      setTimeout(() => {
        viewport.content = setting;
        if (debug) {
          console.log(`📱 Applied viewport setting ${index + 1}: ${setting}`);
        }
      }, index * 100);
    });
    
    // Restore original after attempts
    setTimeout(() => {
      viewport.content = originalContent;
    }, 1000);
  }

  // Show browser address bar - simplified for PWA
  showBrowserUI(): void {
    if (!this.isMobile()) return;
    
    // Clear any pending hide operations
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    // Remove all mobile UI classes
    document.body.classList.remove(
      'ios-safari-ui-hidden',
      'ios-chrome-ui-hidden', 
      'android-chrome-ui-hidden',
      'mobile-ui-hidden',
      'ios-ui-hidden' // Legacy class
    );
  }
}

// Create singleton instance
export const mobileUIController = new MobileUIController();