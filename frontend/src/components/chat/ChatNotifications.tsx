import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { removeNotification } from '../../features/chat/chatSlice';

const AUTO_DISMISS_MS = 5000;

const ChatNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.chat.notifications);

  useEffect(() => {
    if (notifications.length === 0) {
      return;
    }

    const timers = notifications.map((notification) =>
      window.setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, AUTO_DISMISS_MS)
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [dispatch, notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="w-72 rounded-lg border border-primary-200 bg-white shadow-lg">
          <div className="flex items-start justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{notification.senderName}</p>
              <p className="mt-1 text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(removeNotification(notification.id))}
              className="ml-2 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-700">
            {notification.preview}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatNotifications;


