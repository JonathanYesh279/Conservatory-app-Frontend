import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import avatar from '../assets/avatar.png'
import logo from '../assets/logo.jpg'
import { useState, useRef, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  User,
  Menu
} from 'lucide-react'

export function Header() {
  const [dropDownMenu, setDropDownMenu] = useState(false)
  const { user, logout } = useAuth()
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

  return (
    <header className='header'>
      <div className='header-container'>
        {user && (
          <div className='user-container' ref={dropdownRef}>
            {/* Mobile menu button */}
            <button className='mobile-menu-button' onClick={toggleDropDownMenu}>
              <Menu className='menu-icon' />
            </button>
            <div className='avatar-wrapper' onClick={toggleDropDownMenu}>
              <div className='user-greeting'>
                <span className='greeting-text'>שלום, {firstName}</span>
                <div className='chevron-icon'>
                  {dropDownMenu ? (
                    <ChevronUp className='icon' strokeWidth={2.5} />
                  ) : (
                    <ChevronDown className='icon' strokeWidth={2.5} />
                  )}
                </div>
              </div>

              <div className='avatar-circle'>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt='Avatar'
                    className='user-avatar'
                  />
                ) : (
                  <img src={avatar} alt='Avatar' className='user-avatar' />
                )}
              </div>

              {dropDownMenu && (
                <div className='dropdown-menu'>
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
          </div>
        )}

        <div className='logo-container'>
          <Link to='/dashboard' className='logo-link'>
            <img src={logo} alt='Logo' className='logo-image' />
          </Link>
        </div>
      </div>
    </header>
  );
}