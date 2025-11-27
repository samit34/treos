import { useMemo, useState } from 'react';
import { User } from '../../../types';
import { adminApi } from '../../../api/adminApi';

interface UsersTabProps {
  users: User[];
  onUsersUpdate: (users: User[]) => void;
}

const UsersTab = ({ users, onUsersUpdate }: UsersTabProps) => {
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'client' | 'worker'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userActionMsg, setUserActionMsg] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const roleOk = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
      const q = userSearch.trim().toLowerCase();
      const matches =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q);
      return roleOk && matches;
    });
  }, [users, userRoleFilter, userSearch]);

  const handleBlockToggle = async (u: User & { _id?: string; id?: string; isBlocked?: boolean }) => {
    try {
      setUserActionMsg('');
      const userId = (u as any)._id || u.id;
      const updated = u.isBlocked
        ? await adminApi.unblockUser(userId)
        : await adminApi.blockUser(userId);
      const updatedUsers = users.map((x) =>
        ((x as any)._id || x.id) === userId ? { ...x, isBlocked: updated.isBlocked } as any : x
      );
      onUsersUpdate(updatedUsers);
      setUserActionMsg(`User ${u.email} ${u.isBlocked ? 'unblocked' : 'blocked'} successfully.`);
    } catch (err: any) {
      setUserActionMsg(err?.response?.data?.message || 'Failed to update user.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value as any)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="client">Clients</option>
          <option value="worker">Workers</option>
        </select>
        <input
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search name or email"
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
      </div>
      {userActionMsg && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          {userActionMsg}
        </div>
      )}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {filteredUsers.map((u) => (
          <div key={(u as any)._id || u.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">
                {u.firstName} {u.lastName}{' '}
                <span className="text-xs text-gray-500">({u.role})</span>
              </div>
              <div className="text-sm text-gray-500">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  (u as any).isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {(u as any).isBlocked ? 'Blocked' : 'Active'}
              </span>
              <button
                onClick={() => handleBlockToggle(u as any)}
                className="border rounded px-3 py-1 text-xs hover:bg-gray-50"
              >
                {(u as any).isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersTab;

