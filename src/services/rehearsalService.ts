// src/services/rehearsalService.ts
import { httpService } from './httpService';

export interface Rehearsal {
  _id: string;
  groupId: string; // The orchestra this rehearsal belongs to
  type: string; // Usually 'תזמורת' or 'הרכב'
  date: string; // ISO date string
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  location: string;
  notes?: string;
  attendance?: {
    present: string[]; // Array of student IDs
    absent: string[]; // Array of student IDs
  };
  schoolYearId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Update the interface to match exactly what the backend expects
export interface BulkRehearsalData {
  orchestraId: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  excludeDates: string[]; 
}

export interface RehearsalFilter {
  groupId?: string;
  fromDate?: string;
  toDate?: string;
  location?: string;
  isActive?: boolean;
}

export const rehearsalService = {
  // Get all rehearsals with optional filtering
  async getRehearsals(filterBy: RehearsalFilter = {}): Promise<Rehearsal[]> {
    return httpService.get('rehearsal', filterBy);
  },

  // Get a specific rehearsal by ID
  async getRehearsalById(rehearsalId: string): Promise<Rehearsal> {
    return httpService.get(`rehearsal/${rehearsalId}`);
  },

  // Get rehearsals for a specific orchestra
  async getRehearsalsByOrchestraId(orchestraId: string): Promise<Rehearsal[]> {
    return this.getRehearsals({ groupId: orchestraId });
  },

  // Add a new rehearsal
  async addRehearsal(rehearsal: Partial<Rehearsal>): Promise<Rehearsal> {
    // Ensure type property is set
    if (!rehearsal.type) {
      rehearsal.type = 'תזמורת';
    }

    // Calculate dayOfWeek if not provided
    if (rehearsal.date && !rehearsal.dayOfWeek) {
      const date = new Date(rehearsal.date);
      rehearsal.dayOfWeek = date.getDay();
    }

    return httpService.post('rehearsal', rehearsal);
  },

  // Update an existing rehearsal
  async updateRehearsal(
    rehearsalId: string,
    rehearsal: Partial<Rehearsal>
  ): Promise<Rehearsal> {
    // Remove _id from the request body if it exists
    const { _id, ...rehearsalWithoutId } = rehearsal as any;

    // Calculate dayOfWeek if not provided
    if (rehearsal.date && !rehearsal.dayOfWeek) {
      const date = new Date(rehearsal.date);
      rehearsalWithoutId.dayOfWeek = date.getDay();
    }

    return httpService.put(`rehearsal/${rehearsalId}`, rehearsalWithoutId);
  },

  // Soft delete a rehearsal (mark as inactive)
  async removeRehearsal(rehearsalId: string): Promise<Rehearsal> {
    if (!rehearsalId) {
      throw new Error('Invalid rehearsal ID');
    }
    return httpService.delete(`rehearsal/${rehearsalId}`);
  },

  // Bulk rehearsals creation
  async bulkCreateRehearsals(
    data: BulkRehearsalData & { schoolYearId?: string }
  ): Promise<{
    insertedCount: number;
    rehearsalIds: string[];
  }> {
    try {
      console.log('Bulk create data being sent:', data);

      // Create a new object with only the fields expected by the backend
      const formattedData: BulkRehearsalData = {
        orchestraId: data.orchestraId,
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: Number(data.dayOfWeek), // Ensure dayOfWeek is a number
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        notes: data.notes || '',
        excludeDates: data.excludeDates || [],
      };

      // Execute the API call, omitting the schoolYearId
      const response = await httpService.post(
        'rehearsal/bulk-create',
        formattedData
      );
      return response;
    } catch (error) {
      console.error('Error in bulk create:', error);
      throw error;
    }
  },

  // Attendance management
  async updateAttendance(
    rehearsalId: string,
    attendance: { present: string[]; absent: string[] }
  ): Promise<Rehearsal> {
    return httpService.put(`rehearsal/${rehearsalId}/attendance`, attendance);
  },

  async getAttendance(
    rehearsalId: string
  ): Promise<{ present: string[]; absent: string[] }> {
    return httpService.get(`rehearsal/${rehearsalId}/attendance`);
  },

  // Helper methods
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },

  formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  },

  // Parse ISO date string into a readable format
  formatDateForDisplay(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Format time for display (e.g., "15:30")
  formatTimeForDisplay(timeString: string): string {
    return timeString;
  },

  // Get rehearsal duration in minutes
  calculateDuration(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;

    return end - start;
  },
};
