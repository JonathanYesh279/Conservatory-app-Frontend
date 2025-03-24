// src/pages/Dashboard.tsx
import { Header } from '../cmps/Header'
import { BottomNavbar } from '../cmps/BottomNavbar'
import { StatCard } from '../cmps/StatCard'
import { Users, BookOpen, Music, Calendar, CheckSquare } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'

export function Dashboard() {
  const { stats, isLoading, error } = useDashboard()
  
  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="app-container">
        <Header />
        <main className="main-content">
          <h1>מרכז ניהול</h1>
          <div className="loading-state">טוען נתונים...</div>
        </main>
        <BottomNavbar />
      </div>
    )
  }
  
  // If there's an error, show an error state
  if (error) {
    return (
      <div className="app-container">
        <Header />
        <main className="main-content">
          <h1>מרכז ניהול</h1>
          <div className="error-state">
            <p>שגיאה בטעינת הנתונים</p>
            <button className="btn primary" onClick={() => window.location.reload()}>
              נסה שוב
            </button>
          </div>
        </main>
        <BottomNavbar />
      </div>
    )
  }
  
  // No data yet (shouldn't happen with our implementation, but just in case)
  if (!stats) {
    return (
      <div className="app-container">
        <Header />
        <main className="main-content">
          <h1>מרכז ניהול</h1>
          <div className="empty-state">אין נתונים להצגה</div>
        </main>
        <BottomNavbar />
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <div className="dashboard-grid">
          <StatCard
            title="סך הכל תלמידים"
            value={stats.students.total}
            icon={Users}
            category="תלמידים"
            comparison={stats.students.comparison}
          />

          <StatCard
            title="מורים פעילים"
            value={stats.teachers.total}
            icon={BookOpen}
            category="מורים"
            comparison={stats.teachers.comparison}
          />
          
          <StatCard
            title="תזמורות פעילות"
            value={stats.orchestras.total}
            icon={Music}
            category="תזמורות"
            comparison={stats.orchestras.comparison}
          />
          
          <StatCard
            title="חזרות שבועיות"
            value={stats.rehearsals.total}
            icon={Calendar}
            category="חזרות"
            additionalStats={[
              { label: 'שעות אימון', value: stats.rehearsals.practiceHours }
            ]}
          />
          
          <StatCard
            title="נוכחות"
            value={stats.attendance.total}
            icon={CheckSquare}
            category="נוכחות"
            comparison={stats.attendance.comparison}
          />
        </div>
      </main>
      
      <BottomNavbar />
    </div>
  )
}