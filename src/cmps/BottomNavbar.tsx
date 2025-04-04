import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Music, Users, GraduationCap  } from 'lucide-react'
import { useEffect, useState } from 'react'

export function BottomNavbar() {
  const location = useLocation()
  const path = location.pathname
  const [mounted, setMounted] = useState(false)

  // Add animation on mount
  useEffect(() => {
    setMounted(true)
  }, [])

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
      className={`bottom-nav ${mounted ? 'mounted' : ''}`}
    >
      <div className="nav-items">
        {navItems.map((item) => {
          const isActive = path === item.path || 
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
                className="nav-icon" 
                strokeWidth={item.isHome ? 2.5 : 2} 
              />
              {!item.isHome && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  )
}