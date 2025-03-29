import { httpService } from './httpService'

export interface Teacher {
  _id: string
  personalInfo: {
    fullName: string
  }
  professionalInfo?: {
    instrument: string
  }
  isActive: boolean
  teaching?: {
    studentIds: string[]
    schedule: Array<{
      studentId: string
      lessonDay: string
      lessonTime: string
      lessonDuration: number
      isActive: boolean
    }>
  }
}

export interface TeacherScheduleUpdate {
  studentId: string
  lessonDay: string
  lessonTime: string
  lessonDuration: number
  isActive: boolean
}

export const teacherService = {
  async getTeachers(filterBy: { isActive?: boolean } = {}): Promise<Teacher[]> {
    return httpService.get('teacher', filterBy)
  },

  async getTeacherById(teacherId: string): Promise<Teacher> {
    return httpService.get(`teacher/${teacherId}`)
  },

  async updateTeacherSchedule(teacherId: string, scheduleData: TeacherScheduleUpdate): Promise<Teacher> {
    return httpService.post(`teacher/${teacherId}/schedule`, scheduleData)
  }
} 