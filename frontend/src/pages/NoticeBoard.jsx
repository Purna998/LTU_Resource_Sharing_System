import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../api/axios';
import './NoticeBoard.css';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notices/')
      .then(res => {
        setNotices(res.data.results || res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container text-center" style={{padding: '5rem 0'}}>Loading notices...</div>;

  return (
    <div className="notice-board-container">
      <div className="hero-gradient-bg">
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
            <Link to="/" style={{ color: 'inherit' }}>Home</Link>
            <span className="breadcrumb-separator">/</span>
            <span style={{ color: 'white' }}>Notice Board</span>
          </div>
          <h1 className="notice-board-title">
            <Bell size={32} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> 
            Notice Board
          </h1>
          <p className="notice-board-subtitle">Official announcements, routines, and results from LTU.</p>
        </div>
      </div>

      <div className="container py-12">
        <div className="notices-wrapper-premium">
        {notices.length > 0 ? (
          <ul className="notices-list-full">
            {notices.map(notice => (
              <li key={notice.id} className="notice-item-full">
                <div className="notice-meta">
                  <span className="notice-date">{new Date(notice.date_published).toLocaleDateString()}</span>
                  {notice.department_name && <span className="notice-tag">{notice.department_name}</span>}
                </div>
                <h2 className="notice-title-full">{notice.title}</h2>
                <div className="notice-content">
                  {notice.content}
                </div>
                {notice.link && (
                  <a href={notice.link} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem'}}>
                    View Official Document
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-secondary text-center" style={{padding: '3rem 0'}}>No notices currently available.</p>
        )}
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;
