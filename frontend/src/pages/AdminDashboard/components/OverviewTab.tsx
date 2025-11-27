import { User, Job } from '../../../types';

interface OverviewTabProps {
  stats: {
    totalUsers?: number;
    totalJobs?: number;
    totalRevenue?: number;
    inProgressJobs?: number;
  };
  users: User[];
  jobs: (Job & { _id: string })[];
  onMarkJobComplete: (jobId: string) => Promise<void>;
  completingJobId: string | null;
  jobCompletionMessage: string;
}

const OverviewTab = ({
  stats,
  users,
  jobs,
  onMarkJobComplete,
  completingJobId,
  jobCompletionMessage,
}: OverviewTabProps) => {
  return (
    <>
      {jobCompletionMessage && (
        <div className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {jobCompletionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalJobs || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.inProgressJobs || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
          <div className="space-y-2">
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div key={job._id} className="space-y-2 border-b py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-gray-500">Status: {job.status}</p>
                  </div>
                  {job.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => onMarkJobComplete(job._id)}
                      disabled={completingJobId === job._id}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {completingJobId === job._id ? 'Marking…' : 'Mark Completed'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Client: {job.client?.firstName} {job.client?.lastName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;

