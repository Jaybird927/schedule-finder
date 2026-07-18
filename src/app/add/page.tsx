'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ScheduleBuilder from '@/components/ScheduleBuilder';
import { SUBJECT_COLORS, PERIOD_LABELS, SCHOOLS, SCHOOL_COLORS, SchoolId } from '@/lib/constants';

type Step = 'info' | 'schedule' | 'confirm';

function AddPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';

  const [step, setStep] = useState<Step>('info');
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [school, setSchool] = useState<SchoolId | null>(null);
  const [currentSchool, setCurrentSchool] = useState<1 | 2 | null>(null);
  const name = `${firstName.trim()} ${lastInitial.trim().toUpperCase()}`.trim();
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<Partial<Record<number, string>>>({});
  const [existingSchedule, setExistingSchedule] = useState<Partial<Record<number, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  // If editing, load existing user + schedule from localStorage then API
  useEffect(() => {
    if (!isEditing) return;
    const id = localStorage.getItem('schedule_userId');
    if (!id) { router.push('/add'); return; }

    fetch('/api/users')
      .then(r => r.json())
      .then((users: { id: string; name: string; school: string; currentSchool: number; schedule: { period: number; subject: string }[] }[]) => {
        const me = users.find(u => u.id === id);
        if (!me) { router.push('/add'); return; }

        const parts = me.name.split(' ');
        setFirstName(parts.slice(0, -1).join(' ') || me.name);
        setLastInitial(parts[parts.length - 1] ?? '');
        setSchool(me.school as SchoolId);
        setCurrentSchool(me.currentSchool as 1 | 2);
        setUserId(me.id);

        const sched: Partial<Record<number, string>> = {};
        me.schedule.forEach(e => { sched[e.period] = e.subject; });
        setExistingSchedule(sched);

        setStep('schedule');
        setLoadingEdit(false);
      })
      .catch(() => { router.push('/add'); });
  }, [isEditing, router]);

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastInitial.trim() || !school || !currentSchool) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, school, currentSchool }),
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

  function handleScheduleReady(schedule: Partial<Record<number, string>>) {
    setPendingSchedule(schedule);
    setStep('confirm');
  }

  async function handleConfirm() {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, schedule: pendingSchedule }),
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

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-5 text-sm flex-wrap">
      {!isEditing && (
        <>
          <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${step === 'info' ? 'bg-indigo-600 text-white' : 'bg-green-100 text-green-600'}`}>
            {step === 'info' ? '1' : '✓'}
          </span>
          <span className={step === 'info' ? 'text-indigo-600 font-semibold' : 'text-gray-400 line-through'}>Your Info</span>
          <span className="text-gray-300 mx-1">→</span>
        </>
      )}
      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${step === 'schedule' ? 'bg-indigo-600 text-white' : step === 'confirm' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
        {step === 'confirm' ? '✓' : isEditing ? '1' : '2'}
      </span>
      <span className={step === 'schedule' ? 'text-indigo-600 font-semibold' : step === 'confirm' ? 'text-gray-400 line-through' : 'text-gray-400'}>
        {isEditing ? 'Edit Schedule' : 'Your Schedule'}
      </span>
      <span className="text-gray-300 mx-1">→</span>
      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${step === 'confirm' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
        {isEditing ? '2' : '3'}
      </span>
      <span className={step === 'confirm' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}>Confirm</span>
    </div>
  );

  if (loadingEdit) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading your schedule...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 pt-8 pb-10">
        <div className="flex items-center gap-3">
          {step === 'info' && <Link href="/" className="text-white/60 hover:text-white text-sm transition">← Back</Link>}
          {step === 'schedule' && (
            <button
              onClick={() => isEditing ? router.push('/') : setStep('info')}
              className="text-white/60 hover:text-white text-sm transition"
            >
              ← Back
            </button>
          )}
          {step === 'confirm' && (
            <button onClick={() => setStep('schedule')} className="text-white/60 hover:text-white text-sm transition">
              ← Back
            </button>
          )}
          <h1 className="text-2xl font-extrabold">
            {step === 'info' && 'Add Your Schedule'}
            {step === 'schedule' && (isEditing ? 'Edit Your Schedule' : 'Build Your Schedule')}
            {step === 'confirm' && 'Does this look right?'}
          </h1>
        </div>
        {step === 'schedule' && <p className="text-indigo-200 text-sm mt-2 ml-14">Drag subjects into each period slot</p>}
        {step === 'confirm' && <p className="text-indigo-200 text-sm mt-2 ml-14">Double-check your schedule before saving</p>}
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        {/* Step 1 — Info */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {stepIndicator}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">What&apos;s your name?</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  maxLength={30}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 placeholder-gray-400"
                  required autoFocus
                />
                <input
                  type="text"
                  value={lastInitial}
                  onChange={e => setLastInitial(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1))}
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
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Which old school did you go to?</label>
              <div className="grid grid-cols-2 gap-3">
                {SCHOOLS.map(s => (
                  <button key={s.id} type="button" onClick={() => setSchool(s.id as SchoolId)}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition ${
                      school === s.id
                        ? SCHOOL_COLORS[s.id].button
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s.label} {school === s.id && '✓'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Which school are you in now?</label>
              <div className="grid grid-cols-2 gap-3">
                {([1, 2] as const).map(s => (
                  <button key={s} type="button" onClick={() => setCurrentSchool(s)}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition ${
                      currentSchool === s
                        ? s === 1 ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    School {s} {currentSchool === s && '✓'}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!firstName.trim() || !lastInitial.trim() || !school || !currentSchool || saving}
              className="w-full py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
              {saving ? 'Setting up...' : 'Next →'}
            </button>
          </form>
        )}

        {/* Step 2 — Schedule builder */}
        {step === 'schedule' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {stepIndicator}
            <div className="mb-5 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
              Schedule for <span className="font-bold text-gray-800">{name}</span>{' '}
              · <span className={`font-semibold inline-block px-2 py-0.5 rounded-full text-xs ${school ? SCHOOL_COLORS[school].badge : ''}`}>{school === 'new' ? "I'm new" : school}</span>
            </div>
            <ScheduleBuilder
              onSave={handleScheduleReady}
              saving={false}
              initialSchedule={existingSchedule}
            />
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 'confirm' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {stepIndicator}
            <div className="mb-5 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
              <span className="font-bold text-gray-800">{name}</span>{' '}
              · <span className={`font-semibold inline-block px-2 py-0.5 rounded-full text-xs ${school ? SCHOOL_COLORS[school].badge : ''}`}>{school === 'new' ? "I'm new" : school}</span>
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Schedule</h3>
            <div className="space-y-2 mb-6">
              {[0, 1, 2, 3, 4, 5, 6].map(period => {
                const subject = pendingSchedule[period];
                return (
                  <div key={period} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
                    <span className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">{PERIOD_LABELS[period]}</span>
                    {subject
                      ? <span className={`inline-block border rounded-full px-3 py-1 text-sm font-medium ${SUBJECT_COLORS[subject]}`}>{subject}</span>
                      : <span className="text-xs text-gray-300 italic">N/A</span>
                    }
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirm} disabled={saving}
                className="w-full py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition">
                {saving ? 'Saving...' : 'Yes, this is correct!'}
              </button>
              <button onClick={() => setStep('schedule')} disabled={saving}
                className="w-full py-3 rounded-full font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition">
                Go back and edit
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AddPage() {
  return (
    <Suspense>
      <AddPageInner />
    </Suspense>
  );
}
