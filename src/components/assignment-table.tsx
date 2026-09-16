import type { Assignment } from '@/domain/types';
import { dueLabel, status } from '@/domain/selectors';
import { useWorkspace } from './workspace-context';
import { CourseTag, Empty, Status } from './ui';
export function AssignmentTable({
  items,
  onOpen,
  compact = false,
}: {
  items: Assignment[];
  onOpen: (id: string) => void;
  compact?: boolean;
}) {
  const { state, toggle, ready } = useWorkspace();
  if (!items.length)
    return (
      <Empty
        title="No assignments here"
        detail="Completed work and filters may change this list."
      />
    );
  return (
    <div className="table-scroll" tabIndex={0} aria-label="Assignment table">
      <table className={compact ? 'assignment-table compact' : 'assignment-table'}>
        <thead>
          <tr>
            <th className="check-cell">
              <span className="sr-only">Complete</span>
            </th>
            <th>Assignment</th>
            <th>Due</th>
            {!compact && (
              <>
                <th>Source</th>
                <th>Weight</th>
              </>
            )}
            <th>{compact ? 'Effort' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id} className={state.completed.includes(a.id) ? 'completed-row' : ''}>
              <td className="check-cell">
                <input
                  type="checkbox"
                  aria-label={`Complete ${a.title}`}
                  checked={state.completed.includes(a.id)}
                  disabled={!ready}
                  onChange={() => toggle(a.id)}
                />
              </td>
              <td>
                <button className="row-title" onClick={() => onOpen(a.id)}>
                  {a.title}
                </button>
                <div className="row-meta">
                  <CourseTag id={a.courseId} />
                  <span>{a.type}</span>
                </div>
              </td>
              <td className={status(a, state) === 'Overdue' ? 'overdue-text' : ''}>
                {dueLabel(a.due)}
              </td>
              {!compact && (
                <>
                  <td className="muted">{a.platform}</td>
                  <td>{a.weight ? `${a.weight}%` : 'Not recorded'}</td>
                </>
              )}
              <td>
                {compact ? (
                  <span className="muted">{a.minutes} min</span>
                ) : (
                  <Status>{status(a, state)}</Status>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
