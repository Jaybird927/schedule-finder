'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScheduleBuilder from '@/components/ScheduleBuilder';

type Step = 'info' | 'schedule';

export default function AddPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [school, setSchool] = useState<1 | 2 | null>(null);
  const name = `${firstName.trim()} ${lastInitial.trim().toUpperCase()}`.trim();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastInitial.trim() || !school) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), school }),
      });
      if (!res.ok) throw new Error();
      const user = await res.json();
      setUserId(user.id);
      setStep('schedule');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleScheduleSave(schedule: Partial<Record<number, string>>) {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, schedule }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem('schedule_userId', userId);
      router.push('/');
    } catch {
      setError('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 pt-8 pb-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition">
            ← Back
          </Link>
          <h1 className="text-2xl font-extrabold">
            {step === 'info' ? 'Add Your Schedule' : 'Build Your Schedule'}
          </h1>
        </div>
        {step === 'schedule' && (
          <p className="text-indigo-200 text-sm mt-2 ml-14">
            Drag subjects into each period slot
          </p>
        )}
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {step === 'info' ? (
          <form
            onSubmit={handleInfoSubmit}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6 text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                1
              </span>
              <span className="text-indigo-600 font-semibold">Your Info</span>
              <span className="text-gray-300 mx-1">→</span>
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                2
              </span>
              <span className="text-gray-400">Your Schedule</span>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What&apos;s your name?
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  maxLength={30}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 placeholder-gray-400"
                  required
                  autoFocus
                />
                <input
                  type="text"
                  value={lastInitial}
                  onChange={(e) => setLastInitial(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1))}
                  placeholder="Last initial"
                  maxLength={1}
                  className="w-28 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 placeholder-gray-400 text-center font-bold uppercase"
                  required
                />
              </div>
              {firstName && lastInitial && (
                <p className="mt-2 text-xs text-gray-400">
                  You&apos;ll appear as <span className="font-semibold text-gray-600">{firstName.trim()} {lastInitial.toUpperCase()}</span>
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Which school are you at?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([1, 2] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSchool(s)}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition ${
                      school === s
                        ? s === 1
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    School {s}
                    {school === s && <span className="ml-2">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !school || saving}
              className="w-full py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Setting up...' : 'Next →'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5 text-sm">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                ✓
              </span>
              <span className="text-gray-400 line-through">Your Info</span>
              <span className="text-gray-300 mx-1">→</span>
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                2
              </span>
              <span className="text-indigo-600 font-semibold">Your Schedule</span>
            </div>

            <div className="mb-5 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
              Schedule for{' '}
              <span className="font-bold text-gray-800">{name}</span> ·{' '}
              <span
                className={`font-semibold ${
                  school === 1 ? 'text-indigo-600' : 'text-emerald-600'
                }`}
              >
                School {school}
              </span>
            </div>

            <ScheduleBuilder onSave={handleScheduleSave} saving={saving} />
          </div>
        )}
      </div>
    </main>
  );
}
