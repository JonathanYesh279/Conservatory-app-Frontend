// src/utils/authorization.ts

/**
 * Comprehensive authorization utility for the conservatory application
 * Provides centralized permission checking logic
 */

import { Student } from '../services/studentService';
import { Teacher } from '../services/teacherService';

export interface User {
  _id: string;
  email: string;
  roles: string[];
  personalInfo?: {
    fullName: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface AuthorizationContext {
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Role constants for consistent usage
 */
export const ROLES = {
  ADMIN: 'מנהל',
  TEACHER: 'מורה',
  CONDUCTOR: 'מנצח',
  ENSEMBLE_INSTRUCTOR: 'מדריך הרכב',
  THEORY_TEACHER: 'מורה תאוריה',
  STUDENT: 'תלמיד',
  PARENT: 'הורה'
} as const;

/**
 * Permission checking functions
 */
export class AuthorizationManager {
  constructor(private context: AuthorizationContext) {}

  /**
   * Check if user has any of the specified roles
   */
  hasRole(roles: string | string[]): boolean {
    if (!this.context.user) return false;
    
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    return rolesToCheck.some(role => this.context.user!.roles.includes(role));
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole(ROLES.ADMIN);
  }

  /**
   * Check if user is teacher
   */
  isTeacher(): boolean {
    return this.hasRole(ROLES.TEACHER);
  }

  /**
   * Check if user is student
   */
  isStudent(): boolean {
    return this.hasRole(ROLES.STUDENT);
  }

  /**
   * Check if user is conductor
   */
  isConductor(): boolean {
    return this.hasRole(ROLES.CONDUCTOR);
  }

  /**
   * Check if user is ensemble instructor
   */
  isEnsembleInstructor(): boolean {
    return this.hasRole(ROLES.ENSEMBLE_INSTRUCTOR);
  }

  /**
   * Check if user can add students
   */
  canAddStudent(): boolean {
    return this.isAdmin() || this.isTeacher();
  }

  /**
   * Check if user can add teachers
   */
  canAddTeacher(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view a specific student
   */
  canViewStudent(student: Student): boolean {
    if (!this.context.user) return false;
    
    // Admin can view all students
    if (this.isAdmin()) return true;
    
    // Teacher can view students assigned to them
    if (this.isTeacher()) {
      return this.isStudentAssignedToTeacher(student, this.context.user._id);
    }
    
    // Student can view their own profile
    if (this.isStudent()) {
      return student._id === this.context.user._id;
    }
    
    return false;
  }

  /**
   * Check if user can edit a specific student
   */
  canEditStudent(student: Student): boolean {
    if (!this.context.user) return false;
    
    // Admin can edit all students
    if (this.isAdmin()) return true;
    
    // Teacher can edit students assigned to them
    if (this.isTeacher()) {
      return this.isStudentAssignedToTeacher(student, this.context.user._id);
    }
    
    return false;
  }

  /**
   * Check if user can delete a specific student
   */
  canDeleteStudent(student: Student): boolean {
    if (!this.context.user) return false;
    
    // Only admin can delete students
    return this.isAdmin();
  }

  /**
   * Check if user can update a specific student
   */
  canUpdateStudent(student: Student): boolean {
    return this.canEditStudent(student);
  }

  /**
   * Check if user can view a specific teacher
   */
  canViewTeacher(teacher: Teacher): boolean {
    if (!this.context.user) return false;
    
    // Admin can view all teachers
    if (this.isAdmin()) return true;
    
    // Teacher can view their own profile
    if (this.isTeacher()) {
      return teacher._id === this.context.user._id;
    }
    
    return false;
  }

  /**
   * Check if user can edit a specific teacher
   */
  canEditTeacher(teacher: Teacher): boolean {
    if (!this.context.user) return false;
    
    // Only admin can edit teachers
    if (this.isAdmin()) return true;
    
    // Teacher can edit their own profile
    if (this.isTeacher()) {
      return teacher._id === this.context.user._id;
    }
    
    return false;
  }

  /**
   * Check if user can delete a specific teacher
   */
  canDeleteTeacher(teacher: Teacher): boolean {
    if (!this.context.user) return false;
    
    // Only admin can delete teachers
    return this.isAdmin();
  }

  /**
   * Check if user can update a specific teacher
   */
  canUpdateTeacher(teacher: Teacher): boolean {
    return this.canEditTeacher(teacher);
  }

  /**
   * Check if user can view orchestras
   */
  canViewOrchestras(): boolean {
    return this.isAdmin() || this.isConductor() || this.isEnsembleInstructor() || this.isTeacher();
  }

  /**
   * Check if user can create orchestras
   */
  canCreateOrchestra(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can edit a specific orchestra
   */
  canEditOrchestra(orchestra: any): boolean {
    if (!this.context.user || !orchestra) return false;
    
    // Admin can edit all orchestras
    if (this.isAdmin()) return true;
    
    // Conductor can edit orchestras they conduct
    if (this.isConductor() || this.isEnsembleInstructor()) {
      // Check if user is the conductor of this orchestra
      return orchestra.conductorId === this.context.user._id;
    }
    
    return false;
  }

  /**
   * Check if user can delete a specific orchestra
   */
  canDeleteOrchestra(orchestra: any): boolean {
    if (!this.context.user) return false;
    
    // Only admin can delete orchestras
    return this.isAdmin();
  }

  /**
   * Check if user can update a specific orchestra
   */
  canUpdateOrchestra(orchestra: any): boolean {
    return this.canEditOrchestra(orchestra);
  }

  /**
   * Check if a student is assigned to a specific teacher
   */
  private isStudentAssignedToTeacher(student: Student, teacherId: string): boolean {
    if (!student.teacherIds || !Array.isArray(student.teacherIds)) {
      return false;
    }
    
    return student.teacherIds.includes(teacherId);
  }

  /**
   * Get user-friendly error message for authorization failures
   */
  getAuthorizationErrorMessage(action: string, resource: string = 'תלמיד'): string {
    const messages = {
      view: `אין לך הרשאות לצפות ב${resource} זה.`,
      edit: `אין לך הרשאות לערוך ${resource} זה. רק המורה הקבוע או המנהל יכולים לערוך.`,
      update: `אין לך הרשאות לעדכן ${resource} זה. רק המורה הקבוע או המנהל יכולים לעדכן.`,
      delete: `אין לך הרשאות למחוק ${resource} זה. רק המנהל יכול למחוק.`,
      add: `אין לך הרשאות להוסיף ${resource} חדש.`,
      default: `אין לך הרשאות לבצע פעולה זו.`
    };
    
    return messages[action as keyof typeof messages] || messages.default;
  }

  /**
   * Check if user should see action buttons (edit/delete) for a student
   */
  getStudentActionPermissions(student: Student) {
    return {
      canView: this.canViewStudent(student),
      canEdit: this.canEditStudent(student),
      canDelete: this.canDeleteStudent(student),
      canUpdate: this.canUpdateStudent(student),
      showEditButton: this.canEditStudent(student),
      showDeleteButton: this.canDeleteStudent(student)
    };
  }

  /**
   * Check if user should see action buttons (edit/delete) for a teacher
   */
  getTeacherActionPermissions(teacher: Teacher) {
    return {
      canView: this.canViewTeacher(teacher),
      canEdit: this.canEditTeacher(teacher),
      canDelete: this.canDeleteTeacher(teacher),
      canUpdate: this.canUpdateTeacher(teacher),
      showEditButton: this.canEditTeacher(teacher),
      showDeleteButton: this.canDeleteTeacher(teacher)
    };
  }

  /**
   * Check if user should see action buttons (edit/delete) for an orchestra
   */
  getOrchestraActionPermissions(orchestra: any) {
    return {
      canView: this.canViewOrchestras(),
      canEdit: this.canEditOrchestra(orchestra),
      canDelete: this.canDeleteOrchestra(orchestra),
      canUpdate: this.canUpdateOrchestra(orchestra),
      showEditButton: this.canEditOrchestra(orchestra),
      showDeleteButton: this.canDeleteOrchestra(orchestra)
    };
  }

  /**
   * Validate action before execution and throw appropriate error
   */
  validateAction(action: string, entity?: Student | Teacher, entityType?: 'student' | 'teacher'): void {
    if (!this.context.user) {
      throw new Error('אין לך הרשאות לבצע פעולה זו. אנא התחבר למערכת.');
    }

    const isTeacher = entityType === 'teacher';
    const resourceName = isTeacher ? 'מורה' : 'תלמיד';

    switch (action) {
      case 'add':
        if (isTeacher && !this.canAddTeacher()) {
          throw new Error(this.getAuthorizationErrorMessage('add', resourceName));
        } else if (!isTeacher && !this.canAddStudent()) {
          throw new Error(this.getAuthorizationErrorMessage('add', resourceName));
        }
        break;
      case 'view':
        if (entity) {
          if (isTeacher && !this.canViewTeacher(entity as Teacher)) {
            throw new Error(this.getAuthorizationErrorMessage('view', resourceName));
          } else if (!isTeacher && !this.canViewStudent(entity as Student)) {
            throw new Error(this.getAuthorizationErrorMessage('view', resourceName));
          }
        }
        break;
      case 'edit':
      case 'update':
        if (entity) {
          if (isTeacher && !this.canUpdateTeacher(entity as Teacher)) {
            throw new Error(this.getAuthorizationErrorMessage('update', resourceName));
          } else if (!isTeacher && !this.canUpdateStudent(entity as Student)) {
            throw new Error(this.getAuthorizationErrorMessage('update', resourceName));
          }
        }
        break;
      case 'delete':
        if (entity) {
          if (isTeacher && !this.canDeleteTeacher(entity as Teacher)) {
            throw new Error(this.getAuthorizationErrorMessage('delete', resourceName));
          } else if (!isTeacher && !this.canDeleteStudent(entity as Student)) {
            throw new Error(this.getAuthorizationErrorMessage('delete', resourceName));
          }
        }
        break;
      default:
        throw new Error(this.getAuthorizationErrorMessage('default'));
    }
  }
}

/**
 * Hook for using authorization in React components
 */
export function useAuthorization(context: AuthorizationContext) {
  return new AuthorizationManager(context);
}

/**
 * Helper function to create authorization context
 */
export function createAuthorizationContext(user: User | null, isAuthenticated: boolean): AuthorizationContext {
  return { user, isAuthenticated };
}

/**
 * Utility functions for common authorization checks
 */
export const AuthUtils = {
  /**
   * Check if user has admin privileges
   */
  isAdmin(user: User | null): boolean {
    return user?.roles.includes(ROLES.ADMIN) || false;
  },

  /**
   * Check if user has teacher privileges
   */
  isTeacher(user: User | null): boolean {
    return user?.roles.includes(ROLES.TEACHER) || false;
  },

  /**
   * Check if user can perform student operations
   */
  canManageStudents(user: User | null): boolean {
    return this.isAdmin(user) || this.isTeacher(user);
  },

  /**
   * Check if user can delete students
   */
  canDeleteStudents(user: User | null): boolean {
    return this.isAdmin(user);
  },

  /**
   * Check if user can manage teachers
   */
  canManageTeachers(user: User | null): boolean {
    return this.isAdmin(user);
  },

  /**
   * Check if user can delete teachers
   */
  canDeleteTeachers(user: User | null): boolean {
    return this.isAdmin(user);
  },

  isStudent(user: User | null): boolean {
    if (!user || !user.roles) return false;
    return user.roles.includes('תלמיד');
  },

  /**
   * Filter students based on user permissions
   */
  filterStudentsByPermissions(students: Student[], user: User | null): Student[] {
    if (!user) return [];
    
    // Admin can see all students
    if (this.isAdmin(user)) return students;
    
    // Teacher can see assigned students
    if (this.isTeacher(user)) {
      return students.filter(student => 
        student.teacherIds && student.teacherIds.includes(user._id)
      );
    }
    
    // Students can only see their own profile
    if (this.isStudent(user)) {
      return students.filter(student => student._id === user._id);
    }
    
    return [];
  },

  /**
   * Filter teachers based on user permissions
   */
  filterTeachersByPermissions(teachers: Teacher[], user: User | null): Teacher[] {
    if (!user) return [];
    
    // Admin can see all teachers
    if (this.isAdmin(user)) return teachers;
    
    // Teacher can see their own profile
    if (this.isTeacher(user)) {
      return teachers.filter(teacher => teacher._id === user._id);
    }
    
    return [];
  }
};