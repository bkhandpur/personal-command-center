import { useState } from 'react';
import { courses } from '@/fixtures/semester';
import { emptyFilters, filterAssignments } from '@/domain/selectors';
import { useWorkspace } from './workspace-context';
import { AssignmentTable } from './assignment-table';
import { SearchBox } from './ui';
export function Assignments({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useWorkspace();
  const [filters, setFilters] = useState(emptyFilters);
  const items = filterAssignments(state, filters);
  function set(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  return (
    <section className="panel assignment-workspace">
      <div className="filters">
        <SearchBox
          id="assignment-search"
          value={filters.search}
          onChange={(v) => set('search', v)}
        />
        <label>
          <span className="sr-only">Course filter</span>
          <select value={filters.course} onChange={(e) => set('course', e.target.value)}>
            <option value="All">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Type filter</span>
          <select value={filters.type} onChange={(e) => set('type', e.target.value)}>
            <option value="All">All types</option>
            {['Homework', 'Reading', 'Essay', 'Quiz', 'Project'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status filter</span>
          <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
            <option value="All">All statuses</option>
            {['Upcoming', 'Due today', 'Overdue', 'Undated', 'Completed'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-secondary">
        <div>
          <label>
            From
            <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} />
          </label>
          <button className="text-button" onClick={() => setFilters(emptyFilters)}>
            Clear filters
          </button>
        </div>
        <label>
          Sort
          <select value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="due">Due date</option>
            <option value="title">Assignment</option>
            <option value="course">Course</option>
            <option value="weight">Weight</option>
            <option value="effort">Effort</option>
          </select>
        </label>
      </div>
      <div className="table-caption" role="status">
        {items.length} assignments
        {filters.from && filters.to && filters.from > filters.to
          ? ' · Choose an end date after the start date'
          : ''}
      </div>
      <AssignmentTable items={items} onOpen={onOpen} />
    </section>
  );
}
