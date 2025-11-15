import axiosInstance from './axiosInstance';
import { User } from '../types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get('/users/profile');
    return response.data.data.user;
  },

  updateProfile: async (data: any): Promise<User> => {
    const response = await axiosInstance.put('/users/profile', data);
    return response.data.data.user;
  },

  completeOnboarding: async (data: any): Promise<User> => {
    const response = await axiosInstance.post('/users/onboarding', data);
    return response.data.data.user;
  },

  uploadProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await axiosInstance.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.user;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await axiosInstance.post('/users/change-password', { currentPassword, newPassword });
  },

  requestPasswordOtp: async (): Promise<void> => {
    await axiosInstance.post('/users/password-otp');
  },

  changePasswordWithOtp: async (otp: string, newPassword: string): Promise<void> => {
    await axiosInstance.post('/users/password-otp/verify', { otp, newPassword });
  },

  getWorkers: async (
    params?: Record<string, string | number | undefined>
  ): Promise<{ workers: User[]; total: number; totalPages: number; currentPage: number }> => {
    const response = await axiosInstance.get('/users/workers', { params });
    return response.data.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data.data.user;
  },
};

