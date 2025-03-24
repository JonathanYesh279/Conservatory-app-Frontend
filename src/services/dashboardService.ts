// src/services/dashboardService.ts
import { httpService } from './httpService'

// Define the interfaces for your API responses
interface Student {
  _id: string
  personalInfo: {
    fullName: string
  }
  isActive: boolean
  createdAt: string
}

interface Teacher {
  _id: string
  personalInfo: {
    fullName: string
  }
  isActive: boolean
  createdAt: string
}

interface Orchestra {
  _id: string
  name: string
  isActive: boolean
  rehearsalIds: string[]
  createdAt: string
}

interface Rehearsal {
  _id: string
  groupId: string
  date: string
  startTime: string
  endTime: string
  isActive: boolean
  // This is the important part - attendance data inside rehearsals
  attendance: {
    present: string[] // Array of student IDs
    absent: string[] // Array of student IDs
  }
}

// Custom attendance record derived from rehearsals
interface AttendanceRecord {
  studentId: string
  rehearsalId: string
  date: string
  status: 'present' | 'absent'
}

// Dashboard stats interface
export interface DashboardStats {
  students: {
    total: number
    comparison?: { value: number, text: string }
  }
  teachers: {
    total: number
    comparison?: { value: number, text: string }
  }
  orchestras: {
    total: number
    comparison?: { value: number, text: string }
  }
  rehearsals: {
    total: number
    practiceHours: number
    weeklyBreakdown?: {
      [key: string]: number
    }
  }
  attendance: {
    total: number
    comparison?: { value: number, text: string }
  }
}

export const dashboardService = {
  async getStudentStats(): Promise<Student[]> {
    return httpService.get('student', { isActive: true })
  },
  
  async getTeacherStats(): Promise<Teacher[]> {
    return httpService.get('teacher', { isActive: true })
  },
  
  async getOrchestraStats(): Promise<Orchestra[]> {
    return httpService.get('orchestra', { isActive: true })
  },
  
  async getRehearsalStats(): Promise<Rehearsal[]> {
    return httpService.get('rehearsal', { isActive: true })
  },
  
  // Extract attendance records from rehearsal data
  extractAttendanceRecords(rehearsals: Rehearsal[]): AttendanceRecord[] {
    const attendanceRecords: AttendanceRecord[] = []
    
    rehearsals.forEach(rehearsal => {
      // Skip rehearsals without attendance data
      if (!rehearsal.attendance) return
      
      // Process present students
      if (rehearsal.attendance.present && Array.isArray(rehearsal.attendance.present)) {
        rehearsal.attendance.present.forEach(studentId => {
          attendanceRecords.push({
            studentId,
            rehearsalId: rehearsal._id,
            date: rehearsal.date,
            status: 'present'
          })
        })
      }
      
      // Process absent students
      if (rehearsal.attendance.absent && Array.isArray(rehearsal.attendance.absent)) {
        rehearsal.attendance.absent.forEach(studentId => {
          attendanceRecords.push({
            studentId,
            rehearsalId: rehearsal._id,
            date: rehearsal.date,
            status: 'absent'
          })
        })
      }
    })
    
    return attendanceRecords
  },
  
  // Calculate the percentage change between current and previous counts
  calculateComparison(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  },
  
  // Get previous month stats for comparison
  async getPreviousMonthStats(): Promise<{
    students: number
    teachers: number
    orchestras: number
    attendance: number
  }> {
    // Get the current date and calculate the start of the current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    
    // Calculate previous month
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const previousMonthStart = new Date(previousYear, previousMonth, 1)
    const previousMonthEnd = new Date(currentYear, currentMonth, 0)
    
    // Fetch all data
    const [students, teachers, orchestras, rehearsals] = await Promise.all([
      this.getStudentStats(),
      this.getTeacherStats(),
      this.getOrchestraStats(),
      this.getRehearsalStats(),
    ])
    
    // Count items created before this month (for students, teachers, orchestras)
    const prevStudents = students.filter(s => new Date(s.createdAt) < currentMonthStart).length
    const prevTeachers = teachers.filter(t => new Date(t.createdAt) < currentMonthStart).length
    const prevOrchestras = orchestras.filter(o => new Date(o.createdAt) < currentMonthStart).length
    
    // Get rehearsals from the previous month
    const previousMonthRehearsals = rehearsals.filter(r => {
      const rehearsalDate = new Date(r.date)
      return rehearsalDate >= previousMonthStart && rehearsalDate <= previousMonthEnd
    })
    
    // Get attendance records from previous month rehearsals
    const attendanceRecords = this.extractAttendanceRecords(previousMonthRehearsals)
    
    return {
      students: prevStudents,
      teachers: prevTeachers,
      orchestras: prevOrchestras,
      attendance: attendanceRecords.length
    }
  },
  
  // Main method to get all dashboard stats
  async getAllDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all data in parallel
      const [
        students, 
        teachers, 
        orchestras, 
        rehearsals,
        previousMonthStats
      ] = await Promise.all([
        this.getStudentStats(),
        this.getTeacherStats(),
        this.getOrchestraStats(),
        this.getRehearsalStats(),
        this.getPreviousMonthStats()
      ])
      
      // Extract attendance records from all rehearsals
      const attendanceRecords = this.extractAttendanceRecords(rehearsals)
      
      // Calculate comparisons with previous month
      const studentComparison = this.calculateComparison(
        students.length, 
        previousMonthStats.students
      )
      
      const teacherComparison = this.calculateComparison(
        teachers.length, 
        previousMonthStats.teachers
      )
      
      const orchestraComparison = this.calculateComparison(
        orchestras.length, 
        previousMonthStats.orchestras
      )
      
      const attendanceComparison = this.calculateComparison(
        attendanceRecords.length, 
        previousMonthStats.attendance
      )
      
      // Calculate practice hours
      let practiceHours = 0
      rehearsals.forEach(rehearsal => {
        if (rehearsal.startTime && rehearsal.endTime) {
          const [startHours, startMinutes] = rehearsal.startTime.split(':').map(Number)
          const [endHours, endMinutes] = rehearsal.endTime.split(':').map(Number)
          
          const startMinutesTotal = startHours * 60 + startMinutes
          const endMinutesTotal = endHours * 60 + endMinutes
          
          const durationMinutes = endMinutesTotal - startMinutesTotal
          practiceHours += durationMinutes / 60
        }
      })
      
      // Round to 2 decimal places
      practiceHours = Math.round(practiceHours * 100) / 100
      
      // Calculate weekly breakdown
      const weeklyBreakdown = {}
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      
      rehearsals.forEach(rehearsal => {
        const dayOfWeek = new Date(rehearsal.date).getDay()
        const dayName = dayNames[dayOfWeek]
        
        if (!weeklyBreakdown[dayName]) {
          weeklyBreakdown[dayName] = 0
        }
        
        weeklyBreakdown[dayName]++
      })
      
      // Build and return the complete dashboard stats object
      return {
        students: {
          total: students.length,
          comparison: { 
            value: studentComparison, 
            text: "לעומת החודש הקודם" 
          }
        },
        teachers: {
          total: teachers.length,
          comparison: { 
            value: teacherComparison, 
            text: "לעומת החודש הקודם" 
          }
        },
        orchestras: {
          total: orchestras.length,
          comparison: { 
            value: orchestraComparison, 
            text: "לעומת החודש הקודם" 
          }
        },
        rehearsals: {
          total: rehearsals.length,
          practiceHours: practiceHours,
          weeklyBreakdown: weeklyBreakdown
        },
        attendance: {
          total: attendanceRecords.length,
          comparison: { 
            value: attendanceComparison, 
            text: "לעומת החודש הקודם" 
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }
}