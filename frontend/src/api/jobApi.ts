import axiosInstance from './axiosInstance';
import { Job } from '../types';

export const jobApi = {
  getJobs: async (params?: any): Promise<{ jobs: Job[]; total: number }> => {
    const response = await axiosInstance.get('/jobs', { params });
    return response.data.data;
  },

  getJobById: async (id: string): Promise<Job> => {
    const response = await axiosInstance.get(`/jobs/${id}`);
    return response.data.data.job;
  },

  createJob: async (data: any): Promise<Job> => {
    const response = await axiosInstance.post('/jobs', data);
    return response.data.data.job;
  },

  updateJob: async (id: string, data: any): Promise<Job> => {
    const response = await axiosInstance.put(`/jobs/${id}`, data);
    return response.data.data.job;
  },

  deleteJob: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/jobs/${id}`);
  },

  selectWorker: async (jobId: string, workerId: string, proposalId: string): Promise<void> => {
    await axiosInstance.post(`/jobs/${jobId}/select-worker`, { workerId, proposalId });
  },

  completeJob: async (jobId: string): Promise<void> => {
    await axiosInstance.post(`/jobs/${jobId}/complete`);
  },
};

