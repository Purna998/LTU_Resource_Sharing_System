import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Book, ChevronRight, Home, Layers, AlertCircle } from 'lucide-react';
import { romanize } from '../utils/romanize';
import './SemesterSelect.css';

const SemesterSelect = () => {
  const { deptSlug, semesterId } = useParams();
  const [department, setDepartment] = useState(null);
  const [semester, setSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/departments/${deptSlug}/`),
      api.get(`/semesters/${semesterId}/`),
      // Fixed: query directly by semester__id instead of fetching all dept subjects + filtering in JS
      api.get(`/subjects/?semester__id=${semesterId}`)
    ])
      .then(([deptRes, semRes, subjectsRes]) => {
        setDepartment(deptRes.data);
        setSemester(semRes.data);
        setSubjects(subjectsRes.data.results || subjectsRes.data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [deptSlug, semesterId]);

  if (loading) {
    return (
      <div className="semester-view-container">
        <div className="hero-gradient-bg">
          <div className="container">
            <div className="skeleton skeleton-text-sm" style={{ width: 180, marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text-lg" style={{ width: '40%', marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text-sm" style={{ width: 300 }} />
          </div>
        </div>
        <div className="container py-12">
          <div className="subjects-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
            ))}
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

  if (!semester || !department) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <h2>Data not found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Go Home</Link>
      </div>
    );
  }

  return (
    <div className="semester-view-container">
      <div className="hero-gradient-bg">
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
            <Link to="/"><Home size={16} /></Link>
            <ChevronRight size={14} />
            <Link to={`/browse/${deptSlug}`} style={{ color: 'inherit' }}>{department.short_name}</Link>
            <ChevronRight size={14} />
            <span className="current" style={{ color: 'white' }}>Semester {romanize(semester.number)}</span>
          </div>
          <h1 className="semester-title">Semester {romanize(semester.number)}</h1>
          <p className="semester-subtitle-header">{department.name} — Select a subject to explore its resources.</p>
        </div>
      </div>

      <div className="container py-12">
        <div className="section-header-compact">
          <h2 className="section-title-small">Course Modules</h2>
          <p className="text-secondary">Explore dedicated resources for each subject in this semester.</p>
        </div>

        <div className="subjects-grid">
          {subjects.length > 0 ? subjects.map(subject => (
            <Link to={`/subject/${subject.slug}`} key={subject.id} className="subject-premium-card">
              <div className="subject-icon-box">
                <Book size={22} strokeWidth={1.5} />
              </div>
              <div className="subject-details">
                <h3>{subject.name}</h3>
                <div className="subject-meta-row">
                  {subject.code && <span className="subject-code-pill">{subject.code}</span>}
                  <span className="subject-resource-count">
                    <Layers size={14} /> {subject.resource_count || 0} Resources
                  </span>
                </div>
              </div>
              <div className="subject-action">
                <ChevronRight size={20} />
              </div>
            </Link>
          )) : (
            <div className="empty-state-card">
              <p>Subjects for this semester will be available soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemesterSelect;
