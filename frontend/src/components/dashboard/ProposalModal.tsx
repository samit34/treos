import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '../../api/axiosInstance';
import { Job } from '../../types';

interface ProposalModalProps {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}

const ProposalModal = ({ job, onClose, onSuccess }: ProposalModalProps) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      message: '',
      proposedRate: job.hourlyRate.toString(),
    },
    validationSchema: Yup.object({
      message: Yup.string().required('Message is required'),
      proposedRate: Yup.number().required('Proposed rate is required').min(0),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        setLoading(true);
        await axiosInstance.post('/proposals', {
          jobId: job._id,
          message: values.message,
          proposedRate: parseFloat(values.proposedRate),
        });
        onSuccess();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to submit proposal');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Submit Proposal</h2>
        <div className="mb-4">
          <h3 className="font-semibold">{job.title}</h3>
          <p className="text-sm text-gray-500">Client Rate: ${job.hourlyRate}/hr</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Message</label>
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
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;

