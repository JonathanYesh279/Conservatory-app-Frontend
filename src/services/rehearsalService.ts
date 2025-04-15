// src/services/rehearsalService.ts
import { httpService } from './httpService';

export interface Rehearsal {
  _id: string;
  groupId: string; // The orchestra this rehearsal belongs to
  date: string; // ISO date string
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  location: string;
  notes?: string;
  attendance?: {
    present: string[]; // Array of student IDs
    absent: string[]; // Array of student IDs
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
    return httpService.post('rehearsal', rehearsal);
  },

  // Update an existing rehearsal
  async updateRehearsal(
    rehearsalId: string,
    rehearsal: Partial<Rehearsal>
  ): Promise<Rehearsal> {
    // Remove _id from the request body if it exists
    const { _id, ...rehearsalWithoutId } = rehearsal as any;
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
 async bulkCreateRehearsals(data: BulkRehearsalData): Promise<{ 
  insertedCount: number, 
  rehearsalIds: string[] 
}> {
  // Convert date fields to the correct format expected by the backend
  const formattedData = {
    ...data,
    // Make sure dates are in the correct format
    startDate: data.startDate, // already in 'YYYY-MM-DD' format from input
    endDate: data.endDate,     // already in 'YYYY-MM-DD' format from input
    // Convert excludeDates to the correct format if needed
    excludeDates: data.excludeDates || []
  };
  
  console.log('Bulk create data being sent:', formattedData);
  
  try {
    return httpService.post('rehearsal/bulk-create', formattedData);
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
