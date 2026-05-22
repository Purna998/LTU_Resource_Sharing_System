import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';
import logo from '../assets/logo1.svg';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="theme-footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={logo} alt="Hamro Uni Logo" className="footer-logo-img" />
              <div className="logo-text-wrapper">
                <span className="logo-main-text-footer">Hamro Uni</span>
                <span className="logo-sub-text-footer">Student Resource Sharing Platform</span>
              </div>
            </Link>
            <p className="footer-desc">
              © {new Date().getFullYear()} Hamro Uni · The digital library of
              academic resources for all LTU students.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Github"><Github size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h3>Platform</h3>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/upload">Contribute</Link></li>
                <li><Link to="/about">About</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Support</h3>
              <ul>
                <li><a href="#">Contact Support</a></li>
                <li><a href="#">Guidelines</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Legal</h3>
              <ul>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Copyright Info</a></li>
                <li><a href="#">Academic Integrity</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Hamro Uni — Built for students, by students.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
