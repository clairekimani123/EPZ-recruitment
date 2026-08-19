import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="page-center">
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1>Trainee Recruitment</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Apply for an upcoming traineeship. It takes about five minutes.
        </p>
        <Link to="/apply" className="button">
          Start application
        </Link>
      </div>
    </main>
  );
}
