import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Calendar, Music, Users, GraduationCap } from 'lucide-react'
import { useNavbar } from '../context/NavbarContext'

export function BottomNavbar() {
  const location = useLocation()
  const path = location.pathname
  const { isVisible } = useNavbar()
  
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
      path: '/theory',
      label: 'תאוריה',
      icon: BookOpen,
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
  ]

  return (
    <nav 
      className={`bottom-nav mounted ${isVisible ? 'scroll-up' : 'scroll-down'}`}
    >
      <div className='nav-items'>
        {navItems.map((item) => {
          const isActive =
            path === item.path ||
            (item.path === '/theory' && path === '/') ||
            (path.startsWith(item.path))

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <item.icon
                className='nav-icon'
                strokeWidth={2}
              />
              <span className='nav-label'>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}