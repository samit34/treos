import axiosInstance from './axiosInstance';
import { Review } from '../types';

export interface SubmitReviewPayload {
  jobId: string;
  revieweeId: string;
  rating: number;
  comment: string;
}

export const reviewApi = {
  submitReview: async (payload: SubmitReviewPayload): Promise<Review> => {
    const response = await axiosInstance.post('/reviews', payload);
    return response.data.data.review;
  },

  getForUser: async (userId: string): Promise<Review[]> => {
    const response = await axiosInstance.get(`/reviews/user/${userId}`);
    return response.data.data.reviews;
  },

  getForJob: async (jobId: string): Promise<Review[]> => {
    const response = await axiosInstance.get(`/reviews/job/${jobId}`);
    return response.data.data.reviews;
  },
};

