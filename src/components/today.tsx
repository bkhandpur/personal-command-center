import { ArrowRight, ArrowUpRight, Clock3, CalendarDays, Check, ChevronRight } from 'lucide-react';
import { assignments, courses, DEMO_NOW } from '@/fixtures/semester';
import {
  dateKey,
  dueLabel,
  dueThisWeek,
  followUps,
  nextClass,
  now,
  openAssignments,
  prioritized,
  status,
  time,
  weekEvents,
  weekStart,
} from '@/domain/selectors';
import type { Page } from '@/domain/types';
import { useWorkspace } from './workspace-context';
import { CourseTag, Panel, TextAction, Empty } from './ui';
import { AssignmentTable } from './assignment-table';
export function Today({
  navigate,
  onAssignment,
  onApplication,
  onCourse,
}: {
  navigate: (page: Page) => void;
  onAssignment: (id: string) => void;
  onApplication: (id: string) => void;
  onCourse: (id: string) => void;
}) {
  const { state } = useWorkspace();
  const open = openAssignments(state),
    week = dueThisWeek(state),
    today = open.filter((a) => a.due && dateKey(a.due) === dateKey(DEMO_NOW));
  const late = open.filter((a) => status(a, state) === 'Overdue');
  const queue = prioritized(state).slice(0, 3);
  const next = nextClass(state);
  const deadline = open
    .filter((a) => a.due && a.due >= DEMO_NOW)
    .sort((a, b) => a.due!.localeCompare(b.due!))[0];
  const follow = followUps(state);
  const events = weekEvents(weekStart(now()), state).filter(
    (e) => dateKey(e.start) === dateKey(DEMO_NOW) && e.start >= DEMO_NOW && e.kind === 'Class',
  );
  return (
    <>
      <div className="metrics">
        <div>
          <span>Due today</span>
          <strong>{today.length.toString().padStart(2, '0')}</strong>
          <small>{today.reduce((n, a) => n + a.minutes, 0)} min estimated</small>
        </div>
        <div>
          <span>Due this week</span>
          <strong>{week.length.toString().padStart(2, '0')}</strong>
          <small>
            {Math.round((week.reduce((n, a) => n + a.minutes, 0) / 60) * 10) / 10} hours of work
          </small>
        </div>
        <div>
          <span>Overdue</span>
          <strong className={late.length ? 'amber-text' : ''}>
            {late.length.toString().padStart(2, '0')}
          </strong>
          <small>{late.length ? 'Review submission policies' : 'No overdue work'}</small>
        </div>
        <div>
          <span>Semester progress</span>
          <strong>
            {Math.round((state.completed.length / assignments.length) * 100)}
            <em>%</em>
          </strong>
          <small>
            {state.completed.length} of {assignments.length} assignments complete
          </small>
        </div>
      </div>
      <div className="today-layout">
        <div className="main-column">
          <section className="next-action">
            <div className="next-action-top">
              <span>
                <i />
                Next deadline
              </span>
              <span>{deadline ? dueLabel(deadline.due) : 'All clear'}</span>
            </div>
            <h2>{deadline?.title ?? 'No upcoming deadlines'}</h2>
            <div className="next-action-bottom">
              {deadline && (
                <>
                  <div>
                    <CourseTag id={deadline.courseId} />
                    <span>
                      <Clock3 size={14} />
                      {deadline.minutes} min
                    </span>
                  </div>
                  <button className="primary" onClick={() => onAssignment(deadline.id)}>
                    Open assignment
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </section>
          <Panel title="Action queue" action={<span className="small muted">Priority order</span>}>
            <div className="queue">
              {queue.map((a, i) => (
                <button key={a.id} onClick={() => onAssignment(a.id)} className="queue-row">
                  <span className="rank">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{a.title}</strong>
                    <div className="row-meta">
                      <CourseTag id={a.courseId} />
                      <span className={status(a, state) === 'Overdue' ? 'amber-text' : ''}>
                        {status(a, state) === 'Overdue'
                          ? 'Overdue · Review late policy'
                          : dueLabel(a.due)}
                      </span>
                    </div>
                  </div>
                  <span className="queue-effort">{a.minutes} min</span>
                  <ChevronRight size={16} />
                </button>
              ))}
              {!queue.length && <Empty title="Queue complete" detail="No open work remains." />}
            </div>
          </Panel>
          <Panel
            title="This week"
            action={
              <TextAction onClick={() => navigate('Assignments')}>All assignments</TextAction>
            }
          >
            <AssignmentTable items={week.slice(0, 5)} onOpen={onAssignment} compact />
          </Panel>
        </div>
        <aside className="side-column">
          <Panel title="On the schedule" action={<CalendarDays size={16} className="muted" />}>
            {next ? (
              <div className="next-class">
                <span className="small muted">Next class · {time(next.start)}</span>
                <button className="row-title" onClick={() => onCourse(next.courseId!)}>
                  {next.title}
                  <ArrowUpRight size={14} />
                </button>
                <p>{next.detail}</p>
              </div>
            ) : (
              <Empty title="No upcoming class" detail="No meetings remain in this semester." />
            )}
            <div className="agenda">
              {events.map((e) => (
                <button onClick={() => onCourse(e.courseId!)} key={e.id}>
                  <span className="agenda-time">{time(e.start)}</span>
                  <i />
                  <div>
                    <strong>{e.title}</strong>
                    <small>{e.detail}</small>
                  </div>
                </button>
              ))}
            </div>
            <div className="panel-footer">
              <TextAction onClick={() => navigate('Schedule')}>View week</TextAction>
            </div>
          </Panel>
          <Panel title="Recruiting" action={<span className="count">{follow.length}</span>}>
            <div className="follow-list">
              {follow.map((a) => (
                <button key={a.id} onClick={() => onApplication(a.id)}>
                  <div>
                    <strong>{a.company}</strong>
                    <small>{a.nextAction}</small>
                  </div>
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {!follow.length && (
                <div className="quiet-state">
                  <Check size={16} />
                  No follow-ups due
                </div>
              )}
            </div>
            <div className="panel-footer">
              <TextAction onClick={() => navigate('Recruiting')}>Open pipeline</TextAction>
            </div>
          </Panel>
          <Panel title="Course workload">
            <div className="workload">
              {courses.map((c) => {
                const total = assignments.filter((a) => a.courseId === c.id).length;
                const completed = assignments.filter(
                  (a) => a.courseId === c.id && state.completed.includes(a.id),
                ).length;
                return (
                  <button key={c.id} onClick={() => onCourse(c.id)}>
                    <div>
                      <CourseTag id={c.id} />
                      <span>{total - completed} open</span>
                    </div>
                    <div className="progress-track">
                      <i style={{ width: `${(completed / total) * 100}%`, background: c.color }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
