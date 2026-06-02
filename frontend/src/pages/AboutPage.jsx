import React from 'react';
import { Github, Linkedin } from 'lucide-react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="about-title">About the Platform</h1>
          <p className="about-hero-text">
            Our portal is a premier academic resource platform, providing comprehensive
            study materials for all departments to help students excel in their academic journey.
          </p>
        </div>
        <div className="wave-bg"></div>
      </section>

      <section className="container about-content">
        <div className="mission-section">
          <h2 className="content-title">Our <span>Mission</span></h2>
          <p className="mission-subtitle">Empowering students with accessible, high-quality learning materials</p>

          <div className="mission-text-block">
            <p>
              Our mission is to support students across the
              university by providing free, high-quality resources
              such as notes, question banks, lab solutions, and syllabuses.
            </p>
            <p>
              We aim to foster a collaborative community where students and faculty
              contribute to and benefit from a shared knowledge base,
              ensuring academic success for all.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>1000+</h3>
            <p>Resources</p>
          </div>
          <div className="stat-card">
            <h3>8</h3>
            <p>Semesters</p>
          </div>
          <div className="stat-card">
            <h3>5+</h3>
            <p>Departments</p>
          </div>
        </div>

        <div className="team-section">
          <h2 className="content-title">Our <span>Team</span></h2>
          <p className="mission-subtitle">The people behind the platform</p>

          <div className="team-grid">
            <div className="team-card">
              <div className="team-image-wrapper">
                <div className="team-placeholder">PK</div>
                <div className="team-social-overlay">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                    <Github size={20} />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
              <div className="team-info">
                <h3>Purna Kanta Acharya</h3>
                <p className="team-role">Lead Developer &amp; Founder</p>
                <div className="team-bio">
                  <p>
                    Passionate about creating accessible academic tools for the student community.
                    Building this platform as a central hub for student growth and collaboration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
