import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Job, Proposal } from '../../types';
import { useAppSelector } from '../../hooks/redux';

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalProposals: number;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'job' | 'proposal';
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setError('');
      try {
        const jobsResponse = await axiosInstance.get('/jobs');
        const jobsData: Job[] = jobsResponse.data.data.jobs || [];
        setJobs(jobsData);

        const proposalsResponses = await Promise.all(
          jobsData.map((job) =>
            axiosInstance.get('/proposals', { params: { jobId: job._id } })
          )
        );

        const aggregatedProposals: Proposal[] = proposalsResponses.flatMap(
          (response) => response.data.data.proposals || []
        );
        setProposals(aggregatedProposals);
      } catch (err: any) {
        console.error('Failed to load dashboard data', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const totalJobs = jobs.length;
    const openJobs = jobs.filter((job) => job.status === 'open').length;
    const inProgressJobs = jobs.filter((job) => job.status === 'in-progress').length;
    const completedJobs = jobs.filter((job) => job.status === 'completed').length;
    const totalProposals = proposals.length;

    return { totalJobs, openJobs, inProgressJobs, completedJobs, totalProposals };
  }, [jobs, proposals]);

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [jobs]);

  const recentProposals = useMemo(() => {
    return [...proposals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [proposals]);

  const notifications: NotificationItem[] = useMemo(() => {
    const jobNotifications = jobs
      .filter((job) => job.status === 'in-progress' || job.status === 'completed')
      .slice(0, 3)
      .map((job) => ({
        id: job._id,
        title:
          job.status === 'completed'
            ? `Job completed: ${job.title}`
            : `Job in progress: ${job.title}`,
        description:
          job.status === 'completed'
            ? 'Please remember to leave feedback for the worker.'
            : 'Your selected worker has started this job.',
        timestamp: job.updatedAt,
        type: 'job' as const,
      }));

    const proposalNotifications = proposals
      .filter((proposal) => proposal.status === 'pending')
      .slice(0, 3)
      .map((proposal) => ({
        id: proposal._id,
        title: `New proposal for ${proposal.job.title}`,
        description: `${proposal.worker.firstName} ${proposal.worker.lastName} offered $${proposal.proposedRate}/hr`,
        timestamp: proposal.createdAt,
        type: 'proposal' as const,
      }));

    return [...proposalNotifications, ...jobNotifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [jobs, proposals]);

  const shortcutButtons = [
    {
      label: 'Post a Job',
      description: 'Create a new care request',
      action: () => navigate('/dashboard/jobs'),
    },
    {
      label: 'View Calendar',
      description: 'See upcoming jobs by date',
      action: () => navigate('/dashboard/calendar'),
    },
    {
      label: 'View Proposals',
      description: 'Review worker proposals',
      action: () => navigate('/dashboard/jobs'),
    },
    {
      label: 'Update Account',
      description: 'Edit your profile and preferences',
      action: () => navigate('/dashboard/account'),
    },
  ];

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}</h2>
        <p className="text-sm text-gray-500">
          Monitor your care requests, track proposals, and manage your account in one place.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Open Jobs</p>
          <p className="text-2xl font-semibold text-primary-600">{stats.openJobs}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Jobs In Progress</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.inProgressJobs}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Proposals Received</p>
          <p className="text-2xl font-semibold text-emerald-600">{stats.totalProposals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcutButtons.map((button) => (
              <button
                key={button.label}
                onClick={button.action}
                className="border border-gray-200 rounded-lg p-4 text-left hover:border-primary-300 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">{button.label}</h4>
                <p className="text-sm text-gray-500 mt-1">{button.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No new notifications.</p>
          ) : (
            <ul className="space-y-3 text-sm text-gray-700">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b pb-3 last:border-b-0">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{notification.description}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
            <button
              type="button"
              onClick={() => navigate('/dashboard/jobs')}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </button>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-500">You have not posted any jobs yet.</p>
          ) : (
            <ul className="space-y-4 text-sm text-gray-700">
              {recentJobs.map((job) => (
                <li key={job._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Posted on {new Date(job.createdAt).toLocaleDateString()} · Expected rate ${job.hourlyRate}/hr
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Proposals</h3>
            <button
              type="button"
              onClick={() => navigate('/dashboard/jobs')}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Review proposals
            </button>
          </div>
          {recentProposals.length === 0 ? (
            <p className="text-sm text-gray-500">No proposals received yet.</p>
          ) : (
            <ul className="space-y-4 text-sm text-gray-700">
              {recentProposals.map((proposal) => (
                <li key={proposal._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {proposal.worker.firstName} {proposal.worker.lastName}
                      </p>
                      <p className="text-gray-500 mt-1 line-clamp-2">{proposal.message}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      ${proposal.proposedRate}/hr
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    For job: {proposal.job.title}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
