'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Workspace unavailable</h1>
      <p>Try loading the workspace again.</p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
