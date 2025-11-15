import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { jobApi } from '../../api/jobApi';
import { reviewApi } from '../../api/reviewApi';
import { Job, Review, User } from '../../types';

interface LocationState {
  client?: User;
}

const ClientProfilePage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | undefined) ?? {};

  const [client, setClient] = useState<User | null>(state.client ?? null);
  const [loading, setLoading] = useState(!state.client);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    if (!clientId) {
      setError('We could not find that client.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchClient = async () => {
      try {
        if (!state.client) {
          setLoading(true);
        }
        const fetchedClient = await userApi.getUserById(clientId);
        if (!isMounted) return;
        setClient(fetchedClient);
        setError('');
      } catch (err: any) {
        if (!isMounted) return;
        const message = err?.response?.data?.message || 'Unable to load this client profile.';
        setError(message);
        if (!state.client) {
          setClient(null);
        }
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchClient();

    return () => {
      isMounted = false;
    };
  }, [clientId, state.client]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError('');
        const response = await jobApi.getJobs({ status: 'open', limit: 100 });
        const clientJobs =
          response.jobs?.filter((job) => {
            const id =
              (job.client as unknown as { id?: string; _id?: string }).id ??
              (job.client as unknown as { id?: string; _id?: string })._id;
            return id === clientId;
          }) ?? [];
        setJobs(clientJobs);
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Failed to load this client’s jobs.';
        setJobsError(message);
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    if (clientId) {
      fetchJobs();
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let isMounted = true;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError('');
        const fetchedReviews = await reviewApi.getForUser(clientId);
        if (!isMounted) return;
        setReviews(fetchedReviews);
      } catch (err: any) {
        if (!isMounted) return;
        const message = err?.response?.data?.message || 'Failed to load reviews for this client.';
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
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let isMounted = true;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError('');
        const fetchedReviews = await reviewApi.getForUser(clientId);
        if (!isMounted) return;
        setReviews(fetchedReviews);
      } catch (err: any) {
        if (!isMounted) return;
        const message = err?.response?.data?.message || 'Failed to load reviews for this client.';
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
  }, [clientId]);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
    []
  );

  const profilePictureSrc = useMemo(() => {
    if (!client?.profilePicture) {
      return null;
    }
    if (client.profilePicture.startsWith('http')) {
      return client.profilePicture;
    }
    return `${apiBaseUrl}${client.profilePicture}`;
  }, [apiBaseUrl, client]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-16">
        <p className="text-sm text-gray-500">Loading client profile...</p>
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

  if (!client) {
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
          We could not find that client profile. They may no longer be available.
        </div>
      </div>
    );
  }

  const fullName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || client.email;
  const clientRating =
    typeof client.rating === 'number'
      ? `${client.rating.toFixed(1)} (${client.totalReviews ?? 0} review${
          client.totalReviews === 1 ? '' : 's'
        })`
      : 'No reviews yet';

  const handleStartChat = () => {
    if (!clientId) {
      return;
    }
    navigate('/dashboard/chat', { state: { startWithUserId: clientId } });
  };

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
            onClick={() => navigate('/dashboard/jobs')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            View Jobs Board
          </button>
          <button
            type="button"
            onClick={handleStartChat}
            className="rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            Message
          </button>
        </div>
      </div>

      {jobsError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          {jobsError}
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
                  {client.firstName?.[0]}
                  {client.lastName?.[0]}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-500 capitalize">{client.role}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-900">Rating:</span> {clientRating}
              </p>
              {client.createdAt && (
                <p>
                  <span className="font-medium text-gray-900">Member Since:</span>{' '}
                  {new Date(client.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-600">
            <h2 className="text-base font-semibold text-gray-900">Contact</h2>
            <p>
              <span className="font-medium text-gray-900">Email:</span> {client.email}
            </p>
            {client.phone && (
              <p>
                <span className="font-medium text-gray-900">Phone:</span> {client.phone}
              </p>
            )}
            {client.address && (
              <>
                <p>
                  <span className="font-medium text-gray-900">Primary Location:</span>{' '}
                  {client.address.city}, {client.address.state}
                </p>
                <p className="text-xs text-gray-500">
                  {client.address.street && `${client.address.street}, `}
                  {client.address.city}, {client.address.state} {client.address.zipCode}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {client.bio && (
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{client.bio}</p>
            </section>
          )}

          {client.supportNeeds && client.supportNeeds.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
              <h2 className="text-lg font-semibold text-gray-900">Support Needs</h2>
              <div className="flex flex-wrap gap-2">
                {client.supportNeeds.map((need) => (
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
            <h2 className="text-lg font-semibold text-gray-900">Working With This Client</h2>
            <p>
              Be sure to clarify expectations, scheduling needs, and any required documentation with
              the client via chat before accepting or continuing work.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Open Jobs From This Client</h2>
              {jobsLoading && <span className="text-xs text-gray-400">Loading…</span>}
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">
                {jobsLoading
                  ? 'Fetching jobs…'
                  : 'This client has no open jobs available right now.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {jobs.map((job) => (
                  <li key={job._id} className="rounded-md border border-gray-200 p-3">
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>${job.hourlyRate}/hr</span>
                      <span>{job.location.city}, {job.location.state}</span>
                      <span>{job.schedule.days?.join(', ')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Loading reviews…</p>
            ) : reviewsError ? (
              <p className="text-sm text-red-600">{reviewsError}</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">This client has not received any reviews yet.</p>
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
    </div>
  );
};

export default ClientProfilePage;

