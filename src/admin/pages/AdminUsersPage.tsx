import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit2, Trash2, X, User, KeyRound } from 'lucide-react';
import { api } from '../../services/api';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.users.getAll(),
        api.users.getRoles(),
      ]);
      if (uRes.success) setUsers(uRes.data);
      if (rRes.success) {
        setRoles(rRes.data.roles);
        if (!form.roleId && rRes.data.roles[0]) {
          setForm(prev => ({ ...prev, roleId: rRes.data.roles[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load users & roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      password: '',
      roleId: roles[0]?.id || '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.users.update(editingUser.id, form);
      } else {
        await api.users.create(form);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save staff user');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove staff access for "${name}"?`)) return;
    try {
      await api.users.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EBE0D7] shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#1E1E24]">Staff Accounts & Role-Based Access</h2>
          <p className="text-xs text-gray-500">
            Control administrative permissions for Super Admins, Store Managers, and Content Editors.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-2xl border border-[#EBE0D7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-gray-100 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Last Login</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Loading staff accounts...</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1E1E24] text-white flex items-center justify-center font-bold text-[10px]">
                        {u.name?.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF0F2] text-[#C24560] border border-[#F8CAD1]">
                        {u.role?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role?.name !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#EBE0D7] shadow-xs space-y-4">
        <h3 className="font-serif text-base text-[#1E1E24] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C24560]" />
          <span>Role Permissions Clearance</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {roles.map(r => (
            <div key={r.id} className="p-4 rounded-xl border border-gray-200 bg-[#FAF7F5] space-y-2">
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>{r.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {r.permissions?.length || 0} perms
                </span>
              </div>
              <p className="text-gray-500 text-[11px]">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#F0E6DE] text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-lg text-gray-900">Add Staff Account</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C24560]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Staff Role *</label>
                <select
                  value={form.roleId}
                  onChange={e => setForm(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C24560] text-white rounded-lg font-semibold hover:bg-[#A3354E]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
