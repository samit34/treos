import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { useAppSelector } from '../../hooks/redux';
import axiosInstance from '../../api/axiosInstance';
import { Job } from '../../types';

const CalendarPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Only clients can access this page
  if (user?.role !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDateJobs, setSelectedDateJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobsByDate(selectedDate);
  }, [selectedDate, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await axiosInstance.get('/jobs');
      setJobs(response.data.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const filtered = jobs.filter((job) => {
      const jobStartDate = format(new Date(job.schedule.startDate), 'yyyy-MM-dd');
      const jobEndDate = job.schedule.endDate
        ? format(new Date(job.schedule.endDate), 'yyyy-MM-dd')
        : null;

      // Check if date is within job schedule
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

  const tileContent = ({ date }: { date: Date }) => {
    const jobCount = getJobsForDate(date);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
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

  if (loading) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  const handleDateChange: CalendarProps['onChange'] = (value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      return;
    }

    if (Array.isArray(value) && value[0] instanceof Date) {
      setSelectedDate(value[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Calendar</h2>

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
              <p className="text-gray-500 text-sm">No jobs scheduled for this date</p>
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
                    <div className="text-sm text-gray-500">
                      <p>
                        Time: {job.schedule.hours.start} - {job.schedule.hours.end}
                      </p>
                      <p>Location: {job.location.city}, {job.location.state}</p>
                      {job.selectedWorker && (
                        <p className="mt-1">
                          Worker: {job.selectedWorker.firstName} {job.selectedWorker.lastName}
                        </p>
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
        <div className="space-y-4">
          {jobs
            .filter((job) => new Date(job.schedule.startDate) >= new Date())
            .sort((a, b) => new Date(a.schedule.startDate).getTime() - new Date(b.schedule.startDate).getTime())
            .slice(0, 5)
            .map((job) => (
              <div key={job._id} className="flex justify-between items-center border-b pb-4 last:border-b-0">
                <div>
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-500">
                    {format(new Date(job.schedule.startDate), 'MMMM d, yyyy')} at {job.schedule.hours.start}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

