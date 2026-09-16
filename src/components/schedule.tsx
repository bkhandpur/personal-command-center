import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEMO_NOW, courses } from '@/fixtures/semester';
import {
  addDays,
  dateKey,
  formatDate,
  now,
  time,
  weekEvents,
  weekStart,
  type CalendarEvent,
} from '@/domain/selectors';
import { useWorkspace } from './workspace-context';
import { Empty, Panel } from './ui';
export function Schedule({ onEvent }: { onEvent: (e: CalendarEvent) => void }) {
  const { state } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('All');
  const start = addDays(weekStart(now()), offset * 7);
  const events = weekEvents(start, state).filter((e) => filter === 'All' || e.kind === filter);
  return (
    <>
      <div className="schedule-toolbar">
        <div className="week-navigation">
          <button
            className="icon-button"
            aria-label="Previous week"
            onClick={() => setOffset(offset - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <h2>
            {formatDate(start)} – {formatDate(addDays(start, 6))}
          </h2>
          <button
            className="icon-button"
            aria-label="Next week"
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronRight size={18} />
          </button>
          <button className="secondary" onClick={() => setOffset(0)}>
            This week
          </button>
        </div>
        <label>
          <span className="sr-only">Event type</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {['All', 'Class', 'Deadline', 'Interview', 'Follow-up'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="schedule-legend">
        <span>
          <i className="legend-class" />
          Classes
        </span>
        <span>
          <i className="legend-deadline" />
          Deadlines
        </span>
        <span>
          <i className="legend-recruiting" />
          Recruiting
        </span>
      </div>
      <div className="week-grid">
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(start, i);
          const today = dateKey(day) === dateKey(DEMO_NOW);
          const list = events.filter((e) => dateKey(e.start) === dateKey(day));
          return (
            <section className={`day-column ${today ? 'current-day' : ''}`} key={i}>
              <header>
                <span>{formatDate(day, { weekday: 'short' })}</span>
                <strong>{formatDate(day, { day: 'numeric' })}</strong>
                {today && <small>Today</small>}
              </header>
              <div className="day-events">
                {list.map((e) => (
                  <button
                    className={`calendar-event ${e.kind.toLowerCase()}`}
                    key={e.id}
                    onClick={() => onEvent(e)}
                    style={{
                      borderLeftColor: e.courseId
                        ? courses.find((c) => c.id === e.courseId)!.color
                        : undefined,
                    }}
                  >
                    <span className="event-time">
                      {e.kind === 'Follow-up' ? 'Follow-up' : time(e.start)}
                    </span>
                    <strong>{e.title}</strong>
                    <small>{e.kind === 'Class' ? e.detail : e.kind}</small>
                  </button>
                ))}
                {!list.length && <span className="day-empty">No events</span>}
              </div>
            </section>
          );
        })}
      </div>
      <Panel title="Upcoming in this week">
        <div className="event-agenda">
          {events
            .filter((e) => e.start >= DEMO_NOW)
            .slice(0, 5)
            .map((e) => (
              <button key={e.id} onClick={() => onEvent(e)}>
                <div className="event-date">
                  <strong>{formatDate(e.start, { day: 'numeric' })}</strong>
                  <span>{formatDate(e.start, { weekday: 'short' })}</span>
                </div>
                <div>
                  <strong>{e.title}</strong>
                  <small>{e.detail}</small>
                </div>
                <span className="muted">
                  {e.kind === 'Follow-up' ? 'Follow-up' : time(e.start)}
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          {!events.some((e) => e.start >= DEMO_NOW) && (
            <Empty title="No upcoming events" detail="Choose another week or event type." />
          )}
        </div>
      </Panel>
    </>
  );
}
