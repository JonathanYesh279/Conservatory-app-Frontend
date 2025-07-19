import { httpService } from './httpService';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResponse {
  success: boolean;
  message: string;
}

export const passwordService = {
  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordRequest): Promise<PasswordResponse> {
    try {
      const response = await httpService.post<PasswordResponse>('auth/change-password', data);
      return response;
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  },

  /**
   * Request password reset (forgot password)
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<PasswordResponse> {
    try {
      const response = await httpService.post<PasswordResponse>('auth/forgot-password', data);
      return response;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<PasswordResponse> {
    try {
      const response = await httpService.post<PasswordResponse>('auth/reset-password', data);
      return response;
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }
};

export default passwordService;