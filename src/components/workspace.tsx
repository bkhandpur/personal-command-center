'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  BookOpen,
  BriefcaseBusiness,
  Search,
  Files,
  Command,
  Menu,
  X,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';
import type { Page } from '@/domain/types';
import { DEMO_NOW, SEMESTER, assignments, courses } from '@/fixtures/semester';
import { formatDate, type CalendarEvent } from '@/domain/selectors';
import { WorkspaceProvider, useWorkspace } from './workspace-context';
import { Today } from './today';
import { Assignments } from './assignments';
import { Courses } from './courses';
import { Schedule } from './schedule';
import { Recruiting } from './recruiting';
import { Ask } from './ask';
import { Sources } from './sources';
import { RecordDetails, type Detail } from './record-details';
import { Drawer } from './ui';
const navigation = [
  { label: 'Today', icon: LayoutDashboard },
  { label: 'Assignments', icon: ListChecks },
  { label: 'Schedule', icon: CalendarDays },
  { label: 'Courses', icon: BookOpen },
  { label: 'Recruiting', icon: BriefcaseBusiness },
  { label: 'Ask', icon: Search },
  { label: 'Sources', icon: Files },
] as const;
function subscribePage(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}
function currentPage(): Page {
  return (
    navigation.find((n) => n.label.toLowerCase() === window.location.hash.slice(1))?.label ??
    'Today'
  );
}
function WorkspaceShell() {
  const page = useSyncExternalStore(subscribePage, currentPage, () => 'Today' as Page);
  const [mobile, setMobile] = useState(false);
  const [course, setCourse] = useState('ACC');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const mainRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const { ready, error, reset } = useWorkspace();
  function navigate(next: Page) {
    setMobile(false);
    setDetail(null);
    window.history.pushState(null, '', `#${next.toLowerCase()}`);
    window.dispatchEvent(new Event('hashchange'));
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      mainRef.current?.focus({ preventScroll: true });
    });
  }
  function openCourse(id: string) {
    setCourse(id);
    navigate('Courses');
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.querySelector('dialog[open]')) return;
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Escape') {
        setMobile(false);
        mobileRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('Ask');
        requestAnimationFrame(() => document.getElementById('ask-input')?.focus());
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault();
        navigate('Assignments');
        requestAnimationFrame(() => document.getElementById('assignment-search')?.focus());
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    navRef.current?.querySelector<HTMLButtonElement>('nav button')?.focus();
    function containFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab' || document.querySelector('dialog[open]')) return;
      const buttons = [...(navRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
      const controls = [...buttons, mobileRef.current].filter(
        (node): node is HTMLButtonElement => !!node,
      );
      const index = controls.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
    }
    document.addEventListener('keydown', containFocus);
    return () => document.removeEventListener('keydown', containFocus);
  }, [mobile]);
  function onEvent(e: CalendarEvent) {
    if (e.assignmentId) setDetail({ kind: 'assignment', id: e.assignmentId });
    else if (e.applicationId) setDetail({ kind: 'application', id: e.applicationId });
    else if (e.courseId) openCourse(e.courseId);
  }
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside
        ref={navRef}
        id="workspace-navigation"
        className={`sidebar ${mobile ? 'mobile-open' : ''}`}
      >
        <div className="brand">
          <span className="brand-mark">
            <Command size={21} />
          </span>
          <div>
            Command Center<small>SEMESTER WORKSPACE</small>
          </div>
        </div>
        <div className="workspace-switch">
          <span className="workspace-initial">F</span>
          <div>
            {SEMESTER.name}
            <small>Academic and recruiting</small>
          </div>
          <span className="live-dot" />
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              aria-current={page === label ? 'page' : undefined}
              aria-keyshortcuts={label === 'Ask' ? 'Control+k Meta+k' : undefined}
              onClick={() => navigate(label)}
            >
              <Icon size={18} />
              {label}
              {label === 'Ask' && <kbd aria-hidden="true">⌘ K</kbd>}
              {label === 'Today' && <span className="nav-marker" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-indicator">
            <span className="live-dot" />
            {error
              ? 'Storage needs attention'
              : ready
                ? 'Saved on this device'
                : 'Loading workspace'}
          </div>
          <button onClick={() => setResetOpen(true)}>
            <RotateCcw size={15} />
            Reset demo data
          </button>
          <div className="demo-profile">
            <span>AL</span>
            <div>
              Alex Lane<small>Student workspace</small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => {
            setMobile(false);
            mobileRef.current?.focus();
          }}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-toggle"
              ref={mobileRef}
              aria-label={mobile ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="breadcrumb">
              Workspace<span>/</span>
              <strong>{page}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="demo-badge">
              {formatDate(DEMO_NOW, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              className="global-search"
              aria-label="Ask workspace"
              onClick={() => {
                navigate('Ask');
                requestAnimationFrame(() => document.getElementById('ask-input')?.focus());
              }}
            >
              <Search size={15} />
              <span>Ask workspace</span>
              <kbd>⌘ K</kbd>
            </button>
          </div>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1}>
          <div className="page-heading">
            <div>
              <h1>{page}</h1>
              <p>
                {page === 'Today'
                  ? formatDate(DEMO_NOW, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : page === 'Assignments'
                    ? `Fall semester · ${assignments.length} assignments`
                    : page === 'Schedule'
                      ? 'Fall semester'
                      : page === 'Courses'
                        ? `${courses.length} courses · Fall semester`
                        : page === 'Recruiting'
                          ? 'Fall recruiting cycle'
                          : page === 'Ask'
                            ? 'Search across your records'
                            : 'Course and recruiting records'}
              </p>
            </div>
            {page === 'Today' && (
              <button className="secondary" onClick={() => navigate('Schedule')}>
                View schedule
                <ArrowUpRight size={15} />
              </button>
            )}
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => setResetOpen(true)}>Reset demo data</button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {page === 'Today' && (
            <Today
              navigate={navigate}
              onAssignment={(id) => setDetail({ kind: 'assignment', id })}
              onApplication={(id) => setDetail({ kind: 'application', id })}
              onCourse={openCourse}
            />
          )}
          {page === 'Assignments' && (
            <Assignments onOpen={(id) => setDetail({ kind: 'assignment', id })} />
          )}
          {page === 'Courses' && (
            <Courses
              selected={course}
              onSelect={setCourse}
              onAssignment={(id) => setDetail({ kind: 'assignment', id })}
              onSource={(id) => setDetail({ kind: 'source', id })}
            />
          )}
          {page === 'Schedule' && <Schedule onEvent={onEvent} />}
          {page === 'Recruiting' && (
            <Recruiting onOpen={(id) => setDetail({ kind: 'application', id })} />
          )}
          {page === 'Ask' && (
            <Ask
              onSource={(id) => setDetail({ kind: 'source', id })}
              onAction={(a) =>
                a.kind === 'course' ? openCourse(a.id) : setDetail({ kind: a.kind, id: a.id })
              }
            />
          )}
          {page === 'Sources' && <Sources onOpen={(id) => setDetail({ kind: 'source', id })} />}
          <footer className="workspace-footer">
            <span>Command Center</span>
            <span>Sample records · Saved locally</span>
          </footer>
        </main>
      </div>
      {detail && (
        <RecordDetails
          key={`${detail.kind}-${detail.id}`}
          detail={detail}
          onClose={() => setDetail(null)}
          onSource={(id) => setDetail({ kind: 'source', id })}
        />
      )}
      {resetOpen && (
        <Drawer title="Reset demo data" onClose={() => setResetOpen(false)}>
          <p className="reset-copy">
            Restore original completion states, recruiting stages and follow-up dates on this
            device.
          </p>
          <div className="detail-actions">
            <button
              className="primary"
              onClick={() => {
                reset();
                setResetOpen(false);
                setNotice('Demo data restored');
              }}
            >
              Reset demo data
            </button>
            <button className="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
export function Workspace() {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}
