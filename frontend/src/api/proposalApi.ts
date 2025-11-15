import axiosInstance from './axiosInstance';
import { Proposal } from '../types';

interface InvitePayload {
  jobId: string;
  workerId: string;
  message?: string;
  proposedRate?: number;
}

export const proposalApi = {
  inviteWorker: async (payload: InvitePayload): Promise<Proposal> => {
    const response = await axiosInstance.post('/proposals/invite', payload);
    return response.data.data.proposal;
  },

  respondToProposal: async (
    proposalId: string,
    action: 'accept' | 'reject'
  ): Promise<Proposal> => {
    const response = await axiosInstance.post(`/proposals/${proposalId}/respond`, { action });
    return response.data.data.proposal;
  },
};

