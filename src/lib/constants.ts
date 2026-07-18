export const SUBJECTS = [
  'PE',
  'Social Studies',
  'Math',
  'History',
  'Science',
  'Elective 1',
  'Elective 2',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const MANDATORY_SUBJECTS: string[] = [
  'PE',
  'Social Studies',
  'Math',
  'History',
  'Science',
  'Elective 1',
];

export const SUBJECT_COLORS: Record<string, string> = {
  'PE': 'bg-green-100 text-green-800 border-green-300',
  'Social Studies': 'bg-blue-100 text-blue-800 border-blue-300',
  'Math': 'bg-violet-100 text-violet-800 border-violet-300',
  'History': 'bg-orange-100 text-orange-800 border-orange-300',
  'Science': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Elective 1': 'bg-pink-100 text-pink-800 border-pink-300',
  'Elective 2': 'bg-amber-100 text-amber-800 border-amber-300',
};

export const SCHOOLS = [
  { id: 'PCY', label: 'PCY' },
  { id: 'PCR', label: 'PCR' },
  { id: 'LCE', label: 'LCE' },
  { id: 'new', label: "I'm new" },
] as const;

export type SchoolId = 'PCY' | 'PCR' | 'LCE' | 'new';

export const SCHOOL_COLORS: Record<string, { badge: string; button: string; modal: string }> = {
  PCY: {
    badge: 'bg-red-100 text-red-700',
    button: 'border-red-500 bg-red-50 text-red-700',
    modal: 'from-red-500 to-red-600',
  },
  PCR: {
    badge: 'bg-blue-100 text-blue-700',
    button: 'border-blue-500 bg-blue-50 text-blue-700',
    modal: 'from-blue-500 to-blue-600',
  },
  LCE: {
    badge: 'bg-yellow-100 text-yellow-800',
    button: 'border-yellow-400 bg-yellow-50 text-yellow-700',
    modal: 'from-yellow-400 to-amber-500',
  },
  new: {
    badge: 'bg-gray-100 text-gray-500',
    button: 'border-gray-400 bg-gray-50 text-gray-600',
    modal: 'from-gray-400 to-gray-500',
  },
};

export const PERIOD_LABELS: Record<number, string> = {
  0: 'Zero Period',
  1: 'Period 1',
  2: 'Period 2',
  3: 'Period 3',
  4: 'Period 4',
  5: 'Period 5',
  6: 'Period 6',
};
