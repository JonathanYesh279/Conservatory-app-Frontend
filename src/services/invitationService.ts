// src/services/invitationService.ts
import { httpService } from './httpService';

export interface InvitationValidationResponse {
  success: boolean;
  teacher: {
    personalInfo: {
      fullName: string;
      email: string;
    };
    roles: string[];
  };
  message?: string;
}

export interface InvitationAcceptanceRequest {
  password: string;
}

export interface InvitationAcceptanceResponse {
  success: boolean;
  teacher: {
    _id: string;
    personalInfo: {
      fullName: string;
      email: string;
    };
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface ResendInvitationRequest {
  adminId: string;
}

export const invitationService = {
  /**
   * Validates an invitation token
   */
  async validateInvitation(token: string): Promise<InvitationValidationResponse> {
    try {
      const response = await httpService.get(`/teacher/invitation/validate/${token}`);
      
      // Handle wrapped response structure {success: true, data: {...}}
      let responseData = response;
      if (response && response.success && response.data) {
        responseData = response.data;
      }
      
      return responseData;
    } catch (error) {
      console.error('Error validating invitation:', error);
      throw error;
    }
  },

  /**
   * Accepts an invitation and sets up the teacher account
   */
  async acceptInvitation(token: string, data: InvitationAcceptanceRequest): Promise<InvitationAcceptanceResponse> {
    try {
      const response = await httpService.post(`/teacher/invitation/accept/${token}`, data);
      
      // Handle wrapped response structure {success: true, data: {...}}
      let responseData = response;
      if (response && response.success && response.data) {
        responseData = response.data;
      }
      
      return responseData;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  /**
   * Resends an invitation (admin only)
   */
  async resendInvitation(teacherId: string, data: ResendInvitationRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpService.post(`/teacher/invitation/resend/${teacherId}`, data);
      return response;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }
};