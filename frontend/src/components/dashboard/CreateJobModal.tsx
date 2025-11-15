import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axiosInstance from '../../api/axiosInstance';
import { Job } from '../../types';

interface CreateJobModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateJobModal = ({ onClose, onSuccess }: CreateJobModalProps) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      careType: '',
      location: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      schedule: {
        startDate: new Date(),
        days: [] as string[],
        hours: {
          start: '',
          end: '',
        },
      },
      hourlyRate: '',
      requirements: [] as string[],
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      description: Yup.string().required('Description is required'),
      careType: Yup.string().required('Care type is required'),
      location: Yup.object({
        street: Yup.string().required('Street is required'),
        city: Yup.string().required('City is required'),
        state: Yup.string().required('State is required'),
        zipCode: Yup.string().required('Zip code is required'),
      }),
      hourlyRate: Yup.number().required('Hourly rate is required').min(0),
    }),
    onSubmit: async (values) => {
      try {
        setError('');
        setLoading(true);
        await axiosInstance.post('/jobs', values);
        onSuccess();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to create job');
      } finally {
        setLoading(false);
      }
    },
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const careTypes = ['Personal Care', 'Companionship', 'Medical Assistance', 'Housekeeping', 'Transportation'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Job</h2>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              name="title"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formik.values.title}
              onChange={formik.handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formik.values.description}
              onChange={formik.handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Care Type</label>
            <select
              name="careType"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formik.values.careType}
              onChange={formik.handleChange}
            >
              <option value="">Select care type</option>
              {careTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <div className="space-y-2 mt-1">
              <input
                type="text"
                name="location.street"
                placeholder="Street"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formik.values.location.street}
                onChange={formik.handleChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="location.city"
                  placeholder="City"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formik.values.location.city}
                  onChange={formik.handleChange}
                />
                <input
                  type="text"
                  name="location.state"
                  placeholder="State"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formik.values.location.state}
                  onChange={formik.handleChange}
                />
              </div>
              <input
                type="text"
                name="location.zipCode"
                placeholder="Zip Code"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formik.values.location.zipCode}
                onChange={formik.handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Days</label>
            <div className="grid grid-cols-2 gap-2">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={formik.values.schedule.days.includes(day)}
                    onChange={(e) => {
                      const days = formik.values.schedule.days;
                      if (e.target.checked) {
                        formik.setFieldValue('schedule.days', [...days, day]);
                      } else {
                        formik.setFieldValue('schedule.days', days.filter((d) => d !== day));
                      }
                    }}
                  />
                  <span className="ml-2">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                name="schedule.hours.start"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formik.values.schedule.hours.start}
                onChange={formik.handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                name="schedule.hours.end"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formik.values.schedule.hours.end}
                onChange={formik.handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
            <input
              type="number"
              name="hourlyRate"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formik.values.hourlyRate}
              onChange={formik.handleChange}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;

