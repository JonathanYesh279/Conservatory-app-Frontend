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
  schoolYearId: string; // Required to match backend schema
}

export interface RehearsalFilter {
  groupId?: string;
  fromDate?: string;
  toDate?: string;
  location?: string;
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

    // Check for schoolYearId
    if (!rehearsal.schoolYearId) {
      throw new Error('School year ID is required for rehearsal creation');
    }

    console.log('Adding rehearsal with data:', rehearsal);
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

  // Hard delete a rehearsal (permanently removes from database)
  async removeRehearsal(rehearsalId: string): Promise<void> {
    if (!rehearsalId) {
      throw new Error('Invalid rehearsal ID');
    }
    return httpService.delete(`rehearsal/${rehearsalId}`);
  },

  // Bulk delete rehearsals by orchestra ID
  async removeRehearsalsByOrchestra(orchestraId: string): Promise<{ deletedCount: number }> {
    if (!orchestraId) {
      throw new Error('Invalid orchestra ID');
    }
    
    try {
      // Try the bulk delete endpoint first
      console.log('Attempting bulk delete for orchestra:', orchestraId);
      const result = await httpService.delete(`rehearsal/orchestra/${orchestraId}`);
      console.log('Bulk delete successful:', result);
      return result;
    } catch (error: any) {
      console.log('Bulk delete failed, error:', error);
      
      // If the endpoint doesn't exist or returns 404, fall back to individual deletions
      if (error.status === 404 || error.response?.status === 404) {
        console.log('Bulk delete endpoint not available (404), falling back to individual deletions');
        
        // Get all rehearsals for this orchestra
        const rehearsals = await this.getRehearsals({ groupId: orchestraId });
        console.log(`Found ${rehearsals.length} rehearsals to delete for orchestra ${orchestraId}`);
        
        if (rehearsals.length === 0) {
          return { deletedCount: 0 };
        }
        
        // Delete each rehearsal individually
        let deletedCount = 0;
        const deletePromises = rehearsals.map(async (rehearsal) => {
          try {
            await this.removeRehearsal(rehearsal._id);
            deletedCount++;
            console.log(`Successfully deleted rehearsal ${rehearsal._id}`);
          } catch (err) {
            console.error(`Failed to delete rehearsal ${rehearsal._id}:`, err);
            // Continue with other deletions even if one fails
          }
        });
        
        // Wait for all deletions to complete
        await Promise.allSettled(deletePromises);
        
        console.log(`Fallback deletion completed: ${deletedCount} out of ${rehearsals.length} rehearsals deleted`);
        return { deletedCount };
      }
      
      // Re-throw other errors (auth, server errors, etc.)
      throw error;
    }
  },

  // Bulk update rehearsals by orchestra ID
  async updateRehearsalsByOrchestra(orchestraId: string, updates: Partial<Rehearsal>): Promise<{ updatedCount: number }> {
    if (!orchestraId) {
      throw new Error('Invalid orchestra ID');
    }
    
    try {
      // Try the bulk update endpoint first
      console.log('Attempting bulk update for orchestra:', orchestraId, 'with updates:', updates);
      const result = await httpService.put(`rehearsal/orchestra/${orchestraId}`, updates);
      console.log('Bulk update successful:', result);
      return result;
    } catch (error: any) {
      console.log('Bulk update failed, error:', error);
      
      // If the endpoint doesn't exist or returns 404, fall back to individual updates
      if (error.status === 404 || error.response?.status === 404) {
        console.log('Bulk update endpoint not available (404), falling back to individual updates');
        
        // Get all rehearsals for this orchestra
        const rehearsals = await this.getRehearsals({ groupId: orchestraId });
        console.log(`Found ${rehearsals.length} rehearsals to update for orchestra ${orchestraId}`);
        
        if (rehearsals.length === 0) {
          return { updatedCount: 0 };
        }
        
        // Update each rehearsal individually
        let updatedCount = 0;
        const updatePromises = rehearsals.map(async (rehearsal) => {
          try {
            await this.updateRehearsal(rehearsal._id, updates);
            updatedCount++;
            console.log(`Successfully updated rehearsal ${rehearsal._id}`);
          } catch (err) {
            console.error(`Failed to update rehearsal ${rehearsal._id}:`, err);
            // Continue with other updates even if one fails
          }
        });
        
        // Wait for all updates to complete
        await Promise.allSettled(updatePromises);
        
        console.log(`Fallback update completed: ${updatedCount} out of ${rehearsals.length} rehearsals updated`);
        return { updatedCount };
      }
      
      // Re-throw other errors (auth, server errors, etc.)
      throw error;
    }
  },

  // Bulk rehearsals creation
  async bulkCreateRehearsals(data: BulkRehearsalData): Promise<{
    insertedCount: number;
    rehearsalIds: string[];
  }> {
    try {
      // Validate that we have the required fields before sending
      if (!data.orchestraId) {
        throw new Error('Orchestra ID is required for bulk rehearsal creation');
      }

      if (!data.schoolYearId) {
        throw new Error(
          'School year ID is required for bulk rehearsal creation'
        );
      }

      if (!data.startDate || !data.endDate) {
        throw new Error(
          'Start date and end date are required for bulk rehearsal creation'
        );
      }

      // Ensure dayOfWeek is a number
      const dayOfWeek = Number(data.dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Day of week must be a number between 0 and 6');
      }

      // Create a formatted object with all required fields
      const formattedData = {
        orchestraId: data.orchestraId,
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        notes: data.notes || '',
        excludeDates: data.excludeDates || [],
        schoolYearId: data.schoolYearId,
      };

      console.log('Sending bulk create data:', formattedData);

      // Get the current auth token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required for bulk rehearsal creation');
      }

      // Execute the API call with authentication headers
      const response = await httpService.post(
        'rehearsal/bulk-create',
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
