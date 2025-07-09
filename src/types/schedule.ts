// src/types/schedule.ts
// Comprehensive type definitions for schedule management

// Hebrew day names constants
export const HEBREW_DAYS = {
  SUNDAY: 'ראשון',
  MONDAY: 'שני',
  TUESDAY: 'שלישי',
  WEDNESDAY: 'רביעי',
  THURSDAY: 'חמישי',
  FRIDAY: 'שישי',
  SATURDAY: 'שבת'
} as const;

export const HEBREW_DAYS_ARRAY = Object.values(HEBREW_DAYS);

export type HebrewDayName = typeof HEBREW_DAYS[keyof typeof HEBREW_DAYS];

// Day conversion utilities
export const HEBREW_TO_NUMERIC_DAYS: Record<HebrewDayName, number> = {
  [HEBREW_DAYS.SUNDAY]: 0,
  [HEBREW_DAYS.MONDAY]: 1,
  [HEBREW_DAYS.TUESDAY]: 2,
  [HEBREW_DAYS.WEDNESDAY]: 3,
  [HEBREW_DAYS.THURSDAY]: 4,
  [HEBREW_DAYS.FRIDAY]: 5,
  [HEBREW_DAYS.SATURDAY]: 6,
};

export const NUMERIC_TO_HEBREW_DAYS: Record<number, HebrewDayName> = {
  0: HEBREW_DAYS.SUNDAY,
  1: HEBREW_DAYS.MONDAY,
  2: HEBREW_DAYS.TUESDAY,
  3: HEBREW_DAYS.WEDNESDAY,
  4: HEBREW_DAYS.THURSDAY,
  5: HEBREW_DAYS.FRIDAY,
  6: HEBREW_DAYS.SATURDAY,
};

// Core schedule interfaces
export interface ScheduleSlot {
  id: string;
  teacherId: string;
  teacherName?: string;
  studentId?: string;
  studentName?: string;
  dayOfWeek: number; // 0-6, where 0 is Sunday
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  duration?: number; // Calculated duration in minutes
  location?: string;
  notes?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklySchedule {
  [dayOfWeek: number]: ScheduleSlot[];
}

export interface StudentSchedule {
  studentId: string;
  studentName: string;
  teacherSchedules: {
    teacherId: string;
    teacherName: string;
    instrument?: string;
    slots: ScheduleSlot[];
  }[];
  totalHours: number;
}

export interface TeacherSchedule {
  teacherId: string;
  teacherName: string;
  instrument?: string;
  weeklySchedule: WeeklySchedule;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
}

// API request/response interfaces
export interface CreateScheduleSlotRequest {
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring: boolean;
}

export interface CreateScheduleSlotResponse {
  success: boolean;
  slot: ScheduleSlot;
  message?: string;
}

export interface UpdateScheduleSlotRequest {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface UpdateScheduleSlotResponse {
  success: boolean;
  slot: ScheduleSlot;
  message?: string;
}

export interface AssignStudentRequest {
  scheduleSlotId: string;
  studentId: string;
}

export interface AssignStudentResponse {
  success: boolean;
  slot: ScheduleSlot;
  message?: string;
}

export interface GetAvailableSlotsRequest {
  teacherId: string;
  dayOfWeek?: number;
  minStartTime?: string;
  maxEndTime?: string;
  duration?: number; // in minutes
  excludeStudentId?: string; // exclude slots already assigned to this student
}

export interface GetAvailableSlotsResponse {
  success: boolean;
  slots: ScheduleSlot[];
  message?: string;
}

export interface GetTeacherScheduleRequest {
  teacherId: string;
  includeStudentInfo?: boolean;
  weekStartDate?: string; // ISO date string
}

export interface GetTeacherScheduleResponse {
  success: boolean;
  schedule: TeacherSchedule;
  message?: string;
}

export interface GetStudentScheduleRequest {
  studentId: string;
  includeTeacherInfo?: boolean;
}

export interface GetStudentScheduleResponse {
  success: boolean;
  schedule: StudentSchedule;
  message?: string;
}

// Schedule conflict detection
export interface ScheduleConflict {
  type: 'overlap' | 'double_booking' | 'invalid_time' | 'block_overlap' | 'lesson_conflict' | 'capacity_exceeded' | 'invalid_assignment';
  slotA: ScheduleSlot | string;
  slotB?: ScheduleSlot | string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  affectedTimeBlocks?: any[];
  affectedAssignments?: any[];
  suggestedResolution?: string;
}

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: ScheduleConflict[];
  suggestions?: string[];
}

// Form data interfaces
export interface TeacherAssignmentFormData {
  teacherId: string;
  scheduleSlotId?: string;
  day: HebrewDayName;
  time: string;
  duration: number;
  location?: string;
  notes?: string;
}

export interface ScheduleSlotFormData {
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  studentId?: string;
}

// Validation interfaces
export interface TimeSlotValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: ScheduleConflict[];
}

// Utility types
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TimeFormat = 'HH:MM';
export type LessonDuration = 30 | 45 | 60 | 90 | 120;

// Schedule management state
export interface ScheduleFilters {
  teacherId?: string;
  studentId?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  instrument?: string;
  location?: string;
  onlyAvailable?: boolean;
  onlyConflicts?: boolean;
}

export interface ScheduleViewOptions {
  viewType: 'weekly' | 'daily' | 'list';
  showStudentNames: boolean;
  showTeacherNames: boolean;
  showLocations: boolean;
  showNotes: boolean;
  use24HourFormat: boolean;
  highlightConflicts: boolean;
}

// Backend integration types (for transformation)
export interface BackendScheduleSlot {
  _id: string;
  teacherId: string;
  teacherName?: string;
  studentId?: string;
  studentName?: string;
  day: HebrewDayName; // Backend uses Hebrew day names
  time: string;
  duration: number;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTeacherSchedule {
  teacherId: string;
  schedule: {
    [key in HebrewDayName]?: BackendScheduleSlot[];
  };
}

// Error handling
export interface ScheduleError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ScheduleApiError {
  success: false;
  error: ScheduleError;
  timestamp: string;
}

// Success response wrapper
export interface ScheduleApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
  message?: string;
}

export type ScheduleApiResponse<T> = ScheduleApiSuccess<T> | ScheduleApiError;

// ========================================
// TIME BLOCK SYSTEM INTERFACES
// ========================================

// Lesson duration types
export type LessonDurationMinutes = 30 | 45 | 60;

// Time Block Creation Form Data - Following the guide requirements
export interface TimeBlockFormData {
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  recurringDays: HebrewDayName[];
}

// Enhanced Time Block Creation Request
export interface CreateTimeBlockRequest {
  teacherId: string;
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringDays?: HebrewDayName[];
}

// Time Block creation wizard steps
export interface TimeBlockWizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isActive: boolean;
}

// Wizard state for time block creation
export interface TimeBlockWizardState {
  currentStep: number;
  steps: TimeBlockWizardStep[];
  formData: TimeBlockFormData;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
}

// Lesson assignment within a time block
export interface LessonAssignment {
  studentId: string;
  studentName: string;
  lessonStartTime: string; // "14:00"
  lessonEndTime: string;   // "15:00"
  duration: LessonDurationMinutes;
  assignmentDate: Date;
  isActive: boolean;
}

// Time block interface - replaces individual slots
export interface TimeBlock {
  _id: string;
  teacherId: string;
  day: HebrewDayName;
  startTime: string; // "14:00"
  endTime: string;   // "18:00"
  location?: string;
  notes?: string;
  isActive: boolean;
  assignedLessons: LessonAssignment[];
  availableMinutes: number; // Calculated by backend
  utilizationPercentage: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

// Available slot calculated from time blocks
export interface AvailableSlot {
  timeBlockId: string;
  possibleStartTime: string;
  possibleEndTime: string;
  duration: LessonDurationMinutes;
  teacherId: string;
  teacherName?: string;
  day: HebrewDayName;
  location?: string;
  optimalScore: number; // Backend-calculated preference score (0-100)
  gapMinutesBefore?: number; // Minutes until previous lesson
  gapMinutesAfter?: number;  // Minutes until next lesson
}

// Time block creation/update requests
export interface CreateTimeBlockRequest {
  teacherId: string;
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean; // If true, create for multiple days
  recurringDays?: HebrewDayName[]; // Days to create recurring blocks
}

export interface CreateTimeBlockResponse {
  success: boolean;
  timeBlock: TimeBlock;
  message?: string;
}

export interface UpdateTimeBlockRequest {
  day?: HebrewDayName;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateTimeBlockResponse {
  success: boolean;
  timeBlock: TimeBlock;
  affectedAssignments?: LessonAssignment[]; // Assignments that were moved/cancelled
  message?: string;
}

// Enhanced slot discovery
export interface SlotSearchCriteria {
  teacherId: string;
  duration: LessonDurationMinutes;
  preferredDays?: HebrewDayName[];
  preferredTimeRange?: {
    startTime: string;
    endTime: string;
  };
  excludeStudentId?: string;
  maxResults?: number;
  sortBy?: 'optimal' | 'earliest' | 'latest' | 'day' | 'duration';
}

export interface GetAvailableSlotsEnhancedResponse {
  success: boolean;
  slots: AvailableSlot[];
  totalBlocksChecked: number;
  alternativeDurations?: {
    duration: LessonDurationMinutes;
    availableCount: number;
  }[];
  message?: string;
}

// Intelligent lesson assignment
export interface AssignLessonRequest {
  timeBlockId: string;
  studentId: string;
  lessonStartTime: string;
  duration: LessonDurationMinutes;
  preferredLocation?: string;
  notes?: string;
}

export interface AssignLessonResponse {
  success: boolean;
  assignment: LessonAssignment;
  updatedTimeBlock: TimeBlock;
  conflictsResolved?: ScheduleConflict[];
  message?: string;
}

// Lesson rescheduling
export interface RescheduleLessonRequest {
  currentAssignmentId: string;
  newTimeBlockId: string;
  newStartTime: string;
  newDuration?: LessonDurationMinutes;
}

export interface RescheduleLessonResponse {
  success: boolean;
  oldAssignment: LessonAssignment;
  newAssignment: LessonAssignment;
  affectedTimeBlocks: TimeBlock[];
  message?: string;
}

// Teacher schedule statistics
export interface TeacherScheduleStats {
  teacherId: string;
  totalTimeBlocks: number;
  totalAvailableHours: number;
  totalAssignedHours: number;
  utilizationPercentage: number;
  averageBlockUtilization: number;
  lessonsPerWeek: number;
  studentsPerWeek: number;
  gapAnalysis: {
    totalGapHours: number;
    averageGapMinutes: number;
    utilizableGaps: number; // Gaps large enough for lessons
  };
}

// Enhanced schedule state management
export interface TimeBlockScheduleState {
  // Time Block Management
  teacherTimeBlocks: Record<string, TimeBlock[]>;
  selectedTimeBlock: TimeBlock | null;
  timeBlockStats: Record<string, TeacherScheduleStats>;
  
  // Slot Discovery
  availableSlots: AvailableSlot[];
  slotSearchCriteria: SlotSearchCriteria | null;
  lastSearchResults: GetAvailableSlotsEnhancedResponse | null;
  
  // Assignment Management
  activeAssignments: LessonAssignment[];
  assignmentConflicts: ScheduleConflict[];
  recentAssignmentHistory: LessonAssignment[];
  
  // UI State
  selectedDuration: LessonDurationMinutes;
  selectedDay: HebrewDayName | null;
  isCreatingBlock: boolean;
  isCalculatingSlots: boolean;
  isAssigningLesson: boolean;
  viewMode: 'blocks' | 'timeline' | 'calendar';
  
  // Cache Management
  lastUpdated: Record<string, Date>;
  pendingOperations: string[];
}

// Time block form data
export interface TimeBlockFormData {
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  recurringDays: HebrewDayName[];
}

// Slot booking preferences
export interface StudentSlotPreferences {
  studentId: string;
  preferredDurations: LessonDurationMinutes[];
  preferredDays: HebrewDayName[];
  preferredTimeRanges: {
    startTime: string;
    endTime: string;
  }[];
  avoidTimeRanges: {
    startTime: string;
    endTime: string;
    reason?: string;
  }[];
  maxLessonsPerWeek?: number;
  preferredTeachers: string[];
  locations?: string[];
}

// Enhanced conflict detection for time blocks
export interface TimeBlockConflict {
  type: 'block_overlap' | 'lesson_conflict' | 'capacity_exceeded' | 'invalid_assignment';
  affectedTimeBlocks: TimeBlock[];
  affectedAssignments: LessonAssignment[];
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestedResolution?: string;
}

// Advanced scheduling algorithms data
export interface OptimizationSuggestion {
  type: 'gap_reduction' | 'better_utilization' | 'student_preference' | 'teacher_efficiency';
  currentScore: number;
  proposedScore: number;
  actionRequired: string;
  timeBlocksAffected: string[];
  studentsAffected: string[];
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}

// Migration support interfaces
export interface LegacySlotMigration {
  legacySlotId: string;
  newTimeBlockId: string;
  newAssignmentId?: string;
  migrationStatus: 'pending' | 'completed' | 'failed';
  migrationDate?: Date;
  notes?: string;
}

// Analytics and reporting
export interface ScheduleAnalytics {
  teacherId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalTeachingHours: number;
    utilizationRate: number;
    averageLessonDuration: number;
    gapEfficiency: number;
    studentSatisfactionScore?: number;
  };
  trends: {
    weeklyUtilization: number[];
    popularTimeSlots: string[];
    durationPreferences: Record<LessonDurationMinutes, number>;
  };
}