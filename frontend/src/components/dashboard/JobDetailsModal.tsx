import { Job, Proposal, Review, User } from '../../types';
import ProposalList from './ProposalList';

interface JobDetailsModalProps {
  job: Job;
  proposals: Proposal[];
  reviews?: Review[];
  reviewsLoading?: boolean;
  onClose: () => void;
  onDeleteJob: (jobId: string) => void;
  onSelectWorker: (proposalId: string, workerId: string) => void;
  onCompleteJob: (jobId: string) => void;
  completingJobId?: string | null;
  onViewWorkerProfile?: (worker: User) => void;
  onLeaveReview?: () => void;
  hasLeftReview?: boolean;
}

const JobDetailsModal = ({
  job,
  proposals,
  reviews = [],
  reviewsLoading = false,
  onClose,
  onDeleteJob,
  onSelectWorker,
  onCompleteJob,
  completingJobId,
  onViewWorkerProfile,
  onLeaveReview,
  hasLeftReview = false,
}: JobDetailsModalProps) => {
  const selectedWorker = job.selectedWorker as User | undefined;
  const acceptedProposalId =
    typeof job.selectedProposal === 'string' ? job.selectedProposal : job.selectedProposal?._id;
  const selectedWorkerRatingValue =
    typeof selectedWorker?.rating === 'number' ? selectedWorker.rating : null;
  const selectedWorkerReviewCount = selectedWorker?.totalReviews ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-6">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
            <p className="text-sm text-gray-500 mt-1">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
          </div>
        <div className="flex items-center space-x-3">
          {job.status !== 'completed' && (
            <button
              type="button"
              onClick={() => onCompleteJob(job._id)}
              disabled={completingJobId === job._id}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {completingJobId === job._id ? 'Marking...' : 'Mark Completed'}
            </button>
          )}
          {selectedWorker && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-yellow-600">
                {selectedWorkerRatingValue !== null && selectedWorkerReviewCount > 0 ? (
                  <span>
                    ⭐ {selectedWorkerRatingValue.toFixed(1)} ({selectedWorkerReviewCount} review
                    {selectedWorkerReviewCount === 1 ? '' : 's'})
                  </span>
                ) : (
                  <span className="text-gray-500">No reviews yet</span>
                )}
              </div>
              {onViewWorkerProfile && (
                <button
                  type="button"
                  onClick={() => onViewWorkerProfile(selectedWorker)}
                  className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-md hover:bg-primary-50"
                >
                  View Worker Profile
                </button>
              )}
            </div>
          )}
          {hasLeftReview && (
            <span className="px-3 py-1 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-md">
              Review Submitted
            </span>
          )}
          {onLeaveReview && (
            <button
              type="button"
              onClick={onLeaveReview}
              className="px-4 py-2 text-sm font-medium text-amber-700 border border-amber-200 rounded-md hover:bg-amber-50"
            >
              Leave Review
            </button>
          )}
            <button
              type="button"
              onClick={() => onDeleteJob(job._id)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Delete Job
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Job Overview</h4>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="text-gray-500">Care Type</p>
                <p className="font-medium text-gray-900">{job.careType}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className={`font-medium capitalize ${
                  job.status === 'completed'
                    ? 'text-emerald-600'
                    : job.status === 'in-progress'
                    ? 'text-yellow-600'
                    : 'text-primary-600'
                }`}>
                  {job.status}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Hourly Rate</p>
                <p className="font-medium text-gray-900">${job.hourlyRate}/hr</p>
              </div>
              <div>
                <p className="text-gray-500">Schedule</p>
                <p className="font-medium text-gray-900">
                  {new Date(job.schedule.startDate).toLocaleDateString()} {job.schedule.hours.start} –
                  {job.schedule.hours.end}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</h4>
              <p className="mt-2 text-sm text-gray-700">
                {job.location.street}, {job.location.city}, {job.location.state} {job.location.zipCode}
              </p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Requirements</h4>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
                  {job.requirements.map((requirement, index) => (
                    <li key={`${job._id}-requirement-${index}`}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Proposals
            </h4>
            {proposals.length === 0 ? (
              <p className="text-sm text-gray-500">No proposals received yet for this job.</p>
            ) : (
              <ProposalList
                proposals={proposals}
                job={job}
                onSelectWorker={onSelectWorker}
                onViewProfile={onViewWorkerProfile}
                acceptedProposalId={acceptedProposalId}
              />
            )}
          </div>

          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Reviews
            </h4>
            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">
                {job.status === 'completed'
                  ? 'No reviews have been submitted for this job yet.'
                  : 'Reviews will appear here once the job is completed.'}
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const reviewerName = `${review.reviewer.firstName ?? ''} ${review.reviewer.lastName ?? ''}`.trim() ||
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
                        <span className="text-sm font-semibold text-yellow-600">⭐ {review.rating.toFixed(1)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
