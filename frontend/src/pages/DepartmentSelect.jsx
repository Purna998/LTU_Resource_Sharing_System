import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Monitor, Laptop, Cpu, HardHat, FileText, ChevronRight } from 'lucide-react';
import axiosInstance from '../api/axios';
import './HomePage.css';

const IconMap = {
  Monitor: Monitor,
  Laptop: Laptop,
  Cpu: Cpu,
  HardHat: HardHat,
  FileText: FileText,
};

function DepartmentSelect() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/departments/');
      setDepartments(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch departments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  if (loading) return <div className="loading-spinner">Loading departments...</div>;

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchDepartments} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="hero-gradient-bg">
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1rem' }}>
            <Link to="/" style={{ color: 'inherit' }}>Home</Link>
            <span>›</span>
            <span style={{ color: 'white' }}>Departments</span>
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Explore Departments
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 560, lineHeight: 1.65 }}>
            Select your department to browse semesters and specialized study materials.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
        <div className="dept-grid">
          {departments.map((dept) => {
            const Icon = IconMap[dept.icon_name] || FileText;
            return (
              <Link
                to={`/departments/${dept.id}/semesters`}
                key={dept.id}
                className="dept-card"
              >
                <div className="dept-card-top">
                  <div className="dept-card-icon">
                    <Icon size={22} />
                  </div>
                </div>
                <div className="dept-card-content">
                  <h3>{dept.short_name}</h3>
                  <p>{dept.name}</p>
                  {dept.description && (
                    <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {dept.description}
                    </p>
                  )}
                </div>
                <div className="dept-card-footer">
                  <span>Browse Resources</span>
                  <ChevronRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DepartmentSelect;
