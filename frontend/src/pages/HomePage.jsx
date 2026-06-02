import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Monitor, Laptop, Cpu, HardHat, FileText, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import BackgroundParticles from '../components/BackgroundParticles';
import Hero3DScene from '../components/Hero3DScene';
import { useSubjectSearch } from '../hooks/useSubjectSearch';
import './HomePage.css';

const IconMap = {
  Monitor: Monitor,
  Laptop: Laptop,
  Cpu: Cpu,
  HardHat: HardHat,
  FileText: FileText
};

const HomePage = () => {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { search, isReady } = useSubjectSearch();
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/departments/')
      .then(res => {
        setDepartments(res.data.results || res.data);
        setDeptLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDeptLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      const results = search(val);
      setSuggestions(results);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const bestMatch = suggestions[0];
      navigate(`/semesters/${bestMatch.semester}/subjects`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  // Pick the first department's slug dynamically for the "View All" link
  const firstDeptSlug = departments.length > 0 ? departments[0].slug : null;

  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="particles-wrapper">
          <BackgroundParticles />
        </div>
        <div className="container hero-container">
          <div className="hero-split-layout">
            <div className="hero-content-left">
              <div className="hero-badge">University Resource Portal</div>
              <h1 className="hero-title">
                The Library of<br />
                <span className="hero-title-accent">Innovation.</span>
              </h1>
              <p className="hero-subtitle">
                Access syllabuses, notes, old questions and lab resources for all technical programs.
                Empowering the next generation of engineers and technologists.
              </p>
            </div>
            <div className="hero-content-right">
              <React.Suspense fallback={<div className="hero-3d-placeholder" />}>
                <Hero3DScene />
              </React.Suspense>
            </div>
          </div>

          <div className="hero-search-row">
            <form className="hero-search" onSubmit={handleSearch} ref={dropdownRef}>
              <div className="hero-search-wrapper">
                <div className="hero-input-group">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    className="hero-search-input"
                    placeholder={isReady ? 'Search by subject, department, or topic...' : 'Loading search...'}
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                    disabled={!isReady}
                  />
                </div>
                <button type="submit" className="hero-search-btn">Find Resource</button>

                {showDropdown && suggestions.length > 0 && (
                  <div className="search-dropdown">
                    {suggestions.map(sub => (
                      <div
                        key={sub.id}
                        className="search-dropdown-item"
                        onClick={() => {
                          navigate(`/semesters/${sub.semester}/subjects`);
                          setSearchQuery('');
                          setShowDropdown(false);
                        }}
                      >
                        <div className="search-item-title">
                          {sub.name} <span className="search-item-code">{sub.code}</span>
                        </div>
                        <div className="search-item-dept">{sub.department_name} • Semester {sub.semester_name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && searchQuery.trim() && suggestions.length === 0 && (
                  <div className="search-dropdown">
                    <div className="search-dropdown-empty">No subjects found matching "{searchQuery}"</div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section className="departments-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Explore Departments</h2>
              <p className="section-subtitle">Select your field of study to access specialized curriculum materials.</p>
            </div>
            {/* Use the first department slug dynamically, not a hardcoded value */}
            {departments.length > 0 && (
              <Link to={`/departments/${departments[0].id}/semesters`} className="section-link">
                View All <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="dept-grid">
            {deptLoading ? (
              // Skeleton loading cards
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="dept-card skeleton-card">
                  <div className="skeleton skeleton-icon" />
                  <div className="skeleton skeleton-text-lg" style={{ marginTop: '1rem' }} />
                  <div className="skeleton skeleton-text-sm" />
                </div>
              ))
            ) : departments.map(dept => {
              const Icon = IconMap[dept.icon_name] || FileText;
              return (
                <Link to={`/departments/${dept.id}/semesters`} key={dept.id} className="dept-card">
                  <div className="dept-card-top">
                    <div className="dept-card-icon">
                      <Icon size={22} />
                    </div>
                  </div>
                  <div className="dept-card-content">
                    <h3>{dept.short_name}</h3>
                    <p>{dept.name}</p>
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
      </section>

    </div>
  );
};

export default HomePage;
