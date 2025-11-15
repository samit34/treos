import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import axiosInstance from '../../api/axiosInstance';
import { Job } from '../../types';
import { useAppSelector } from '../../hooks/redux';
import SubmitReviewModal from '../../components/dashboard/SubmitReviewModal';
import { reviewApi } from '../../api/reviewApi';

const WORKER_JOB_STATUSES = ['in-progress', 'completed'] as const;

const WorkerCalendarPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role !== 'worker') {
    return <Navigate to="/dashboard" replace />;
  }

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDateJobs, setSelectedDateJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [reviewModalData, setReviewModalData] = useState<{ job: Job } | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setError('');
      setLoading(true);

      try {
        const [inProgressResponse, completedResponse] = await Promise.all(
          WORKER_JOB_STATUSES.map((status) =>
            axiosInstance.get('/jobs', {
              params: { status },
            })
          )
        );

        const combinedJobs = [
          ...(inProgressResponse.data?.data?.jobs ?? []),
          ...(completedResponse.data?.data?.jobs ?? []),
        ];

        const workerId = user.id;

        const assignedJobs = combinedJobs.filter((job: Job) => {
          const selectedWorkerId = (job.selectedWorker as any)?._id || job.selectedWorker?.id;
          return selectedWorkerId === workerId;
        });

        setJobs(assignedJobs);
      } catch (err: any) {
        console.error('Failed to fetch worker jobs:', err);
        setError(err?.response?.data?.message || 'Failed to load your scheduled jobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user.id]);

  useEffect(() => {
    filterJobsByDate(selectedDate);
  }, [selectedDate, jobs]);

  const filterJobsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const filtered = jobs.filter((job) => {
      const jobStartDate = format(new Date(job.schedule.startDate), 'yyyy-MM-dd');
      const jobEndDate = job.schedule.endDate
        ? format(new Date(job.schedule.endDate), 'yyyy-MM-dd')
        : null;

      if (jobEndDate) {
        return dateStr >= jobStartDate && dateStr <= jobEndDate;
      }
      return dateStr === jobStartDate;
    });

    setSelectedDateJobs(filtered);
  };

  const getJobsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return jobs.filter((job) => {
      const jobStartDate = format(new Date(job.schedule.startDate), 'yyyy-MM-dd');
      const jobEndDate = job.schedule.endDate
        ? format(new Date(job.schedule.endDate), 'yyyy-MM-dd')
        : null;

      if (jobEndDate) {
        return dateStr >= jobStartDate && dateStr <= jobEndDate;
      }
      return dateStr === jobStartDate;
    }).length;
  };

  const tileContent: CalendarProps['tileContent'] = ({ date }) => {
    const jobCount = getJobsForDate(date as Date);
    if (jobCount > 0) {
      return (
        <div className="flex justify-center mt-1">
          <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {jobCount}
          </span>
        </div>
      );
    }
    return null;
  };

  const handleDateChange: CalendarProps['onChange'] = (value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      return;
    }

    if (Array.isArray(value) && value[0] instanceof Date) {
      setSelectedDate(value[0]);
    }
  };

  const handleViewClientProfile = (client: Job['client']) => {
    if (!client) {
      return;
    }
    const clientId =
      (client as unknown as { id?: string; _id?: string }).id ??
      (client as unknown as { id?: string; _id?: string })._id;

    if (!clientId) {
      console.warn('Unable to determine client id for profile navigation');
      return;
    }

    navigate(`/dashboard/clients/${clientId}`, { state: { client } });
  };

  const handleOpenReviewModal = (job: Job) => {
    if (job.status !== 'completed') {
      return;
    }
    setReviewError('');
    setReviewModalData({ job });
  };

  const handleSubmitReview = async ({ rating, comment }: { rating: number; comment: string }) => {
    if (!reviewModalData) {
      return;
    }

    const client = reviewModalData.job.client;
    const clientId =
      (client as unknown as { id?: string; _id?: string }).id ??
      (client as unknown as { id?: string; _id?: string })._id;

    if (!clientId) {
      setReviewError('Unable to determine client for this review.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError('');
      await reviewApi.submitReview({
        jobId: reviewModalData.job._id,
        revieweeId: clientId,
        rating,
        comment,
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingJobs = useMemo(() => {
    return jobs
      .filter((job) => new Date(job.schedule.startDate) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.schedule.startDate).getTime() - new Date(b.schedule.startDate).getTime()
      )
      .slice(0, 5);
  }, [jobs]);

  if (loading) {
    return <div className="text-center py-12">Loading your schedule...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Job Calendar</h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {reviewSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded mb-4">
          {reviewSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full border-0"
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Jobs on {format(selectedDate, 'MMMM d, yyyy')}
            </h3>

            {selectedDateJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">You do not have any jobs scheduled for this date.</p>
            ) : (
              <div className="space-y-4">
                {selectedDateJobs.map((job) => (
                  <div key={job._id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        Time: {job.schedule.hours.start} - {job.schedule.hours.end}
                      </p>
                      <p>
                        Location: {job.location.city}, {job.location.state}
                      </p>
                      <p>
                        Client: {job.client.firstName} {job.client.lastName}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewClientProfile(job.client)}
                        className="inline-flex items-center rounded-md border border-primary-200 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                      >
                        View Client Profile
                      </button>
                      {job.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(job)}
                          className="inline-flex items-center rounded-md border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Jobs</h3>
        {upcomingJobs.length === 0 ? (
          <p className="text-gray-500 text-sm">You do not have any upcoming jobs scheduled.</p>
        ) : (
          <div className="space-y-4">
            {upcomingJobs.map((job) => (
              <div
                key={job._id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-4 last:border-b-0 gap-2"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-500">
                    {format(new Date(job.schedule.startDate), 'MMMM d, yyyy')} at{' '}
                    {job.schedule.hours.start}
                  </p>
                  <p className="text-sm text-gray-500">
                    Client: {job.client.firstName} {job.client.lastName}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
                <button
                  type="button"
                  onClick={() => handleViewClientProfile(job.client)}
                  className="inline-flex items-center justify-center rounded-md border border-primary-200 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                >
                  View Client Profile
                </button>
                {job.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal(job)}
                    className="inline-flex items-center justify-center rounded-md border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  >
                    Leave Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewModalData && (
        <SubmitReviewModal
          isOpen={Boolean(reviewModalData)}
          onClose={closeReviewModal}
          onSubmit={handleSubmitReview}
          title={`Review ${reviewModalData.job.client.firstName ?? 'the client'}`}
          subtitle={`Job: ${reviewModalData.job.title}`}
          submitting={reviewSubmitting}
          error={reviewError}
        />
      )}
    </div>
  );
};

export default WorkerCalendarPage;


