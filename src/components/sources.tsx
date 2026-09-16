import { useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { sources } from '@/fixtures/semester';
import { formatDate, sourceRecordCount } from '@/domain/selectors';
import { useWorkspace } from './workspace-context';
import { Empty, SearchBox, Status } from './ui';
export function Sources({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useWorkspace();
  const [search, setSearch] = useState('');
  const items = sources.filter((s) =>
    `${s.name} ${s.coverage}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="source-summary">
        <div>
          <strong>{sources.length}</strong>
          <span>Source records</span>
        </div>
        <div>
          <strong>{sources.reduce((n, s) => n + sourceRecordCount(s.id, state), 0)}</strong>
          <span>Structured records</span>
        </div>
        <div>
          <strong className="amber-text">
            {sources.filter((s) => s.status === 'Needs review').length}
          </strong>
          <span>Needs review</span>
        </div>
      </div>
      <section className="panel">
        <div className="filters">
          <SearchBox value={search} onChange={setSearch} label="Search sources" />
        </div>
        {items.length ? (
          <div className="table-scroll" tabIndex={0} aria-label="Source registry">
            <table className="sources-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Area</th>
                  <th>Coverage</th>
                  <th>Updated</th>
                  <th>Records</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button className="row-title source-title" onClick={() => onOpen(s.id)}>
                        <FileText size={16} />
                        {s.name}
                        <ChevronRight size={14} />
                      </button>
                      <small>{s.type}</small>
                    </td>
                    <td>{s.area}</td>
                    <td className="coverage-cell">{s.coverage}</td>
                    <td>{formatDate(s.updated)}</td>
                    <td>{sourceRecordCount(s.id, state)}</td>
                    <td>
                      <Status>{s.status}</Status>
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
      <p className="source-footnote">
        Sample records; no accounts or live feeds are connected.
      </p>
    </>
  );
}
