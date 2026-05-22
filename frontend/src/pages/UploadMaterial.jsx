import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, ChevronRight, UploadCloud, Info, CheckCircle2, AlertCircle, Loader2, Calendar, FileType } from 'lucide-react';
import api from '../api/axios';
import { romanize } from '../utils/romanize';
import './UploadMaterial.css';

const RESOURCE_TYPES = [
  { id: 'note', label: 'Notes' },
  { id: 'old_question', label: 'Old Questions' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'lab_report', label: 'Lab Reports' },
  { id: 'solution', label: 'Solutions' },
  { id: 'assignment', label: 'Assignments' },
];

// Must stay in sync with backend MAX_UPLOAD_MB in api_views.py
const MAX_FILE_MB = 20;

/**
 * Approximate current Bikram Sambat year.
 * BS year ≈ AD year + 56/57 (the offset changes in April).
 */
const getCurrentBSYear = () => {
  const adYear = new Date().getFullYear();
  // Rough conversion: BS is ~56.7 years ahead of AD
  return adYear + 57;
};

const UploadMaterial = () => {
  const [searchParams] = useSearchParams();
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    title: '',
    contributor: '',
    department: '',
    semester: '',
    subject: '',
    resource_type: 'note',
    year: getCurrentBSYear(),  // Fixed: default to current BS year, not AD
    file: null
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Initialize from query parameters (context-aware pre-fill)
  useEffect(() => {
    const subjectSlug = searchParams.get('subject');
    const typeParam = searchParams.get('type');

    if (subjectSlug) {
      setLoading(true);
      api.get(`/subjects/${subjectSlug}/`)
        .then(res => {
          const sub = res.data;
          setForm(prev => ({
            ...prev,
            department: sub.department_slug,
            semester: sub.semester,
            subject: sub.id,
            resource_type: typeParam || prev.resource_type
          }));
        })
        .catch(err => console.error('Error pre-filling subject details', err))
        .finally(() => setLoading(false));
    } else if (typeParam) {
      setForm(prev => ({ ...prev, resource_type: typeParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    api.get('/departments/')
      .then(res => setDepartments(res.data.results || res.data))
      .catch(err => console.error('Error fetching departments', err));
  }, []);

  useEffect(() => {
    if (form.department) {
      api.get(`/semesters/?department__slug=${form.department}`)
        .then(res => setSemesters(res.data.results || res.data))
        .catch(err => console.error('Error fetching semesters', err));
    } else {
      setSemesters([]);
    }
  }, [form.department]);

  useEffect(() => {
    if (form.semester) {
      setLoading(true);
      api.get(`/subjects/?semester__id=${form.semester}`)
        .then(res => {
          setSubjects(res.data.results || res.data);
        })
        .catch(err => console.error('Error fetching subjects', err))
        .finally(() => setLoading(false));
    } else {
      setSubjects([]);
    }
  }, [form.semester]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateFile = (file) => {
    if (!file) return null;
    if (file.type !== 'application/pdf') {
      return 'Please upload only PDF files.';
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_FILE_MB}MB.`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const err = validateFile(file);
    if (err) {
      setStatus({ type: 'error', message: err });
    } else {
      setForm(prev => ({ ...prev, file }));
      setStatus({ type: '', message: '' });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    const err = validateFile(file);
    if (err) {
      setStatus({ type: 'error', message: err });
    } else if (file) {
      setForm(prev => ({ ...prev, file }));
      setStatus({ type: '', message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file || !form.subject) {
      setStatus({ type: 'error', message: 'Please select a subject and upload a file.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('contributor', form.contributor);
    formData.append('subject', form.subject);
    formData.append('resource_type', form.resource_type);
    formData.append('year', form.year);
    formData.append('file', form.file);

    try {
      await api.post('/resources/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({
        type: 'success',
        message: 'Resource uploaded successfully! It will be visible once an administrator verifies it.'
      });
      setForm(prev => ({
        title: '',
        contributor: '',
        department: prev.department,
        semester: prev.semester,
        subject: '',
        resource_type: 'note',
        year: getCurrentBSYear(),
        file: null
      }));
    } catch (err) {
      const apiError = err?.response?.data;
      const message = apiError?.file?.[0] || apiError?.detail || 'Upload failed. Please check the file and try again.';
      setStatus({ type: 'error', message });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="upload-view-container">
      <div className="hero-gradient-bg">
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
            <Link to="/" style={{ color: 'inherit' }}><Home size={14} /></Link>
            <ChevronRight size={14} />
            <span style={{ color: 'white' }}>Contribute</span>
          </div>
          <h1 className="upload-title">
            <UploadCloud size={32} style={{ marginRight: '0.75rem', verticalAlign: 'middle' }} />
            Share Your Study Resources
          </h1>
          <p className="upload-subtitle">Submit notes, old questions, or lab reports. Our team will verify and publish them.</p>
        </div>
      </div>

      <div className="container py-12">
        <div className="upload-layout-grid">
          <div className="upload-form-card premium-card">
            <h2 className="form-section-title">Resource Details</h2>

            {status.message && (
              <div className={`status-banner ${status.type}`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Resource Title *</label>
                <input
                  type="text"
                  name="title"
                  className="input-field"
                  required
                  placeholder="e.g. Unit 1 Complete Notes"
                  value={form.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Contributor Name</label>
                  <input
                    type="text"
                    name="contributor"
                    className="input-field"
                    placeholder="Your Name"
                    value={form.contributor}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Resource Category *</label>
                  <select
                    name="resource_type"
                    className="input-field"
                    value={form.resource_type}
                    onChange={handleInputChange}
                  >
                    {RESOURCE_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    className="input-field"
                    required
                    value={form.department}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.slug} value={dept.slug}>{dept.short_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester *</label>
                  <select
                    name="semester"
                    className="input-field"
                    required
                    value={form.semester}
                    onChange={handleInputChange}
                    disabled={!form.department}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem.id} value={sem.id}>Sem {romanize(sem.number)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    name="subject"
                    className="input-field"
                    required
                    disabled={!form.semester || loading}
                    value={form.subject}
                    onChange={handleInputChange}
                  >
                    <option value="">{loading ? 'Loading...' : 'Select Subject'}</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.resource_type === 'old_question' && (
                <div className="form-group year-hint-box animate-fade-in">
                  <label><Calendar size={16} /> Exam Year (BS) *</label>
                  <input
                    type="number"
                    name="year"
                    className="input-field"
                    required
                    min="2060"
                    max="2090"
                    placeholder="e.g. 2080"
                    value={form.year}
                    onChange={handleInputChange}
                  />
                  <small className="help-text">Please enter the examination year in Bikram Sambat (BS) only.</small>
                </div>
              )}

              <div className="form-group">
                <label>File (PDF only) *</label>
                <div className="file-input-container">
                  <input
                    type="file"
                    required
                    accept=".pdf"
                    id="file-upload"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`file-drop-zone ${form.file ? 'file-selected' : ''} ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="drop-zone-content">
                      <div className="icon-wrapper-premium">
                        {form.file ? <FileType size={32} /> : <UploadCloud size={48} />}
                      </div>
                      <div className="text-content">
                        <span className="main-text">{form.file ? form.file.name : 'Click to select PDF or Drag and Drop'}</span>
                        {!form.file && <span className="sub-text">Only PDF files are supported (Max {MAX_FILE_MB}MB)</span>}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '1rem', marginTop: '1.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Uploading...
                  </>
                ) : (
                  'Submit for Admin Verification'
                )}
              </button>
            </form>
          </div>

          <aside className="upload-tips-sidebar">
            <div className="tips-card">
              <h3><Info size={18} /> Review Process</h3>
              <ul className="tips-list">
                <li>Every resource is manually reviewed by moderators.</li>
                <li>Verify your file doesn't have watermarks or empty pages.</li>
                <li>Make sure the title reflects the chapter or exam year.</li>
                <li>Enter exam years in Bikram Sambat (BS) format.</li>
                <li>Verified resources earn a special badge!</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UploadMaterial;
