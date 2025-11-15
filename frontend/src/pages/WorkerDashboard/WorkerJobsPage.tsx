import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Job, Proposal, User } from '../../types';
import JobCard from '../../components/dashboard/JobCard';
import ProposalModal from '../../components/dashboard/ProposalModal';

const WorkerJobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchMyProposals();
  }, []);

  const fetchJobs = async () => {
    setError('');
    try {
      const response = await axiosInstance.get('/jobs');
      setJobs(response.data.data.jobs ?? []);
    } catch (err: any) {
      console.error('Failed to fetch jobs', err);
      setError(err?.response?.data?.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProposals = async () => {
    try {
      const response = await axiosInstance.get('/proposals');
      setMyProposals(response.data.data.proposals ?? []);
    } catch (err) {
      console.error('Failed to fetch proposals', err);
    }
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setShowProposalModal(true);
  };

  const handleProposalSubmit = () => {
    setShowProposalModal(false);
    setSelectedJob(null);
    fetchMyProposals();
  };

  const handleViewClientProfile = (client: User | null | undefined) => {
    if (!client) {
      return;
    }

    const clientId =
      (client as unknown as { id?: string; _id?: string }).id ??
      (client as unknown as { id?: string; _id?: string })._id;

    if (!clientId) {
      console.warn('Unable to determine client id for profile navigation');
      return;
    }

    navigate(`/dashboard/clients/${clientId}`, { state: { client } });
  };

  const hasApplied = (jobId: string) => myProposals.some((proposal) => proposal.job._id === jobId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Find Jobs</h2>
        <p className="text-sm text-gray-500">
          Browse open care opportunities and submit tailored proposals to families in need.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading available jobs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onApply={() => handleApply(job)}
              hasApplied={hasApplied(job._id)}
              onViewClientProfile={handleViewClientProfile}
            />
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">No jobs available at the moment. Check back soon!</div>
      )}

      {showProposalModal && selectedJob && (
        <ProposalModal
          job={selectedJob}
          onClose={() => {
            setShowProposalModal(false);
            setSelectedJob(null);
          }}
          onSuccess={handleProposalSubmit}
        />
      )}
    </div>
  );
};

export default WorkerJobsPage;


