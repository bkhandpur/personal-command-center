import { useMemo, useState, type FormEvent } from 'react';
import { ArrowUp, ArrowUpRight, FileText, Search } from 'lucide-react';
import { answerQuestion, BOOKS_QUESTION, citationLabel, suggestions } from '@/domain/query';
import type { AnswerItem } from '@/domain/types';
import { useWorkspace } from './workspace-context';
export function Ask({
  onAction,
  onSource,
}: {
  onAction: (action: NonNullable<AnswerItem['action']>) => void;
  onSource: (id: string) => void;
}) {
  const { state } = useWorkspace();
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState(BOOKS_QUESTION);
  const answer = useMemo(() => answerQuestion(question, state), [question, state]);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      setQuestion(input.trim());
      setInput('');
    }
  }
  return (
    <div className="ask-layout">
      <div className="ask-main">
        <form className="ask-form" onSubmit={submit}>
          <label htmlFor="ask-input">
            <Search size={18} />
            <span className="sr-only">Ask Command Center</span>
          </label>
          <input
            id="ask-input"
            maxLength={500}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your semester"
            autoComplete="off"
          />
          <button
            className="primary icon-button"
            disabled={!input.trim()}
            aria-label="Submit question"
          >
            <ArrowUp size={18} />
          </button>
        </form>
        <div className="answer-question">
          <span>Question</span>
          <h2>{question}</h2>
        </div>
        <article className="answer" aria-live="polite" aria-atomic="true">
          <div className="answer-heading">
            <h2>{answer.title}</h2>
            <span className="answer-kind">{answer.kind}</span>
          </div>
          {answer.sections.map((section) => (
            <section className="answer-section" key={section.title}>
              <h3>
                {section.title}
                <span>{section.items.length}</span>
              </h3>
              {section.items.length ? (
                section.items.map((item, i) => (
                  <div className="answer-item" key={`${item.title}-${i}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    {item.action && (
                      <button
                        className="icon-button"
                        aria-label={`Open ${item.title}`}
                        onClick={() => onAction(item.action!)}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="muted small">No matching records</p>
              )}
            </section>
          ))}
          {answer.note && <p className="answer-note">{answer.note}</p>}
          <footer className="answer-sources">
            <span>Sources used</span>
            {answer.sourceIds.length ? (
              answer.sourceIds.map((id) => (
                <button key={id} onClick={() => onSource(id)}>
                  <FileText size={13} />
                  {citationLabel(id)}
                </button>
              ))
            ) : (
              <small>No supporting source found</small>
            )}
          </footer>
        </article>
      </div>
      <aside className="ask-sidebar">
        <h2>Try a question</h2>
        {suggestions.map((q) => (
          <button
            key={q}
            className={question === q ? 'active' : ''}
            onClick={() => {
              setQuestion(q);
              setInput('');
            }}
          >
            {q}
            <ArrowUpRight size={14} />
          </button>
        ))}
        <div className="query-scope">
          <FileText size={18} />
          <h3>In this workspace</h3>
          <p>Course records, assignments and recruiting.</p>
          <small>Answers reflect your saved changes.</small>
        </div>
      </aside>
    </div>
  );
}
