import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Menu, X, Sun, Moon, Monitor, Laptop, Cpu, HardHat, FileText } from 'lucide-react';
import api from '../api/axios';
import { useSubjectSearch } from '../hooks/useSubjectSearch';
import logo from '../assets/logo1.svg';
import './Navbar.css';

const IconMap = {
  Monitor: Monitor,
  Laptop: Laptop,
  Cpu: Cpu,
  HardHat: HardHat,
  FileText: FileText
};

const Navbar = ({ theme, toggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  const { search, isReady } = useSubjectSearch();
  const searchDropdownRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setShowMobileSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      setSuggestions(search(val));
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      navigate(`/subject/${suggestions[0].slug}`);
      setSearchQuery('');
      setShowSearchDropdown(false);
      setShowMobileSearch(false);
    }
  };

  const handleSuggestionClick = (sub) => {
    navigate(`/subject/${sub.slug}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setShowMobileSearch(false);
  };

  useEffect(() => {
    api.get('/departments/')
      .then(res => setDepartments(res.data.results || res.data))
      .catch(err => console.error(err));

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setShowDeptDropdown(false);
    setShowSearchDropdown(false);
    setIsMobileMenuOpen(false);
    setShowMobileSearch(false);
    setSearchQuery('');
  }, [location.pathname]);

  const SearchDropdownResults = () => (
    <>
      {showSearchDropdown && suggestions.length > 0 && (
        <div className="nav-search-dropdown">
          {suggestions.map(sub => (
            <div
              key={sub.id}
              className="nav-search-item"
              onClick={() => handleSuggestionClick(sub)}
            >
              <div className="nav-search-title">{sub.name} <span className="nav-search-code">{sub.code}</span></div>
              <div className="nav-search-dept">{sub.department_name} • Semester {sub.semester_name}</div>
            </div>
          ))}
        </div>
      )}
      {showSearchDropdown && searchQuery.trim() && suggestions.length === 0 && (
        <div className="nav-search-dropdown">
          <div className="nav-search-empty">No matching subjects</div>
        </div>
      )}
    </>
  );

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Hamro Uni Logo" className="navbar-logo-img" />
          <div className="logo-text-wrapper">
            <span className="logo-main-text">Hamro Uni</span>
            <span className="logo-sub-text">Student Resource Sharing Platform</span>
          </div>
        </Link>

        <div className="nav-right-header">
          {/* Mobile: Search toggle */}
          <button
            className="mobile-search-toggle mobile-only"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle Search"
          >
            <Search size={20} />
          </button>

          {/* Mobile: Theme toggle */}
          <button onClick={toggleTheme} className="theme-toggle-btn mobile-only" aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active-link' : ''}>Home</Link>

          {/* Department Dropdown */}
          <div
            className="dropdown-container"
            onMouseEnter={() => window.innerWidth > 768 && setShowDeptDropdown(true)}
            onMouseLeave={() => window.innerWidth > 768 && setShowDeptDropdown(false)}
          >
            <button 
              className="nav-dropdown-btn"
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
            >
              Departments <ChevronDown size={16} />
            </button>
            {showDeptDropdown && (
              <div className="dropdown-menu-premium">
                <div className="dropdown-header">
                  <span>Specializations</span>
                  <span className="count-badge">{departments.length} Faculties</span>
                </div>
                <div className="dropdown-grid">
                  {departments.map(dept => {
                    const Icon = IconMap[dept.icon_name] || FileText;
                    return (
                      <Link
                        key={dept.id}
                        to={`/browse/${dept.slug}`}
                        className="dropdown-item-premium"
                      >
                        <div className="dropdown-item-icon">
                          <Icon size={18} />
                        </div>
                        <div className="dropdown-item-content">
                          <span className="dropdown-item-title">{dept.short_name}</span>
                          <span className="dropdown-item-desc">{dept.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link to="/about" className={location.pathname === '/about' ? 'active-link' : ''}>About</Link>

          {/* Desktop Only Toggle */}
          <button onClick={toggleTheme} className="theme-toggle-btn desktop-only" aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Desktop Search */}
          <form className="nav-search desktop-only" onSubmit={handleSearch} ref={searchDropdownRef}>
            <input
              type="text"
              placeholder={isReady ? 'Search Subject...' : 'Loading...'}
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              disabled={!isReady}
            />
            <Search className="search-icon" size={18} />
            <SearchDropdownResults />
          </form>

          <Link to="/upload" className="btn-primary contribute-btn">Contribute</Link>
        </div>
      </div>

      {/* Mobile Search Bar — appears below navbar when toggled */}
      {showMobileSearch && (
        <div className="mobile-search-bar" ref={mobileSearchRef}>
          <form className="mobile-search-form" onSubmit={handleSearch}>
            <div className="mobile-search-inner">
              <Search size={18} className="mobile-search-icon" />
              <input
                type="text"
                autoFocus
                placeholder={isReady ? 'Search subject, department...' : 'Loading search...'}
                value={searchQuery}
                onChange={handleInputChange}
                disabled={!isReady}
                className="mobile-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mobile-search-clear"
                  onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <SearchDropdownResults />
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
