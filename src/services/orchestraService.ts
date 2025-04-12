// src/services/orchestraService.ts
import { httpService } from './httpService';
import { studentService } from './studentService';

export interface Orchestra {
  _id: string;
  name: string;
  type: string;
  conductorId: string;
  memberIds: string[];
  rehearsalIds: string[];
  schoolYearId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrchestraFilter {
  name?: string;
  type?: string;
  conductorId?: string;
  memberIds?: string;
  schoolYearId?: string;
  isActive?: boolean;
  showInactive?: boolean;
}

export interface AddMemberRequest {
  studentId: string;
}

export const orchestraService = {
  async getOrchestras(filterBy: OrchestraFilter = {}): Promise<Orchestra[]> {
    return httpService.get('orchestra', filterBy);
  },

  async getOrchestraById(orchestraId: string): Promise<Orchestra> {
    return httpService.get(`orchestra/${orchestraId}`);
  },

  async getOrchestrasByIds(orchestraIds: string[]): Promise<Orchestra[]> {
    // If no ids provided, return empty array
    if (!orchestraIds || orchestraIds.length === 0) {
      return [];
    }

    // Fetch orchestras and filter by the provided IDs
    const allOrchestras = await this.getOrchestras();
    return allOrchestras.filter((orchestra) =>
      orchestraIds.includes(orchestra._id)
    );
  },

  async getOrchestrasByConductorId(conductorId: string): Promise<Orchestra[]> {
    return this.getOrchestras({ conductorId });
  },

  async getOrchestrasByStudentId(studentId: string): Promise<Orchestra[]> {
    return this.getOrchestras({ memberIds: studentId });
  },

  async addOrchestra(orchestra: Partial<Orchestra>): Promise<Orchestra> {
    return httpService.post('orchestra', orchestra);
  },

  async updateOrchestra(
    orchestraId: string,
    orchestra: Partial<Orchestra>
  ): Promise<Orchestra> {
    // Make sure we're not sending the _id in the request body
    const { _id, ...orchestraWithoutId } = orchestra as any;
    return httpService.put(`orchestra/${orchestraId}`, orchestraWithoutId);
  },

  async removeOrchestra(orchestraId: string): Promise<Orchestra> {
    return httpService.delete(`orchestra/${orchestraId}`);
  },

  // Member management
  async addMember(orchestraId: string, studentId: string): Promise<Orchestra> {
    try {
      // 1. Add student to orchestra
      const updatedOrchestra = await httpService.post(`orchestra/${orchestraId}/members`, { studentId });
      
      // 2. Update student with orchestra (to maintain consistency)
      const student = await studentService.getStudentById(studentId);
      
      // Only add if not already present
      if (!student.enrollments.orchestraIds.includes(orchestraId)) {
        await studentService.updateStudent(studentId, {
          enrollments: {
            ...student.enrollments,
            orchestraIds: [...student.enrollments.orchestraIds, orchestraId]
          }
        });
      }
      
      return updatedOrchestra;
    } catch (error) {
      console.error('Error adding member to orchestra:', error);
      throw error;
    }
  },

  async removeMember(
    orchestraId: string,
    studentId: string
  ): Promise<Orchestra> {
    try {
      // 1. Remove student from orchestra
      const updatedOrchestra = await httpService.delete(`orchestra/${orchestraId}/members/${studentId}`);
      
      // 2. Update student to remove orchestra
      const student = await studentService.getStudentById(studentId);
      
      await studentService.updateStudent(studentId, {
        enrollments: {
          ...student.enrollments,
          orchestraIds: student.enrollments.orchestraIds.filter(id => id !== orchestraId)
        }
      });
      
      return updatedOrchestra;
    } catch (error) {
      console.error('Error removing member from orchestra:', error);
      throw error;
    }
  },
  
  // Add multiple members at once
  async updateMembers(
    orchestraId: string,
    memberIds: string[],
    currentMemberIds: string[] = []
  ): Promise<Orchestra> {
    try {
      // 1. Update the orchestra with the new member IDs
      const updatedOrchestra = await this.updateOrchestra(orchestraId, { memberIds });
      
      // 2. Find which students were added and which were removed
      const addedStudentIds = memberIds.filter(id => !currentMemberIds.includes(id));
      const removedStudentIds = currentMemberIds.filter(id => !memberIds.includes(id));
      
      // 3. Add orchestra to added students
      for (const studentId of addedStudentIds) {
        const student = await studentService.getStudentById(studentId);
        if (!student.enrollments.orchestraIds.includes(orchestraId)) {
          await studentService.updateStudent(studentId, {
            enrollments: {
              ...student.enrollments,
              orchestraIds: [...student.enrollments.orchestraIds, orchestraId]
            }
          });
        }
      }
      
      // 4. Remove orchestra from removed students
      for (const studentId of removedStudentIds) {
        const student = await studentService.getStudentById(studentId);
        await studentService.updateStudent(studentId, {
          enrollments: {
            ...student.enrollments,
            orchestraIds: student.enrollments.orchestraIds.filter(id => id !== orchestraId)
          }
        });
      }
      
      return updatedOrchestra;
    } catch (error) {
      console.error('Error updating orchestra members:', error);
      throw error;
    }
  },

  // Rehearsal attendance
  async getRehearsalAttendance(
    orchestraId: string,
    rehearsalId: string
  ): Promise<any> {
    return httpService.get(
      `orchestra/${orchestraId}/rehearsals/${rehearsalId}/attendance`
    );
  },

  async updateRehearsalAttendance(
    orchestraId: string,
    rehearsalId: string,
    attendance: { present: string[]; absent: string[] }
  ): Promise<any> {
    return httpService.put(
      `orchestra/${orchestraId}/rehearsals/${rehearsalId}/attendance`,
      attendance
    );
  },

  // Student attendance stats
  async getStudentAttendanceStats(
    orchestraId: string,
    studentId: string
  ): Promise<any> {
    return httpService.get(
      `orchestra/${orchestraId}/student/${studentId}/attendance`
    );
  },
  
  // Bulk operations for synchronizing members
  async syncOrchestraMembers(orchestraId: string): Promise<void> {
    try {
      // 1. Get the orchestra with its current members
      const orchestra = await this.getOrchestraById(orchestraId);
      
      // 2. Get all students who have this orchestra in their enrollments
      const allStudents = await studentService.getStudents();
      const studentsWithOrchestra = allStudents.filter(student =>
        student.enrollments.orchestraIds.includes(orchestraId)
      );
      
      // 3. Compare and synchronize
      const studentIds = studentsWithOrchestra.map(student => student._id);
      
      // Students that should be added to the orchestra
      const studentsToAdd = studentIds.filter(id => !orchestra.memberIds.includes(id));
      
      // Students that should have the orchestra removed from their enrollments
      const studentsToRemove = orchestra.memberIds.filter(id => !studentIds.includes(id));
      
      // 4. Update orchestra with correct member IDs
      if (studentsToAdd.length > 0) {
        const newMemberIds = [...orchestra.memberIds, ...studentsToAdd];
        await this.updateOrchestra(orchestraId, { memberIds: newMemberIds });
      }
      
      // 5. Update students that should be removed
      for (const studentId of studentsToRemove) {
        const student = await studentService.getStudentById(studentId);
        await studentService.updateStudent(studentId, {
          enrollments: {
            ...student.enrollments,
            orchestraIds: student.enrollments.orchestraIds.filter(id => id !== orchestraId)
          }
        });
      }
    } catch (error) {
      console.error('Error syncing orchestra members:', error);
      throw error;
    }
  },

  // Helper methods for frontend use
  getOrchestraTypeDisplay(type: string): string {
    const typeMap: Record<string, string> = {
      תזמורת: 'תזמורת',
      הרכב: 'הרכב',
    };
    return typeMap[type] || type;
  },

  getValidOrchestraTypes(): string[] {
    return ['תזמורת', 'הרכב'];
  },

  getValidOrchestraNames(): string[] {
    return [
      'תזמורת מתחילים נשיפה',
      'תזמורת עתודה נשיפה',
      'תזמורת צעירה נשיפה',
      'תזמורת יצוגית נשיפה',
      'תזמורת סימפונית',
    ];
  }
}