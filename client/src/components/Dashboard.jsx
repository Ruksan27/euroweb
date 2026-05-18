import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LucideFileText, LucideEye, LucideTrash, LucideExternalLink, LucideDownload } from 'lucide-react';
import { API } from '../config/api';

import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCvs();
  }, []);

  const fetchCvs = async () => {
    try {
      const response = await axios.get(`${API.cv}/list`);
      setCvs(response.data);
    } catch (error) {
      console.error("Failed to fetch CVs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id) => {
    const downloadUrl = `${API.cv}/generate-pdf/${id}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Starting your PDF download... 🚀');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this CV?")) return;
    try {
      await axios.delete(`${API.cv}/delete/${id}`);
      setCvs(p => p.filter(c => c._id !== id));
      toast.success("CV deleted successfully");
    } catch (error) {
      console.error("Failed to delete CV", error);
      toast.error("Failed to delete CV");
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto py-10 px-4 sm:px-8 lg:px-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Saved CVs</h2>
          <p className="text-slate-400 text-sm mt-1">Manage and download your generated Europass documents</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-300">
          Using Cloudinary (25GB) for your documents
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-slate-500">Loading your CVs...</div>
      ) : cvs.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
          <LucideFileText className="mx-auto mb-4 text-slate-600" size={48} />
          <p className="text-slate-400 text-lg">No CVs saved yet.</p>
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
                    onClick={() => handleDelete(cv._id)}
                    className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
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
                <button 
                  onClick={() => handleDownload(cv._id)}
                  className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium text-sm"
                >
                  <LucideDownload size={16} /> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
