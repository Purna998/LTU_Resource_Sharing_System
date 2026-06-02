import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import './SubjectSelect.css';

function SubjectSelect() {
  const { semId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [semesterName, setSemesterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, semesterRes] = await Promise.all([
        axiosInstance.get(`/subjects/?semester=${semId}`),
        axiosInstance.get(`/semesters/${semId}/`),
      ]);
      setSubjects(subjectsRes.data.results || subjectsRes.data);
      setSemesterName(semesterRes.data.name || 'Semester');
    } catch (err) {
      setError('Failed to fetch subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [semId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="loading-spinner">Loading subjects...</div>;

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="dept-view-container">
      <div className="dept-hero-banner">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/departments" style={{ color: 'rgba(255,255,255,0.65)' }}>Departments</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', cursor:'pointer' }} onClick={() => navigate(-1)}>Semesters</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span style={{ color: 'white' }}>{semesterName}</span>
          </div>
          <h1 className="dept-title">Select Subject</h1>
          <p className="dept-desc">
            Choose a subject from <strong>{semesterName}</strong> to browse study materials, notes, and past papers.
          </p>
        </div>
      </div>

      <div className="container semester-select-section">
        {subjects.length === 0 ? (
          <div className="subject-empty-state">
            <div className="empty-icon-circle" style={{margin: '0 auto 1.5rem', fontSize: '2rem'}}>📚</div>
            <h3>No subjects found</h3>
            <p>Subjects for this semester haven't been added yet.</p>
          </div>
        ) : (
          <div className="subject-card-grid">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="subject-select-card"
                onClick={() => navigate(`/subjects/${sub.id}/resources`)}
                style={{cursor: 'pointer'}}
              >
                <div className="subj-icon-box">
                  <span>📖</span>
                </div>
                <div className="subj-info">
                  <h3>{sub.name}</h3>
                  <div className="subj-meta-row">
                    {sub.code && <span className="subj-code-pill">{sub.code}</span>}
                    <span className="subj-resource-count">
                      {sub.resource_count || 0} resources
                    </span>
                  </div>
                </div>
                <div className="subj-action-icon">→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectSelect;
