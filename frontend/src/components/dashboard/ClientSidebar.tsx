import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadTotal } = useAppSelector((state) => state.chat);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const profilePictureSrc = user?.profilePicture
    ? user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${apiBaseUrl}${user.profilePicture}`
    : null;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { path: '/clientdashboard', label: 'Overview', icon: '📊' },
    { path: '/clientdashboard/jobs', label: 'Jobs', icon: '🗂️' },
    { path: '/clientdashboard/jobs/post', label: 'Post Job', icon: '📝' },
    { path: '/clientdashboard/workers', label: 'Workers', icon: '🧑‍⚕️' },
    { path: '/clientdashboard/calendar', label: 'Calendar', icon: '📅' },
    { path: '/clientdashboard/account', label: 'Profile', icon: '👤' },
    { path: '/clientdashboard/settings', label: 'Settings', icon: '⚙️' },
    { path: '/clientdashboard/reviews', label: 'Reviews', icon: '⭐' },
    {
      path: '/clientdashboard/chat',
      label: 'Messages',
      icon: '💬',
      badge: unreadTotal,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/clientdashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b flex-shrink-0">
        <h1 className="text-xl font-bold text-primary-600">Care Service</h1>
        <p className="text-sm text-gray-500 mt-1">Client Portal</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
              {profilePictureSrc ? (
                <img
                  src={profilePictureSrc}
                  alt={user?.firstName || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span className="text-primary-600 font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto inline-flex min-w-[1.5rem] justify-center rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ClientSidebar;

