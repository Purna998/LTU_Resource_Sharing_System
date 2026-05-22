import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { FileText, BookOpen, Eye, HelpCircle, FileCheck, CheckCircle2, ChevronRight, Home, AlertCircle, Download } from 'lucide-react';
import { romanize } from '../utils/romanize';
import './SubjectDashboard.css';

const TABS = [
  { id: 'note', label: 'Notes', icon: <FileText size={18} /> },
  { id: 'old_question', label: 'Old Questions', icon: <HelpCircle size={18} /> },
  { id: 'syllabus', label: 'Syllabus', icon: <BookOpen size={18} /> },
  { id: 'lab_report', label: 'Lab Reports', icon: <FileCheck size={18} /> },
];

const SubjectDashboard = () => {
  const { subjectSlug } = useParams();
  const [subject, setSubject] = useState(null);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState('note');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Use Promise.all so both calls run in parallel and loading ends when BOTH are done
    Promise.all([
      api.get(`/subjects/${subjectSlug}/`),
      api.get(`/resources/?subject__slug=${subjectSlug}`)
    ])
      .then(([subjectRes, resourcesRes]) => {
        setSubject(subjectRes.data);
        setResources(resourcesRes.data.results || resourcesRes.data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load subject data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [subjectSlug]);

  if (loading) {
    return (
      <div className="subject-dashboard-container">
        <div className="hero-gradient-bg">
          <div className="container">
            <div className="skeleton skeleton-text-sm" style={{ width: 200, marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text-lg" style={{ width: '60%', marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text-sm" style={{ width: 250 }} />
          </div>
        </div>
        <div className="container py-8">
          <div className="dashboard-layout">
            <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
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

  if (!subject) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <h2>Subject not found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Go Home</Link>
      </div>
    );
  }

  const currentResources = resources.filter(r => r.resource_type === activeTab);

  return (
    <div className="subject-dashboard-container">
      <div className="hero-gradient-bg">
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
            <Link to="/"><Home size={16} /></Link>
            <ChevronRight size={14} />
            <Link to={`/browse/${subject.department_slug}`} style={{ color: 'inherit' }}>
              {subject.department_short_name || subject.department_name}
            </Link>
            <ChevronRight size={14} />
            <Link to={`/browse/${subject.department_slug}/semester/${subject.semester}`} style={{ color: 'inherit' }}>
              Sem {romanize(subject.semester_number)}
            </Link>
            <ChevronRight size={14} />
            <span className="current" style={{ color: 'white' }}>{subject.name}</span>
          </div>
          <h1 className="dashboard-title">{subject.name}</h1>
          <p className="dashboard-subtitle-header">
            {subject.code} • {subject.credit_hours} Credits • Sem {romanize(subject.semester_number)}
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="dashboard-layout">
          <aside className="tabs-sidebar-premium">
            <div className="sidebar-group-title">Resource Categories</div>
            <ul className="tabs-list-premium">
              {TABS.map(tab => (
                <li key={tab.id}>
                  <button
                    className={`tab-btn-premium ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-badge">
                      {resources.filter(r => r.resource_type === tab.id).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="resources-panel-premium">
            <div className="panel-top-bar">
              <h2>{TABS.find(t => t.id === activeTab)?.label} List</h2>
              <Link to={`/upload?subject=${subject.slug}&type=${activeTab}`} className="btn-primary-sm">
                + Upload New
              </Link>
            </div>

            <div className="resources-list-grid">
              {currentResources.length > 0 ? (
                currentResources.map(res => (
                  <div key={res.id} className="resource-card-premium">
                    <div className="resource-type-icon">
                      {TABS.find(t => t.id === activeTab)?.icon}
                    </div>
                    <div className="resource-body">
                      <div className="res-top">
                        <h3>{res.title}</h3>
                        {res.is_approved && <span className="verified-badge"><CheckCircle2 size={12} /> Verified</span>}
                      </div>
                      <div className="resource-meta-chips">
                        {res.year && <span className="meta-chip">Year {res.year}</span>}
                        {res.contributor && <span className="meta-chip">By {res.contributor}</span>}
                        {res.downloads > 0 && <span className="meta-chip">{res.downloads} downloads</span>}
                      </div>
                    </div>
                    <div className="resource-actions">
                      {/* View button — opens in browser */}
                      <a href={res.file} target="_blank" rel="noopener noreferrer" className="view-btn-pill" title="View">
                        <Eye size={16} /> View
                      </a>
                      {/* Download button — force download */}
                      <a
                        href={res.file}
                        download
                        className="view-btn-pill view-btn-download"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-modern">
                  <div className="empty-icon-circle">
                    {TABS.find(t => t.id === activeTab)?.icon}
                  </div>
                  <h3>No {TABS.find(t => t.id === activeTab)?.label} Found</h3>
                  <p>Be the first to help your fellow students by contributing to this subject.</p>
                  <Link to={`/upload?subject=${subject.slug}&type=${activeTab}`} className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                    Share Resources
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SubjectDashboard;
