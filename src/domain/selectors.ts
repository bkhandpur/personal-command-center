import { assignments, courses, DEMO_NOW, SEMESTER, sources } from '../fixtures/semester';
import type { Application, Assignment, CourseId, DemoState, MaterialKind } from './types';
export const DAY = 86_400_000;
export const now = () => new Date(DEMO_NOW);
export const dateKey = (date: string | Date) =>
  (typeof date === 'string' ? date : date.toISOString()).slice(0, 10);
export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
export function weekStart(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return addDays(d, -((d.getUTCDay() + 6) % 7));
}
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
) => new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(new Date(date));
export const time = (date: string | Date) =>
  formatDate(date, { hour: 'numeric', minute: '2-digit' });
export const courseById = (id: string) => courses.find((c) => c.id === id)!;
export function status(a: Assignment, state: DemoState) {
  return state.completed.includes(a.id)
    ? 'Completed'
    : !a.due
      ? 'Undated'
      : a.due < DEMO_NOW
        ? 'Overdue'
        : dateKey(a.due) === dateKey(DEMO_NOW)
          ? 'Due today'
          : 'Upcoming';
}
export function dueLabel(due: string | null) {
  if (!due) return 'Date unconfirmed';
  const day = dateKey(due);
  return `${day === dateKey(DEMO_NOW) ? 'Today' : formatDate(due)} · ${time(due)}`;
}
export interface Filters {
  search: string;
  course: string;
  type: string;
  status: string;
  from: string;
  to: string;
  sort: string;
}
export const emptyFilters: Filters = {
  search: '',
  course: 'All',
  type: 'All',
  status: 'All',
  from: '',
  to: '',
  sort: 'due',
};
export function filterAssignments(state: DemoState, f: Filters) {
  return assignments
    .filter(
      (a) =>
        (!f.search ||
          `${a.title} ${courseById(a.courseId).name} ${a.platform}`
            .toLowerCase()
            .includes(f.search.toLowerCase())) &&
        (f.course === 'All' || a.courseId === f.course) &&
        (f.type === 'All' || a.type === f.type) &&
        (f.status === 'All' || status(a, state) === f.status) &&
        (!f.from || (!!a.due && dateKey(a.due) >= f.from)) &&
        (!f.to || (!!a.due && dateKey(a.due) <= f.to)),
    )
    .sort((a, b) =>
      f.sort === 'title'
        ? a.title.localeCompare(b.title)
        : f.sort === 'weight'
          ? (b.weight ?? -1) - (a.weight ?? -1)
          : f.sort === 'effort'
            ? a.minutes - b.minutes
            : f.sort === 'course'
              ? a.courseId.localeCompare(b.courseId)
              : (a.due ?? '9999').localeCompare(b.due ?? '9999'),
    );
}
export const openAssignments = (state: DemoState) =>
  assignments.filter((a) => !state.completed.includes(a.id));
export function priorityScore(a: Assignment) {
  if (!a.due) return -100;
  const hours = (new Date(a.due).getTime() - now().getTime()) / 3_600_000;
  return (hours < 0 ? 120 : Math.max(0, 100 - hours * 1.3)) + (a.weight ?? 0) * 2 - a.minutes / 20;
}
export const prioritized = (state: DemoState, minutes?: number) =>
  openAssignments(state)
    .filter((a) => minutes === undefined || a.minutes <= minutes)
    .sort((a, b) => priorityScore(b) - priorityScore(a));
export const dueThisWeek = (state: DemoState) =>
  openAssignments(state)
    .filter(
      (a) =>
        a.due &&
        a.due >= weekStart(now()).toISOString() &&
        a.due < addDays(weekStart(now()), 7).toISOString(),
    )
    .sort((a, b) => a.due!.localeCompare(b.due!));
export const followUps = (state: DemoState) =>
  state.applications
    .filter((a) => a.stage !== 'Closed' && a.followUp && a.followUp <= dateKey(DEMO_NOW))
    .sort((a, b) => a.followUp!.localeCompare(b.followUp!));
export const nextInterview = (state: DemoState) =>
  state.applications
    .filter((a) => a.stage === 'Interview' && a.interview && a.interview >= DEMO_NOW)
    .sort((a, b) => a.interview!.localeCompare(b.interview!))[0];
export const materialKinds: MaterialKind[] = [
  'Required purchases',
  'Optional purchases',
  'Already online',
  'Platform access fees',
  'Needs confirmation',
];
export const categorizedMaterials = (courseId?: CourseId) =>
  materialKinds.map((kind) => ({
    kind,
    items: courses
      .filter((c) => !courseId || c.id === courseId)
      .flatMap((c) => c.materials.filter((m) => m.kind === kind).map((m) => ({ ...m, course: c }))),
  }));
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  kind: 'Class' | 'Deadline' | 'Interview' | 'Follow-up';
  detail: string;
  courseId?: CourseId;
  assignmentId?: string;
  applicationId?: string;
}
export function weekEvents(start: Date, state: DemoState): CalendarEvent[] {
  const end = addDays(start, 7).toISOString();
  const events: CalendarEvent[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i),
      key = dateKey(day);
    if (key < SEMESTER.start || key > SEMESTER.end) continue;
    for (const c of courses)
      for (const m of c.meetings)
        if (m.days.includes(day.getUTCDay()))
          events.push({
            id: `${c.id}-${key}`,
            title: c.name,
            start: `${key}T${m.start}:00Z`,
            end: `${key}T${m.end}:00Z`,
            kind: 'Class',
            detail: `${c.code} · ${m.room}`,
            courseId: c.id,
          });
  }
  for (const a of openAssignments(state))
    if (a.due && a.due >= start.toISOString() && a.due < end)
      events.push({
        id: a.id,
        title: a.title,
        start: a.due,
        kind: 'Deadline',
        detail: courseById(a.courseId).code,
        assignmentId: a.id,
        courseId: a.courseId,
      });
  for (const a of state.applications) {
    if (
      a.stage === 'Interview' &&
      a.interview &&
      a.interview >= start.toISOString() &&
      a.interview < end
    )
      events.push({
        id: `interview-${a.id}`,
        title: a.company,
        start: a.interview,
        kind: 'Interview',
        detail: a.role,
        applicationId: a.id,
      });
    if (
      a.stage !== 'Closed' &&
      a.followUp &&
      a.followUp >= dateKey(start) &&
      a.followUp < dateKey(end)
    )
      events.push({
        id: `follow-${a.id}`,
        title: a.company,
        start: `${a.followUp}T09:00:00Z`,
        kind: 'Follow-up',
        detail: a.nextAction,
        applicationId: a.id,
      });
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}
export function nextClass(state: DemoState, courseId?: CourseId) {
  return [
    ...weekEvents(weekStart(now()), state),
    ...weekEvents(addDays(weekStart(now()), 7), state),
  ].find(
    (e) => e.kind === 'Class' && e.start >= DEMO_NOW && (!courseId || e.courseId === courseId),
  );
}
export const sourceRecordCount = (id: string, state: DemoState) =>
  id === 's-rec'
    ? state.applications.length
    : assignments.filter((a) => a.sourceId === id).length +
      courses
        .filter((c) => c.sourceId === id)
        .reduce((n, c) => n + c.materials.length + c.grades.length + c.meetings.length + 1, 0);
export const sourceName = (id: string) =>
  sources.find((s) => s.id === id)?.name ?? 'Source unavailable';
export const activeApplications = (apps: Application[]) => apps.filter((a) => a.stage !== 'Closed');
