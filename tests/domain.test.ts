import { describe, it, expect } from 'vitest';
import { assignments, courses, applications, DEMO_NOW, sources } from '../src/fixtures/semester';
import {
  freshState,
  loadState,
  parseState,
  resetState,
  saveState,
  toggleCompletion,
  type StorageLike,
} from '../src/domain/persistence';
import {
  addDays,
  categorizedMaterials,
  dueThisWeek,
  emptyFilters,
  filterAssignments,
  followUps,
  nextClass,
  nextInterview,
  now,
  prioritized,
  sourceRecordCount,
  weekEvents,
  weekStart,
} from '../src/domain/selectors';
import { answerQuestion, BOOKS_QUESTION } from '../src/domain/query';
function memory(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}
const state = freshState();
describe('Assignment workspace', () => {
  it('combines course, search, type, status and inclusive date filters', () => {
    const result = filterAssignments(state, {
      ...emptyFilters,
      course: 'ECO',
      search: 'elasticity',
      type: 'Homework',
      status: 'Due today',
      from: '2026-10-19',
      to: '2026-10-19',
    });
    expect(result.map((a) => a.id)).toEqual(['a01']);
  });
  it('isolates undated and completed work', () => {
    expect(
      filterAssignments(state, { ...emptyFilters, status: 'Undated' }).map((a) => a.id),
    ).toEqual(['a10', 'a21']);
    expect(filterAssignments(state, { ...emptyFilters, status: 'Completed' })).toHaveLength(5);
  });
  it('excludes undated work from a date range and handles reversed ranges', () => {
    expect(
      filterAssignments(state, { ...emptyFilters, from: '2026-10-01' }).every((a) => a.due),
    ).toBe(true);
    expect(
      filterAssignments(state, { ...emptyFilters, from: '2026-11-01', to: '2026-10-01' }),
    ).toEqual([]);
  });
  it('sorts dates with undated last, weight descending and effort ascending', () => {
    const due = filterAssignments(state, emptyFilters);
    expect(due.slice(-2).every((a) => !a.due)).toBe(true);
    expect(filterAssignments(state, { ...emptyFilters, sort: 'weight' })[0].id).toBe('a23');
    expect(filterAssignments(state, { ...emptyFilters, sort: 'effort' })[0].id).toBe('a25');
  });
  it('prioritizes overdue work and removes completed tasks from recommendations', () => {
    expect(prioritized(state)[0].id).toBe('a06');
    expect(prioritized(toggleCompletion(state, 'a06')).some((a) => a.id === 'a06')).toBe(false);
    expect(prioritized(state, 45).every((a) => a.minutes <= 45)).toBe(true);
  });
  it('uses a Monday through Sunday week without including previous overdue work', () => {
    expect(dueThisWeek(state)).toHaveLength(9);
    expect(dueThisWeek(state).some((a) => a.id === 'a06')).toBe(false);
  });
});
describe('Saved state', () => {
  it('round trips completion and recruiting changes', () => {
    const storage = memory();
    const next = toggleCompletion(state, 'a01');
    next.applications = next.applications.map((a) =>
      a.id === 'r1' ? { ...a, stage: 'Offer', followUp: '2026-11-02' } : a,
    );
    saveState(storage, next);
    expect(loadState(storage)).toEqual(next);
    expect(state.completed).not.toContain('a01');
  });
  it('toggles back and ignores unknown completion IDs', () => {
    expect(toggleCompletion(toggleCompletion(state, 'a01'), 'a01')).toEqual(state);
    expect(toggleCompletion(state, 'unknown')).toBe(state);
  });
  it('restores every original record on reset', () => {
    const storage = memory();
    saveState(storage, toggleCompletion(state, 'a01'));
    expect(resetState(storage)).toEqual(freshState());
    expect(loadState(storage)).toEqual(freshState());
  });
  it('rejects malformed storage and impossible dates', () => {
    expect(() => parseState('{bad')).toThrow();
    expect(() => parseState('{"version":2}')).toThrow();
    const bad = freshState();
    bad.applications[0].followUp = '2026-02-31';
    expect(() => parseState(JSON.stringify(bad))).toThrow();
  });
  it('does not restore arbitrary persisted content', () => {
    const edited = freshState();
    edited.applications[0].company = 'Untrusted replacement';
    edited.completed.push('unrecognized');
    const result = parseState(JSON.stringify(edited));
    expect(result.applications[0].company).toBe(applications[0].company);
    expect(result.completed).not.toContain('unrecognized');
  });
});
describe('Course and recruiting selectors', () => {
  it('partitions materials without duplicates', () => {
    const groups = categorizedMaterials();
    expect(groups.map((g) => g.items.length)).toEqual([2, 1, 4, 1, 1]);
    expect(new Set(groups.flatMap((g) => g.items.map((m) => m.id))).size).toBe(9);
  });
  it('includes overdue and today follow-ups but excludes closed records', () => {
    expect(followUps(state).map((a) => a.id)).toEqual(['r3', 'r2']);
    const closed = {
      ...state,
      applications: state.applications.map((a) => ({ ...a, stage: 'Closed' as const })),
    };
    expect(followUps(closed)).toEqual([]);
    expect(nextInterview(closed)).toBeUndefined();
  });
  it('selects the next interview and class using the demo clock', () => {
    expect(nextInterview(state)?.id).toBe('r1');
    expect(nextClass(state)?.courseId).toBe('PHI');
    expect(nextClass(state, 'ACC')?.start).toBe('2026-10-19T14:00:00Z');
  });
  it('derives calendar events and respects semester bounds', () => {
    const events = weekEvents(weekStart(now()), state);
    expect(events.filter((e) => e.kind === 'Class')).toHaveLength(9);
    expect(events.some((e) => e.assignmentId === 'a16')).toBe(false);
    expect(
      weekEvents(addDays(weekStart(now()), 100), state).filter((e) => e.kind === 'Class'),
    ).toEqual([]);
  });
  it('all weights sum to 100 and all citations resolve', () => {
    expect(courses.every((c) => c.grades.reduce((n, g) => n + g.weight, 0) === 100)).toBe(true);
    expect(assignments.every((a) => sources.some((s) => s.id === a.sourceId))).toBe(true);
    expect(sources.every((s) => sourceRecordCount(s.id, state) > 0)).toBe(true);
    expect(DEMO_NOW).toBe('2026-10-19T09:00:00Z');
  });
});
describe('Grounded retrieval', () => {
  it('answers the exact books and Brightspace question in five verified categories', () => {
    const answer = answerQuestion(BOOKS_QUESTION, state);
    expect(answer.kind).toBe('Records');
    expect(answer.sections.map((s) => s.title)).toEqual([
      'Required purchases',
      'Optional purchases',
      'Already online',
      'Platform access fees',
      'Needs confirmation',
    ]);
    expect(answer.sections.map((s) => s.items.length)).toEqual([2, 1, 4, 1, 1]);
    expect(answer.sourceIds).toHaveLength(5);
    expect(JSON.stringify(answer)).toContain('City Voices anthology');
    expect(JSON.stringify(answer)).toContain('Fee not recorded');
  });
  it.each([
    'Which books do I actually need to buy',
    'Which readings are already online',
    'Where is my economics homework',
    'What is due this week',
    'What should I work on first',
    'I have 45 minutes. What can I finish',
    'Which class has the strictest late policy',
    'How much is attendance worth in philosophy',
    'Which applications need a follow-up',
    'What is my next interview',
    'Which assignments do not have dates',
    'What is due before my next accounting class',
  ])('supports %s', (q) => {
    expect(answerQuestion(q, state).kind).not.toBe('Missing information');
    expect(answerQuestion(q, state).sourceIds.length).toBeGreaterThan(0);
  });
  it('does not interpret dates as the DAT course', () => {
    expect(
      answerQuestion('Which assignments do not have dates', state).sections[0].items.map(
        (i) => i.action?.id,
      ),
    ).toEqual(['a10', 'a21']);
  });
  it('retrieves actual policy and attendance values', () => {
    expect(
      JSON.stringify(answerQuestion('Which class has the strictest late policy', state)),
    ).toContain('No late submissions accepted');
    expect(
      answerQuestion('How much is attendance worth in philosophy', state).sections[0].items[0]
        .detail,
    ).toContain('10%');
  });
  it('answers time comparisons with actual schedule boundaries', () => {
    expect(
      answerQuestion('What is due before my next accounting class', state).sections[0].items.map(
        (i) => i.action?.id,
      ),
    ).toEqual(['a02', 'a06', 'a26']);
  });
  it('answers from current completion and stage state', () => {
    const updated = toggleCompletion(state, 'a01');
    expect(JSON.stringify(answerQuestion('What is due this week', updated))).not.toContain(
      'Elasticity problem set',
    );
    updated.applications = updated.applications.map((a) => ({ ...a, stage: 'Closed' }));
    expect(
      answerQuestion('Which applications need a follow-up', updated).sections[0].items,
    ).toEqual([]);
  });
  it('uses keyword retrieval and returns unknown for unsupported facts', () => {
    expect(
      answerQuestion('Find the sampling bias lab', state).sections[0].items[0].action?.id,
    ).toBe('a05');
    for (const q of [
      'What is my GPA?',
      'What is my accounting professor email?',
      'How much does the glass arcade cost?',
      'Will I get an offer?',
    ])
      expect(answerQuestion(q, state).kind).toBe('Missing information');
  });
  it('never emits interface em dashes or fabricated currency values', () => {
    for (const q of [BOOKS_QUESTION, 'What should I work on first']) {
      const answer = JSON.stringify(answerQuestion(q, state));
      expect(answer).not.toContain('—');
      expect(answer).not.toMatch(/\$\d/);
    }
  });
});
