'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Building2,
  Ticket,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import UserEditModal from '@/components/admin/UserEditModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveModal = async (payload: { updates: Record<string, any>; password?: string }) => {
    if (!selectedUser) return;
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedUser.id,
        updates: payload.updates,
        password: payload.password,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    await fetchUsers();
  };

  const handleDeleteUser = async (user: any) => {
    const confirmName = prompt(
      `CAUTION: This will permanently delete the account for ${user.email} from both Supabase Auth and database profiles.\n\nType DELETE to confirm:`
    );
    if (confirmName !== 'DELETE') return;

    setActionLoading(`del-${user.id}`);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user');
      }
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (activeRoleTab !== 'all' && u.role !== activeRoleTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.handle?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalUsers = users.length;
  const organizersCount = users.filter((u) => u.role === 'organizer').length;
  const guestsCount = users.filter((u) => u.role === 'guest').length;
  const curatorsCount = users.filter((u) => u.role === 'curator').length;
  const superAdminsCount = users.filter((u) => u.role === 'super_admin').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">
            Accounts & Identity Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            View, edit credentials, adjust roles, or permanently delete user accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{totalUsers}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Registered users</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Organizers (Hosts)</span>
            <Building2 className="w-4 h-4 text-[#E8621A]" />
          </div>
          <div className="text-2xl font-black text-[#FF8442] font-mono mt-2">{organizersCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Event creators</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Curators & Staff</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">{curatorsCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Telegram bot curators</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Super Admins</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-2">{superAdminsCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Full privileged access</div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F19] p-2.5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveRoleTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeRoleTab === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({totalUsers})
          </button>
          <button
            onClick={() => setActiveRoleTab('organizer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeRoleTab === 'organizer'
                ? 'bg-[#E8621A]/20 text-[#FF8442] border border-[#E8621A]/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Organizers ({organizersCount})
          </button>
          <button
            onClick={() => setActiveRoleTab('guest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeRoleTab === 'guest'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Guests ({guestsCount})
          </button>
          <button
            onClick={() => setActiveRoleTab('curator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeRoleTab === 'curator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Curators ({curatorsCount})
          </button>
          <button
            onClick={() => setActiveRoleTab('super_admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeRoleTab === 'super_admin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Admins ({superAdminsCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, handle..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8621A]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500 font-mono">
            Loading user accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            No accounts found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User Account</th>
                  <th className="py-3.5 px-4 font-semibold">Role & Access</th>
                  <th className="py-3.5 px-4 font-semibold">Hosted Events</th>
                  <th className="py-3.5 px-4 font-semibold">RSVPs</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition">
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E8621A]/30 to-purple-500/30 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                          {user.logo_url ? (
                            <img src={user.logo_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div className="max-w-[220px]">
                          <div className="font-bold text-white truncate">{user.name || 'Unnamed User'}</div>
                          <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{user.email}</span>
                          </div>
                          {user.handle && (
                            <div className="text-[10px] text-zinc-500 font-mono">@{user.handle}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          user.role === 'super_admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : user.role === 'curator'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : user.role === 'organizer'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Hosted Events */}
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {user.hosted_events_count || 0}
                    </td>

                    {/* RSVPs */}
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {user.rsvps_count || 0}
                    </td>

                    {/* Onboarded */}
                    <td className="py-3 px-4">
                      {user.onboarded ? (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Onboarded</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          title="Edit user account & role"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF8442] hover:bg-zinc-800 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoading === `del-${user.id}`}
                          title="Delete account permanently"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}
