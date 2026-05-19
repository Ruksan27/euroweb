import React, { useState, useEffect } from 'react';
import { LucideUsers, LucideTrash2, LucideEdit, LucideLoader2, LucideSearch, LucideSave, LucideX } from 'lucide-react';
import toast from 'react-hot-toast';
import { API } from '../config/api';

function UserEditModal({ user, token, onClose, onUpdated }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API.admin}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, email, password })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        toast.success('User updated successfully');
        onUpdated(updatedUser);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update user');
      }
    } catch {
      toast.error('Network error updating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <LucideX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">New Password (Optional)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <LucideLoader2 size={18} className="animate-spin" /> : <LucideSave size={18} />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API.admin}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        toast.error('Session expired');
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch {
      toast.error('Network error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user AND all their CVs? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API.admin}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
        toast.success('User and associated CVs deleted');
      } else {
        toast.error('Failed to delete user');
      }
    } catch {
      toast.error('Network error deleting user');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <LucideUsers className="text-indigo-400" /> Manage Users
        </h2>
        <div className="relative w-full sm:w-96">
          <LucideSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <LucideLoader2 size={36} className="animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
          <LucideUsers size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No users found</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm bg-black/20">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(user => (
                  <tr key={user._id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center">
                          {user.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-white font-medium">{user.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingUser(user)} className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition" title="Edit User">
                          <LucideEdit size={16} />
                        </button>
                        <button onClick={() => handleDelete(user._id)} disabled={deletingId === user._id} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50" title="Delete User">
                          {deletingId === user._id ? <LucideLoader2 size={16} className="animate-spin" /> : <LucideTrash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          token={token}
          onClose={() => setEditingUser(null)}
          onUpdated={(updated) => {
            setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
