// src/services/theoryService.ts
import { httpService } from './httpService';

export interface TheoryLesson {
  _id: string;
  category: string; // Theory lesson category
  teacherId: string; // The teacher/instructor for this theory lesson
  date: string; // ISO date string
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  location: string;
  studentIds: string[]; // Array of student IDs enrolled in this theory lesson
  attendance?: {
    present: string[]; // Array of student IDs
    absent: string[]; // Array of student IDs
  };
  notes?: string;
  syllabus?: string;
  homework?: string;
  schoolYearId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Constants from backend
export const THEORY_CATEGORIES = [
  'מתקדמים', // Advanced
  'אמצעיים', // Intermediate
  'מתחילים', // Beginners
  'תלמידים חדשים בגדול', // New students (older)
  'תלמידים חדשים (צ-ח)', // New students (grades 6-8)
  'תלמידים חדשים נוגאממרים', // New students (specific group)
  'שעת שאלות', // Question hour
  'שרות', // Service
  "בג'ע-ק בע", // Specific group codes
];

export const THEORY_LOCATIONS = [
  'אולם ערן',
  'סטודיו קאמרי 1',
  'סטודיו קאמרי 2',
  'אולפן הקלטות',
  'חדר חזרות 1',
  'חדר חזרות 2',
  'חדר מחשבים',
  'חדר 1',
  'חדר 2',
  'חדר חזרות',
  'חדר 5',
  'חדר 6',
  'חדר 7',
  'חדר 8',
  'חדר 9',
  'חדר 10',
  'חדר 11',
  'חדר 12',
  'חדר 13',
  'חדר 14',
  'חדר 15',
  'חדר 16',
  'חדר 17',
  'חדר 18',
  'חדר 19',
  'חדר 20',
  'חדר 21',
  'חדר 22',
  'חדר 23',
  'חדר 24',
  'חדר 25',
  'חדר 26',
];

export const DAYS_OF_WEEK: Record<number, string> = {
  0: 'ראשון', // Sunday
  1: 'שני', // Monday
  2: 'שלישי', // Tuesday
  3: 'רביעי', // Wednesday
  4: 'חמישי', // Thursday
  5: 'שישי', // Friday
  6: 'שבת', // Saturday
};

// Update the interface to match exactly what the backend expects for bulk creation
export interface BulkTheoryLessonData {
  category: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  studentIds?: string[];
  notes?: string;
  syllabus?: string;
  excludeDates?: string[];
  schoolYearId: string; // Required to match backend schema
}

export interface TheoryFilter {
  category?: string;
  teacherId?: string;
  studentId?: string;
  fromDate?: string;
  toDate?: string;
  dayOfWeek?: number;
  location?: string;
  schoolYearId?: string;
  isActive?: boolean;
  showInactive?: boolean;
}

export const theoryService = {
  // Get all theory lessons with optional filtering
  async getTheoryLessons(filterBy: TheoryFilter = {}): Promise<TheoryLesson[]> {
    return httpService.get('theory', filterBy);
  },

  // Get a specific theory lesson by ID
  async getTheoryLessonById(theoryLessonId: string): Promise<TheoryLesson> {
    return httpService.get(`theory/${theoryLessonId}`);
  },

  // Get theory lessons by category
  async getTheoryLessonsByCategory(category: string, filterBy: TheoryFilter = {}): Promise<TheoryLesson[]> {
    return httpService.get(`theory/category/${category}`, filterBy);
  },

  // Get theory lessons for a specific teacher
  async getTheoryLessonsByTeacher(teacherId: string, filterBy: TheoryFilter = {}): Promise<TheoryLesson[]> {
    return httpService.get(`theory/teacher/${teacherId}`, filterBy);
  },

  // Get theory lessons by IDs
  async getTheoryLessonsByIds(theoryLessonIds: string[]): Promise<TheoryLesson[]> {
    // If no ids provided, return empty array
    if (!theoryLessonIds || theoryLessonIds.length === 0) {
      return [];
    }

    try {
      // Use individual GET requests instead of POST to byIds endpoint
      const theoryLessonPromises = theoryLessonIds.map((id) =>
        this.getTheoryLessonById(id).catch((error) => {
          console.error(`Failed to fetch theory lesson ${id}:`, error);
          return null;
        })
      );

      const results = await Promise.allSettled(theoryLessonPromises);

      // Filter out failures and nulls
      const theoryLessons = results
        .filter(
          (result) => result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => (result as PromiseFulfilledResult<TheoryLesson>).value);

      return theoryLessons;
    } catch (error) {
      console.error('Error fetching theory lessons by IDs:', error);
      return []; // Return empty array instead of throwing
    }
  },

  // Add a new theory lesson
  async addTheoryLesson(theoryLesson: Partial<TheoryLesson>): Promise<TheoryLesson> {
    // Calculate dayOfWeek if not provided
    if (theoryLesson.date && !theoryLesson.dayOfWeek) {
      const date = new Date(theoryLesson.date);
      theoryLesson.dayOfWeek = date.getDay();
    }

    // Check for schoolYearId
    if (!theoryLesson.schoolYearId) {
      throw new Error('School year ID is required for theory lesson creation');
    }

    console.log('Adding theory lesson with data:', theoryLesson);
    return httpService.post('theory', theoryLesson);
  },

  // Update an existing theory lesson
  async updateTheoryLesson(
    theoryLessonId: string,
    theoryLesson: Partial<TheoryLesson>
  ): Promise<TheoryLesson> {
    // Remove _id from the request body if it exists
    const { _id, ...theoryLessonWithoutId } = theoryLesson as any;

    // Calculate dayOfWeek if not provided
    if (theoryLesson.date && !theoryLesson.dayOfWeek) {
      const date = new Date(theoryLesson.date);
      theoryLessonWithoutId.dayOfWeek = date.getDay();
    }

    return httpService.put(`theory/${theoryLessonId}`, theoryLessonWithoutId);
  },

  // Soft delete a theory lesson (mark as inactive)
  async removeTheoryLesson(theoryLessonId: string): Promise<TheoryLesson> {
    if (!theoryLessonId) {
      throw new Error('Invalid theory lesson ID');
    }
    return httpService.delete(`theory/${theoryLessonId}`);
  },

  // Bulk theory lessons creation
  async bulkCreateTheoryLessons(data: BulkTheoryLessonData): Promise<{
    insertedCount: number;
    theoryLessonIds: string[];
  }> {
    try {
      // Validate that we have the required fields before sending
      if (!data.category) {
        throw new Error('Category is required for bulk theory lesson creation');
      }

      if (!data.teacherId) {
        throw new Error('Teacher ID is required for bulk theory lesson creation');
      }

      if (!data.schoolYearId) {
        throw new Error(
          'School year ID is required for bulk theory lesson creation'
        );
      }

      if (!data.startDate || !data.endDate) {
        throw new Error(
          'Start date and end date are required for bulk theory lesson creation'
        );
      }

      // Ensure dayOfWeek is a number
      const dayOfWeek = Number(data.dayOfWeek);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Day of week must be a number between 0 and 6');
      }

      // Create a formatted object with all required fields
      const formattedData = {
        category: data.category,
        teacherId: data.teacherId,
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        studentIds: data.studentIds || [],
        notes: data.notes || '',
        syllabus: data.syllabus || '',
        excludeDates: data.excludeDates || [],
        schoolYearId: data.schoolYearId,
      };

      console.log('Sending bulk create data:', formattedData);

      // Get the current auth token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required for bulk theory lesson creation');
      }

      // Execute the API call with authentication headers
      const response = await httpService.post(
        'theory/bulk-create',
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
    theoryLessonId: string,
    attendance: { present: string[]; absent: string[] }
  ): Promise<TheoryLesson> {
    return httpService.put(`theory/${theoryLessonId}/attendance`, attendance);
  },

  async getAttendance(
    theoryLessonId: string
  ): Promise<{ present: string[]; absent: string[] }> {
    return httpService.get(`theory/${theoryLessonId}/attendance`);
  },

  // Student enrollment
  async addStudentToTheory(theoryLessonId: string, studentId: string): Promise<TheoryLesson> {
    return httpService.post(`theory/${theoryLessonId}/student`, { studentId });
  },

  async removeStudentFromTheory(theoryLessonId: string, studentId: string): Promise<TheoryLesson> {
    return httpService.delete(`theory/${theoryLessonId}/student/${studentId}`);
  },

  async getStudentTheoryAttendanceStats(studentId: string, category?: string): Promise<any> {
    const queryParams = category ? { category } : {};
    return httpService.get(`theory/student/${studentId}/stats`, queryParams);
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

  // Get theory lesson duration in minutes
  calculateDuration(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;

    return end - start;
  },

  // Format duration for display
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} דקות`;
    } else if (hours === 1 && mins === 0) {
      return 'שעה אחת';
    } else if (hours === 1) {
      return `שעה ו-${mins} דקות`;
    } else if (mins === 0) {
      return `${hours} שעות`;
    } else {
      return `${hours} שעות ו-${mins} דקות`;
    }
  },
};