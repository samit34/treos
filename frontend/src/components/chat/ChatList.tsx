import { Conversation } from '../../types';

interface ChatListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
  onlineUsers?: string[];
  unreadCounts?: Record<string, number>;
  onStartConversation?: (userId: string) => void;
}

const ChatList = ({
  conversations,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  onlineUsers = [],
  unreadCounts = {},
  onStartConversation,
}: ChatListProps) => {
  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants.find((participant) => {
      const participantId =
        participant.id ??
        (participant as unknown as { _id?: string })?._id ??
        (participant as unknown as { id?: string })?.id;
      return participantId !== currentUserId;
    });
  };

  const hasConversations = conversations.length > 0;

  return (
    <div className="bg-white border-r h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Messages</h2>
      </div>
      <div className="divide-y">
        {!hasConversations ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
            {onStartConversation && (
              <p className="mt-2 text-xs">
                Start chatting with an associated client or worker from their profile or job page.
              </p>
            )}
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherUser(conversation);
            const otherUserId =
              otherUser?.id ??
              (otherUser as unknown as { _id?: string })?._id ??
              (otherUser as unknown as { id?: string })?.id;
            const isOnline = otherUserId ? onlineUsers.includes(otherUserId) : false;
            const unreadCount = unreadCounts[conversation._id] ?? 0;
            const avatarInitial =
              otherUser?.firstName?.[0] ??
              otherUser?.lastName?.[0] ??
              (otherUser?.email?.[0] ? otherUser.email[0].toUpperCase() : 'U');

            return (
              <button
                key={conversation._id}
                type="button"
                onClick={() => onSelectConversation(conversation._id)}
                className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-gray-50 focus:outline-none ${
                  selectedConversationId === conversation._id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary-200">
                    {otherUser?.profilePicture ? (
                      <img
                        src={otherUser.profilePicture}
                        alt={otherUser.firstName}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-primary-600">{avatarInitial}</span>
                    )}
                    {otherUserId && (
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                        aria-label={isOnline ? 'Online' : 'Offline'}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {otherUser?.firstName} {otherUser?.lastName}
                      </p>
                      {conversation.lastMessageAt && (
                        <span className="ml-2 whitespace-nowrap text-xs text-gray-400">
                          {new Date(conversation.lastMessageAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                        {conversation.lastMessage?.content ?? 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-2 text-xs font-semibold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;

