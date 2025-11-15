import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import axiosInstance from '../../api/axiosInstance';
import { Job, Proposal, Review, User } from '../../types';
import CreateJobModal from '../../components/dashboard/CreateJobModal';
import JobList from '../../components/dashboard/JobList';
import ProposalList from '../../components/dashboard/ProposalList';
import JobDetailsModal from '../../components/dashboard/JobDetailsModal';
import SubmitReviewModal from '../../components/dashboard/SubmitReviewModal';
import { jobApi } from '../../api/jobApi';
import { reviewApi } from '../../api/reviewApi';

const JobsPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Only clients can access this page
  if (user?.role !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [detailsProposals, setDetailsProposals] = useState<Proposal[]>([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const latestRequestRef = useRef(0);
  const showSearchingIndicator =
    loading && (searchTerm.trim().length > 0 || activeSearch.length > 0);
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);
  const [, setCompletionMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'completed'>('all');
  const navigate = useNavigate();
  const [detailsReviews, setDetailsReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewModalData, setReviewModalData] = useState<{ job: Job; worker: User } | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const trimmed = searchTerm.trim();

    const handler = setTimeout(() => {
      setActiveSearch(trimmed);
      fetchJobs(trimmed, statusFilter);
    }, 300);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchJobs = async (
    searchValue = activeSearch,
    statusValue: typeof statusFilter = statusFilter
  ) => {
    const requestId = ++latestRequestRef.current;
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchValue) {
        params.search = searchValue;
      }
      if (statusValue !== 'all') {
        params.status = statusValue;
      }
      const response = await axiosInstance.get('/jobs', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      const fetchedJobs: Job[] = response.data.data.jobs;

      if (requestId !== latestRequestRef.current) {
        return;
      }

      setJobs(fetchedJobs);

      if (selectedJob && !fetchedJobs.some((job) => job._id === selectedJob._id)) {
        setSelectedJob(null);
        setProposals([]);
      }

      if (showDetailsModal && selectedJob && !fetchedJobs.some((job) => job._id === selectedJob._id)) {
        setShowDetailsModal(false);
        setDetailsProposals([]);
      }
    } catch (error) {
      if (requestId === latestRequestRef.current) {
        console.error('Failed to fetch jobs:', error);
      }
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    fetchJobs('', statusFilter);
  };

  const fetchProposals = async (jobId: string, updateState = true) => {
    try {
      const response = await axiosInstance.get(`/proposals?jobId=${jobId}`);
      if (updateState) {
        setProposals(response.data.data.proposals);
      }
      return response.data.data.proposals as Proposal[];
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      return [];
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setDetailsReviews([]);
    fetchProposals(job._id);
  };

  const handleViewDetails = async (job: Job) => {
    setSelectedJob(job);
    setReviewSuccess('');
    setReviewError('');
    setReviewModalData(null);
    const fetchedProposals = await fetchProposals(job._id, false);
    setDetailsProposals(fetchedProposals);
    setShowDetailsModal(true);
    setReviewsLoading(true);
    try {
      const fetchedReviews = await reviewApi.getForJob(job._id);
      setDetailsReviews(fetchedReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setDetailsReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the job "${job.title}"?`);
    if (!confirmDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await axiosInstance.delete(`/jobs/${job._id}`);
      await fetchJobs();
      if (selectedJob?._id === job._id) {
        setSelectedJob(null);
        setProposals([]);
      }
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectWorker = async (proposalId: string, workerId: string) => {
    try {
      await axiosInstance.post(`/jobs/${selectedJob?._id}/select-worker`, {
        proposalId,
        workerId,
      });
      fetchJobs();
      setSelectedJob(null);
      setProposals([]);
      if (showDetailsModal && selectedJob) {
        const updatedProposals = await fetchProposals(selectedJob._id, false);
        setDetailsProposals(updatedProposals);
      }
    } catch (error) {
      console.error('Failed to select worker:', error);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    const confirmComplete = window.confirm('Mark this job as completed?');
    if (!confirmComplete) {
      return;
    }

    try {
      setCompletionMessage('');
      setCompletingJobId(jobId);
      await jobApi.completeJob(jobId);
      await fetchJobs();
      setCompletionMessage('Job marked as completed.');
      if (selectedJob?._id === jobId) {
        setSelectedJob((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      }
      if (showDetailsModal && selectedJob?._id === jobId) {
        setDetailsProposals((prev) => prev);
      }
    } catch (error: any) {
      console.error('Failed to mark job as completed:', error);
      setCompletionMessage(error?.response?.data?.message || 'Unable to mark job as completed.');
    } finally {
      setCompletingJobId(null);
    }
  };

  const handleViewWorkerProfile = (worker: User | null | undefined) => {
    if (!worker) {
      return;
    }

    const workerId =
      (worker as unknown as { id?: string; _id?: string }).id ??
      (worker as unknown as { id?: string; _id?: string })._id;

    if (!workerId) {
      console.warn('Unable to determine worker id for profile navigation');
      return;
    }

    navigate(`/dashboard/workers/${workerId}`, { state: { worker } });
  };

  const handleOpenReviewModal = (job: Job) => {
    if (!job.selectedWorker) {
      return;
    }
    setReviewError('');
    setReviewModalData({ job, worker: job.selectedWorker });
  };

  const handleSubmitReview = async ({ rating, comment }: { rating: number; comment: string }) => {
    if (!reviewModalData) {
      return;
    }

    const worker = reviewModalData.worker;
    const workerId =
      (worker as unknown as { id?: string; _id?: string }).id ??
      (worker as unknown as { id?: string; _id?: string })._id;

    if (!workerId) {
      setReviewError('Unable to determine worker for this review.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError('');
      await reviewApi.submitReview({
        jobId: reviewModalData.job._id,
        revieweeId: workerId,
        rating,
        comment,
      });
      setReviewSuccess(`Thanks for reviewing ${worker.firstName ?? 'this worker'}!`);
      setReviewModalData(null);
      const refreshed = await reviewApi.getForJob(reviewModalData.job._id);
      setDetailsReviews(refreshed);
      fetchJobs();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to submit review.';
      setReviewError(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const closeReviewModal = () => {
    setReviewModalData(null);
    setReviewError('');
  };

  const currentUserId =
    (user as unknown as { id?: string; _id?: string })?.id ??
    (user as unknown as { id?: string; _id?: string })?._id ??
    user?.id;

  const existingReviewByUser = detailsReviews.find((review) => {
    const reviewerId =
      (review.reviewer as unknown as { id?: string; _id?: string }).id ??
      (review.reviewer as unknown as { id?: string; _id?: string })._id ??
      (review.reviewer as unknown as { id?: string })?.id;
    return reviewerId === currentUserId;
  });

  const canLeaveReview =
    selectedJob?.status === 'completed' && selectedJob.selectedWorker && !existingReviewByUser;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Jobs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review job postings, track proposals, and select workers.
          </p>
        </div>
        {/* <button
          onClick={() => setShowCreateJob(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Post New Job
        </button> */}
      </div>

      {reviewSuccess && (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {reviewSuccess}
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <label htmlFor="job-search" className="sr-only">
              Search jobs
            </label>
            <input
              id="job-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Start typing to filter jobs instantly"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        <div className="mt-3 flex items-center gap-2 md:mt-0">
          <label htmlFor="status-filter" className="text-sm text-gray-600">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => {
              const newStatus = event.target.value as typeof statusFilter;
              setStatusFilter(newStatus);
              fetchJobs(activeSearch, newStatus);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
          {showSearchingIndicator && (
            <span className="text-sm text-gray-500">Searching...</span>
          )}
        </div>
        {activeSearch && !loading && (
          <p className="mt-2 text-sm text-gray-500">
            Showing results for "{activeSearch}" ({jobs.length} match{jobs.length === 1 ? '' : 'es'})
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <JobList
              jobs={jobs}
              onJobClick={handleJobClick}
              selectedJob={selectedJob}
              onViewDetails={handleViewDetails}
              onDeleteJob={handleDeleteJob}
              onViewWorkerProfile={handleViewWorkerProfile}
            />
          </div>
          <div className="lg:col-span-1">
            {selectedJob && (
              <ProposalList
                proposals={proposals}
                onSelectWorker={handleSelectWorker}
                job={selectedJob}
                onViewProfile={handleViewWorkerProfile}
                acceptedProposalId={
                  typeof selectedJob.selectedProposal === 'string'
                    ? selectedJob.selectedProposal
                    : selectedJob.selectedProposal?._id
                }
              />
            )}
          </div>
        </div>
      )}

      {showCreateJob && (
        <CreateJobModal
          onClose={() => setShowCreateJob(false)}
          onSuccess={() => {
            setShowCreateJob(false);
            fetchJobs();
          }}
        />
      )}

      {showDetailsModal && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          proposals={detailsProposals}
          reviews={detailsReviews}
          reviewsLoading={reviewsLoading}
          onClose={() => setShowDetailsModal(false)}
          onDeleteJob={(jobId) => {
            if (!isDeleting) {
              const job = jobs.find((item) => item._id === jobId);
              if (job) {
                handleDeleteJob(job);
              }
            }
          }}
          onSelectWorker={handleSelectWorker}
          onCompleteJob={handleCompleteJob}
          completingJobId={completingJobId}
          onViewWorkerProfile={handleViewWorkerProfile}
          onLeaveReview={canLeaveReview ? () => handleOpenReviewModal(selectedJob) : undefined}
          hasLeftReview={Boolean(existingReviewByUser)}
        />
      )}

      {reviewModalData && (
        <SubmitReviewModal
          isOpen={Boolean(reviewModalData)}
          onClose={closeReviewModal}
          onSubmit={handleSubmitReview}
          title={`Review ${reviewModalData.worker.firstName ?? 'this worker'}`}
          subtitle={`Job: ${reviewModalData.job.title}`}
          submitting={reviewSubmitting}
          error={reviewError}
        />
      )}
    </div>
  );
};

export default JobsPage;

