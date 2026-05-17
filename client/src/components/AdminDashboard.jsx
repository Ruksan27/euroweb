import React, { useState, useEffect } from 'react';
import {
  LucideShield, LucideLogOut, LucideUsers, LucideFileText,
  LucideDownload, LucideTrash2, LucideEye, LucideX, LucideEdit,
  LucideSearch, LucideChevronDown, LucideChevronUp,
  LucideMail, LucidePhone, LucideMapPin, LucideCalendar,
  LucideBriefcase, LucideGraduationCap, LucideCode2,
  LucideGlobe, LucideLink, LucideLoader2, LucideAward
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API } from '../config/api';

// ─── Login Screen ──────────────────────────────────────────────────────────────
export function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API.admin}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Welcome, Admin!');
        onLogin(data.token);
      } else {
        toast.error('Invalid username or password!');
      }
    } catch {
      toast.error('Server connection failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)]" />
      
      <div className="relative w-full max-w-md px-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4">
              <LucideShield size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">EuroBuilder AI — Secure Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="Enter admin username"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? <LucideLoader2 size={20} className="animate-spin" /> : <LucideShield size={20} />}
              {loading ? 'Logging in...' : 'Login to Admin'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Default: <span className="text-slate-400">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CV Detail Modal ────────────────────────────────────────────────────────────
function CVModal({ cv, token, onClose }) {
  const downloadPDF = () => {
    window.open(`${API.cv}/generate-pdf/${cv._id}`, '_blank');
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">
        <Icon size={16} />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-8 py-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-4">
            {cv.photoUrl ? (
              <img src={cv.photoUrl} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <LucideUsers size={24} className="text-indigo-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{cv.personalInfo?.fullName || 'Unknown'}</h2>
              <p className="text-slate-400 text-sm">{cv.personalInfo?.email}</p>
              {cv.folderName && <p className="text-xs text-indigo-400/70 mt-0.5">Folder: {cv.folderName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <LucideDownload size={16} />
              Download PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition">
              <LucideX size={20} />
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Personal Info */}
          <Section icon={LucideUsers} title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: LucideMail, label: 'Email', value: cv.personalInfo?.email },
                { icon: LucidePhone, label: 'Phone', value: cv.personalInfo?.phone },
                { icon: LucideCalendar, label: 'Date of Birth', value: cv.personalInfo?.dateOfBirth },
                { icon: LucideGlobe, label: 'Nationality', value: cv.personalInfo?.nationality },
                { icon: LucideUsers, label: 'Gender', value: cv.personalInfo?.gender },
                { icon: LucideShield, label: 'National ID', value: cv.personalInfo?.nationalId },
                { icon: LucideBriefcase, label: 'Passport No', value: cv.personalInfo?.passportNumber },
                { icon: LucideMapPin, label: 'Address', value: [cv.personalInfo?.address, cv.personalInfo?.city, cv.personalInfo?.country].filter(Boolean).join(', ') },
                { icon: LucideGlobe, label: 'Website', value: cv.personalInfo?.website },
                { icon: LucideLink, label: 'LinkedIn', value: cv.personalInfo?.linkedIn },
              ].filter(f => f.value).map((field, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <field.icon size={16} className="text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">{field.label}</p>
                    <p className="text-white text-sm font-medium">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Work Experience */}
          {cv.workExperience?.length > 0 && (
            <Section icon={LucideBriefcase} title="Work Experience">
              <div className="space-y-3">
                {cv.workExperience.map((job, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{job.occupation}</p>
                        <p className="text-indigo-400 text-sm">{job.employer}</p>
                        {(job.city || job.country) && (
                          <p className="text-slate-500 text-xs">{[job.city, job.country].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div className="flex items-center gap-1"><LucideCalendar size={12} /><span>{job.from}</span></div>
                        {job.to && <div className="flex items-center gap-1"><LucideCalendar size={12} /><span>{job.to}</span></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {cv.education?.length > 0 && (
            <Section icon={LucideGraduationCap} title="Education">
              <div className="space-y-3">
                {cv.education.map((edu, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{edu.qualification}</p>
                        <p className="text-indigo-400 text-sm">{edu.organization}</p>
                        {edu.documentUrl && (
                          <a href={edu.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 bg-emerald-500/10 px-2 py-1 rounded">
                            <LucideFileText size={12} /> View Certificate
                          </a>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <span>{edu.from}</span>
                        {edu.to && <span> — {edu.to}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Certificates */}
          {cv.certificates?.length > 0 && (
            <Section icon={LucideAward} title="Other Certificates">
              <div className="space-y-3">
                {cv.certificates.map((cert, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{cert.title}</p>
                        <p className="text-indigo-400 text-sm">{cert.issuer}</p>
                        {cert.documentUrl && (
                          <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 bg-emerald-500/10 px-2 py-1 rounded">
                            <LucideFileText size={12} /> View Document
                          </a>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <span>{cert.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Skills */}
          {cv.digitalSkills?.length > 0 && (
            <Section icon={LucideCode2} title="Digital Skills">
              <div className="flex flex-wrap gap-2">
                {cv.digitalSkills.map((skill, i) => (
                  <span key={i} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Languages */}
          {cv.languages?.length > 0 && (
            <Section icon={LucideGlobe} title="Languages">
              <div className="flex flex-wrap gap-2">
                {cv.languages.map((lang, i) => (
                  <span key={i} className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-sm">
                    {lang.language} — {lang.level}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Document Folder */}
          <Section icon={LucideFileText} title={`Attached Documents (${[cv.photoUrl, ...(cv.education || []).map(e=>e.documentUrl), ...(cv.certificates || []).map(c=>c.documentUrl), ...(cv.documents || []).map(d=>d.url)].filter(Boolean).length})`}>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {cv.photoUrl && (
                  <a href={cv.photoUrl} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition group">
                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><LucideUsers size={24} /></div>
                    <span className="text-xs text-slate-300 font-medium text-center line-clamp-2">Profile Photo</span>
                  </a>
                )}
                {cv.education?.map((edu, i) => edu.documentUrl && (
                  <a key={`edu-${i}`} href={edu.documentUrl} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition group">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><LucideFileText size={24} /></div>
                    <span className="text-xs text-slate-300 font-medium text-center line-clamp-2">{edu.documentName || `Education Cert ${i+1}`}</span>
                  </a>
                ))}
                {cv.certificates?.map((cert, i) => cert.documentUrl && (
                  <a key={`cert-${i}`} href={cert.documentUrl} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition group">
                    <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><LucideAward size={24} /></div>
                    <span className="text-xs text-slate-300 font-medium text-center line-clamp-2">{cert.documentName || `Extra Cert ${i+1}`}</span>
                  </a>
                ))}
                {cv.documents?.map((doc, i) => doc.url && (
                  <a key={`raw-${i}`} href={doc.url} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition group">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><LucideFileText size={24} /></div>
                    <span className="text-xs text-slate-300 font-medium text-center line-clamp-2">{doc.name || `Raw Upload ${i+1}`}</span>
                  </a>
                ))}
             </div>
          </Section>

          {/* Submitted At */}
          <div className="mt-6 pt-6 border-t border-white/10 text-slate-500 text-sm flex items-center gap-2">
            <LucideCalendar size={14} />
            <span>Submitted: {new Date(cv.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ───────────────────────────────────────────────────────
export default function AdminDashboard({ onLogout, onEditCV }) {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCV, setSelectedCV] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('admin_token');

  const fetchCVs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API.admin}/cvs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.cvs) setCvs(data.cvs);
      else if (Array.isArray(data)) setCvs(data);
      else toast.error('Failed to load CVs');
    } catch {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCVs(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) return;
    setDeletingId(id);
    try {
      await fetch(`${API.admin}/cvs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setCvs(prev => prev.filter(c => c._id !== id));
      toast.success('CV deleted successfully');
    } catch {
      toast.error('Failed to delete CV');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Logged out');
    onLogout();
  };

  const filtered = cvs.filter(cv => {
    const q = search.toLowerCase();
    return (
      cv.personalInfo?.fullName?.toLowerCase().includes(q) ||
      cv.personalInfo?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Nav */}
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <LucideShield size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-500 text-xs hidden sm:block">EuroBuilder AI — Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-slate-300">
              <span className="text-indigo-400 font-bold">{cvs.length}</span>
              <span className="hidden sm:inline"> Total CVs</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition px-2 sm:px-3 py-2 rounded-xl hover:bg-red-500/10"
            >
              <LucideLogOut size={16} />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total CVs Submitted', value: cvs.length, icon: LucideFileText, color: 'indigo' },
            { label: 'This Month', value: cvs.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: LucideCalendar, color: 'emerald' },
            { label: 'Today', value: cvs.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).length, icon: LucideUsers, color: 'violet' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={18} className={`text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold">{stat.value}</p>
                <p className="text-slate-500 text-xs sm:text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <LucideSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* CV Table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LucideLoader2 size={36} className="animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-slate-500">
            <LucideFileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No CVs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-3">
              {filtered.map((cv, index) => (
                <div key={cv._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                        {cv.personalInfo?.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{cv.personalInfo?.fullName || '—'}</p>
                        <p className="text-slate-400 text-xs">{cv.personalInfo?.email || '—'}</p>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">{new Date(cv.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(cv.digitalSkills || []).slice(0, 3).map((s, i) => (
                      <span key={i} className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <button onClick={() => setSelectedCV(cv)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition text-xs font-medium">
                      <LucideEye size={14} /> View
                    </button>
                    <button onClick={() => onEditCV && onEditCV(cv)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition text-xs font-medium">
                      <LucideEdit size={14} /> Edit
                    </button>
                    <button onClick={() => window.open(`${API.cv}/generate-pdf/${cv._id}`, '_blank')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition text-xs font-medium">
                      <LucideDownload size={14} /> PDF
                    </button>
                    <button onClick={() => handleDelete(cv._id)} disabled={deletingId === cv._id} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition text-xs font-medium disabled:opacity-50">
                      {deletingId === cv._id ? <LucideLoader2 size={14} className="animate-spin" /> : <LucideTrash2 size={14} />} Del
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-sm">
                      <th className="text-left px-5 py-4 font-medium">#</th>
                      <th className="text-left px-5 py-4 font-medium">Full Name</th>
                      <th className="text-left px-5 py-4 font-medium">Email</th>
                      <th className="text-left px-5 py-4 font-medium">Phone</th>
                      <th className="text-left px-5 py-4 font-medium">Submitted</th>
                      <th className="text-left px-5 py-4 font-medium">Skills</th>
                      <th className="text-right px-5 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((cv, index) => (
                      <tr key={cv._id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4 text-slate-500 text-sm">{index + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                              {cv.personalInfo?.fullName?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="text-white font-medium">{cv.personalInfo?.fullName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300 text-sm">{cv.personalInfo?.email || '—'}</td>
                        <td className="px-5 py-4 text-slate-300 text-sm">{cv.personalInfo?.phone || '—'}</td>
                        <td className="px-5 py-4 text-slate-400 text-sm">{new Date(cv.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(cv.digitalSkills || []).slice(0, 2).map((s, i) => (
                              <span key={i} className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                            {(cv.digitalSkills?.length || 0) > 2 && <span className="text-slate-500 text-xs">+{cv.digitalSkills.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setSelectedCV(cv)} className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition" title="View">
                              <LucideEye size={15} />
                            </button>
                            <button onClick={() => onEditCV && onEditCV(cv)} className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition" title="Edit">
                              <LucideEdit size={15} />
                            </button>
                            <button onClick={() => window.open(`${API.cv}/generate-pdf/${cv._id}`, '_blank')} className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition" title="PDF">
                              <LucideDownload size={15} />
                            </button>
                            <button onClick={() => handleDelete(cv._id)} disabled={deletingId === cv._id} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50" title="Delete">
                              {deletingId === cv._id ? <LucideLoader2 size={15} className="animate-spin" /> : <LucideTrash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CV Detail Modal */}
      {selectedCV && (
        <CVModal cv={selectedCV} token={token} onClose={() => setSelectedCV(null)} />
      )}
    </div>
  );
}
