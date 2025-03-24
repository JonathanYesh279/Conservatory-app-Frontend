import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useState, useRef, useEffect } from 'react'
import {  
  LogOut, 
  User,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function Header() {
  const [dropDownMenu, setDropDownMenu] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropDownMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleLogout() {
    logout()
  }

  function toggleDropDownMenu() {
    setDropDownMenu((prev) => !prev)
  }

  // Extract first name and ensure it's properly rendered with a fallback
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'אורח'
  
  // Create initials for avatar placeholder
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <header className='header'>
      <div className='header-container'>
        <div
          className='right-section'
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {user && (
            <div className='user-container' ref={dropdownRef}>
              <div className='avatar-wrapper' onClick={toggleDropDownMenu}>
                <div className='avatar-circle'>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt='Avatar'
                      className='user-avatar'
                    />
                  ) : (
                    <div className='avatar-placeholder'>{userInitials}</div>
                  )}
                </div>
              </div>

              {dropDownMenu && (
                <div className='dropdown-menu'>
                  <div className='user-info'>
                    <div className='user-name'>{user.fullName}</div>
                    <div className='user-email'>{user.email}</div>
                  </div>
                  <Link to='/profile' className='dropdown-item'>
                    <User className='dropdown-icon' strokeWidth={2} />
                    <span>פרופיל אישי</span>
                  </Link>
                  <div className='dropdown-divider'></div>
                  <button
                    className='dropdown-item logout-btn'
                    onClick={handleLogout}
                  >
                    <LogOut className='dropdown-icon' strokeWidth={2} />
                    <span>התנתק</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className='theme-toggle'
            onClick={toggleTheme}
            aria-label='Toggle theme'
          >
            {theme === 'dark' ? (
              <Sun className='icon' />
            ) : (
              <Moon className='icon' />
            )}
          </button>
        </div>

        <div className='logo-container'>
          <Link to='/dashboard' className='logo-link'>
            <img src={logo} alt='Logo' className='logo-image' />
          </Link>
        </div>
      </div>
    </header>
  );
}