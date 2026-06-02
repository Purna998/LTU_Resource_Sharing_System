import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ClipboardList, BookOpen, ScrollText, CheckSquare, FlaskConical, ClipboardCheck, FolderOpen, Download, ArrowLeft } from 'lucide-react';
import axiosInstance from '../api/axios';
import './SubjectDashboard.css';

const RESOURCE_TYPE_ICONS = {
  syllabus:     ClipboardList,
  note:         BookOpen,
  old_question: ScrollText,
  solution:     CheckSquare,
  lab_report:   FlaskConical,
  assignment:   ClipboardCheck,
};

const RESOURCE_TYPE_LABELS = {
  syllabus:     'Syllabus',
  note:         'Notes & Study Material',
  old_question: 'Old Question Paper',
  solution:     'Solution / Guidelines',
  lab_report:   'Lab Report / Practical',
  assignment:   'Assignment / Project',
};

const RESOURCE_TYPE_COLORS = {
  syllabus:     '#6366f1',
  note:         '#2563eb',
  old_question: '#f59e0b',
  solution:     '#10b981',
  lab_report:   '#ec4899',
  assignment:   '#8b5cf6',
};

function SubjectDashboard() {
  const { semId: subjectId } = useParams();
  const [subjectName, setSubjectName] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('all');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resourcesRes, subjectRes] = await Promise.all([
        axiosInstance.get(`/resources/?subject=${subjectId}`),
        axiosInstance.get(`/subjects/${subjectId}/`),
      ]);
      setResources(resourcesRes.data.results || resourcesRes.data);
      setSubjectName(subjectRes.data.name || 'Subject');
    } catch (err) {
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = async (resourceId) => {
    try {
      const response = await axiosInstance.post(`/resources/${resourceId}/download/`);
      const { download_url, filename } = response.data;

      const link = document.createElement('a');
      link.href = download_url;
      link.setAttribute('download', filename || 'download.pdf');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setResources(prev =>
        prev.map(res => res.id === resourceId ? { ...res, downloads: res.downloads + 1 } : res)
      );
    } catch (err) {
      alert('Failed to initialise download. Please try again.');
    }
  };

  const availableTypes = ['all', ...new Set(resources.map(r => r.resource_type))];

  const filteredResources = activeType === 'all'
    ? resources
    : resources.filter(r => r.resource_type === activeType);

  if (loading) return <div className="loading-spinner">Loading resources...</div>;
  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={fetchData} className="retry-btn">Retry</button>
    </div>
  );

  return (
    <div className="subject-dashboard-container">
      {/* Hero Header */}
      <div className="hero-gradient-bg">
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1rem' }}>
            <Link to="/departments" style={{ color: 'inherit' }}>Departments</Link>
            <span>›</span>
            <span style={{ color: 'white' }}>{subjectName}</span>
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            {subjectName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem' }}>
            Browse all study materials for this subject
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="dashboard-layout">
          {/* Left sidebar */}
          <aside className="tabs-sidebar-premium">
            <h3 className="sidebar-group-title">Resource Type</h3>
            <ul className="tabs-list-premium">
              {availableTypes.map(type => {
                const count = type === 'all' ? resources.length : resources.filter(r => r.resource_type === type).length;
                const Icon = type === 'all' ? FolderOpen : (RESOURCE_TYPE_ICONS[type] || FolderOpen);
                const color = type === 'all' ? 'var(--brand-accent)' : (RESOURCE_TYPE_COLORS[type] || 'var(--brand-accent)');
                return (
                  <li
                    key={type}
                    className={`tab-btn-premium ${activeType === type ? 'active' : ''}`}
                    onClick={() => setActiveType(type)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="tab-icon" style={{ color: activeType === type ? color : undefined }}>
                      <Icon size={17} />
                    </span>
                    {type === 'all' ? 'All Materials' : RESOURCE_TYPE_LABELS[type] || type}
                    <span className="tab-badge">{count}</span>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Right panel */}
          <main className="resources-panel-premium">
            <div className="panel-top-bar">
              <h2>
                {activeType === 'all' ? 'All Materials' : RESOURCE_TYPE_LABELS[activeType] || activeType}
              </h2>
              <span className="panel-count">
                {filteredResources.length} file{filteredResources.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredResources.length === 0 ? (
              <div className="empty-state-modern">
                <div className="empty-icon-circle">
                  <FolderOpen size={32} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3>No resources yet</h3>
                <p>Be the first to upload study materials for this subject!</p>
                <Link to="/upload" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                  Upload Resource
                </Link>
              </div>
            ) : (
              <div className="resources-list-grid">
                {filteredResources.map(res => {
                  const Icon = RESOURCE_TYPE_ICONS[res.resource_type] || FolderOpen;
                  const color = RESOURCE_TYPE_COLORS[res.resource_type] || 'var(--brand-accent)';
                  return (
                    <div key={res.id} className="resource-card-premium">
                      <div className="resource-type-icon" style={{ background: `${color}18`, color }}>
                        <Icon size={22} strokeWidth={1.75} />
                      </div>
                      <div className="resource-body">
                        <div className="res-top">
                          <h3>{res.title}</h3>
                          {res.downloads > 10 && <span className="verified-badge">Popular</span>}
                        </div>
                        <div className="resource-meta-chips">
                          {res.year && <span className="meta-chip">📅 {res.year} B.S.</span>}
                          <span className="meta-chip">By: {res.contributor || 'Anonymous'}</span>
                          <span className="meta-chip">{new Date(res.uploaded_at).toLocaleDateString()}</span>
                          <span className="meta-chip">⬇ {res.downloads}</span>
                          {res.file_size && res.file_size !== 'Unknown' && (
                            <span className="meta-chip">🗂 {res.file_size}</span>
                          )}
                        </div>
                      </div>
                      <div className="resource-actions">
                        <button
                          className="view-btn-pill view-btn-download"
                          onClick={() => handleDownload(res.id)}
                          title="Download"
                        >
                          <Download size={16} /> Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SubjectDashboard;
