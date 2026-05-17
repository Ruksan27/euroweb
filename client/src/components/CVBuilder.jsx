import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  LucideUpload, LucideSparkles, LucidePlus, LucideTrash, LucideDownload, 
  LucideBriefcase, LucideGraduationCap, LucideWrench, LucideUser, LucideImage,
  LucideFileText, LucideLanguages, LucideAward, LucideLoader2, LucideSave, LucideX
} from 'lucide-react';
import { API } from '../config/api';

const CVBuilder = ({ initialData }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(initialData?._id || null);
  
  const [cvData, setCvData] = useState(() => {
    const defaultData = {
      personalInfo: { 
        fullName: '', firstName: '', lastName: '', aboutMe: '', dateOfBirth: '', 
        nationality: '', gender: '', nationalId: '', passportNumber: '',
        email: '', phone: '', address: '', city: '', country: '', 
        postalCode: '', website: '', linkedIn: '', motherTongue: '' 
      },
      photoUrl: '',
      photoShape: 'rounded',
      cvFormat: 'europass',
      themeColor: '#0e4a8e',
      workExperience: [],
      education: [],
      certificates: [],
      languages: [],
      digitalSkills: [],
      otherSkills: [],
      documents: []
    };
    if (initialData) {
      return { 
        ...defaultData, 
        ...initialData, 
        personalInfo: { ...defaultData.personalInfo, ...(initialData.personalInfo || {}) }
      };
    }
    return defaultData;
  });

  const photoInputRef = useRef(null);

  // --- Photo Upload ---
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('personName', cvData.personalInfo.fullName || 'User');

    setUploadingImage(true);
    const toastId = toast.loading('Uploading photo...');
    try {
      const response = await axios.post(`${API.cv}/upload-photo`, formData);
      setCvData(prev => ({ ...prev, photoUrl: response.data.url }));
      toast.success('Photo uploaded!', { id: toastId });
    } catch {
      toast.error('Failed to upload photo', { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Document Upload ---
  const handleDocUpload = async (file, type) => {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return null; }
    const formData = new FormData();
    formData.append('document', file);
    formData.append('personName', cvData.personalInfo.fullName || 'User');
    formData.append('docType', type);
    try {
      const response = await axios.post(`${API.cv}/upload-document`, formData);
      return { url: response.data.url, name: response.data.name };
    } catch {
      toast.error(`Failed to upload ${type}`);
      return null;
    }
  };

  // --- AI Extract ---
  const handleAIExtract = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('documents', files[i]);
    }

    setLoading(true);
    const toastId = toast.loading('AI is extracting data from documents...');
    try {
      const response = await axios.post(`${API.ai}/extract`, formData);
      // Merge AI data with existing
      const aiData = response.data;
      setCvData(prev => ({ 
        ...prev, 
        ...aiData, 
        photoUrl: prev.photoUrl, 
        photoShape: prev.photoShape, 
        cvFormat: prev.cvFormat,
        documents: [...(prev.documents || []), ...(aiData.documents || [])] 
      }));
      toast.success('Data extracted successfully.', { id: toastId });
    } catch (error) {
      toast.error('AI Extraction failed.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cvData.personalInfo.fullName?.trim()) {
      toast.error('Please enter your full name before saving');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API.cv}/save`, cvData);
      setLastSavedId(response.data._id);
      setCvData(prev => ({ ...prev, _id: response.data._id }));
      toast.success('CV saved successfully! ✅');
    } catch {
      toast.error('Failed to save CV');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (type) => {
    const id = lastSavedId || cvData._id;
    if (!id) { toast.error('Save the CV first before downloading'); return; }
    window.open(`${API.cv}/generate-${type}/${id}`, '_blank');
  };

  // Helpers
  const updatePI = (f, v) => setCvData(p => {
    const personalInfo = { ...p.personalInfo, [f]: v };
    if (f === 'firstName' || f === 'lastName') {
      personalInfo.fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
    }
    return { ...p, personalInfo };
  });
  
  const addList = (key, defaultObj) => setCvData(p => ({ ...p, [key]: [...p[key], defaultObj] }));
  const updateList = (key, index, f, v) => {
    const updated = [...cvData[key]];
    updated[index][f] = v;
    setCvData(p => ({ ...p, [key]: updated }));
  };
  const removeList = (key, index) => {
    const updated = [...cvData[key]];
    updated.splice(index, 1);
    setCvData(p => ({ ...p, [key]: updated }));
  };

  // Styles based on shape
  const getPhotoShapeClass = (shape) => {
    switch (shape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-none';
      default: return 'rounded-2xl';
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto py-6 px-4 sm:px-8 lg:px-12 pb-24 lg:pb-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT SIDE: BUILDER FORM */}
        <div className="w-full lg:w-[58%] space-y-6">
          
          {/* AI Magic */}
          <section className="form-section">
            <div className="flex justify-between items-center mb-4">
              <h3 className="section-title text-indigo-400">
                <LucideSparkles size={20} /> AI Smart Extract
              </h3>
            </div>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-5 sm:p-6 text-center hover:border-indigo-500/50 transition-all cursor-pointer relative bg-black/20">
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleAIExtract} disabled={loading} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              <LucideUpload className="mx-auto mb-2 text-indigo-400" size={28} />
              <p className="text-slate-300 font-semibold text-sm sm:text-base">Upload Multiple Documents</p>
              <p className="text-xs text-slate-500 mt-1">CV, ID, Certificates — AI merges everything!</p>
              {loading && <div className="mt-2 text-xs text-indigo-400 animate-pulse">Extracting data...</div>}
            </div>
          </section>

          {/* Photo & Shape */}
          <section className="form-section">
            <h3 className="section-title"><LucideImage size={18} className="text-emerald-400"/> Profile Photo</h3>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="relative group cursor-pointer" onClick={() => photoInputRef.current.click()}>
                <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <div className={`w-32 h-32 bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center transition-all group-hover:border-emerald-400 ${getPhotoShapeClass(cvData.photoShape)}`}>
                  {uploadingImage ? <LucideLoader2 className="animate-spin text-emerald-400" /> 
                    : cvData.photoUrl ? <img src={cvData.photoUrl} alt="Profile" className="w-full h-full object-cover" /> 
                    : <LucideUser size={40} className="text-white/30" />}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold ${getPhotoShapeClass(cvData.photoShape)}">
                  CHANGE
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <label className="text-sm text-slate-400 block mb-1">Photo Shape</label>
                <div className="flex gap-3">
                  {['circle', 'rounded', 'square'].map(shape => (
                    <button 
                      key={shape} 
                      onClick={() => setCvData(p => ({...p, photoShape: shape}))}
                      className={`flex-1 py-2 px-3 rounded-xl capitalize font-medium text-sm transition-all border ${cvData.photoShape === shape ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
                
                <label className="text-sm text-slate-400 block mt-4 mb-1">CV Template Format</label>
                <div className="flex gap-3">
                  {['europass', 'modern', 'minimal'].map(fmt => (
                    <button 
                      key={fmt} 
                      onClick={() => setCvData(p => ({...p, cvFormat: fmt}))}
                      className={`flex-1 py-2 px-3 rounded-xl capitalize font-medium text-sm transition-all border ${cvData.cvFormat === fmt ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                <label className="text-sm text-slate-400 block mt-4 mb-2">Accent Theme Color</label>
                <div className="flex gap-3 flex-wrap items-center">
                  {[
                    { name: 'Deep Blue', hex: '#0e4a8e', bg: 'bg-[#0e4a8e]' },
                    { name: 'Teal', hex: '#00828a', bg: 'bg-[#00828a]' },
                    { name: 'Green', hex: '#00875a', bg: 'bg-[#00875a]' },
                    { name: 'Purple', hex: '#5b368c', bg: 'bg-[#5b368c]' },
                    { name: 'Violet', hex: '#7d5ba6', bg: 'bg-[#7d5ba6]' },
                    { name: 'Pink', hex: '#d01c6b', bg: 'bg-[#d01c6b]' }
                  ].map(color => (
                    <button 
                      key={color.hex} 
                      type="button"
                      onClick={() => setCvData(p => ({...p, themeColor: color.hex}))}
                      className={`w-8 h-8 rounded-full transition-all border border-white/20 ${color.bg} ${cvData.themeColor === color.hex ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Personal Info */}
          <section className="form-section">
            <h3 className="section-title"><LucideUser size={18} className="text-indigo-400"/> Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="First Name(s)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.firstName || ''} onChange={(e) => updatePI('firstName', e.target.value)} />
              <input placeholder="Last Name(s)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.lastName || ''} onChange={(e) => updatePI('lastName', e.target.value)} />
              <input placeholder="Full Name (Auto-computed)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.fullName} onChange={(e) => updatePI('fullName', e.target.value)} />
              <input placeholder="Email" type="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.email} onChange={(e) => updatePI('email', e.target.value)} />
              <input placeholder="Phone" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.phone} onChange={(e) => updatePI('phone', e.target.value)} />
              <input placeholder="Date of Birth (e.g. DD/MM/YYYY)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.dateOfBirth} onChange={(e) => updatePI('dateOfBirth', e.target.value)} />
              
              <input placeholder="Nationality" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.nationality} onChange={(e) => updatePI('nationality', e.target.value)} />
              <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none text-slate-300 appearance-none" value={cvData.personalInfo.gender} onChange={(e) => updatePI('gender', e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              
              <input placeholder="National ID / Citizenship No" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.nationalId} onChange={(e) => updatePI('nationalId', e.target.value)} />
              <input placeholder="Passport Number" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.passportNumber} onChange={(e) => updatePI('passportNumber', e.target.value)} />
              
              <input placeholder="Address" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none sm:col-span-2" value={cvData.personalInfo.address} onChange={(e) => updatePI('address', e.target.value)} />
              <input placeholder="City" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.city} onChange={(e) => updatePI('city', e.target.value)} />
              <input placeholder="Country" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.country} onChange={(e) => updatePI('country', e.target.value)} />
              <input placeholder="Postal Code" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.postalCode} onChange={(e) => updatePI('postalCode', e.target.value)} />
              
              <input placeholder="Website URL" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.website || ''} onChange={(e) => updatePI('website', e.target.value)} />
              <input placeholder="LinkedIn Profile Link" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-indigo-500 outline-none" value={cvData.personalInfo.linkedIn || ''} onChange={(e) => updatePI('linkedIn', e.target.value)} />
              
              <textarea placeholder="About Me / Profile Description" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none sm:col-span-2 min-h-[100px]" value={cvData.personalInfo.aboutMe || ''} onChange={(e) => updatePI('aboutMe', e.target.value)} />
            </div>
          </section>

          {/* Education & Cert Uploads */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><LucideGraduationCap size={20} className="text-amber-400"/> Education</h3>
              <button onClick={() => addList('education', { qualification: '', organization: '', city: '', country: '', from: '', to: '', website: '', fieldOfStudy: '', eqfLevel: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-amber-400 transition"><LucidePlus size={20} /></button>
            </div>
            {cvData.education.map((edu, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('education', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16}/></button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                  <input placeholder="Qualification (e.g. B.Sc CSIT)" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.qualification} onChange={(e) => updateList('education', i, 'qualification', e.target.value)} />
                  <input placeholder="Organization/University" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.organization} onChange={(e) => updateList('education', i, 'organization', e.target.value)} />
                  <div className="flex gap-2">
                    <input placeholder="City" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.city || ''} onChange={(e) => updateList('education', i, 'city', e.target.value)} />
                    <input placeholder="Country" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.country || ''} onChange={(e) => updateList('education', i, 'country', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="From Year" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.from} onChange={(e) => updateList('education', i, 'from', e.target.value)} />
                    <input placeholder="To Year" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.to} onChange={(e) => updateList('education', i, 'to', e.target.value)} />
                  </div>
                  <input placeholder="Website URL (e.g. www.collegedomain.edu)" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.website || ''} onChange={(e) => updateList('education', i, 'website', e.target.value)} />
                  <input placeholder="Field of study" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-amber-400 outline-none" value={edu.fieldOfStudy || ''} onChange={(e) => updateList('education', i, 'fieldOfStudy', e.target.value)} />
                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-[10px] text-amber-400 capitalize mb-1 font-semibold">Level in EQF</label>
                    <select 
                      className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:border-amber-400 outline-none text-amber-300 font-medium"
                      value={edu.eqfLevel || ''} 
                      onChange={(e) => updateList('education', i, 'eqfLevel', e.target.value)}
                    >
                      <option value="" className="bg-slate-900 text-slate-400">Select EQF Level</option>
                      <option value="EQF level 1" className="bg-slate-900 text-white">EQF level 1</option>
                      <option value="EQF level 2" className="bg-slate-900 text-white">EQF level 2</option>
                      <option value="EQF level 3" className="bg-slate-900 text-white">EQF level 3</option>
                      <option value="EQF level 4" className="bg-slate-900 text-white">EQF level 4</option>
                      <option value="EQF level 5" className="bg-slate-900 text-white">EQF level 5</option>
                      <option value="EQF level 6" className="bg-slate-900 text-white">EQF level 6</option>
                      <option value="EQF level 7" className="bg-slate-900 text-white">EQF level 7</option>
                      <option value="EQF level 8" className="bg-slate-900 text-white">EQF level 8</option>
                    </select>
                  </div>
                </div>
                {/* File Upload for Education */}
                <div className="mt-3 flex items-center gap-3">
                  <label className="cursor-pointer text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
                    <LucideFileText size={14} /> {edu.documentName ? 'Change Certificate' : 'Upload Certificate'}
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                       const doc = await handleDocUpload(e.target.files[0], 'education');
                       if (doc) { updateList('education', i, 'documentUrl', doc.url); updateList('education', i, 'documentName', doc.name); }
                    }} />
                  </label>
                  {edu.documentName && (
                    <a href={edu.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[150px] flex items-center gap-1 underline underline-offset-2">
                      <LucideFileText size={12} /> Preview {edu.documentName}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Certificates */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><LucideAward size={20} className="text-rose-400"/> Extra Certificates</h3>
              <button onClick={() => addList('certificates', { title: '', issuer: '', date: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-rose-400 transition"><LucidePlus size={20} /></button>
            </div>
             {cvData.certificates.map((cert, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('certificates', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16}/></button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                  <input placeholder="Certificate Title" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-rose-400 outline-none sm:col-span-2" value={cert.title} onChange={(e) => updateList('certificates', i, 'title', e.target.value)} />
                  <input placeholder="Issuer / Authority" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-rose-400 outline-none" value={cert.issuer} onChange={(e) => updateList('certificates', i, 'issuer', e.target.value)} />
                  <input placeholder="Date / Year" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-rose-400 outline-none" value={cert.date} onChange={(e) => updateList('certificates', i, 'date', e.target.value)} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="cursor-pointer text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
                    <LucideFileText size={14} /> Upload Doc
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                       const doc = await handleDocUpload(e.target.files[0], 'certificate');
                       if (doc) { updateList('certificates', i, 'documentUrl', doc.url); updateList('certificates', i, 'documentName', doc.name); }
                    }} />
                  </label>
                  {cert.documentName && (
                    <a href={cert.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[150px] flex items-center gap-1 underline underline-offset-2">
                      <LucideFileText size={12} /> Preview {cert.documentName}
                    </a>
                  )}
                </div>
              </div>
             ))}
          </section>

          {/* Languages */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><LucideLanguages size={20} className="text-cyan-400"/> Languages</h3>
              <button onClick={() => addList('languages', { language: '', listening: '', reading: '', spokenInteraction: '', spokenProduction: '', writing: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition"><LucidePlus size={20} /></button>
            </div>
            
            <div className="mb-5 bg-black/20 border border-white/5 rounded-2xl p-4">
              <label className="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1.5">Mother Tongue(s)</label>
              <input placeholder="e.g. Nepali" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-cyan-400 outline-none text-cyan-300 font-medium text-sm" value={cvData.personalInfo.motherTongue || ''} onChange={(e) => updatePI('motherTongue', e.target.value)} />
            </div>

            {cvData.languages.map((lang, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                 <button onClick={() => removeList('languages', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16}/></button>
                 <input placeholder="Language (e.g. English)" className="w-full font-bold text-cyan-300 bg-transparent border-b border-white/20 px-2 py-1 mb-3 focus:border-cyan-400 outline-none max-w-[80%]" value={lang.language} onChange={(e) => updateList('languages', i, 'language', e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     {['listening', 'reading', 'spokenInteraction', 'spokenProduction', 'writing'].map(skill => (
                       <div key={skill} className="flex flex-col">
                         <label className="text-[10px] text-cyan-400 capitalize mb-1 font-semibold">{skill.replace(/([A-Z])/g, ' $1')}</label>
                         <select 
                           className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-2 py-2 focus:border-cyan-400 outline-none text-cyan-300 font-medium"
                           value={lang[skill] || ''} 
                           onChange={(e) => updateList('languages', i, skill, e.target.value)}
                         >
                           <option value="" className="bg-slate-900 text-slate-400">Select CEFR</option>
                           <option value="A1" className="bg-slate-900 text-white">A1 (Basic User)</option>
                           <option value="A2" className="bg-slate-900 text-white">A2 (Basic User)</option>
                           <option value="B1" className="bg-slate-900 text-white">B1 (Independent User)</option>
                           <option value="B2" className="bg-slate-900 text-white">B2 (Independent User)</option>
                           <option value="C1" className="bg-slate-900 text-white">C1 (Proficient User)</option>
                           <option value="C2" className="bg-slate-900 text-white">C2 (Proficient User)</option>
                         </select>
                       </div>
                     ))}
                  </div>
              </div>
            ))}
          </section>

          {/* Work Experience */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><LucideBriefcase size={20} className="text-fuchsia-400"/> Work Experience</h3>
              <button onClick={() => addList('workExperience', { occupation: '', employer: '', city: '', country: '', from: '', to: '', responsibilities: [] })} className="p-1.5 hover:bg-white/10 rounded-lg text-fuchsia-400 transition"><LucidePlus size={20} /></button>
            </div>
            {cvData.workExperience.map((exp, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('workExperience', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16}/></button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                  <input placeholder="Occupation" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-fuchsia-400 outline-none" value={exp.occupation} onChange={(e) => updateList('workExperience', i, 'occupation', e.target.value)} />
                  <input placeholder="Employer" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-fuchsia-400 outline-none" value={exp.employer} onChange={(e) => updateList('workExperience', i, 'employer', e.target.value)} />
                  <div className="flex gap-2">
                    <input placeholder="City" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-fuchsia-400 outline-none" value={exp.city} onChange={(e) => updateList('workExperience', i, 'city', e.target.value)} />
                    <input placeholder="Country" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-fuchsia-400 outline-none" value={exp.country} onChange={(e) => updateList('workExperience', i, 'country', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="From" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-fuchsia-400 outline-none" value={exp.from} onChange={(e) => updateList('workExperience', i, 'from', e.target.value)} />
                    <input placeholder="To" className="w-full bg-transparent border-b border-white/20 px-2 py-1 focus:border-fuchsia-400 outline-none" value={exp.to} onChange={(e) => updateList('workExperience', i, 'to', e.target.value)} />
                  </div>
                </div>
                <textarea 
                  placeholder="Responsibilities (one per line)" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-fuchsia-400 outline-none min-h-[80px]"
                  value={exp.responsibilities.join('\n')}
                  onChange={(e) => updateList('workExperience', i, 'responsibilities', e.target.value.split('\n'))}
                />
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LucideWrench size={20} className="text-blue-400"/> Skills</h3>
             <div className="space-y-4">
               <div>
                  <label className="text-sm text-slate-400 block mb-1">Digital Skills (Comma separated)</label>
                  <textarea className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" 
                    value={cvData.digitalSkills.join(', ')} 
                    onChange={(e) => setCvData({...cvData, digitalSkills: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  />
               </div>
               <div>
                  <label className="text-sm text-slate-400 block mb-1">Other Skills (Comma separated)</label>
                  <textarea className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" 
                    value={cvData.otherSkills.join(', ')} 
                    onChange={(e) => setCvData({...cvData, otherSkills: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  />
               </div>
             </div>
          </section>

        </div>

        {/* RIGHT SIDE: PREVIEW (hidden on mobile) */}
        <div className="preview-panel w-full lg:w-[40%]" style={{ position: 'sticky', top: '24px', alignSelf: 'flex-start' }}>
          
          {/* Desktop Action Buttons */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex gap-2 mb-4">
             <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
                {loading ? <LucideLoader2 size={16} className="animate-spin"/> : <LucideSave size={16}/>}
                {loading ? 'Saving...' : 'Save'}
             </button>
             <button onClick={() => downloadFile('pdf')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
                <LucideDownload size={16} /> PDF
             </button>
             <button onClick={() => downloadFile('jpg')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
                <LucideDownload size={16} /> JPG
             </button>
             <button onClick={() => downloadFile('png')} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
                <LucideDownload size={16} /> PNG
             </button>
          </div>

          {/* Rich Mini Preview Box */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
             {cvData.cvFormat === 'europass' ? (
                <>
                  {/* Purple Accent Top Line */}
                  <div className="h-2.5 w-full" style={{ backgroundColor: cvData.themeColor || '#0e4a8e' }}></div>
                  
                  {/* Header */}
                  <div className="p-5 text-slate-800 flex justify-between items-start border-b border-gray-100 gap-4">
                     <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}>
                           {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover"/> : <LucideUser size={26} className="text-gray-400"/>}
                        </div>
                        <div className="min-w-0">
                           <h2 className="text-base font-bold truncate" style={{ color: cvData.themeColor || '#0e4a8e' }}>{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
                           <div className="text-[9px] text-gray-500 font-medium">
                              {[
                                 cvData.personalInfo.passportNumber ? `Passport: ${cvData.personalInfo.passportNumber}` : null,
                                 cvData.personalInfo.nationality ? `Nationality: ${cvData.personalInfo.nationality}` : null,
                                 cvData.personalInfo.dateOfBirth ? `Date of birth: ${cvData.personalInfo.dateOfBirth}` : null
                              ].filter(Boolean).join(' • ')}
                           </div>
                           <div className="text-[9px] mt-1.5 space-y-0.5 text-gray-600 font-medium">
                              {cvData.personalInfo.phone && <div>🏠 Phone number: {cvData.personalInfo.phone}</div>}
                              {cvData.personalInfo.email && <div>✉ Email address: {cvData.personalInfo.email}</div>}
                              {cvData.personalInfo.address && <div>📍 Home: {[cvData.personalInfo.address, cvData.personalInfo.city, cvData.personalInfo.country].filter(Boolean).join(', ')}</div>}
                              {cvData.personalInfo.website && <div>🌐 Website: {cvData.personalInfo.website}</div>}
                              {cvData.personalInfo.linkedIn && <div>🔗 LinkedIn: {cvData.personalInfo.linkedIn}</div>}
                           </div>
                        </div>
                     </div>
                     <div className="shrink-0">
                        <img src="/europass-logo.svg" className="h-7 w-auto" alt="Europass"/>
                     </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4 text-gray-800">
                     {cvData.personalInfo.aboutMe && (
                        <div>
                           <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: cvData.themeColor || '#0e4a8e' }}>About Me</div>
                           <div className="border-b my-1" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}></div>
                           <div className="text-[9.5px] text-gray-600 leading-relaxed italic">"{cvData.personalInfo.aboutMe}"</div>
                        </div>
                     )}

                     {(cvData.personalInfo.motherTongue || cvData.languages.length > 0) && (
                        <div>
                           <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: cvData.themeColor || '#0e4a8e' }}>Language Skills</div>
                           <div className="border-b my-1" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}></div>
                           <div className="text-[9.5px] text-gray-600 space-y-2">
                              {cvData.personalInfo.motherTongue && (
                                 <div><strong>Mother tongue(s):</strong> {cvData.personalInfo.motherTongue}</div>
                              )}
                              {cvData.languages.length > 0 && (
                                 <>
                                    <strong>Other language(s):</strong>
                                    {cvData.languages.map((l, i) => (
                                       <div key={i} className="pl-2 border-l border-dashed py-0.5" style={{ borderLeftColor: cvData.themeColor || '#0e4a8e' }}>
                                          <div className="font-bold" style={{ color: cvData.themeColor || '#0e4a8e' }}>{l.language}</div>
                                          <div className="text-[8px] flex flex-wrap gap-x-2 text-gray-500 uppercase font-semibold">
                                             {l.listening && <span>Listening: {l.listening}</span>}
                                             {l.reading && <span>Reading: {l.reading}</span>}
                                             {l.writing && <span>Writing: {l.writing}</span>}
                                             {l.spokenProduction && <span>Spoken Prod: {l.spokenProduction}</span>}
                                             {l.spokenInteraction && <span>Spoken Int: {l.spokenInteraction}</span>}
                                          </div>
                                       </div>
                                    ))}
                                 </>
                              )}
                           </div>
                        </div>
                     )}

                     {cvData.workExperience.length > 0 && (
                        <div>
                           <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: cvData.themeColor || '#0e4a8e' }}>Work Experience</div>
                           <div className="border-b my-1" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}></div>
                           {cvData.workExperience.slice(0, 3).map((exp, i) => (
                              <div key={i} className="mb-2.5">
                                 <div className="text-[10px] font-bold text-gray-800">{exp.occupation}</div>
                                 <div className="text-[9px] text-gray-500 font-semibold italic">{exp.employer} <span className="text-[8px] font-normal not-italic">[{exp.from} – {exp.to || 'Present'}]</span></div>
                              </div>
                           ))}
                        </div>
                     )}

                     {cvData.education.length > 0 && (
                        <div>
                           <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: cvData.themeColor || '#0e4a8e' }}>Education</div>
                           <div className="border-b my-1" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}></div>
                           {cvData.education.slice(0, 3).map((edu, i) => (
                              <div key={i} className="mb-2.5">
                                 <div className="text-[10px] font-bold text-gray-800">{edu.qualification}</div>
                                 <div className="text-[9px] text-gray-500 font-semibold italic">{edu.organization} <span className="text-[8px] font-normal not-italic">[{edu.from} – {edu.to || 'Present'}]</span></div>
                                 {(edu.city || edu.fieldOfStudy || edu.eqfLevel) && (
                                    <div className="text-[8px] text-gray-400 bg-gray-50 p-1 border-l-2 mt-1 leading-tight" style={{ borderLeftColor: cvData.themeColor || '#0e4a8e' }}>
                                       {[
                                          edu.city ? `City: ${edu.city}` : null,
                                          edu.fieldOfStudy ? `Field: ${edu.fieldOfStudy}` : null,
                                          edu.eqfLevel ? `EQF: ${edu.eqfLevel}` : null
                                       ].filter(Boolean).join(' | ')}
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                </>
             ) : (
                <>
                  {/* Default Format (Modern/Minimal/Standard) */}
                  <div className="bg-gradient-to-br from-[#0055a6] to-[#003d7a] p-5 text-white flex gap-4">
                     <div className={`w-16 h-16 bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden shrink-0 ${getPhotoShapeClass(cvData.photoShape)}`}>
                        {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover"/> : <LucideUser size={26} className="opacity-50"/>}
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-base font-bold tracking-tight truncate">{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
                        <div className="text-[10px] opacity-80 mt-0.5">{[cvData.personalInfo.nationality, cvData.personalInfo.dateOfBirth].filter(Boolean).join(' • ')}</div>
                        <div className="text-[10px] mt-1.5 space-y-0.5 opacity-90">
                           {cvData.personalInfo.email && <div>✉ {cvData.personalInfo.email}</div>}
                           {cvData.personalInfo.phone && <div>📞 {cvData.personalInfo.phone}</div>}
                           {(cvData.personalInfo.city || cvData.personalInfo.country) && <div>📍 {[cvData.personalInfo.city, cvData.personalInfo.country].filter(Boolean).join(', ')}</div>}
                        </div>
                     </div>
                  </div>
                  <div className="p-5 space-y-4 text-gray-800">
                     {cvData.personalInfo.aboutMe && (
                        <div className="mb-4">
                           <div className="text-gray-500 text-[9px] italic line-clamp-3">
                              "{cvData.personalInfo.aboutMe}"
                           </div>
                        </div>
                     )}
                     {cvData.workExperience.length > 0 && (
                       <div>
                         <div className="text-[#0055a6] text-[9px] font-bold uppercase border-b-2 border-[#0055a6] pb-1 mb-2">Work Experience</div>
                         {cvData.workExperience.slice(0,2).map((exp, i) => (
                           <div key={i} className="mb-2 flex gap-2">
                             <div className="text-[8px] text-gray-400 w-14 shrink-0">{exp.from}{exp.to ? `–${exp.to}` : ''}</div>
                             <div><div className="text-[10px] font-bold">{exp.occupation}</div><div className="text-[9px] text-[#0055a6]">{exp.employer}</div></div>
                           </div>
                         ))}
                       </div>
                     )}
                     {cvData.education.length > 0 && (
                       <div>
                         <div className="text-[#0055a6] text-[9px] font-bold uppercase border-b-2 border-[#0055a6] pb-1 mb-2">Education</div>
                         {cvData.education.slice(0,2).map((edu, i) => (
                           <div key={i} className="mb-2 flex gap-2">
                             <div className="text-[8px] text-gray-400 w-14 shrink-0">{edu.from}{edu.to ? `–${edu.to}` : ''}</div>
                             <div><div className="text-[10px] font-bold">{edu.qualification}</div><div className="text-[9px] text-gray-500">{edu.organization}</div></div>
                           </div>
                         ))}
                       </div>
                     )}
                     {cvData.digitalSkills.length > 0 && (
                       <div>
                         <div className="text-[#0055a6] text-[9px] font-bold uppercase border-b-2 border-[#0055a6] pb-1 mb-2">Digital Skills</div>
                         <div className="flex flex-wrap gap-1">
                           {cvData.digitalSkills.slice(0,6).map((s,i) => <span key={i} className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s}</span>)}
                         </div>
                       </div>
                     )}
                     {cvData.languages.length > 0 && (
                       <div>
                         <div className="text-[#0055a6] text-[9px] font-bold uppercase border-b-2 border-[#0055a6] pb-1 mb-2">Languages</div>
                         <div className="flex flex-wrap gap-1">
                           {cvData.languages.slice(0,4).map((l,i) => <span key={i} className="text-[9px] font-medium text-gray-700">{l.language}{i < cvData.languages.length-1 ? ' •' : ''}</span>)}
                         </div>
                       </div>
                     )}
                  </div>
                </>
             )}
          </div>
          <p className="text-center text-slate-500 text-xs mt-2">{lastSavedId ? '✅ Saved — ready to download' : 'Fill form → Save → Download PDF/JPG'}</p>
        </div>

      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="mobile-action-bar">
        <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          {loading ? <LucideLoader2 size={16} className="animate-spin"/> : <LucideSave size={16}/>}
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => downloadFile('pdf')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={16} /> PDF
        </button>
        <button onClick={() => downloadFile('jpg')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={16} /> JPG
        </button>
      </div>
    </div>
  );
};

export default CVBuilder;
