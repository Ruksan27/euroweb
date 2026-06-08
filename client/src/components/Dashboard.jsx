import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LucideFileText, LucideEye, LucideTrash, LucideExternalLink, LucideDownload,
  LucideUsers, LucideSearch, LucideLoader2, LucideCalendar, LucideBriefcase, LucideEdit
} from 'lucide-react';
import { API } from '../config/api';
import { toast } from 'react-hot-toast';
import UserManagement from './UserManagement';
import CVModal from './CVModal';

const Dashboard = ({ onLogout, onEditCV }) => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-cvs'); // 'my-cvs' | 'users' | 'all-cvs'
  
  // Admin-specific states
  const [allCvs, setAllCvs] = useState([]);
  const [allCvsLoading, setAllCvsLoading] = useState(false);
  const [allCvsSearch, setAllCvsSearch] = useState('');
  const [selectedAllCV, setSelectedAllCV] = useState(null);
  const [deletingAllId, setDeletingAllId] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user_data') || '{}');
    } catch {
      return {};
    }
  });

  const token = localStorage.getItem('user_token');

  useEffect(() => {
    fetchCvs();
  }, []);

  useEffect(() => {
    if (activeTab === 'all-cvs' && user.role === 'admin') {
      fetchAllCvs();
    }
  }, [activeTab]);

  const fetchCvs = async () => {
    try {
      const response = await axios.get(`${API.cv}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCvs(response.data);
    } catch (error) {
      console.error("Failed to fetch CVs", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Session expired, please login again.");
        if (onLogout) onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCvs = async () => {
    setAllCvsLoading(true);
    try {
      const response = await axios.get(`${API.admin}/cvs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.cvs) {
        setAllCvs(response.data.cvs);
      } else if (Array.isArray(response.data)) {
        setAllCvs(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch all system CVs", error);
      toast.error("Failed to load system CVs");
    } finally {
      setAllCvsLoading(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (id, fullName) => {
    const toastId = toast.loading('Generating PDF...');
    setDownloadingId(id);
    try {
      const response = await axios.get(`${API.cv}/generate-pdf/${id}`, {
        responseType: 'blob',
        timeout: 60000,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const name = (fullName || 'CV').replace(/\s+/g, '_');
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${name}_Europass.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      toast.success('PDF downloaded! 🚀', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeletePersonal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this CV?")) return;
    try {
      await axios.delete(`${API.cv}/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCvs(p => p.filter(c => c._id !== id));
      toast.success("CV deleted successfully");
    } catch (error) {
      console.error("Failed to delete CV", error);
      toast.error("Failed to delete CV");
    }
  };

  const handleDeleteSystem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this CV from the system?")) return;
    setDeletingAllId(id);
    try {
      await axios.delete(`${API.admin}/cvs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllCvs(prev => prev.filter(c => c._id !== id));
      // Sync personal CV state in case the deleted CV belonged to the admin
      setCvs(prev => prev.filter(c => c._id !== id));
      toast.success("CV deleted from system successfully");
    } catch (error) {
      console.error("Failed to delete system CV", error);
      toast.error("Failed to delete CV from system");
    } finally {
      setDeletingAllId(null);
    }
  };

  const filteredSystemCvs = allCvs.filter(cv => {
    const q = allCvsSearch.toLowerCase();
    return (
      (cv.personalInfo?.fullName || '').toLowerCase().includes(q) ||
      (cv.personalInfo?.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto py-10 px-4 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user.role === 'admin' ? 'Admin Portal & Dashboard' : 'Your Saved CVs'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {user.role === 'admin' 
              ? 'Manage your personal CVs and oversee application system resources' 
              : 'Manage and download your generated Europass documents'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-sm font-semibold text-white">
              {user.fullName || 'User'} 
              {user.role === 'admin' && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase font-bold rounded-md">Admin</span>
              )}
            </span>
            <span className="block text-xs text-slate-400">{user.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-xl border border-red-500/20 transition font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Selector for Admin */}
      {user.role === 'admin' && (
        <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5 max-w-lg">
          <button
            onClick={() => setActiveTab('my-cvs')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'my-cvs' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <LucideFileText size={16} /> My CVs
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <LucideUsers size={16} /> Manage Users
          </button>
          <button
            onClick={() => setActiveTab('all-cvs')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'all-cvs' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <LucideBriefcase size={16} /> All System CVs
          </button>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'users' && user.role === 'admin' ? (
        <UserManagement token={token} onLogout={onLogout} />
      ) : activeTab === 'all-cvs' && user.role === 'admin' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <LucideFileText size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{allCvs.length}</p>
                <p className="text-slate-500 text-xs sm:text-sm">Total CVs Saved</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <LucideCalendar size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold">
                  {allCvs.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                </p>
                <p className="text-slate-500 text-xs sm:text-sm">Created Last 30 Days</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <LucideSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={allCvsSearch}
              onChange={e => setAllCvsSearch(e.target.value)}
              placeholder="Search CV database by name or email..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition"
            />
          </div>

          {/* Grid and Table */}
          {allCvsLoading ? (
            <div className="flex items-center justify-center py-32">
              <LucideLoader2 size={36} className="animate-spin text-primary-400" />
            </div>
          ) : filteredSystemCvs.length === 0 ? (
            <div className="text-center py-32 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
              <LucideFileText size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No CV documents found</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-sm bg-black/20">
                      <th className="px-6 py-4 font-medium">#</th>
                      <th className="px-6 py-4 font-medium">Full Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Submitted</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSystemCvs.map((cv, index) => (
                      <tr key={cv._id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-slate-500 text-sm">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                              {cv.personalInfo?.fullName?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="text-white font-medium">{cv.personalInfo?.fullName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{cv.personalInfo?.email || '—'}</td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{cv.personalInfo?.phone || '—'}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{new Date(cv.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedAllCV(cv)}
                              className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition"
                              title="View CV Details"
                            >
                              <LucideEye size={15} />
                            </button>
                            <button
                              onClick={() => onEditCV && onEditCV(cv)}
                              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition"
                              title="Edit CV"
                            >
                              <LucideEdit size={15} />
                            </button>
                            <button
                              onClick={() => handleDownload(cv._id)}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition"
                              title="Download PDF"
                            >
                              <LucideDownload size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteSystem(cv._id)}
                              disabled={deletingAllId === cv._id}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50"
                              title="Delete from System"
                            >
                              {deletingAllId === cv._id ? <LucideLoader2 size={15} className="animate-spin" /> : <LucideTrash size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal details preview */}
          {selectedAllCV && (
            <CVModal cv={selectedAllCV} onClose={() => setSelectedAllCV(null)} />
          )}
        </div>
      ) : (
        /* 'my-cvs' / Standard Personal CV Panel */
        <div className="animate-fadeIn">
          {loading ? (
            <div className="text-center py-20 animate-pulse text-slate-500 flex items-center justify-center gap-2">
              <LucideLoader2 className="animate-spin" size={18} />
              Loading your CVs...
            </div>
          ) : cvs.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
              <LucideFileText className="mx-auto mb-4 text-slate-600 animate-pulse" size={48} />
              <p className="text-slate-400 text-lg">No personal CVs saved yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cvs.map((cv) => (
                <div key={cv._id} className="glass p-6 rounded-2xl hover:border-primary-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary-600/20 p-3 rounded-xl text-primary-400">
                      <LucideFileText size={24} />
                    </div>
                    <div className="flex gap-2">
                      {cv.documentUrl && (
                        <a 
                          href={cv.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="View Original Document"
                        >
                          <LucideExternalLink size={18} />
                        </a>
                      )}
                      <button 
                        onClick={() => handleDeletePersonal(cv._id)}
                        className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete CV"
                      >
                        <LucideTrash size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-1 truncate">{cv.personalInfo.fullName || 'Unnamed CV'}</h3>
                  <p className="text-slate-400 text-sm mb-4 truncate">{cv.personalInfo.email}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-slate-500">
                      {new Date(cv.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onEditCV && onEditCV(cv)}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium text-sm transition-transform hover:scale-105 active:scale-95"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDownload(cv._id, cv.personalInfo?.fullName)}
                        disabled={downloadingId === cv._id}
                        className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                      >
                        {downloadingId === cv._id ? <LucideLoader2 size={16} className="animate-spin" /> : <LucideDownload size={16} />}
                        {downloadingId === cv._id ? 'Generating...' : 'Download'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
