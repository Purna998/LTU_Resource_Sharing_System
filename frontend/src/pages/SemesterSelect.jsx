import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import './DepartmentSelect.css';

function SemesterSelect() {
  const { deptId } = useParams();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchSemesters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/semesters/?department=${deptId}`);
      setSemesters(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch semesters. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  if (loading) return <div className="loading-spinner">Loading semesters...</div>;
  
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchSemesters} className="retry-btn">Retry</button>
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
            <span style={{ color: 'white' }}>Select Semester</span>
          </div>
          <h1 className="dept-title">Select Semester</h1>
          <p className="dept-desc">Choose your current semester to browse specialized subjects and study materials.</p>
        </div>
      </div>

      <div className="container semester-select-section">
        <div className="semester-grid-exclusive">
          {semesters.map((sem) => (
            <div 
              key={sem.id} 
              className="semester-premium-card"
              onClick={() => navigate(`/semesters/${sem.id}/subjects`)}
              style={{cursor: 'pointer'}}
            >
              <div className="sem-number-glow">
                {sem.number || sem.name.replace(/[^0-9]+/g, '') || sem.name.charAt(sem.name.length - 1)}
              </div>
              <div className="sem-info">
                <h3>{sem.name}</h3>
                <div className="sem-stats">
                  <span>{sem.resource_count || 0} Resources available</span>
                </div>
              </div>
              <div className="sem-action-icon">
                →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SemesterSelect;
