import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DepartmentSelect from './pages/DepartmentSelect';
import SemesterSelect from './pages/SemesterSelect';
import SubjectDashboard from './pages/SubjectDashboard';
import UploadMaterial from './pages/UploadMaterial';
import NotFound from './pages/NotFound';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 0 }}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse/:deptSlug" element={<DepartmentSelect />} />
            <Route path="/browse/:deptSlug/semester/:semesterId" element={<SemesterSelect />} />
            <Route path="/subject/:subjectSlug" element={<SubjectDashboard />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/upload" element={<UploadMaterial />} />
            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
