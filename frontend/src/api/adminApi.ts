import axiosInstance from './axiosInstance';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface User {
  _id?: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'worker' | 'admin';
  isBlocked?: boolean;
}

export interface Payment {
  _id: string;
  amount: number;
  status: string;
  transactionId?: string;
  client?: { email: string; firstName: string; lastName: string };
  worker?: { email: string; firstName: string; lastName: string };
  job?: { title: string };
}

export const adminApi = {
  // Users
  getAllUsers: async (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const response = await axiosInstance.get('/users/all', { params });
    return response.data.data.users;
  },

  blockUser: async (userId: string, blockReason?: string) => {
    const response = await axiosInstance.put(`/admin/users/${userId}`, {
      isBlocked: true,
      blockReason,
    });
    return response.data.data.user;
  },

  unblockUser: async (userId: string) => {
    const response = await axiosInstance.put(`/admin/users/${userId}`, {
      isBlocked: false,
    });
    return response.data.data.user;
  },

  // Categories
  listCategories: async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/admin/categories');
    return response.data.data.categories;
  },

  createCategory: async (data: { name: string; description?: string; isActive?: boolean }): Promise<Category> => {
    const response = await axiosInstance.post('/admin/categories', data);
    return response.data.data.category;
  },

  updateCategory: async (id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<Category> => {
    const response = await axiosInstance.put(`/admin/categories/${id}`, data);
    return response.data.data.category;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/admin/categories/${id}`);
  },

  // Payments
  getAllPayments: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await axiosInstance.get('/admin/payments', { params });
    return response.data.data.payments;
  },
};

// Public API for fetching active categories (no auth required)
export const getActiveCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get('/categories/active');
  return response.data.data.categories;
};

