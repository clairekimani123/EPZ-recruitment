import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="page-center">
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <h1>Peak Campus Link</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>
          Choose the application that matches what you're looking for.
        </p>
        <div className="hero-buttons">
          <Link to="/apply/trainee" className="hero-button primary">
            Apply for Training Programme
          </Link>
          <Link to="/apply/job" className="hero-button secondary">
            Apply for a Job
          </Link>
        </div>
      </div>
    </main>
  );
}