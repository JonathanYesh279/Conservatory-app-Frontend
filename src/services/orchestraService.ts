// src/services/orchestraService.ts
import { httpService } from './httpService';

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
    return httpService.post(`orchestra/${orchestraId}/members`, { studentId });
  },

  async removeMember(
    orchestraId: string,
    studentId: string
  ): Promise<Orchestra> {
    return httpService.delete(`orchestra/${orchestraId}/members/${studentId}`);
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
  },
};
