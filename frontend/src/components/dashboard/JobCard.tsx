import { Job, User } from '../../types';

interface JobCardProps {
  job: Job;
  onApply: () => void;
  hasApplied: boolean;
  onViewClientProfile?: (client: User) => void;
}

const JobCard = ({ job, onApply, hasApplied, onViewClientProfile }: JobCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs uppercase tracking-wide text-gray-400">
          <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">Location:</span>
          <span className="ml-2">
            {job.location.city}, {job.location.state}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">Rate:</span>
          <span className="ml-2">${job.hourlyRate}/hr</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">Status:</span>
          <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
            {job.status}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={onApply}
          disabled={hasApplied || job.status !== 'open'}
          className={`w-full px-4 py-2 rounded-md ${
            hasApplied
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : job.status !== 'open'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {hasApplied ? 'Already Applied' : 'Apply Now'}
        </button>
        {onViewClientProfile && job.client && (
          <button
            type="button"
            onClick={() => onViewClientProfile(job.client as User)}
            className="w-full rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            View Client Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;

