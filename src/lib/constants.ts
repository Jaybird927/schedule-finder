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

export const PERIOD_LABELS: Record<number, string> = {
  0: 'Zero Period',
  1: 'Period 1',
  2: 'Period 2',
  3: 'Period 3',
  4: 'Period 4',
  5: 'Period 5',
  6: 'Period 6',
};
