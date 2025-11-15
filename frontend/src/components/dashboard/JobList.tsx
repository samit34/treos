import { Job, User } from '../../types';

interface JobListProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  selectedJob: Job | null;
  onViewDetails: (job: Job) => void;
  onDeleteJob: (job: Job) => void;
  onViewWorkerProfile?: (worker: User) => void;
}

const JobList = ({
  jobs,
  onJobClick,
  selectedJob,
  onViewDetails,
  onDeleteJob,
  onViewWorkerProfile,
}: JobListProps) => {
  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs posted yet.</div>
      ) : (
        jobs.map((job) => (
          <div
            key={job._id}
            onClick={() => onJobClick(job)}
            className={`bg-white p-6 rounded-lg shadow cursor-pointer border-2 transition-colors ${
              selectedJob?._id === job._id ? 'border-primary-500' : 'border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                {job.selectedWorker && (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">
                      Assigned Worker:{' '}
                      {(job.selectedWorker as User).firstName}{' '}
                      {(job.selectedWorker as User).lastName}
                    </p>
                    <p>{(job.selectedWorker as User).email}</p>
                    <div className="mt-1 text-sm text-yellow-600">
                      {(() => {
                        const worker = job.selectedWorker as User;
                        const ratingValue =
                          typeof worker.rating === 'number' ? worker.rating : null;
                        const reviewCount = worker.totalReviews ?? 0;
                        if (ratingValue !== null && reviewCount > 0) {
                          return (
                            <span>
                              ⭐ {ratingValue.toFixed(1)} ({reviewCount} review
                              {reviewCount === 1 ? '' : 's'})
                            </span>
                          );
                        }
                        return <span className="text-gray-500">No reviews yet</span>;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(job);
                  }}
                  className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteJob(job);
                  }}
                  className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Delete
                </button>
                {job.selectedWorker && onViewWorkerProfile && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewWorkerProfile(job.selectedWorker as User);
                    }}
                    className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View Worker
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div>
                <span
                  className={`px-2 py-1 text-xs rounded capitalize ${
                    job.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : job.status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {job.status}
                </span>
                <span className="ml-2 text-gray-500">${job.hourlyRate}/hr</span>
              </div>
              <div className="text-sm text-gray-400">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default JobList;

