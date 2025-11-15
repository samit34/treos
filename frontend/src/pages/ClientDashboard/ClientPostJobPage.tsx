import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAppSelector } from '../../hooks/redux';

interface MessageState {
  type: 'success' | 'error';
  text: string;
}

const careTypes = ['Personal Care', 'Companionship', 'Medical Assistance', 'Housekeeping', 'Transportation'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClientPostJobPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    careType: '',
    hourlyRate: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    selectedDays: [] as string[],
    street: '',
    city: '',
    state: '',
    zipCode: '',
    requirements: '',
  });
  const [message, setMessage] = useState<MessageState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day: string) => {
    setFormValues((prev) => {
      const exists = prev.selectedDays.includes(day);
      return {
        ...prev,
        selectedDays: exists
          ? prev.selectedDays.filter((item) => item !== day)
          : [...prev.selectedDays, day],
      };
    });
  };

  const resetForm = () => {
    setFormValues({
      title: '',
      description: '',
      careType: '',
      hourlyRate: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      selectedDays: [],
      street: '',
      city: '',
      state: '',
      zipCode: '',
      requirements: '',
    });
  };

  const validateForm = () => {
    if (!formValues.title.trim()) return 'Job title is required.';
    if (!formValues.description.trim()) return 'Job description is required.';
    if (!formValues.careType) return 'Please select a care type.';
    if (!formValues.hourlyRate) return 'Hourly rate is required.';
    if (Number(formValues.hourlyRate) <= 0) return 'Hourly rate must be greater than zero.';
    if (!formValues.startDate) return 'Start date is required.';
    if (!formValues.startTime || !formValues.endTime)
      return 'Please provide both start and end times.';
    if (!formValues.street.trim() || !formValues.city.trim() || !formValues.state.trim())
      return 'Please provide the full address.';
    if (!formValues.zipCode.trim()) return 'Zip code is required.';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    const payload = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      careType: formValues.careType,
      hourlyRate: Number(formValues.hourlyRate),
      schedule: {
        startDate: formValues.startDate,
        endDate: formValues.endDate || undefined,
        days: formValues.selectedDays,
        hours: {
          start: formValues.startTime,
          end: formValues.endTime,
        },
      },
      location: {
        street: formValues.street.trim(),
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        zipCode: formValues.zipCode.trim(),
      },
      requirements: formValues.requirements
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      setIsSubmitting(true);
      setMessage(null);
      await axiosInstance.post('/jobs', payload);
      setMessage({ type: 'success', text: 'Job posted successfully.' });
      resetForm();
      setTimeout(() => navigate('/dashboard/jobs'), 1200);
    } catch (err: any) {
      console.error('Failed to post job:', err);
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to post job. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Post a New Job</h2>
          <p className="text-sm text-gray-500">
            Share your care needs with trusted workers. Provide clear details so you receive the best matches.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {message && (
          <div
            className={`mb-4 rounded px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-400 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                name="title"
                value={formValues.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="e.g., Overnight Care Support"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Care Type</label>
              <select
                name="careType"
                value={formValues.careType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              >
                <option value="">Select care type</option>
                {careTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={4}
              value={formValues.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              placeholder="Describe the care needs, responsibilities, and expectations"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                name="hourlyRate"
                value={formValues.hourlyRate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formValues.startDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date (optional)</label>
              <input
                type="date"
                name="endDate"
                value={formValues.endDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formValues.startTime}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formValues.endTime}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days Needed</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => {
                const selected = formValues.selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500">Street</label>
                <input
                  type="text"
                  name="street"
                  value={formValues.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500">City</label>
                <input
                  type="text"
                  name="city"
                  value={formValues.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500">State</label>
                <input
                  type="text"
                  name="state"
                  value={formValues.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formValues.zipCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Requirements (optional)</label>
            <textarea
              name="requirements"
              rows={3}
              value={formValues.requirements}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              placeholder="Add requirements on separate lines"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientPostJobPage;


