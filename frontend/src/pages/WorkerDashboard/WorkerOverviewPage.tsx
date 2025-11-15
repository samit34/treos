import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Job, Proposal } from '../../types';
import { useAppSelector } from '../../hooks/redux';

const WorkerOverviewPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setError('');
      setLoading(true);
      try {
        const jobsResponse = await axiosInstance.get('/jobs');
        const availableJobs: Job[] = jobsResponse.data?.data?.jobs ?? [];
        setJobs(availableJobs);

        const proposalsResponse = await axiosInstance.get('/proposals');
        const myProposals: Proposal[] = proposalsResponse.data?.data?.proposals ?? [];
        setProposals(myProposals);
      } catch (err: any) {
        console.error('Failed to load worker dashboard data', err);
        setError(err?.response?.data?.message || 'Unable to load worker dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const openJobs = jobs.filter((job) => job.status === 'open').length;
    const submittedProposals = proposals.length;
    const acceptedProposals = proposals.filter((proposal) => proposal.status === 'accepted').length;
    const pendingProposals = proposals.filter((proposal) => proposal.status === 'pending').length;

    return { openJobs, submittedProposals, acceptedProposals, pendingProposals };
  }, [jobs, proposals]);

  const recommendedJobs = useMemo(() => {
    return jobs
      .filter((job) => job.status === 'open')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [jobs]);

  const recentProposals = useMemo(() => {
    return [...proposals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [proposals]);

  if (loading) {
    return <div className="text-center py-12">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}</h2>
        <p className="text-sm text-gray-500">
          Keep track of your opportunities, proposals, and account settings in one place.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Open Jobs</p>
          <p className="text-2xl font-semibold text-primary-600">{stats.openJobs}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Submitted Proposals</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.submittedProposals}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Accepted Proposals</p>
          <p className="text-2xl font-semibold text-emerald-600">{stats.acceptedProposals}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending Responses</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.pendingProposals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Jobs</h3>
            <p className="text-sm text-gray-500">Latest opportunities near you</p>
          </div>
          {recommendedJobs.length === 0 ? (
            <p className="text-sm text-gray-500">No open jobs available at the moment.</p>
          ) : (
            <ul className="space-y-4 text-sm text-gray-700">
              {recommendedJobs.map((job) => (
                <li key={job._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      ${job.hourlyRate}/hr
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Proposals</h3>
            <p className="text-sm text-gray-500">Track the status of your bids</p>
          </div>
          {recentProposals.length === 0 ? (
            <p className="text-sm text-gray-500">You have not submitted any proposals yet.</p>
          ) : (
            <ul className="space-y-4 text-sm text-gray-700">
              {recentProposals.map((proposal) => (
                <li key={proposal._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{proposal.job.title}</p>
                      <p className="text-gray-500 mt-1 line-clamp-2">{proposal.message}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        proposal.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : proposal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Submitted {new Date(proposal.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-medium text-gray-900">Complete your worker profile</p>
              <p className="text-xs text-gray-500">Add certifications, experience, and availability to stand out.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-medium text-gray-900">Stay responsive</p>
              <p className="text-xs text-gray-500">Check messages frequently so you do not miss new opportunities.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">📈</span>
            <div>
              <p className="font-medium text-gray-900">Track your progress</p>
              <p className="text-xs text-gray-500">Follow up on pending proposals and accepted jobs in your account.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WorkerOverviewPage;


