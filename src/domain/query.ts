import { assignments, courses } from '../fixtures/semester';
import {
  categorizedMaterials,
  courseById,
  dueLabel,
  dueThisWeek,
  followUps,
  nextClass,
  nextInterview,
  openAssignments,
  prioritized,
  sourceName,
} from './selectors';
import type { Answer, Assignment, DemoState } from './types';
export const BOOKS_QUESTION =
  'Which books do I need to buy, and which are online or in Brightspace?';
export const suggestions = [
  BOOKS_QUESTION,
  'What should I work on first?',
  'I have 45 minutes. What can I finish?',
  'What is due this week?',
  'Which applications need a follow-up?',
  'Which assignments do not have dates?',
];
const item = (a: Assignment) => ({
  title: a.title,
  detail: `${courseById(a.courseId).code} · ${dueLabel(a.due)} · ${a.minutes} min`,
  action: { kind: 'assignment' as const, id: a.id },
});
function taskAnswer(title: string, list: Assignment[], recommendation = false): Answer {
  return {
    title,
    kind: recommendation ? 'Recommendation' : 'Records',
    sections: [{ title: list.length ? 'Assignments' : 'No matching work', items: list.map(item) }],
    sourceIds: [...new Set(list.map((a) => a.sourceId))],
    note: recommendation
      ? 'Ranked by deadline, assignment weight and estimated effort. Estimates are not guaranteed completion times.'
      : undefined,
  };
}
export function answerQuestion(question: string, state: DemoState): Answer {
  const q = question.toLowerCase().replace(/[’']/g, '').trim();
  const course = courses.find(
    (c) =>
      new RegExp(`\\b${c.id.toLowerCase()}\\b`).test(q) ||
      q.includes(c.code.toLowerCase()) ||
      q.includes(c.name.toLowerCase()) ||
      (c.id === 'ECO' && /economic/.test(q)) ||
      (c.id === 'PHI' && /philosoph/.test(q)) ||
      (c.id === 'ACC' && /accounting/.test(q)),
  );
  // A supported intent must be identified before matching records. This keeps
  // unrelated questions containing a course name from producing invented facts.
  if (
    /books?|materials?|readings?.*(online|buy)|online.*readings?/.test(q) &&
    !/due|finish/.test(q)
  )
    return {
      title: 'Course materials',
      kind: 'Records',
      sections: categorizedMaterials(course?.id).map((g) => ({
        title: g.kind,
        items: g.items.map((m) => ({
          title: m.title,
          detail: `${m.course.code} · ${m.location}. ${m.note}`,
          action: { kind: 'course', id: m.course.id },
        })),
      })),
      sourceIds: courses.filter((c) => !course || c.id === course.id).map((c) => c.sourceId),
      note: 'Purchase prices and platform fees are not recorded. Brightspace locations are fixture references, not connected accounts.',
    };
  if (/strictest|late policy|late submission/.test(q)) {
    const selected = course
      ? [course]
      : [...courses].sort((a, b) => a.late.maximumDays - b.late.maximumDays).slice(0, 1);
    return {
      title: course ? 'Late policy' : 'Strictest late policy',
      kind: 'Records',
      sections: [
        {
          title: 'Submission window',
          items: selected.map((c) => ({
            title: c.name,
            detail: c.late.text,
            action: { kind: 'course', id: c.id },
          })),
        },
      ],
      sourceIds: selected.map((c) => c.sourceId),
      note: course
        ? undefined
        : 'Compared by maximum accepted late window. Exceptions require instructor confirmation.',
    };
  }
  if (/attendance|grading|grade structure/.test(q) && course)
    return {
      title: `${course.code} grading`,
      kind: 'Records',
      sections: [
        {
          title: 'Grade structure',
          items: course.grades
            .filter((g) => !/attendance/.test(q) || g.label === 'Attendance')
            .map((g) => ({
              title: g.label,
              detail: `${g.weight}% of the course grade`,
              action: { kind: 'course', id: course.id },
            })),
        },
      ],
      sourceIds: [course.sourceId],
      note:
        /attendance/.test(q) && !course.grades.some((g) => g.label === 'Attendance')
          ? 'A separate attendance weight is not recorded.'
          : undefined,
    };
  if (/follow.?up|applications.*action/.test(q))
    return {
      title: 'Follow-ups needing attention',
      kind: 'Records',
      sections: [
        {
          title: 'Due or overdue',
          items: followUps(state).map((a) => ({
            title: a.company,
            detail: `${a.nextAction} · ${a.followUp} · ${a.stage}`,
            action: { kind: 'application', id: a.id },
          })),
        },
      ],
      sourceIds: ['s-rec'],
    };
  if (/next interview/.test(q)) {
    const a = nextInterview(state);
    return {
      title: a ? 'Next interview' : 'No interview recorded',
      kind: a ? 'Records' : 'Missing information',
      sections: a
        ? [
            {
              title: a.company,
              items: [
                {
                  title: a.role,
                  detail: dueLabel(a.interview!),
                  action: { kind: 'application', id: a.id },
                },
              ],
            },
          ]
        : [],
      sourceIds: ['s-rec'],
    };
  }
  if (/before.*next.*class/.test(q)) {
    if (!course) return missing('Name a course to compare its next class with open deadlines.');
    const event = nextClass(state, course.id);
    return event
      ? taskAnswer(
          `Due before ${course.code} · ${dueLabel(event.start)}`,
          openAssignments(state).filter((a) => a.due && a.due < event.start),
        )
      : missing('No next class is recorded.');
  }
  if (/no dates?|not have dates?|undated|without.*date/.test(q))
    return taskAnswer(
      'Assignments without dates',
      openAssignments(state).filter((a) => !a.due && (!course || a.courseId === course.id)),
    );
  const duration = q.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?)/);
  if (duration) {
    const minutes = Number(duration[1]) * (/^h/.test(duration[2]) ? 60 : 1);
    return taskAnswer(
      `Work within ${minutes} minutes`,
      prioritized(state, minutes)
        .filter((a) => !course || a.courseId === course.id)
        .slice(0, 5),
      true,
    );
  }
  if (/first|prioriti|work on/.test(q))
    return taskAnswer(
      'Start here',
      prioritized(state)
        .filter((a) => !course || a.courseId === course.id)
        .slice(0, 4),
      true,
    );
  if (/due.*week|week.*due/.test(q))
    return taskAnswer(
      'Due this week',
      dueThisWeek(state).filter((a) => !course || a.courseId === course.id),
    );
  if (/where.*homework/.test(q) && course)
    return {
      title: `${course.code} homework`,
      kind: 'Records',
      sections: [
        {
          title: course.platform,
          items: [
            {
              title: 'Assignment location',
              detail:
                course.id === 'ECO'
                  ? 'Brightspace → Course content → Weekly problem sets'
                  : 'Open the course platform and check the assignment catalog.',
              action: { kind: 'course', id: course.id },
            },
            ...openAssignments(state)
              .filter((a) => a.courseId === course.id && a.type === 'Homework')
              .map(item),
          ],
        },
      ],
      sourceIds: [course.sourceId],
      note: 'Private platform links are not included in the public demo.',
    };
  // Small keyword index over titles. Require at least two meaningful token hits.
  const tokens = q
    .split(/\W+/)
    .filter(
      (t) =>
        t.length > 3 &&
        ![
          'what',
          'which',
          'where',
          'have',
          'does',
          'when',
          'with',
          'this',
          'that',
          'about',
        ].includes(t),
    );
  const matches = assignments
    .map((a) => ({ a, score: tokens.filter((t) => a.title.toLowerCase().includes(t)).length }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);
  if (matches.length && !/price|cost|grade|score|contact|email|professor|policy/.test(q))
    return taskAnswer(
      'Matching assignments',
      matches.slice(0, 5).map((x) => x.a),
    );
  return missing(
    'The available records do not answer this question. Try a deadline, course material, policy or recruiting question.',
  );
}
function missing(note: string): Answer {
  return {
    title: 'Not in the available records',
    kind: 'Missing information',
    sections: [],
    sourceIds: [],
    note,
  };
}
export const citationLabel = sourceName;
