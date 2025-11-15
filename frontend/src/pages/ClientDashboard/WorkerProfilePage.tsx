import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { jobApi } from '../../api/jobApi';
import { reviewApi } from '../../api/reviewApi';
import type { Job, Proposal, Review, User } from '../../types';
import InviteWorkerModal from '../../components/dashboard/InviteWorkerModal';

interface LocationState {
  worker?: User;
}

const WorkerProfilePage = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | undefined) ?? {};

  const [worker, setWorker] = useState<User | null>(state.worker ?? null);
  const [loading, setLoading] = useState(!state.worker);
  const [error, setError] = useState('');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    if (!workerId) {
      setError('We could not find that worker.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchWorker = async () => {
      try {
        if (!state.worker) {
          setLoading(true);
        }
        const fetchedWorker = await userApi.getUserById(workerId);
        if (!isMounted) return;
        setWorker(fetchedWorker);
        setError('');
      } catch (err: any) {
        if (!isMounted) return;
        const message = err?.response?.data?.message || 'Unable to load this worker profile.';
        setError(message);
        if (!state.worker) {
          setWorker(null);
        }
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchWorker();

    return () => {
      isMounted = false;
    };
  }, [state.worker, workerId]);

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
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if (!workerId) {
      return;
    }

    let isMounted = true;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError('');
        const fetchedReviews = await reviewApi.getForUser(workerId);
        if (!isMounted) return;
        setReviews(fetchedReviews);
      } catch (err: any) {
        if (!isMounted) return;
        const message = err?.response?.data?.message || 'Failed to load reviews for this worker.';
        setReviewsError(message);
        setReviews([]);
      } finally {
        if (!isMounted) return;
        setReviewsLoading(false);
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [workerId]);

  const handleInviteClick = () => {
    if (!worker) {
      return;
    }
    setInviteSuccess('');
    setShowInviteModal(true);
  };

  const handleInvitationSuccess = (proposal: Proposal) => {
    const invitedWorker = proposal.worker as unknown as User;
    const workerName =
      `${invitedWorker?.firstName ?? ''} ${invitedWorker?.lastName ?? ''}`.trim() ||
      invitedWorker?.firstName ||
      'Worker';
    const jobTitle = proposal.job?.title ?? 'your job';
    setInviteSuccess(`${workerName} has been invited to ${jobTitle}.`);
  };

  const handleStartChat = () => {
    if (!workerId) {
      return;
    }
    navigate('/dashboard/chat', { state: { startWithUserId: workerId } });
  };

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
    []
  );

  const profilePictureSrc = useMemo(() => {
    if (!worker?.profilePicture) {
      return null;
    }
    if (worker.profilePicture.startsWith('http')) {
      return worker.profilePicture;
    }
    return `${apiBaseUrl}${worker.profilePicture}`;
  }, [apiBaseUrl, worker]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-16">
        <p className="text-sm text-gray-500">Loading worker profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back
        </button>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-6 text-yellow-700">
          We could not find that worker profile. They may no longer be available.
        </div>
      </div>
    );
  }

  const fullName = `${worker.firstName ?? ''} ${worker.lastName ?? ''}`.trim() || worker.email;
  const workerRating =
    typeof worker.rating === 'number'
      ? `${worker.rating.toFixed(1)} (${worker.totalReviews ?? 0} review${
          worker.totalReviews === 1 ? '' : 's'
        })`
      : 'No reviews yet';
  const hourlyRateLabel = worker.hourlyRate ? `$${worker.hourlyRate}/hr` : 'Rate not set';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStartChat}
            className="rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            Message
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/workers')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Browse Workers
          </button>
          <button
            type="button"
            onClick={handleInviteClick}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Invite to Job
          </button>
        </div>
      </div>

      {inviteSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {inviteSuccess}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-600">
              {profilePictureSrc ? (
                <img
                  src={profilePictureSrc}
                  alt={fullName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <span>
                  {worker.firstName?.[0]}
                  {worker.lastName?.[0]}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-500 capitalize">{worker.role}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-900">Hourly Rate:</span> {hourlyRateLabel}
              </p>
              <p>
                <span className="font-medium text-gray-900">Rating:</span> {workerRating}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-600">
            <h2 className="text-base font-semibold text-gray-900">Contact</h2>
            <p>
              <span className="font-medium text-gray-900">Email:</span> {worker.email}
            </p>
            {worker.phone && (
              <p>
                <span className="font-medium text-gray-900">Phone:</span> {worker.phone}
              </p>
            )}
            {worker.address && (
              <>
                <p>
                  <span className="font-medium text-gray-900">Location:</span>{' '}
                  {worker.address.city}, {worker.address.state}
                </p>
                <p className="text-xs text-gray-500">
                  {worker.address.street && `${worker.address.street}, `}
                  {worker.address.city}, {worker.address.state} {worker.address.zipCode}
                </p>
              </>
            )}
            {worker.createdAt && (
              <p>
                <span className="font-medium text-gray-900">Member Since:</span>{' '}
                {new Date(worker.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {worker.bio && (
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{worker.bio}</p>
            </section>
          )}

          {worker.qualifications && worker.qualifications.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Qualifications & Training</h2>
              <div className="flex flex-wrap gap-2">
                {worker.qualifications.map((qualification) => (
                  <span
                    key={qualification}
                    className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
                  >
                    {qualification}
                  </span>
                ))}
              </div>
            </section>
          )}

          {worker.availability && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
              <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
              {worker.availability.days && worker.availability.days.length > 0 && (
                <p>
                  <span className="font-medium text-gray-900">Days:</span>{' '}
                  {worker.availability.days.join(', ')}
                </p>
              )}
              {worker.availability.hours && worker.availability.hours.start && (
                <p>
                  <span className="font-medium text-gray-900">Hours:</span>{' '}
                  {worker.availability.hours.start} - {worker.availability.hours.end}
                </p>
              )}
            </section>
          )}

          {worker.supportNeeds && worker.supportNeeds.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
              <h2 className="text-lg font-semibold text-gray-900">Support Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {worker.supportNeeds.map((need) => (
                  <span
                    key={need}
                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Next Steps</h2>
            <p>
              Reach out via chat to discuss expectations, availability, and scheduling. Use the
              “Invite to Job” button above to send a formal invitation when you are ready.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Loading reviews…</p>
            ) : reviewsError ? (
              <p className="text-sm text-red-600">{reviewsError}</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">This worker has not received any reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const reviewerName =
                    `${review.reviewer.firstName ?? ''} ${review.reviewer.lastName ?? ''}`.trim() ||
                    review.reviewer.email;
                  return (
                    <div key={review._id} className="rounded-md border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{reviewerName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">
                          ⭐ {review.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {jobsError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          {jobsError}
        </div>
      )}

      {showInviteModal && worker && (
        <InviteWorkerModal
          worker={worker}
          jobs={jobs}
          loadingJobs={jobsLoading}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInvitationSuccess}
        />
      )}
    </div>
  );
};

export default WorkerProfilePage;

