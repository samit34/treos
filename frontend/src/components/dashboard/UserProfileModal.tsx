import { User } from '../../types';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

const UserProfileModal = ({ user, onClose }: UserProfileModalProps) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const profilePictureSrc = user.profilePicture
    ? user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${apiBaseUrl}${user.profilePicture}`
    : null;

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">User Profile</p>
            <h2 className="text-2xl font-semibold text-gray-900">{fullName || user.email}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-600">
              {profilePictureSrc ? (
                <img
                  src={profilePictureSrc}
                  alt={fullName || user.email}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">{fullName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-base font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-base text-gray-900">{user.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {user.address && (
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Address</h3>
              <p className="text-sm text-gray-600">
                {user.address.street && <>{user.address.street}, </>}
                {user.address.city}, {user.address.state} {user.address.zipCode}
              </p>
              <p className="text-sm text-gray-500">{user.address.country}</p>
            </section>
          )}

          {user.bio && (
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">About</h3>
              <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">{user.bio}</p>
            </section>
          )}

          {user.supportNeeds && user.supportNeeds.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Support Needs</h3>
              <div className="flex flex-wrap gap-2">
                {user.supportNeeds.map((need) => (
                  <span
                    key={need}
                    className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </section>
          )}

          {user.rating !== undefined && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-base font-semibold text-yellow-600">
                  {user.rating?.toFixed ? user.rating.toFixed(1) : user.rating}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-base font-semibold text-gray-900">{user.totalReviews ?? 0}</p>
              </div>
            </section>
          )}

          {user.createdAt && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-base text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              {user.updatedAt && (
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-base text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex justify-end border-t px-6 py-4">
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

export default UserProfileModal;
