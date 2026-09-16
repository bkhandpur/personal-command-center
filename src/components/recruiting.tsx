import { useState } from 'react';
import { stages, type Stage } from '@/domain/types';
import { activeApplications, followUps, formatDate } from '@/domain/selectors';
import { useWorkspace } from './workspace-context';
import { Empty, SearchBox, Status } from './ui';
export function Recruiting({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, updateApplication, ready } = useWorkspace();
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All');
  const [onlyDue, setOnlyDue] = useState(false);
  const due = followUps(state);
  const items = state.applications.filter(
    (a) =>
      `${a.company} ${a.role} ${a.nextAction}`.toLowerCase().includes(search.toLowerCase()) &&
      (stage === 'All' || a.stage === stage) &&
      (!onlyDue || due.some((d) => d.id === a.id)),
  );
  return (
    <>
      <div className="metrics recruiting-metrics">
        <div>
          <span>Active applications</span>
          <strong>
            {activeApplications(state.applications).length.toString().padStart(2, '0')}
          </strong>
          <small>Across the pipeline</small>
        </div>
        <div>
          <span>Interviews</span>
          <strong>
            {state.applications
              .filter((a) => a.stage === 'Interview')
              .length.toString()
              .padStart(2, '0')}
          </strong>
          <small>In interview stage</small>
        </div>
        <div>
          <span>Follow-ups due</span>
          <strong className="amber-text">{due.length.toString().padStart(2, '0')}</strong>
          <small>Due today or overdue</small>
        </div>
        <div>
          <span>Offers</span>
          <strong className="green-text">
            {state.applications
              .filter((a) => a.stage === 'Offer')
              .length.toString()
              .padStart(2, '0')}
          </strong>
          <small>Ready for review</small>
        </div>
      </div>
      <section className="panel">
        <div className="filters">
          <SearchBox value={search} onChange={setSearch} label="Search recruiting" />
          <label>
            <span className="sr-only">Stage filter</span>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="All">All stages</option>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button
            className={`secondary ${onlyDue ? 'selected' : ''}`}
            aria-pressed={onlyDue}
            onClick={() => setOnlyDue(!onlyDue)}
          >
            Follow-ups due<span className="count">{due.length}</span>
          </button>
        </div>
        <div className="table-caption" role="status">
          {items.length} applications
        </div>
        {items.length ? (
          <div className="table-scroll" tabIndex={0} aria-label="Recruiting table">
            <table className="recruiting-table">
              <thead>
                <tr>
                  <th>Company / role</th>
                  <th>Stage</th>
                  <th>Applied</th>
                  <th>Next action</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <button className="row-title" onClick={() => onOpen(a.id)}>
                        {a.company}
                      </button>
                      <small>{a.role}</small>
                    </td>
                    <td>
                      <label>
                        <span className="sr-only">Stage for {a.company}</span>
                        <select
                          value={a.stage}
                          disabled={!ready}
                          onChange={(e) =>
                            updateApplication(a.id, { stage: e.target.value as Stage })
                          }
                        >
                          {stages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </td>
                    <td>{formatDate(a.applied)}</td>
                    <td>
                      <span>{a.nextAction}</span>
                      <small>{a.contact}</small>
                    </td>
                    <td>
                      <label>
                        <span className="sr-only">Follow-up for {a.company}</span>
                        <input
                          type="date"
                          value={a.followUp ?? ''}
                          disabled={!ready}
                          onChange={(e) =>
                            updateApplication(a.id, { followUp: e.target.value || null })
                          }
                        />
                      </label>
                      {due.some((d) => d.id === a.id) && <Status>Needs review</Status>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
