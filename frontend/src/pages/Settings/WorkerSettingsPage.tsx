import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setUser } from '../../features/auth/authSlice';
import { userApi } from '../../api/userApi';

interface MessageState {
  type: 'success' | 'error';
  text: string;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WorkerSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role !== 'worker') {
    return <Navigate to="/dashboard" replace />;
  }

  const [profileMessage, setProfileMessage] = useState<MessageState | null>(null);
  const [photoMessage, setPhotoMessage] = useState<MessageState | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<MessageState | null>(null);
  const [otpMessage, setOtpMessage] = useState<MessageState | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
    []
  );

  const currentProfilePicture = useMemo(() => {
    if (!user?.profilePicture) return null;
    if (user.profilePicture.startsWith('http')) return user.profilePicture;
    return `${apiBaseUrl}${user.profilePicture}`;
  }, [user?.profilePicture, apiBaseUrl]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const profileFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
      },
      qualificationsText: (user?.qualifications || []).join('\n'),
      availabilityDays: user?.availability?.days || [],
      availabilityStart: user?.availability?.hours?.start || '',
      availabilityEnd: user?.availability?.hours?.end || '',
      hourlyRate:
        user?.hourlyRate !== undefined && user?.hourlyRate !== null ? String(user.hourlyRate) : '',
      bio: user?.bio || '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      phone: Yup.string().required('Phone number is required'),
      dateOfBirth: Yup.date().nullable().typeError('Please provide a valid date'),
      address: Yup.object({
        street: Yup.string().required('Street address is required'),
        city: Yup.string().required('City is required'),
        state: Yup.string().required('State is required'),
        zipCode: Yup.string().required('Zip code is required'),
        country: Yup.string().required('Country is required'),
      }),
      hourlyRate: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .nullable()
        .min(0, 'Hourly rate cannot be negative'),
      bio: Yup.string().max(1000, 'Bio should not exceed 1000 characters'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setProfileMessage(null);

        const qualifications = values.qualificationsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        const payload: Record<string, unknown> = {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth || null,
          address: values.address,
          qualifications,
          availability: {
            days: values.availabilityDays,
            hours: {
              start: values.availabilityStart || null,
              end: values.availabilityEnd || null,
            },
          },
          hourlyRate:
            values.hourlyRate === '' || values.hourlyRate === null
              ? null
              : Number(values.hourlyRate),
          bio: values.bio,
        };

        const updatedUser = await userApi.updateProfile(payload);
        dispatch(setUser(updatedUser));
        setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      } catch (err: any) {
        setProfileMessage({
          type: 'error',
          text: err?.response?.data?.message || 'Failed to update profile. Please try again.',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      otp: Yup.string().required('OTP is required'),
      newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        setPasswordMessage(null);
        await userApi.changePasswordWithOtp(values.otp, values.newPassword);
        setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
        resetForm();
        setOtpRequested(false);
      } catch (err: any) {
        setPasswordMessage({
          type: 'error',
          text: err?.response?.data?.message || 'Failed to update password. Please try again.',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPhotoMessage(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      setPhotoMessage({ type: 'error', text: 'Please select an image to upload.' });
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoMessage(null);
      const updatedUser = await userApi.uploadProfilePicture(selectedFile);
      dispatch(setUser(updatedUser));
      setPhotoMessage({ type: 'success', text: 'Profile picture updated successfully.' });
      setSelectedFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
    } catch (err: any) {
      setPhotoMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to upload profile picture. Please try again.',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRequestOtp = async () => {
    try {
      setRequestingOtp(true);
      setOtpMessage(null);
      await userApi.requestPasswordOtp();
      setOtpRequested(true);
      setOtpMessage({
        type: 'success',
        text: 'OTP sent to your registered email address.',
      });
    } catch (err: any) {
      setOtpMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to send OTP. Please try again.',
      });
    } finally {
      setRequestingOtp(false);
    }
  };

  const renderMessage = (message: MessageState | null) => {
    if (!message) return null;
    const baseClasses = 'px-4 py-3 rounded text-sm';
    const colorClasses =
      message.type === 'success'
        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        : 'bg-red-50 border border-red-200 text-red-700';
    return <div className={`${baseClasses} ${colorClasses}`}>{message.text}</div>;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">
            Update your worker profile, availability, and change your password securely with OTP verification.
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile Photo</h2>
        <p className="text-sm text-gray-500">Upload a clear photo to help clients recognise you.</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-600">
            {photoPreview || currentProfilePicture ? (
              <img
                src={photoPreview || currentProfilePicture || ''}
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span>
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {uploadingPhoto ? 'Uploading…' : 'Upload Photo'}
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (photoPreview) {
                      URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                    }
                  }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-3">{renderMessage(photoMessage)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Professional Profile</h2>
        <p className="text-sm text-gray-500">
          Maintain accurate information so clients can understand your experience and availability.
        </p>

        <form onSubmit={profileFormik.handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.firstName}
                onChange={profileFormik.handleChange}
              />
              {profileFormik.touched.firstName && profileFormik.errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{profileFormik.errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.lastName}
                onChange={profileFormik.handleChange}
              />
              {profileFormik.touched.lastName && profileFormik.errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{profileFormik.errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.phone}
                onChange={profileFormik.handleChange}
              />
              {profileFormik.touched.phone && profileFormik.errors.phone && (
                <p className="mt-1 text-xs text-red-600">{profileFormik.errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.dateOfBirth}
                onChange={profileFormik.handleChange}
              />
              {profileFormik.touched.dateOfBirth && profileFormik.errors.dateOfBirth && (
                <p className="mt-1 text-xs text-red-600">{profileFormik.errors.dateOfBirth as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Address</h3>
            <input
              type="text"
              name="address.street"
              placeholder="Street address"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              value={profileFormik.values.address.street}
              onChange={profileFormik.handleChange}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="address.city"
                placeholder="City"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.address.city}
                onChange={profileFormik.handleChange}
              />
              <input
                type="text"
                name="address.state"
                placeholder="State"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.address.state}
                onChange={profileFormik.handleChange}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="address.zipCode"
                placeholder="Zip code"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.address.zipCode}
                onChange={profileFormik.handleChange}
              />
              <input
                type="text"
                name="address.country"
                placeholder="Country"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.address.country}
                onChange={profileFormik.handleChange}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Qualifications</h3>
            <p className="text-xs text-gray-500">
              Enter one qualification or certification per line.
            </p>
            <textarea
              name="qualificationsText"
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              value={profileFormik.values.qualificationsText}
              onChange={profileFormik.handleChange}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Availability</h3>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {daysOfWeek.map((day) => {
                const checked = profileFormik.values.availabilityDays.includes(day);
                return (
                  <label key={day} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={checked}
                      onChange={(event) => {
                        const current = profileFormik.values.availabilityDays;
                        if (event.target.checked) {
                          profileFormik.setFieldValue('availabilityDays', [...current, day]);
                        } else {
                          profileFormik.setFieldValue(
                            'availabilityDays',
                            current.filter((value) => value !== day)
                          );
                        }
                      }}
                    />
                    <span>{day}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  name="availabilityStart"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  value={profileFormik.values.availabilityStart}
                  onChange={profileFormik.handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  name="availabilityEnd"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  value={profileFormik.values.availabilityEnd}
                  onChange={profileFormik.handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
              <input
                type="number"
                name="hourlyRate"
                min={0}
                step="1"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={profileFormik.values.hourlyRate}
                onChange={profileFormik.handleChange}
              />
              {profileFormik.touched.hourlyRate && profileFormik.errors.hourlyRate && (
                <p className="mt-1 text-xs text-red-600">
                  {profileFormik.errors.hourlyRate as string}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              rows={5}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              value={profileFormik.values.bio}
              onChange={profileFormik.handleChange}
            />
            {profileFormik.touched.bio && profileFormik.errors.bio && (
              <p className="mt-1 text-xs text-red-600">{profileFormik.errors.bio}</p>
            )}
          </div>

          {renderMessage(profileMessage)}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileFormik.isSubmitting}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {profileFormik.isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-500">
              Request a one-time OTP to your email, then enter it below with your new password.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestOtp}
            disabled={requestingOtp}
            className="inline-flex items-center rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-60"
          >
            {requestingOtp ? 'Sending…' : 'Send OTP'}
          </button>
        </div>

        {renderMessage(otpMessage)}

        <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">OTP Code</label>
              <input
                type="text"
                name="otp"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={passwordFormik.values.otp}
                onChange={passwordFormik.handleChange}
                disabled={!otpRequested}
              />
              {passwordFormik.touched.otp && passwordFormik.errors.otp && (
                <p className="mt-1 text-xs text-red-600">{passwordFormik.errors.otp}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={passwordFormik.values.newPassword}
                onChange={passwordFormik.handleChange}
                disabled={!otpRequested}
              />
              {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordFormik.errors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                disabled={!otpRequested}
              />
              {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordFormik.errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {renderMessage(passwordMessage)}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!otpRequested || passwordFormik.isSubmitting}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {passwordFormik.isSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default WorkerSettingsPage;

