'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SUBJECT_COLORS, PERIOD_LABELS } from '@/lib/constants';

type ScheduleEntry = { period: number; subject: string };
type UserData = {
  id: string;
  name: string;
  school: number;
  createdAt: string;
  schedule: ScheduleEntry[];
};

function SubjectChip({ subject }: { subject: string }) {
  return (
    <span className={`inline-block border rounded-full px-2 py-0.5 text-xs font-medium ${SUBJECT_COLORS[subject]}`}>
      {subject}
    </span>
  );
}

function ScheduleRow({ user, onDelete }: { user: UserData; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    onDelete();
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition">
        <button onClick={() => setExpanded(e => !e)} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <span className="text-lg">{expanded ? '▾' : '▸'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{user.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.school === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                School {user.school}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {user.schedule.length} period{user.schedule.length !== 1 ? 's' : ''} · Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          onBlur={() => setConfirming(false)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            confirming
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-500 hover:bg-red-100'
          } disabled:opacity-40`}
        >
          {deleting ? 'Deleting...' : confirming ? 'Confirm?' : 'Delete'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map(period => {
              const entry = user.schedule.find(s => s.period === period);
              return (
                <div key={period} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-400 w-24 flex-shrink-0">{PERIOD_LABELS[period]}</span>
                  {entry
                    ? <SubjectChip subject={entry.subject} />
                    : <span className="text-xs text-gray-300 italic">N/A</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === 'true') {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); });
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem('admin_authed', 'true');
      setAuthed(true);
    } else {
      setAuthError('Wrong password.');
    }
    setAuthLoading(false);
  }

  function logout() {
    sessionStorage.removeItem('admin_authed');
    setAuthed(false);
    setPassword('');
  }

  function removeUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Schedule Finder</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
              autoFocus
            />
            {authError && <p className="text-red-500 text-sm mb-3">{authError}</p>}
            <button
              type="submit"
              disabled={!password || authLoading}
              className="w-full py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition"
            >
              {authLoading ? 'Checking...' : 'Log In'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to app</Link>
          </div>
        </div>
      </main>
    );
  }

  const filtered = users
    .filter(u => schoolFilter === 0 || u.school === schoolFilter)
    .filter(u => !search.trim() || u.name.toLowerCase().includes(search.toLowerCase()));

  const school1Count = users.filter(u => u.school === 1).length;
  const school2Count = users.filter(u => u.school === 2).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 pt-8 pb-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-0.5">Schedule Finder</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-white text-sm transition">View App</Link>
            <button onClick={logout} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition">
              Log Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 max-w-3xl mx-auto grid grid-cols-3 gap-3">
          {[
            { label: 'Total Students', value: users.length },
            { label: 'School 1', value: school1Count },
            { label: 'School 2', value: school2Count },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-extrabold">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-5 max-w-3xl mx-auto">
        {/* Search + filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-white rounded-full shadow-md flex items-center px-4 gap-2 border border-gray-100">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 py-3 bg-transparent focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-1 bg-white rounded-full shadow-md px-2 border border-gray-100 items-center">
            {([0, 1, 2] as const).map(s => (
              <button
                key={s}
                onClick={() => setSchoolFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${schoolFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {s === 0 ? 'All' : `S${s}`}
              </button>
            ))}
          </div>
        </div>

        {/* User list */}
        <p className="text-xs text-gray-400 mb-3">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No students found.</div>
        ) : (
          <div className="flex flex-col gap-2 pb-10">
            {filtered.map(user => (
              <ScheduleRow key={user.id} user={user} onDelete={() => removeUser(user.id)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
