import { Proposal, Job } from '../../types';

interface ProposalListProps {
  proposals: Proposal[];
  onSelectWorker: (proposalId: string, workerId: string) => void;
  job: Job;
  onViewProfile?: (worker: Proposal['worker']) => void;
  acceptedProposalId?: string;
}

const ProposalList = ({
  proposals,
  onSelectWorker,
  job,
  onViewProfile,
  acceptedProposalId,
}: ProposalListProps) => {
  const isOpen = job.status === 'open';

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Proposals ({proposals.length})</h3>
          <p className="text-sm text-gray-500 capitalize">Job status: {job.status}</p>
        </div>
        {job.selectedWorker && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              Selected Worker: {job.selectedWorker.firstName} {job.selectedWorker.lastName}
            </p>
            <p>{job.selectedWorker.email}</p>
            <p className="text-yellow-600 mt-1">
              {(() => {
                const ratingValue =
                  typeof job.selectedWorker.rating === 'number'
                    ? job.selectedWorker.rating
                    : null;
                const reviewCount = job.selectedWorker.totalReviews ?? 0;
                if (ratingValue !== null && reviewCount > 0) {
                  return (
                    <>
                      ⭐ {ratingValue.toFixed(1)} ({reviewCount} review
                      {reviewCount === 1 ? '' : 's'})
                    </>
                  );
                }
                return <span className="text-gray-500">No reviews yet</span>;
              })()}
            </p>
            {onViewProfile && (
              <button
                type="button"
                onClick={() => onViewProfile(job.selectedWorker as Proposal['worker'])}
                className="mt-2 w-full rounded-md border border-primary-200 px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                View Profile
              </button>
            )}
          </div>
        )}
      </div>
      {proposals.length === 0 ? (
        <p className="text-gray-500">No proposals yet.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal._id}
              className={`border-b pb-4 ${acceptedProposalId === proposal._id ? 'bg-emerald-50 border-emerald-200 rounded-md px-3 py-3' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <span>
                      {proposal.worker.firstName} {proposal.worker.lastName}
                    </span>
                    {acceptedProposalId === proposal._id && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Accepted
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{proposal.worker.email}</p>
                  <p className="text-sm text-yellow-600">
                    {(() => {
                      const ratingValue =
                        typeof proposal.worker.rating === 'number'
                          ? proposal.worker.rating
                          : null;
                      const reviewCount = proposal.worker.totalReviews ?? 0;
                      if (ratingValue !== null && reviewCount > 0) {
                        return (
                          <>
                            ⭐ {ratingValue.toFixed(1)} ({reviewCount} review
                            {reviewCount === 1 ? '' : 's'})
                          </>
                        );
                      }
                      return <span className="text-gray-500">No reviews yet</span>;
                    })()}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                  ${proposal.proposedRate}/hr
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{proposal.message}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={() => {
                    const workerId =
                      (proposal.worker as unknown as { id?: string; _id?: string }).id ??
                      (proposal.worker as unknown as { id?: string; _id?: string })._id ??
                      '';
                    if (!workerId) {
                      console.warn('Unable to determine worker id for proposal:', proposal._id);
                      return;
                    }
                    onSelectWorker(proposal._id, workerId);
                  }}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  disabled={!isOpen || acceptedProposalId === proposal._id}
                >
                  {acceptedProposalId === proposal._id ? 'Worker Selected' : 'Select Worker'}
                </button>
                {onViewProfile && (
                  <button
                    type="button"
                    onClick={() => onViewProfile(proposal.worker)}
                    className="w-full rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                  >
                    View Profile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalList;

