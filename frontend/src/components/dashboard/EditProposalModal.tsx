import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '../../api/axiosInstance';
import { Proposal } from '../../types';

interface EditProposalModalProps {
  proposal: Proposal;
  onClose: () => void;
  onSuccess: (updatedProposal: Proposal) => void;
}

const EditProposalModal = ({ proposal, onClose, onSuccess }: EditProposalModalProps) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      message: proposal.message ?? '',
      proposedRate: (proposal.proposedRate ?? proposal.job?.hourlyRate ?? 0).toString(),
    },
    validationSchema: Yup.object({
      message: Yup.string().required('Message is required'),
      proposedRate: Yup.number().required('Proposed rate is required').min(0),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        setLoading(true);
        const response = await axiosInstance.put(`/proposals/${proposal._id}`, {
          message: values.message,
          proposedRate: parseFloat(values.proposedRate),
        });
        const updatedProposal: Proposal = response.data?.data?.proposal ?? {
          ...proposal,
          message: values.message,
          proposedRate: parseFloat(values.proposedRate),
          updatedAt: new Date().toISOString(),
        };
        onSuccess(updatedProposal);
      } catch (err: any) {
        console.error('Failed to update proposal', err);
        setError(err?.response?.data?.message || 'Failed to update proposal');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Update Proposal</h2>
        <div className="mb-4">
          <h3 className="font-semibold">{proposal.job.title}</h3>
          <p className="text-sm text-gray-500">
            Current status: <span className="capitalize">{proposal.status}</span>
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Message to Client</label>
            <textarea
              name="message"
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formik.values.message}
              onChange={formik.handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Proposed Rate ($/hr)</label>
            <input
              type="number"
              name="proposedRate"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formik.values.proposedRate}
              onChange={formik.handleChange}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProposalModal;


