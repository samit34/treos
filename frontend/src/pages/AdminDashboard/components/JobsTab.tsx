import { useMemo, useState } from 'react';
import { Job } from '../../../types';
import axiosInstance from '../../../api/axiosInstance';

interface JobsTabProps {
  jobs: (Job & { _id: string })[];
  onJobsUpdate: (jobs: (Job & { _id: string })[]) => void;
}

const JobsTab = ({ jobs, onJobsUpdate }: JobsTabProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const statusMatch = statusFilter === 'all' || job.status === statusFilter;
      const searchMatch =
        !searchQuery.trim() ||
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.client as any)?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.client as any)?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.client as any)?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [jobs, statusFilter, searchQuery]);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This will also delete all associated proposals and payments.')) {
      return;
    }

    try {
      setMessage('');
      setDeletingJobId(jobId);
      await axiosInstance.delete(`/admin/jobs/${jobId}`);
      onJobsUpdate(jobs.filter((job) => job._id !== jobId));
      setMessage('Job deleted successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete job.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setDeletingJobId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, description, or client..."
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
      </div>

      {message && (
        <div className={`text-sm rounded px-3 py-2 ${
          message.includes('successfully') 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Worker</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Budget</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No jobs found
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{job.title}</div>
                    {job.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">
                        {job.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {(job.client as any)?.firstName && (
                      <>
                        <div>
                          {(job.client as any).firstName} {(job.client as any).lastName}
                        </div>
                        <div className="text-xs text-gray-500">{(job.client as any).email}</div>
                      </>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {(job.selectedWorker as any)?.firstName ? (
                      <>
                        <div>
                          {(job.selectedWorker as any).firstName} {(job.selectedWorker as any).lastName}
                        </div>
                        <div className="text-xs text-gray-500">{(job.selectedWorker as any).email}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(job.status || '')}`}>
                      {job.status || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {job.budget ? `$${job.budget}` : 'N/A'}
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-500">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      disabled={deletingJobId === job._id}
                      className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingJobId === job._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsTab;

