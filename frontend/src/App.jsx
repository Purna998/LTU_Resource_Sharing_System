import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DepartmentSelect from './pages/DepartmentSelect';
import SemesterSelect from './pages/SemesterSelect';
import SubjectSelect from './pages/SubjectSelect';
import SubjectDashboard from './pages/SubjectDashboard';
import UploadMaterial from './pages/UploadMaterial';
import NoticeBoard from './pages/NoticeBoard';
import AboutPage from './pages/AboutPage';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <ErrorBoundary>
        <div className="app-container">
          <ScrollToTop />
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/departments" element={<DepartmentSelect />} />
              <Route path="/departments/:deptId/semesters" element={<SemesterSelect />} />
              <Route path="/semesters/:semId/subjects" element={<SubjectSelect />} />
              <Route path="/subjects/:semId/resources" element={<SubjectDashboard />} />
              <Route path="/upload" element={<UploadMaterial />} />
              <Route path="/notices" element={<NoticeBoard />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Fallback route for 404 pages */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
