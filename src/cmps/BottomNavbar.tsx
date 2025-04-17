import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Music, Users, GraduationCap } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export function BottomNavbar() {
  const location = useLocation();
  const path = location.pathname;
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const navbarRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Use a more sensitive scroll detection
  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(
            currentScrollY - lastScrollY.current
          );

          // Log for debugging
          console.log({
            currentY: currentScrollY,
            lastY: lastScrollY.current,
            diff: scrollDifference,
            visible,
          });

          // More sensitive detection - only need a small scroll amount (10px) to trigger
          // Also ensure we're not at the very top of the page (allow 5px buffer)
          if (
            currentScrollY > lastScrollY.current &&
            scrollDifference > 10 &&
            currentScrollY > 5
          ) {
            // Scrolling down
            setVisible(false);
          } else if (
            currentScrollY < lastScrollY.current &&
            scrollDifference > 5
          ) {
            // Scrolling up - be more sensitive for showing than hiding
            setVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible]);

  // Add test content for development
  useEffect(() => {
    // Only in development and only if there's not enough content
    if (process.env.NODE_ENV === 'development') {
      const body = document.body;
      if (body.scrollHeight <= window.innerHeight + 100) {
        console.log('Adding test content for scrolling');
        const testContent = document.createElement('div');
        testContent.id = 'scroll-test-content';
        testContent.style.height = '2000px';
        testContent.style.background = 'transparent';
        testContent.style.pointerEvents = 'none';

        // Only add if not already present
        if (!document.getElementById('scroll-test-content')) {
          body.appendChild(testContent);
        }
      }
    }

    return () => {
      const testContent = document.getElementById('scroll-test-content');
      if (testContent) {
        testContent.parentNode?.removeChild(testContent);
      }
    };
  }, []);

  // Define navigation items
  const navItems = [
    {
      path: '/teachers',
      label: 'מורים',
      icon: GraduationCap,
    },
    {
      path: '/students',
      label: 'תלמידים',
      icon: Users,
    },
    {
      path: '/dashboard',
      label: 'בית',
      icon: Home,
      isHome: true,
    },
    {
      path: '/orchestras',
      label: 'תזמורות',
      icon: Music,
    },
    {
      path: '/rehearsals',
      label: 'לוח חזרות',
      icon: Calendar,
    },
  ];

  return (
    <nav
      ref={navbarRef}
      className={`bottom-nav ${mounted ? 'mounted' : ''}`}
      style={{
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(120px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className='nav-items'>
        {navItems.map((item) => {
          const isActive =
            path === item.path ||
            (item.path === '/dashboard' && path === '/') ||
            (item.path !== '/dashboard' && path.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''} ${
                item.isHome ? 'home' : ''
              }`}
              aria-label={item.label}
            >
              <item.icon
                className='nav-icon'
                strokeWidth={item.isHome ? 2.5 : 2}
              />
              {!item.isHome && <span className='nav-label'>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
