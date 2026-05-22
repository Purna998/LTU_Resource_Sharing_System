import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { ChevronRight, BookOpen, Home, AlertCircle } from 'lucide-react';
import { romanize } from '../utils/romanize';
import './DepartmentSelect.css';

const DepartmentSelect = () => {
  const { deptSlug } = useParams();
  const [department, setDepartment] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/departments/${deptSlug}/`),
      api.get(`/semesters/?department__slug=${deptSlug}`)
    ])
      .then(([deptRes, semRes]) => {
        setDepartment(deptRes.data);
        setSemesters(semRes.data.results || semRes.data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load department data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [deptSlug]);

  if (loading) {
    return (
      <div className="dept-view-container">
        <div className="dept-hero-banner">
          <div className="container">
            <div className="skeleton skeleton-text-sm" style={{ width: 120, marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text-lg" style={{ width: '50%', marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text-sm" style={{ width: 300, marginBottom: '1rem' }} />
          </div>
        </div>
        <div className="semester-select-section">
          <div className="container">
            <div className="semester-grid-exclusive">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={48} color="var(--brand-accent)" />
          <h2 style={{ fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <h2>Department not found.</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Go Home</Link>
      </div>
    );
  }

  return (
    <div className="dept-view-container">
      {/* Hero Banner */}
      <div className="dept-hero-banner">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/"><Home size={15} /></Link>
            <ChevronRight size={13} />
            <span className="current">{department.short_name}</span>
          </div>
          <h1 className="dept-title">{department.name}</h1>
          <p className="dept-desc">{department.description}</p>
          <div className="dept-meta">
            <span className="badge-pill">{department.short_name}</span>
            {/* Use actual semester count from the API, not hardcoded "8" */}
            <span className="badge-pill">{semesters.length} Semester{semesters.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Semester Selection */}
      <div className="semester-select-section">
        <div className="container">
          <div className="section-header-compact">
            <h2 className="section-title-small">Select Semester</h2>
            <p className="text-secondary">Choose a semester to explore its subjects tailored for your faculty.</p>
          </div>

          <div className="semester-grid-exclusive">
            {semesters.map(sem => (
              <Link to={`/browse/${deptSlug}/semester/${sem.id}`} key={sem.id} className="semester-premium-card">
                <div className="sem-number-glow">
                  {romanize(sem.number)}
                </div>
                <div className="sem-info">
                  <h3>Semester {romanize(sem.number)}</h3>
                  <div className="sem-stats">
                    <BookOpen size={13} /> {sem.subject_count} Core Subjects
                  </div>
                </div>
                <div className="sem-action-icon">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSelect;
