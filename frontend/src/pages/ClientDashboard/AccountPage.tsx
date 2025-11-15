import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

const AccountPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  if (user?.role !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
    []
  );

  const profilePictureSrc = useMemo(() => {
    if (!user?.profilePicture) return null;
    if (user.profilePicture.startsWith('http')) return user.profilePicture;
    return `${apiBaseUrl}${user.profilePicture}`;
  }, [user?.profilePicture, apiBaseUrl]);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary-100 text-2xl font-semibold text-primary-600 flex items-center justify-center">
            {profilePictureSrc ? (
              <img
                src={profilePictureSrc}
                alt={fullName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Profile</h1>
            <p className="text-sm text-gray-500">
              Review the information associated with your client account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/settings')}
          className="inline-flex items-center justify-center rounded-md border border-primary-200 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
        >
          Manage Settings
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Full Name</dt>
              <dd className="text-gray-900">{fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Email</dt>
              <dd className="text-gray-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Phone</dt>
              <dd className="text-gray-900">{user?.phone || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Date of Birth</dt>
              <dd className="text-gray-900">
                {user?.dateOfBirth
                  ? new Date(user.dateOfBirth).toLocaleDateString()
                  : 'Not provided'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Member Since</dt>
              <dd className="text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Address</h2>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Street</dt>
              <dd className="text-gray-900">{user?.address?.street || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">City</dt>
              <dd className="text-gray-900">{user?.address?.city || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">State</dt>
              <dd className="text-gray-900">{user?.address?.state || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Zip Code</dt>
              <dd className="text-gray-900">{user?.address?.zipCode || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Country</dt>
              <dd className="text-gray-900">{user?.address?.country || 'Not provided'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Support Needs</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {user?.supportNeeds && user.supportNeeds.length > 0 ? (
            user.supportNeeds.map((need) => (
              <span
                key={need}
                className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
              >
                {need}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500">No support needs added yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AccountPage;

