import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight, X, Search, Inbox } from 'lucide-react';
import { courseById } from '@/domain/selectors';
export function CourseTag({ id }: { id: string }) {
  const c = courseById(id);
  return (
    <span className="course-tag">
      <i style={{ background: c.color }} />
      {c.code}
    </span>
  );
}
export function Status({ children }: { children: ReactNode }) {
  const text = String(children);
  const tone = /Completed|Current|Offer|On track/.test(text)
    ? 'green'
    : /Overdue|Closed/.test(text)
      ? 'red'
      : /Due today|Needs review|Undated|Interview|Screening/.test(text)
        ? 'amber'
        : 'neutral';
  return (
    <span className={`status ${tone}`}>
      <i />
      {children}
    </span>
  );
}
export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  title = 'No matching records',
  detail = 'Try adjusting your filters.',
  action,
}: {
  title?: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={25} />
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  label = 'Search assignments',
  id,
}: {
  value: string;
  onChange: (s: string) => void;
  label?: string;
  id?: string;
}) {
  return (
    <label className="search-box">
      <Search size={16} />
      <span className="sr-only">{label}</span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </label>
  );
}
export function TextAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="text-action" onClick={onClick}>
      {children}
      <ArrowUpRight size={14} />
    </button>
  );
}
export function Drawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="drawer"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="drawer-title"
    >
      <div className="drawer-inner">
        <header>
          <span>Record detail</span>
          <button className="icon-button" aria-label="Close details" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <h2 id="drawer-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
