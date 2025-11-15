import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Proposal, Review } from '../../types';
import { proposalApi } from '../../api/proposalApi';
import ProposalDetailsModal from '../../components/dashboard/ProposalDetailsModal';
import EditProposalModal from '../../components/dashboard/EditProposalModal';
import SubmitReviewModal from '../../components/dashboard/SubmitReviewModal';
import { reviewApi } from '../../api/reviewApi';
import { useAppSelector } from '../../hooks/redux';

type ProposalStatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';

interface WorkerProposalsPageProps {
  filter?: 'pending';
  heading?: string;
  description?: string;
  lockFilter?: boolean;
}

const WorkerProposalsPage = ({
  filter,
  heading = 'My Proposals',
  description = 'Track the proposals you have submitted and manage follow-ups with clients.',
  lockFilter = false,
}: WorkerProposalsPageProps) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [activeStatus, setActiveStatus] = useState<ProposalStatusFilter>(filter ?? 'all');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [detailsProposal, setDetailsProposal] = useState<Proposal | null>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [reviewsByJob, setReviewsByJob] = useState<Record<string, Review[]>>({});
  const [reviewsLoadingMap, setReviewsLoadingMap] = useState<Record<string, boolean>>({});
  const [reviewModalData, setReviewModalData] = useState<{ proposal: Proposal } | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [_reviewSuccess, setReviewSuccess] = useState(''); // Reserved for future use

  useEffect(() => {
    const loadProposals = async () => {
      setError('');
      setSuccessMessage('');
      setLoading(true);
      try {
        const response = await axiosInstance.get('/proposals');
        const myProposals: Proposal[] = response.data?.data?.proposals ?? [];
        setProposals(myProposals);
      } catch (err: any) {
        console.error('Failed to load proposals', err);
        setError(err?.response?.data?.message || 'Unable to load proposals.');
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, []);

  useEffect(() => {
    if (filter) {
      setActiveStatus(filter);
    }
  }, [filter]);

  useEffect(() => {
    proposals.forEach((proposal) => {
      if (proposal.status === 'accepted' && proposal.job?.status === 'completed') {
        loadReviewsForJob(proposal.job?._id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals]);

  const stats = useMemo(() => {
    const pending = proposals.filter((proposal) => proposal.status === 'pending').length;
    const accepted = proposals.filter((proposal) => proposal.status === 'accepted').length;
    const rejected = proposals.filter((proposal) => proposal.status === 'rejected').length;
    return {
      total: proposals.length,
      pending,
      accepted,
      rejected,
    };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (activeStatus === 'all') {
      return proposals;
    }
    return proposals.filter((proposal) => proposal.status === activeStatus);
  }, [activeStatus, proposals]);

  const handleUpdateSuccess = (updatedProposal: Proposal) => {
    setSelectedProposal(null);
    setSuccessMessage('Proposal updated successfully.');
    setProposals((prev) =>
      prev.map((proposal) => (proposal._id === updatedProposal._id ? updatedProposal : proposal))
    );
  };

  const handleWithdraw = async (proposalId: string) => {
    const confirmWithdraw = window.confirm('Are you sure you want to withdraw this proposal?');
    if (!confirmWithdraw) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await axiosInstance.delete(`/proposals/${proposalId}`);
      setProposals((prev) => prev.filter((proposal) => proposal._id !== proposalId));
      setSuccessMessage('Proposal withdrawn.');
      if (selectedProposal?._id === proposalId) {
        setSelectedProposal(null);
      }
    } catch (err: any) {
      console.error('Failed to withdraw proposal', err);
      setError(err?.response?.data?.message || 'Failed to withdraw proposal.');
    }
  };

  const handleRespond = async (proposalId: string, action: 'accept' | 'reject') => {
    try {
      setError('');
      setSuccessMessage('');
      setRespondingId(proposalId);
      const updatedProposal = await proposalApi.respondToProposal(proposalId, action);
      setProposals((prev) =>
        prev.map((proposal) => (proposal._id === updatedProposal._id ? updatedProposal : proposal))
      );
      setSuccessMessage(
        action === 'accept'
          ? 'Invitation accepted. The client has been notified.'
          : 'Invitation declined.'
      );
    } catch (err: any) {
      console.error('Failed to respond to proposal', err);
      setError(err?.response?.data?.message || 'Unable to update the invitation.');
    } finally {
      setRespondingId(null);
    }
  };

  const statusFilters: Array<{ value: ProposalStatusFilter; label: string; count: number }> = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'accepted', label: 'Accepted', count: stats.accepted },
    { value: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  const handleViewClientProfile = (clientId: string, client?: Proposal['job']['client']) => {
    if (!clientId) {
      return;
    }

    const clientPayload = client
      ? {
          ...(client as any),
          id: (client as any)?.id ?? (client as any)?._id ?? clientId,
        }
      : undefined;

    navigate(`/dashboard/clients/${clientId}`, {
      state: clientPayload ? { client: clientPayload } : undefined,
    });
  };

  const loadReviewsForJob = async (jobId: string | undefined) => {
    if (!jobId || reviewsByJob[jobId] || reviewsLoadingMap[jobId]) {
      return;
    }
    setReviewsLoadingMap((prev) => ({ ...prev, [jobId]: true }));
    try {
      const fetched = await reviewApi.getForJob(jobId);
      setReviewsByJob((prev) => ({ ...prev, [jobId]: fetched }));
    } catch (error) {
      console.error('Failed to load reviews for job', jobId, error);
    } finally {
      setReviewsLoadingMap((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const currentWorkerId =
    (user as unknown as { id?: string; _id?: string })?.id ??
    (user as unknown as { id?: string; _id?: string })?._id ??
    user?.id;

  const hasLeftReviewForJob = (jobId: string | undefined) => {
    if (!jobId) return true;
    const reviews = reviewsByJob[jobId] ?? [];
    return reviews.some((review) => {
      const reviewerId =
        (review.reviewer as unknown as { id?: string; _id?: string }).id ??
        (review.reviewer as unknown as { id?: string; _id?: string })._id ??
        (review.reviewer as unknown as { id?: string })?.id;
      return reviewerId === currentWorkerId;
    });
  };

  const handleOpenReviewModal = async (proposal: Proposal) => {
    const jobId = proposal.job?._id;
    if (!jobId) {
      setReviewError('Unable to determine the job for this review.');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    await loadReviewsForJob(jobId);
    setReviewModalData({ proposal });
  };

  const handleSubmitReview = async ({ rating, comment }: { rating: number; comment: string }) => {
    if (!reviewModalData) {
      return;
    }

    const { proposal } = reviewModalData;
    const jobId = proposal.job?._id;
    const client = proposal.job?.client;
    const clientId =
      (client as unknown as { id?: string; _id?: string }).id ??
      (client as unknown as { id?: string; _id?: string })._id;

    if (!jobId || !clientId) {
      setReviewError('Unable to determine the client for this review.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError('');
      const newReview = await reviewApi.submitReview({
        jobId,
        revieweeId: clientId,
        rating,
        comment,
      });
      setReviewsByJob((prev) => ({
        ...prev,
        [jobId]: prev[jobId] ? [...prev[jobId], newReview] : [newReview],
      }));
      setReviewSuccess('Thanks for sharing your feedback!');
      setReviewModalData(null);
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

  const canLeaveReview = (proposal: Proposal) => {
    const jobId = proposal.job?._id;
    const jobStatus = proposal.job?.status;
    return (
      proposal.status === 'accepted' &&
      jobStatus === 'completed' &&
      !hasLeftReviewForJob(jobId)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">{heading}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {!lockFilter && (
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((statusFilter) => {
            const isActive = activeStatus === statusFilter.value;
            const isDisabled = statusFilter.count === 0 && statusFilter.value !== 'all';

            return (
              <button
                key={statusFilter.value}
                type="button"
                disabled={isDisabled && !isActive}
                onClick={() => setActiveStatus(statusFilter.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                } ${isDisabled && !isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{statusFilter.label}</span>
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-gray-600">
                  {statusFilter.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading proposals...</div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {filter === 'pending'
            ? 'You have no pending proposals at the moment.'
            : 'You have not submitted any proposals yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProposals.map((proposal) => {
            const jobTitle = proposal.job?.title ?? 'Job details unavailable';
            const jobRate = proposal.proposedRate ?? proposal.job?.hourlyRate ?? 0;
            const clientFirstName = proposal.job?.client?.firstName ?? 'Client';
            const clientLastName = proposal.job?.client?.lastName ?? '';
            const isClientInvitation = proposal.initiatedBy === 'client';
            const isPending = proposal.status === 'pending';
            const clientId =
              (proposal.job?.client as any)?.id ?? (proposal.job?.client as any)?._id ?? '';

            return (
              <div key={proposal._id} className="bg-white shadow rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {isClientInvitation ? 'Job invitation' : 'Your proposal'}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">{jobTitle}</p>
                    {proposal.message && (
                      <p className="text-sm text-gray-500 line-clamp-2">{proposal.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary-600">${jobRate}/hr</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
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
                </div>
                <div className="text-xs text-gray-400">
                  Submitted {new Date(proposal.createdAt).toLocaleString()}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Client</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientFirstName} {clientLastName}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {clientId && (
                      <button
                        type="button"
                        onClick={() =>
                          handleViewClientProfile(clientId, proposal.job?.client)
                        }
                        className="px-4 py-2 rounded-md border border-primary-200 text-sm font-medium text-primary-600 transition hover:bg-primary-50"
                      >
                        View Client Profile
                      </button>
                    )}
                    {canLeaveReview(proposal) && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(proposal)}
                        className="px-4 py-2 rounded-md border border-amber-200 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                      >
                        Leave Review
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsProposal(proposal);
                        loadReviewsForJob(proposal.job?._id);
                      }}
                      className="px-4 py-2 rounded-md border text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      View Details
                    </button>
                    {isClientInvitation ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespond(proposal._id, 'reject')}
                          disabled={!isPending || respondingId === proposal._id}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                            isPending && respondingId !== proposal._id
                              ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {respondingId === proposal._id ? 'Updating...' : 'Decline'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(proposal._id, 'accept')}
                          disabled={!isPending || respondingId === proposal._id}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            isPending && respondingId !== proposal._id
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'bg-primary-200 text-white cursor-not-allowed'
                          }`}
                        >
                          {respondingId === proposal._id ? 'Updating...' : 'Accept'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedProposal(proposal)}
                          disabled={proposal.status !== 'pending'}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                            proposal.status === 'pending'
                              ? 'border-primary-200 text-primary-600 hover:bg-primary-50'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWithdraw(proposal._id)}
                          disabled={proposal.status !== 'pending'}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                            proposal.status === 'pending'
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Withdraw
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProposal && (
        <EditProposalModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {detailsProposal && (
        <ProposalDetailsModal
          proposal={detailsProposal}
          onClose={() => setDetailsProposal(null)}
          onViewClientProfile={(clientId) =>
            handleViewClientProfile(clientId, detailsProposal.job?.client)
          }
        />
      )}

      {reviewModalData && (
        <SubmitReviewModal
          isOpen={Boolean(reviewModalData)}
          onClose={closeReviewModal}
          onSubmit={handleSubmitReview}
          title={`Review ${
            `${reviewModalData.proposal.job?.client?.firstName ?? ''} ${
              reviewModalData.proposal.job?.client?.lastName ?? ''
            }`.trim() || reviewModalData.proposal.job?.client?.email || 'this client'
          }`}
          subtitle={`Job: ${reviewModalData.proposal.job?.title ?? 'Details unavailable'}`}
          submitting={reviewSubmitting}
          error={reviewError}
        />
      )}
    </div>
  );
};

export const WorkerPendingProposalsPage = () => (
  <WorkerProposalsPage
    filter="pending"
    heading="Pending Proposals"
    description="Review proposals awaiting client response and make updates to stay competitive."
    lockFilter
  />
);

export default WorkerProposalsPage;


