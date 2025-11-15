import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { Review } from '../../types';
import { reviewApi } from '../../api/reviewApi';

const WorkerReviewsPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role !== 'worker') {
    return <Navigate to="/dashboard" replace />;
  }

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId =
    (user as unknown as { id?: string; _id?: string })?.id ??
    (user as unknown as { id?: string; _id?: string })?._id ??
    user?.id ??
    (user as unknown as { _id?: string })?._id ??
    null;

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) {
        setError('We could not determine your account ID to load reviews.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const fetched = await reviewApi.getForUser(userId);
        setReviews(fetched);
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Failed to load your reviews.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  const summary = useMemo(() => {
    if (reviews.length === 0) {
      return { average: 0, formattedAverage: '0.0', total: 0 };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;
    return {
      average,
      formattedAverage: average.toFixed(1),
      total,
    };
  }, [reviews]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Reviews & Ratings</h1>
          <p className="text-sm text-gray-500">
            Track feedback shared by clients after you complete their jobs.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <span className="font-semibold text-lg">
            ⭐ {summary.formattedAverage}
          </span>{' '}
          <span className="ml-2 text-xs text-gray-500">
            ({summary.total} review{summary.total === 1 ? '' : 's'})
          </span>
        </div>
      </header>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading your reviews…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          You have not received any reviews yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => {
            const reviewerName =
              `${review.reviewer.firstName ?? ''} ${review.reviewer.lastName ?? ''}`.trim() ||
              review.reviewer.email;
            return (
              <article key={review._id} className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{reviewerName}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                      {review.reviewer.role}
                    </span>
                    <span className="text-sm font-semibold text-yellow-600">
                      ⭐ {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Job: <span className="font-medium text-gray-700">{review.job.title ?? 'N/A'}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkerReviewsPage;

