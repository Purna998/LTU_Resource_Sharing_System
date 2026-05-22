import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileX } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(37,99,235,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        color: 'var(--brand-accent)',
      }}>
        <FileX size={48} strokeWidth={1.5} />
      </div>
      <h1 style={{
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        marginBottom: '1rem',
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '0.75rem',
      }}>
        Page Not Found
      </h2>
      <p style={{
        color: 'var(--text-secondary)',
        maxWidth: 400,
        lineHeight: 1.6,
        marginBottom: '2rem',
        fontSize: '0.975rem',
      }}>
        The page you're looking for doesn't exist, was moved, or the URL may be incorrect.
      </p>
      <Link to="/" className="btn-primary" style={{ gap: '0.5rem' }}>
        <Home size={16} /> Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
