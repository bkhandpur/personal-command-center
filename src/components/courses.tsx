import { ExternalLink, MapPin, BookOpen } from 'lucide-react';
import { courses, sources } from '@/fixtures/semester';
import { categorizedMaterials, courseById, openAssignments, formatDate } from '@/domain/selectors';
import { useWorkspace } from './workspace-context';
import { CourseTag, Panel, Status } from './ui';
import { AssignmentTable } from './assignment-table';
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function Courses({
  selected,
  onSelect,
  onAssignment,
  onSource,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onAssignment: (id: string) => void;
  onSource: (id: string) => void;
}) {
  const { state } = useWorkspace();
  const course = courseById(selected);
  return (
    <div className="courses-layout">
      <div className="course-nav" aria-label="Select a course">
        {courses.map((c) => (
          <button key={c.id} aria-pressed={selected === c.id} onClick={() => onSelect(c.id)}>
            <CourseTag id={c.id} />
            <strong>{c.name}</strong>
            <small>
              {openAssignments(state).filter((a) => a.courseId === c.id).length} open assignments
            </small>
          </button>
        ))}
      </div>
      <div className="course-content">
        <section className="course-heading">
          <div>
            <CourseTag id={course.id} />
            <h2>{course.name}</h2>
            <p>
              {course.instructor} · {course.platform}
            </p>
          </div>
          <button className="secondary" onClick={() => onSource(course.sourceId)}>
            View source
          </button>
        </section>
        <div className="course-summary">
          <Panel title="Meetings">
            {course.meetings.map((m) => (
              <div className="meeting-detail" key={m.start}>
                <strong>
                  {m.days.map((d) => weekdays[d]).join(' / ')} · {m.start}–{m.end}
                </strong>
                <span>
                  <MapPin size={14} />
                  {m.room}
                </span>
              </div>
            ))}
          </Panel>
          <Panel title="Late submissions">
            <div className="policy-text">{course.late.text}</div>
          </Panel>
        </div>
        <Panel title="Grade structure">
          <div className="grade-strip">
            {course.grades.map((g, i) => (
              <div key={g.label}>
                <strong>
                  {g.weight}
                  <span>%</span>
                </strong>
                <small>{g.label}</small>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${g.weight}%`,
                      background: course.color,
                      opacity: 1 - i * 0.12,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Materials" action={<BookOpen size={16} className="muted" />}>
          <div className="materials">
            {categorizedMaterials(course.id)
              .filter((g) => g.items.length)
              .map((g) => (
                <div key={g.kind}>
                  <h3>{g.kind}</h3>
                  {g.items.map((m) => (
                    <article key={m.id}>
                      <div>
                        <strong>{m.title}</strong>
                        <p>{m.note}</p>
                      </div>
                      {m.url ? (
                        <a className="external-link" href={m.url} target="_blank" rel="noreferrer">
                          {m.location}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="small muted">{m.location}</span>
                      )}
                    </article>
                  ))}
                </div>
              ))}
          </div>
        </Panel>
        <Panel title="Upcoming work">
          <AssignmentTable
            items={openAssignments(state)
              .filter((a) => a.courseId === course.id)
              .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))}
            onOpen={onAssignment}
            compact
          />
        </Panel>
        <div className="source-coverage">
          <Status>{course.id === 'LIT' ? 'Needs review' : 'Current'}</Status>
          <span>
            Updated {formatDate(sources.find((s) => s.id === course.sourceId)!.updated)} ·{' '}
            {course.id === 'LIT'
              ? 'Anthology access unconfirmed'
              : 'Materials, policies and schedule recorded'}
          </span>
        </div>
      </div>
    </div>
  );
}
