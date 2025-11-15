import { useEffect, useState } from 'react';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; comment: string }) => Promise<void> | void;
  title: string;
  subtitle: string;
  submitting?: boolean;
  error?: string;
}

const ratingOptions = [5, 4, 3, 2, 1];

const SubmitReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  submitting = false,
  error,
}: SubmitReviewModalProps) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment('');
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!comment.trim()) {
      setValidationError('Please share a brief comment about your experience.');
      return;
    }

    setValidationError('');
    await onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Leave a Review</p>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:text-gray-600"
            aria-label="Close"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div>
            <label htmlFor="review-rating" className="block text-sm font-medium text-gray-700">
              Rating
            </label>
            <select
              id="review-rating"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              disabled={submitting}
            >
              {ratingOptions.map((option) => (
                <option key={option} value={option}>
                  {option} star{option === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share details about your experience..."
              className="mt-1 h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              disabled={submitting}
            />
            {validationError && <p className="mt-1 text-sm text-red-600">{validationError}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReviewModal;

