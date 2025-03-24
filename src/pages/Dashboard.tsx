import { Header } from '../cmps/Header'
import { BottomNavbar } from '../cmps/BottomNavbar'
import { StatCard } from '../cmps/StatCard'
import { Users, BookOpen, Music, Calendar, TimerIcon, BarChart2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    students: {
      total: 2845,
      comparison: { value: 12, text: 'vs last month' }
    },
    teachers: {
      total: 147,
      comparison: { value: 8, text: 'vs last month' }
    },
    orchestras: {
      total: 24,
      comparison: { value: 15, text: 'vs last month' }
    },
    rehearsals: {
      total: 156,
      practiceHours: 468,
      weeklyBreakdown: {
        mon: 32,
        wed: 45,
        fri: 38
      }
    },
    performances: {
      total: 32,
      comparison: { value: 24, text: 'vs last month' }
    },
    duration: {
      value: '3h 12m',
      comparison: { value: 18, text: 'improvement' }
    }
  })

  // Simulate data fetch from API
  useEffect(() => {
    // In a real app, you would fetch data from your API here
    // For this demo, we're using static data defined above
  }, [])

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <h1>מרכז ניהול</h1>
        
        <div className="dashboard-grid">
          <StatCard
            title="סך הכל תלמידים"  // "Total Students" in Hebrew
            value={dashboardData.students.total}
            icon={Users}
            category="תלמידים"
            comparison={{
              value: dashboardData.students.comparison.value,
              text: "לעומת החודש הקודם"  // "vs last month" in Hebrew
            }}
          />

          <StatCard
            title="מורים פעילים"  // "Active Teachers" in Hebrew
            value={dashboardData.teachers.total}
            icon={BookOpen}
            category="מורים"
            comparison={{
              value: dashboardData.teachers.comparison.value,
              text: "לעומת החודש הקודם"  // "vs last month" in Hebrew
            }}
          />
          
          <StatCard
            title="תזמורות פעילות"
            value={dashboardData.orchestras.total}
            icon={Music}
            category="תזמורות"
            comparison={dashboardData.orchestras.comparison}
          />
          
          <StatCard
            title="חזרות שבועיות"
            value={dashboardData.rehearsals.total}
            icon={Calendar}
            category="חזרות"
            additionalStats={[
              { label: 'Practice Hours', value: dashboardData.rehearsals.practiceHours }
            ]}
          />
          
          <StatCard
            title="מעקב נוכחות"
            value={dashboardData.performances.total}
            icon={BarChart2}
            category="מעקב נוכחות"
            comparison={dashboardData.performances.comparison}
          />
          
          <StatCard
            title="משך זמן"
            value={dashboardData.duration.value}
            icon={TimerIcon}
            category="משך זמן"
            comparison={dashboardData.duration.comparison}
            progress={{ value: 80 }}
          />
        </div>
      </main>
      
      <BottomNavbar />
    </div>
  )
}