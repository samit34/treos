import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setUser } from '../../features/auth/authSlice';
import axiosInstance from '../../api/axiosInstance';
import { getActiveCategories } from '../../api/adminApi';

const Onboarding = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<Array<{ _id: string; name: string; description?: string }>>([]);
  // Only pre-select role if user has completed onboarding (meaning role was explicitly set)
  // Otherwise, show role selection first
  const [selectedRole, setSelectedRole] = useState<'client' | 'worker' | null>(
    user?.onboardingCompleted && user?.role && user.role !== 'admin'
      ? (user.role as 'client' | 'worker')
      : null
  );

  // Fetch active service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getActiveCategories();
        setServiceCategories(categories);
      } catch (error) {
        console.error('Failed to fetch service categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Redirect if onboarding is already completed
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.onboardingCompleted, navigate]);

  const isWorker = selectedRole === 'worker';

  const formik = useFormik({
    initialValues: {
      dateOfBirth: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      // Always include all fields to avoid undefined issues
      qualifications: [] as string[],
      availability: {
        days: [] as string[],
        hours: {
          start: '',
          end: '',
        },
      },
      hourlyRate: '',
      bio: '',
      supportNeeds: [] as string[],
    },
    validationSchema: Yup.object({
      dateOfBirth: Yup.date().required('Date of birth is required'),
      phone: Yup.string().required('Phone number is required'),
      address: Yup.object({
        street: Yup.string().required('Street address is required'),
        city: Yup.string().required('City is required'),
        state: Yup.string().required('State is required'),
        zipCode: Yup.string().required('Zip code is required'),
        country: Yup.string().required('Country is required'),
      }),
      ...(isWorker && {
        hourlyRate: Yup.number().required('Hourly rate is required').min(0),
        bio: Yup.string().required('Bio is required'),
      }),
    }),
    onSubmit: async (values) => {
      try {
        if (!selectedRole) {
          setError('Please select a role');
          return;
        }
        setError('');
        setLoading(true);
        
        // Only include role-specific fields based on selected role
        const submissionData: any = {
          dateOfBirth: values.dateOfBirth,
          phone: values.phone,
          address: values.address,
          role: selectedRole,
        };

        if (selectedRole === 'worker') {
          submissionData.qualifications = values.qualifications;
          submissionData.availability = values.availability;
          submissionData.hourlyRate = values.hourlyRate;
          submissionData.bio = values.bio;
        } else {
          submissionData.supportNeeds = values.supportNeeds;
        }

        const response = await axiosInstance.post('/users/onboarding', submissionData);
        // Update user state with the updated user data from response
        if (response.data.data?.user) {
          dispatch(setUser(response.data.data.user));
        }
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Onboarding failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Complete Your Profile</h2>
        <form onSubmit={formik.handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!selectedRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                I am a
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                    checked={selectedRole === 'client'}
                    onChange={() => setSelectedRole('client')}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Client</div>
                    <div className="text-sm text-gray-500">I need care services</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="worker"
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                    checked={selectedRole === 'worker'}
                    onChange={() => setSelectedRole('worker')}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Support Worker</div>
                    <div className="text-sm text-gray-500">I provide care services</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {selectedRole && (
            <>
              <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.dateOfBirth && formik.errors.dateOfBirth ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.dateOfBirth}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.phone && formik.errors.phone ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.phone}</div>
            ) : null}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="space-y-4">
              <input
                type="text"
                name="address.street"
                placeholder="Street Address"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formik.values.address.street}
                onChange={formik.handleChange}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="address.city"
                  placeholder="City"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formik.values.address.city}
                  onChange={formik.handleChange}
                />
                <input
                  type="text"
                  name="address.state"
                  placeholder="State"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formik.values.address.state}
                  onChange={formik.handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="address.zipCode"
                  placeholder="Zip Code"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formik.values.address.zipCode}
                  onChange={formik.handleChange}
                />
                <input
                  type="text"
                  name="address.country"
                  placeholder="Country"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formik.values.address.country}
                  onChange={formik.handleChange}
                />
              </div>
            </div>
          </div>

          {isWorker && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories</label>
                <p className="text-xs text-gray-500 mb-3">Select the service categories you provide</p>
                {serviceCategories.length === 0 ? (
                  <p className="text-sm text-gray-500">No service categories available. Please contact admin.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {serviceCategories.map((category) => (
                      <label key={category._id} className="flex items-start">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={formik.values.qualifications?.includes(category.name)}
                          onChange={(e) => {
                            const quals = formik.values.qualifications || [];
                            if (e.target.checked) {
                              formik.setFieldValue('qualifications', [...quals, category.name]);
                            } else {
                              formik.setFieldValue(
                                'qualifications',
                                quals.filter((q) => q !== category.name)
                              );
                            }
                          }}
                        />
                        <div className="ml-2">
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          {category.description && (
                            <p className="text-xs text-gray-500">{category.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability Days</label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={(formik.values.availability?.days || []).includes(day)}
                        onChange={(e) => {
                          const days = formik.values.availability?.days || [];
                          if (e.target.checked) {
                            formik.setFieldValue('availability.days', [...days, day]);
                          } else {
                            formik.setFieldValue(
                              'availability.days',
                              days.filter((d) => d !== day)
                            );
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
                  <label className="block text-sm font-medium text-gray-700">Available From</label>
                  <input
                    type="time"
                    name="availability.hours.start"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={formik.values.availability?.hours?.start || ''}
                    onChange={formik.handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Until</label>
                  <input
                    type="time"
                    name="availability.hours.end"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={formik.values.availability?.hours?.end || ''}
                    onChange={formik.handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formik.values.hourlyRate || ''}
                  onChange={formik.handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formik.values.bio || ''}
                  onChange={formik.handleChange}
                />
              </div>
            </>
          )}

          {!isWorker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Needs</label>
              <p className="text-xs text-gray-500 mb-3">Select the service categories you need</p>
              {serviceCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No service categories available. Please contact admin.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {serviceCategories.map((category) => (
                    <label key={category._id} className="flex items-start">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={formik.values.supportNeeds?.includes(category.name)}
                        onChange={(e) => {
                          const needs = formik.values.supportNeeds || [];
                          if (e.target.checked) {
                            formik.setFieldValue('supportNeeds', [...needs, category.name]);
                          } else {
                            formik.setFieldValue('supportNeeds', needs.filter((n) => n !== category.name));
                          }
                        }}
                      />
                      <div className="ml-2">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        {category.description && (
                          <p className="text-xs text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Onboarding;

