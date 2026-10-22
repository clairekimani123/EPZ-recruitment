import { Link } from 'react-router-dom';

// ✅ Correct way to import assets in Vite/React
import bgImage from '../assets/bg.png'; 

export default function HomePage() {
  return (
    <main 
      className="page-center" 
      style={{
        // Set the background image using the imported variable
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
       
        // Add a subtle dark overlay so your white text is readable
        backgroundColor: 'rgba(0, 0, 0, 0.4)', 
        backgroundBlendMode: 'overlay'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 560, padding: '20px' }}>
        <h1 style={{ color: 'white', fontSize: '3rem', marginBottom: '10px' }}>
          Peak Campus Link
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 16, marginBottom: '30px' }}>
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