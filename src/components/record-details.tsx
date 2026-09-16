import { assignments, sources } from '@/fixtures/semester';
import { courseById, dueLabel, formatDate, sourceRecordCount, status } from '@/domain/selectors';
import { stages, type Stage } from '@/domain/types';
import { useWorkspace } from './workspace-context';
import { CourseTag, Drawer, Status } from './ui';
export type Detail = { kind: 'assignment' | 'source' | 'application'; id: string };
export function RecordDetails({
  detail,
  onClose,
  onSource,
}: {
  detail: Detail;
  onClose: () => void;
  onSource: (id: string) => void;
}) {
  const { state, toggle, updateApplication, ready } = useWorkspace();
  if (detail.kind === 'assignment') {
    const a = assignments.find((a) => a.id === detail.id);
    if (!a) return null;
    const c = courseById(a.courseId);
    return (
      <Drawer title={a.title} onClose={onClose}>
        <div className="detail-tags">
          <CourseTag id={a.courseId} />
          <Status>{status(a, state)}</Status>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Due</dt>
            <dd>{dueLabel(a.due)}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{a.type}</dd>
          </div>
          <div>
            <dt>Estimated effort</dt>
            <dd>{a.minutes} min</dd>
          </div>
          <div>
            <dt>Assignment weight</dt>
            <dd>{a.weight ? `${a.weight}%` : 'Not recorded'}</dd>
          </div>
          <div>
            <dt>Platform</dt>
            <dd>{a.platform}</dd>
          </div>
        </dl>
        <section className="detail-section">
          <h3>Assignment notes</h3>
          <p>{a.notes}</p>
        </section>
        <section className="detail-section">
          <h3>Late policy</h3>
          <p>{c.late.text}</p>
        </section>
        <div className="availability">
          <strong>Source unavailable</strong>
          <p>Submission links are not stored in this workspace.</p>
        </div>
        <div className="detail-actions">
          <button className="primary" disabled={!ready} onClick={() => toggle(a.id)}>
            {state.completed.includes(a.id) ? 'Mark incomplete' : 'Mark complete'}
          </button>
          <button className="secondary" onClick={() => onSource(a.sourceId)}>
            View source
          </button>
        </div>
      </Drawer>
    );
  }
  if (detail.kind === 'source') {
    const s = sources.find((s) => s.id === detail.id);
    if (!s) return null;
    const c = courseById(s.area.split(' ')[0]);
    return (
      <Drawer title={s.name} onClose={onClose}>
        <Status>{s.status}</Status>
        <dl className="detail-list">
          <div>
            <dt>Type</dt>
            <dd>{s.type}</dd>
          </div>
          <div>
            <dt>Area</dt>
            <dd>{s.area}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>
              {formatDate(s.updated, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </dd>
          </div>
          <div>
            <dt>Records extracted</dt>
            <dd>{sourceRecordCount(s.id, state)}</dd>
          </div>
        </dl>
        <section className="detail-section">
          <h3>Coverage</h3>
          <p>{s.coverage}</p>
        </section>
        <section className="detail-section">
          <h3>Source note</h3>
          <p>{s.notes}</p>
        </section>
        {c && (
          <section className="detail-section">
            <h3>Recorded policy</h3>
            <p>{c.late.text}</p>
            <h3>Materials</h3>
            {c.materials.map((m) => (
              <p key={m.id}>
                <strong>{m.title}</strong>
                <br />
                {m.kind} · {m.location}
                <br />
                {m.note}
              </p>
            ))}
          </section>
        )}
      </Drawer>
    );
  }
  const a = state.applications.find((a) => a.id === detail.id);
  if (!a) return null;
  return (
    <Drawer title={a.company} onClose={onClose}>
      <p className="muted">{a.role}</p>
      <dl className="detail-list">
        <div>
          <dt>Applied</dt>
          <dd>{formatDate(a.applied)}</dd>
        </div>
        <div>
          <dt>Contact status</dt>
          <dd>{a.contact}</dd>
        </div>
        {a.interview && a.stage === 'Interview' && (
          <div>
            <dt>Interview</dt>
            <dd>{dueLabel(a.interview)}</dd>
          </div>
        )}
      </dl>
      <div className="detail-edit">
        <label>
          Stage
          <select
            value={a.stage}
            disabled={!ready}
            onChange={(e) => updateApplication(a.id, { stage: e.target.value as Stage })}
          >
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Follow-up date
          <input
            type="date"
            value={a.followUp ?? ''}
            disabled={!ready}
            onChange={(e) => updateApplication(a.id, { followUp: e.target.value || null })}
          />
        </label>
      </div>
      <section className="detail-section">
        <h3>Next action</h3>
        <p>{a.nextAction}</p>
        <h3>Notes</h3>
        <p>{a.notes}</p>
      </section>
      <button className="secondary" onClick={() => onSource(a.sourceId)}>
        View source
      </button>
    </Drawer>
  );
}
