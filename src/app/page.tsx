'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SUBJECTS, SUBJECT_COLORS, PERIOD_LABELS } from '@/lib/constants';

type ScheduleEntry = { period: number; subject: string };
type UserData = {
  id: string;
  name: string;
  school: number;
  createdAt: string;
  schedule: ScheduleEntry[];
};

function SubjectChip({ subject, small }: { subject: string; small?: boolean }) {
  return (
    <span
      className={`inline-block border rounded-full font-medium ${
        small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${SUBJECT_COLORS[subject]}`}
    >
      {subject}
    </span>
  );
}

function PersonCard({ user, onClick }: { user: UserData; onClick: () => void }) {
  const subjects = user.schedule.map((s) => s.subject);
  const displaySubjects = subjects.slice(0, 4);
  const extra = subjects.length - 4;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all text-left w-full active:scale-95"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{user.name}</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
            user.school === 1
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          S{user.school}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {displaySubjects.map((subject) => (
          <SubjectChip key={subject} subject={subject} small />
        ))}
        {extra > 0 && (
          <span className="text-xs text-gray-400 self-center">+{extra}</span>
        )}
        {subjects.length === 0 && (
          <span className="text-xs text-gray-300 italic">No schedule yet</span>
        )}
      </div>
    </button>
  );
}

function PersonModal({
  user,
  onClose,
  mySchedule,
  mySchool,
}: {
  user: UserData;
  onClose: () => void;
  mySchedule?: ScheduleEntry[];
  mySchool?: number;
}) {
  const sharedPeriods =
    mySchedule && mySchool === user.school
      ? user.schedule
          .filter((theirs) =>
            mySchedule.some(
              (mine) => mine.period === theirs.period && mine.subject === theirs.subject
            )
          )
          .map((s) => s.period)
      : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className={`p-6 ${
            user.school === 1
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          } text-white`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">{user.name}</h2>
              <p className="text-white/70 mt-0.5 text-sm">School {user.school}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-lg font-bold leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
          {sharedPeriods.length > 0 && (
            <div className="mt-3 bg-white/20 rounded-full px-3 py-1 text-xs font-medium inline-block">
              You share {sharedPeriods.length} class
              {sharedPeriods.length !== 1 ? 'es' : ''} with {user.name}!
            </div>
          )}
        </div>

        {/* Schedule list */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Schedule
          </h3>
          {user.schedule.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No schedule added yet.</p>
          ) : (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((period) => {
                const entry = user.schedule.find((s) => s.period === period);
                const isShared = sharedPeriods.includes(period);
                return (
                  <div
                    key={period}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                      isShared ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">
                      {PERIOD_LABELS[period]}
                    </span>
                    {entry ? (
                      <SubjectChip subject={entry.subject} />
                    ) : (
                      <span className="text-xs text-gray-300 italic">N/A</span>
                    )}
                    {isShared && (
                      <span className="text-xs text-green-600 font-semibold ml-auto">
                        You too!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SortOption = 'newest' | 'az' | 'za';

export default function HomePage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const [schoolFilter, setSchoolFilter] = useState<0 | 1 | 2>(0);
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [classmatesOnly, setClassmatesOnly] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('schedule_userId');
    setMyUserId(id);
  }, []);

  const refresh = () => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const myUser = users.find((u) => u.id === myUserId);

  const activeFilterCount =
    (schoolFilter !== 0 ? 1 : 0) + subjectFilters.length + (classmatesOnly ? 1 : 0);

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => u.id !== myUserId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q));
    }

    if (schoolFilter !== 0) {
      result = result.filter((u) => u.school === schoolFilter);
    }

    if (subjectFilters.length > 0) {
      result = result.filter((u) =>
        subjectFilters.every((subj) => u.schedule.some((s) => s.subject === subj))
      );
    }

    if (classmatesOnly && myUser) {
      result = result.filter((u) => {
        if (u.school !== myUser.school) return false;
        return myUser.schedule.some((mine) =>
          u.schedule.some(
            (theirs) => mine.period === theirs.period && mine.subject === theirs.subject
          )
        );
      });
    }

    if (sortBy === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'za') result.sort((a, b) => b.name.localeCompare(a.name));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [users, search, schoolFilter, subjectFilters, sortBy, classmatesOnly, myUser, myUserId]);

  const clearFilters = () => {
    setSchoolFilter(0);
    setSubjectFilters([]);
    setClassmatesOnly(false);
    setSortBy('newest');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 pt-10 pb-14">
        <h1 className="text-3xl font-extrabold tracking-tight">Schedule Finder</h1>
        <p className="mt-1 text-indigo-200 text-sm">See who&apos;s in your classes!</p>

        {myUser ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="bg-white/20 rounded-2xl px-4 py-2 text-sm backdrop-blur">
              Logged in as <span className="font-bold">{myUser.name}</span>{' '}
              <span className="text-white/60">· School {myUser.school}</span>
            </div>
            <Link
              href="/add"
              className="bg-white text-indigo-600 font-semibold px-4 py-2 rounded-full text-sm hover:bg-indigo-50 transition shadow"
            >
              Edit Schedule
            </Link>
          </div>
        ) : (
          <Link
            href="/add"
            className="mt-5 inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-6 py-3 rounded-full hover:bg-indigo-50 transition shadow-lg"
          >
            <span className="text-lg">+</span> Add Your Own Schedule!
          </Link>
        )}
      </div>

      {/* Search + filter bar (floats over header) */}
      <div className="px-4 -mt-6 sticky top-0 z-20 pb-3 pt-0">
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-full shadow-lg flex items-center px-4 gap-2 border border-gray-100">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 py-3 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((f) => !f)}
            className={`relative bg-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold border transition ${
              filtersOpen
                ? 'border-indigo-400 text-indigo-600'
                : 'border-gray-100 text-gray-700 hover:border-gray-200'
            }`}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mx-4 mb-3 p-5 bg-white rounded-2xl shadow-md border border-gray-100">
          {/* School */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              School
            </p>
            <div className="flex gap-2">
              {([0, 1, 2] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSchoolFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    schoolFilter === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s === 0 ? 'All Schools' : `School ${s}`}
                </button>
              ))}
            </div>
          </div>

          {/* Subject filter */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Has Subject
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  onClick={() =>
                    setSubjectFilters((prev) =>
                      prev.includes(subject)
                        ? prev.filter((s) => s !== subject)
                        : [...prev, subject]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    subjectFilters.includes(subject)
                      ? `${SUBJECT_COLORS[subject]} ring-2 ring-offset-1 ring-current`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Sort By
            </p>
            <div className="flex gap-2">
              {(
                [
                  ['newest', 'Newest First'],
                  ['az', 'A → Z'],
                  ['za', 'Z → A'],
                ] as [SortOption, string][]
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setSortBy(v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    sortBy === v
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Classmates filter — only if logged in */}
          {myUser && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Classmates
              </p>
              <button
                onClick={() => setClassmatesOnly((c) => !c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  classmatesOnly
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                My Classmates Only
              </button>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-400 hover:text-red-600 font-medium mt-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-4 mt-1 pb-10">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3 animate-bounce">📋</div>
            <p>Loading schedules...</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
              {search.trim() ? ` matching "${search}"` : ''}
            </p>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-gray-500">No one found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm text-indigo-500 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredUsers.map((user) => (
                  <PersonCard
                    key={user.id}
                    user={user}
                    onClick={() => setSelectedUser(user)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <PersonModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          mySchedule={myUser?.schedule}
          mySchool={myUser?.school}
        />
      )}
    </main>
  );
}
