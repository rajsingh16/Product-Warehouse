import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, KeyRound, Pencil } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import { profileService } from '../services/profileService';
import { useToast } from '../context/ToastContext';
import type { ProfileUser } from '../types';

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function ReadOnly({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 break-words">{value || '—'}</dd>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function Profile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userName: '', mobile: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    profileService
      .getProfile()
      .then(setProfile)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Could not load profile.', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = () => {
    if (!profile) return;
    setForm({ userName: profile.user_name, mobile: profile.mobile ?? '', email: profile.email ?? '' });
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    if (!form.userName.trim()) return setError('Name is required.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    setSaving(true);
    try {
      setProfile(await profileService.updateProfile(form));
      setEditing(false);
      showToast('Profile updated successfully.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 min-w-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <nav aria-label="Breadcrumb" className="mt-1 flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-gray-900">Profile</span>
          </nav>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading profile...</p>}

        {profile && (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
                {initials(profile.user_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-gray-900">{profile.user_name}</p>
                <p className="text-sm text-gray-600">{profile.emp_id}</p>
                <p className="text-sm text-gray-500">{profile.user_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Personal information */}
              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
                  {!editing && (
                    <Button variant="secondary" onClick={startEdit}>
                      <Pencil size={14} className="mr-1.5 inline" />
                      Edit
                    </Button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                      <input className={inputCls} value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mobile Number</label>
                      <input className={inputCls} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ReadOnly label="Employee ID" value={profile.emp_id} />
                      <ReadOnly label="Designation" value={profile.designation} />
                      <ReadOnly label="Date of Joining" value={fmtDate(profile.date_of_joining)} />
                    </dl>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                      <Button variant="primary" onClick={save} disabled={saving}>
                        {saving ? 'Saving...' : 'Save changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReadOnly label="Full Name" value={profile.user_name} />
                    <ReadOnly label="Employee ID" value={profile.emp_id} />
                    <ReadOnly label="Designation" value={profile.designation} />
                    <ReadOnly label="Mobile Number" value={profile.mobile} />
                    <ReadOnly label="Email" value={profile.email} />
                    <ReadOnly label="Date of Joining" value={fmtDate(profile.date_of_joining)} />
                  </dl>
                )}
              </section>

              <div className="space-y-6">
                {/* Account information */}
                <section className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="mb-4 text-base font-semibold text-gray-900">Account Information</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReadOnly label="Employee ID" value={profile.emp_id} />
                    <ReadOnly label="Account Type" value={profile.user_type} />
                    <ReadOnly label="Account Status" value={<StatusBadge status={profile.status} />} />
                    <ReadOnly label="Date of Joining" value={fmtDate(profile.date_of_joining)} />
                  </dl>
                  <p className="mt-4 text-xs text-gray-500">
                    Roles and permissions are managed by an administrator in User Role Management.
                  </p>
                </section>

                {/* Security */}
                <section className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="mb-1 text-base font-semibold text-gray-900">Security</h2>
                  <p className="text-sm text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">Last changed: not available</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Keep your account secure by regularly updating your password.
                  </p>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => setPwOpen(true)}>
                      <KeyRound size={14} className="mr-1.5 inline" />
                      Change Password
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      <ChangePasswordModal isOpen={pwOpen} onClose={() => setPwOpen(false)} />
    </Layout>
  );
}