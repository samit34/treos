import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { jobApi } from '../../api/jobApi';
import { Job, Proposal, User } from '../../types';
import InviteWorkerModal from '../../components/dashboard/InviteWorkerModal';

interface WorkerFilters {
  search: string;
  minRate: string;
  maxRate: string;
  minRating: string;
}

const emptyFilters: WorkerFilters = {
  search: '',
  minRate: '',
  maxRate: '',
  minRating: '',
};

const PAGE_SIZE = 12;

const WorkerDirectoryPage = () => {
  const [filters, setFilters] = useState<WorkerFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<WorkerFilters>(emptyFilters);
  const [page, setPage] = useState(1);

  const [workers, setWorkers] = useState<User[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkers, setTotalWorkers] = useState(0);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  const [selectedWorker, setSelectedWorker] = useState<User | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError('');
        const response = await jobApi.getJobs({ status: 'open', limit: 100 });
        setJobs(response.jobs ?? []);
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Failed to load your open jobs.';
        setJobsError(message);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setWorkersLoading(true);
        setWorkersError('');
        const params: Record<string, string | number> = {
          page,
          limit: PAGE_SIZE,
        };

        if (appliedFilters.search.trim()) {
          params.search = appliedFilters.search.trim();
        }
        if (appliedFilters.minRate) {
          params.minRate = Number(appliedFilters.minRate);
        }
        if (appliedFilters.maxRate) {
          params.maxRate = Number(appliedFilters.maxRate);
        }
        if (appliedFilters.minRating) {
          params.minRating = Number(appliedFilters.minRating);
        }

        const data = await userApi.getWorkers(params);

        setWorkers(data.workers ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalWorkers(data.total ?? 0);
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Unable to load workers at this time.';
        setWorkersError(message);
        setWorkers([]);
        setTotalPages(1);
        setTotalWorkers(0);
      } finally {
        setWorkersLoading(false);
      }
    };

    fetchWorkers();
  }, [page, appliedFilters]);

  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleInviteClick = (worker: User) => {
    setSelectedWorker(worker);
    setInviteSuccess('');
  };

  const handleViewProfile = (worker: User) => {
    const workerId =
      (worker as unknown as { id?: string; _id?: string }).id ??
      (worker as unknown as { id?: string; _id?: string })._id;

    if (!workerId) {
      console.warn('Unable to determine worker id for profile navigation');
      return;
    }

    navigate(`/dashboard/workers/${workerId}`, { state: { worker } });
  };

  const handleInvitationSuccess = (proposal: Proposal) => {
    const worker = proposal.worker as unknown as User;
    const workerName = `${worker?.firstName ?? ''} ${worker?.lastName ?? ''}`.trim() || worker?.firstName || 'Worker';
    const jobTitle = proposal.job?.title ?? 'the job';
    setInviteSuccess(`${workerName} has been invited to ${jobTitle}.`);
  };

  const hasWorkers = workers.length > 0;
  const workerCountLabel = useMemo(() => {
    if (workersLoading) {
      return 'Loading workers...';
    }
    if (!totalWorkers) {
      return 'No workers found';
    }
    return `${totalWorkers} worker${totalWorkers === 1 ? '' : 's'} found`;
  }, [workersLoading, totalWorkers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Find Care Workers</h1>
        <p className="text-sm text-gray-500">
          Browse experienced caregivers, compare profiles, and invite the perfect fit for your family.
        </p>
      </div>

      {inviteSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded">
          {inviteSuccess}
        </div>
      )}

      {jobsError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          {jobsError}
        </div>
      )}

      <form
        onSubmit={handleFilterSubmit}
        className="bg-white border border-gray-200 rounded-lg p-4 grid gap-4 md:grid-cols-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Name, skill, location..."
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="minRate" className="text-sm font-medium text-gray-700">
            Min Rate ($/hr)
          </label>
          <input
            id="minRate"
            type="number"
            min="0"
            step="1"
            value={filters.minRate}
            onChange={(event) => setFilters((prev) => ({ ...prev, minRate: event.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="maxRate" className="text-sm font-medium text-gray-700">
            Max Rate ($/hr)
          </label>
          <input
            id="maxRate"
            type="number"
            min="0"
            step="1"
            value={filters.maxRate}
            onChange={(event) => setFilters((prev) => ({ ...prev, maxRate: event.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="minRating" className="text-sm font-medium text-gray-700">
            Minimum Rating
          </label>
          <select
            id="minRating"
            value={filters.minRating}
            onChange={(event) => setFilters((prev) => ({ ...prev, minRating: event.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Any rating</option>
            <option value="3">3 stars & up</option>
            <option value="4">4 stars & up</option>
            <option value="4.5">4.5 stars & up</option>
          </select>
        </div>

        <div className="md:col-span-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Apply Filters
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{workerCountLabel}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {workersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {workersError}
        </div>
      )}

      {workersLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          Loading workers...
        </div>
      ) : !hasWorkers ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No workers match your filters yet. Try adjusting your search or check back soon.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {workers.map((worker) => {
            const rate = worker.hourlyRate ? `$${worker.hourlyRate}/hr` : 'Rate not set';
            const ratingValue = typeof worker.rating === 'number' ? worker.rating : null;
            const reviewCount = worker.totalReviews ?? 0;
            const ratingLabel =
              ratingValue !== null && reviewCount > 0
                ? `⭐ ${ratingValue.toFixed(1)} (${reviewCount} review${
                    reviewCount === 1 ? '' : 's'
                  })`
                : 'No reviews yet';
            const workerId = (worker as unknown as { id?: string; _id?: string }).id ??
              (worker as unknown as { id?: string; _id?: string })._id ??
              `worker-${worker.email}`;
            const location = worker.address
              ? `${worker.address.city}, ${worker.address.state}`
              : 'Location not provided';

            return (
              <div key={workerId} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg">
                    {worker.firstName?.[0] ?? worker.lastName?.[0] ?? 'W'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {worker.firstName} {worker.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{location}</p>
                      </div>
                      <span className="text-sm font-medium text-primary-600">{rate}</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      {ratingValue !== null && reviewCount > 0 ? (
                        ratingLabel
                      ) : (
                        <span className="text-gray-500">{ratingLabel}</span>
                      )}
                    </p>
                  </div>
                </div>

                {worker.bio && <p className="text-sm text-gray-600 line-clamp-3">{worker.bio}</p>}

                {worker.qualifications && worker.qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {worker.qualifications.slice(0, 4).map((qualification) => (
                      <span
                        key={qualification}
                        className="inline-flex items-center px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-xs"
                      >
                        {qualification}
                      </span>
                    ))}
                    {worker.qualifications.length > 4 && (
                      <span className="text-xs text-gray-500">+{worker.qualifications.length - 4} more</span>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleViewProfile(worker)}
                      className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-md hover:bg-primary-50"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInviteClick(worker)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
                    >
                      Invite to Job
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedWorker && (
        <InviteWorkerModal
          worker={selectedWorker}
          jobs={jobs}
          loadingJobs={jobsLoading}
          onClose={() => setSelectedWorker(null)}
          onSuccess={handleInvitationSuccess}
        />
      )}
    </div>
  );
};

export default WorkerDirectoryPage;

