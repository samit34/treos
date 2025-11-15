import axiosInstance from './axiosInstance';
import { User } from '../types';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await axiosInstance.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await axiosInstance.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await axiosInstance.post('/auth/reset-password', { token, password });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await axiosInstance.post('/auth/verify-email', { token });
  },

  googleAuth: async (token: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/google', { token });
    return response.data;
  },
};

