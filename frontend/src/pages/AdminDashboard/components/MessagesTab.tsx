import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../types';
import axiosInstance from '../../../api/axiosInstance';

interface MessagesTabProps {
  users: User[];
}

const MessagesTab = ({ users }: MessagesTabProps) => {
  const navigate = useNavigate();
  const [messageUserId, setMessageUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageMsg, setMessageMsg] = useState('');

  const handleSendMessage = async () => {
    if (!messageUserId || !messageText.trim()) {
      setMessageMsg('Please select a user and enter a message.');
      return;
    }
    try {
      setMessageMsg('');
      // Create or get conversation with user
      const convRes = await axiosInstance.post('/chat/conversations', { userId: messageUserId });
      const conversationId = convRes.data.data.conversation._id;

      // Send message
      await axiosInstance.post('/chat/messages', {
        conversationId,
        content: messageText.trim(),
      });

      setMessageText('');
      setMessageUserId('');
      setMessageMsg('Message sent successfully!');
      navigate('/admindashboard/messages', { state: { conversationId } });
    } catch (err: any) {
      setMessageMsg(err?.response?.data?.message || 'Failed to send message.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold">Send Message to User</h3>
      {messageMsg && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          {messageMsg}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
          <select
            value={messageUserId}
            onChange={(e) => setMessageUserId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Choose a user...</option>
            {users.map((u) => (
              <option key={(u as any)._id || u.id} value={(u as any)._id || u.id}>
                {u.firstName} {u.lastName} ({u.email}) - {u.role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Enter your message..."
            rows={4}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleSendMessage}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
        >
          Send Message
        </button>
      </div>
      <div className="mt-6 pt-6 border-t">
        <p className="text-sm text-gray-600">
          You can also visit the{' '}
                    <button
                        onClick={() => navigate('/admindashboard/messages')}
                        className="text-primary-600 hover:underline"
                      >
                        Chat page
                      </button>{' '}
          to view all conversations and send messages.
        </p>
      </div>
    </div>
  );
};

export default MessagesTab;

