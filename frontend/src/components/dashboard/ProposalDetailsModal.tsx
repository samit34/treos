import { Proposal } from '../../types';

interface ProposalDetailsModalProps {
  proposal: Proposal;
  onClose: () => void;
  onViewClientProfile?: (clientId: string) => void;
}

const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString() : 'Not specified');

const ProposalDetailsModal = ({ proposal, onClose, onViewClientProfile }: ProposalDetailsModalProps) => {
  const job = proposal.job;
  const client = job?.client;
  const location = job?.location;
  const schedule = job?.schedule;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://dashboard.tros.com.au';
  const clientProfilePictureSrc = client?.profilePicture
    ? client.profilePicture.startsWith('http')
      ? client.profilePicture
      : `${apiBaseUrl}${client.profilePicture}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Proposal details</p>
            <h2 className="text-2xl font-semibold text-gray-900">{job?.title ?? 'Job details unavailable'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8 px-6 py-6">
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
            {client ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-lg font-semibold text-primary-600">
                    {clientProfilePictureSrc ? (
                      <img
                        src={clientProfilePictureSrc}
                        alt={`${client.firstName} ${client.lastName}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {client.firstName?.[0]}
                        {client.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{client.email}</p>
                  </div>
                </div>
                {onViewClientProfile && client && (
                  <button
                    type="button"
                    onClick={() => {
                      const clientId = (client as any)?.id ?? (client as any)?._id;
                      if (clientId) {
                        onViewClientProfile(clientId as string);
                      }
                    }}
                    className="rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                  >
                    View Full Profile
                  </button>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {client.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-base text-gray-900">{client.phone}</p>
                    </div>
                  )}
                  {client.address && (
                  <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-base text-gray-900">
                        {client.address.city}, {client.address.state}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Client information is not available.</p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Job Overview</h3>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                {job?.status ?? 'unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{job?.description ?? 'No job description provided.'}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Hourly Rate</p>
                <p className="text-base font-medium text-gray-900">
                  {job?.hourlyRate ? `$${job.hourlyRate}/hr` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Care Type</p>
                <p className="text-base font-medium text-gray-900">{job?.careType ?? 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="text-base text-gray-900">{formatDate(schedule?.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="text-base text-gray-900">{formatDate(schedule?.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hours</p>
                <p className="text-base text-gray-900">
                  {schedule?.hours?.start && schedule?.hours?.end
                    ? `${schedule.hours.start} - ${schedule.hours.end}`
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-base text-gray-900">
                  {location
                    ? `${location.city}, ${location.state}`
                    : 'Address shared upon acceptance'}
                </p>
              </div>
            </div>
            {job?.requirements && job.requirements.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Requirements</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.requirements.map((requirement) => (
                    <span
                      key={requirement}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {requirement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Your Proposal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Proposed Rate</p>
                <p className="text-base text-gray-900">
                  {proposal.proposedRate ? `$${proposal.proposedRate}/hr` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-flex w-max rounded-full px-3 py-1 text-xs font-semibold ${
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
            {proposal.message && (
              <div>
                <p className="text-sm text-gray-500">Message to client</p>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                  {proposal.message}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailsModal;

