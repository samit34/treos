import { useEffect, useMemo, useState } from 'react';
import { Job, Proposal, User } from '../../types';
import { proposalApi } from '../../api/proposalApi';

interface InviteWorkerModalProps {
  worker: User;
  jobs: Job[];
  loadingJobs: boolean;
  onClose: () => void;
  onSuccess: (proposal: Proposal) => void;
}

const autoMessage = (worker: User, job?: Job) => {
  const workerName = `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim() || worker.firstName || 'there';
  const jobTitle = job?.title ?? 'my job opportunity';
  return `Hello ${workerName}, I would love to invite you to my job "${jobTitle}". Please let me know if you're available!`;
};

const InviteWorkerModal = ({ worker, jobs, loadingJobs, onClose, onSuccess }: InviteWorkerModalProps) => {
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [hasMessageTouched, setHasMessageTouched] = useState(false);
  const [proposedRate, setProposedRate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const workerDisplayName = useMemo(
    () => `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim() || worker.firstName || worker.email,
    [worker]
  );

  useEffect(() => {
    if (jobs.length > 0) {
      const defaultJob = jobs[0];
      setSelectedJobId(defaultJob._id);
      setProposedRate(defaultJob.hourlyRate?.toString() ?? '');
      setMessage(autoMessage(worker, defaultJob));
      setHasMessageTouched(false);
    } else {
      setSelectedJobId('');
      setProposedRate('');
      setMessage('');
      setHasMessageTouched(false);
    }
  }, [jobs, worker]);

  useEffect(() => {
    if (!selectedJobId) {
      return;
    }
    const job = jobs.find((item) => item._id === selectedJobId);
    if (job) {
      setProposedRate(job.hourlyRate?.toString() ?? '');
      if (!hasMessageTouched) {
        setMessage(autoMessage(worker, job));
      }
    }
  }, [selectedJobId, jobs, worker, hasMessageTouched]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedJobId) {
      setError('Please choose a job to send with the invitation.');
      return;
    }

    const workerId = (worker as unknown as { id?: string; _id?: string }).id ??
      (worker as unknown as { id?: string; _id?: string })._id;

    if (!workerId) {
      setError('Unable to determine the selected worker.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        jobId: selectedJobId,
        workerId,
        message: message.trim() ? message.trim() : undefined,
        proposedRate: proposedRate ? Number(proposedRate) : undefined,
      };

      const proposal = await proposalApi.inviteWorker(payload);
      onSuccess(proposal);
      onClose();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || 'Unable to send invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Invite {workerDisplayName}</h2>
          <p className="text-sm text-gray-500">Send a personalized invitation and job details.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loadingJobs ? (
            <div className="text-center text-gray-500 py-10">Loading your open jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-5 rounded">
              <h3 className="font-semibold">You do not have any open jobs yet.</h3>
              <p className="mt-2 text-sm">
                Create a job first, then return here to invite workers to apply.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="jobId" className="text-sm font-medium text-gray-700">
                    Select Job
                  </label>
                  <select
                    id="jobId"
                    value={selectedJobId}
                    onChange={(event) => setSelectedJobId(event.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                  {selectedJobId && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                      {(() => {
                        const job = jobs.find((item) => item._id === selectedJobId);
                        if (!job) return null;
                        const location = job.location
                          ? `${job.location.city}, ${job.location.state}`
                          : 'Location TBD';
                        return (
                          <ul className="space-y-1">
                            <li><strong>Rate:</strong> ${job.hourlyRate}/hr</li>
                            <li><strong>Start:</strong> {job.schedule?.startDate ? new Date(job.schedule.startDate).toLocaleDateString() : 'TBD'}</li>
                            <li><strong>Hours:</strong> {job.schedule?.hours?.start ?? 'TBD'} - {job.schedule?.hours?.end ?? 'TBD'}</li>
                            <li><strong>Location:</strong> {location}</li>
                          </ul>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="rate" className="text-sm font-medium text-gray-700">
                    Proposed Rate ($/hr)
                  </label>
                  <input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposedRate}
                    onChange={(event) => setProposedRate(event.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  <p className="text-xs text-gray-500">
                    Adjust the hourly rate if you would like to offer something different from the job listing.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Personalized Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (!hasMessageTouched) {
                      setHasMessageTouched(true);
                    }
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Introduce yourself and share why this worker would be a great fit for your family."
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingJobs || jobs.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteWorkerModal;

