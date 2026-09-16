export type CourseId = 'ACC' | 'ECO' | 'PHI' | 'LIT' | 'DAT';
export type MaterialKind =
  | 'Required purchases'
  | 'Optional purchases'
  | 'Already online'
  | 'Platform access fees'
  | 'Needs confirmation';
export interface Material {
  id: string;
  title: string;
  kind: MaterialKind;
  location: string;
  note: string;
  url?: string;
}
export interface Meeting {
  days: number[];
  start: string;
  end: string;
  room: string;
}
export interface Course {
  id: CourseId;
  code: string;
  name: string;
  instructor: string;
  platform: string;
  color: string;
  meetings: Meeting[];
  grades: { label: string; weight: number }[];
  late: { text: string; maximumDays: number; penalty: number };
  materials: Material[];
  sourceId: string;
}
export type AssignmentType = 'Homework' | 'Reading' | 'Essay' | 'Quiz' | 'Project';
export interface Assignment {
  id: string;
  courseId: CourseId;
  title: string;
  type: AssignmentType;
  due: string | null;
  minutes: number;
  weight?: number;
  platform: string;
  sourceId: string;
  notes: string;
}
export const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Closed'] as const;
export type Stage = (typeof stages)[number];
export interface Application {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  applied: string;
  nextAction: string;
  followUp: string | null;
  contact: string;
  notes: string;
  sourceId: string;
  interview?: string;
}
export interface Source {
  id: string;
  name: string;
  type: string;
  area: string;
  updated: string;
  coverage: string;
  status: 'Current' | 'Needs review';
  notes: string;
}
export interface DemoState {
  version: 1;
  completed: string[];
  applications: Application[];
}
export interface AnswerItem {
  title: string;
  detail: string;
  action?: { kind: 'assignment' | 'course' | 'application'; id: string };
}
export interface AnswerSection {
  title: string;
  items: AnswerItem[];
}
export interface Answer {
  title: string;
  kind: 'Records' | 'Recommendation' | 'Missing information';
  sections: AnswerSection[];
  sourceIds: string[];
  note?: string;
}
export type Page =
  'Today' | 'Assignments' | 'Schedule' | 'Courses' | 'Recruiting' | 'Ask' | 'Sources';
