import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  LucideUpload, LucideSparkles, LucidePlus, LucideTrash, LucideDownload,
  LucideBriefcase, LucideGraduationCap, LucideWrench, LucideUser, LucideImage,
  LucideFileText, LucideLanguages, LucideAward, LucideLoader2, LucideSave
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

    if (files.length > 5) {
      toast.error('You can upload a maximum of 5 documents at a time.');
      return;
    }

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
      console.error('AI Extraction Error Details:', error);
      toast.error(`AI Extraction failed: ${error.response?.data?.error || error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // --- AI Extract Section-wise ---
  const handleSectionAIExtract = async (e, section) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 5) {
      toast.error('You can upload a maximum of 5 documents at a time.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('documents', files[i]);
    }

    setLoading(true);
    const toastId = toast.loading(`AI is extracting data for ${section}...`);
    try {
      const response = await axios.post(`${API.ai}/extract`, formData);
      const aiData = response.data;
      
      setCvData(prev => ({
        ...prev,
        [section]: [...(prev[section] || []), ...(aiData[section] || [])],
        documents: [...(prev.documents || []), ...(aiData.documents || [])]
      }));
      toast.success(`Data extracted for ${section}.`, { id: toastId });
    } catch (error) {
      toast.error(`AI Extraction failed: ${error.response?.data?.error || error.message}`, { id: toastId });
    } finally {
      setLoading(false);
      e.target.value = null; // reset file input
    }
  };

  const handleSave = async () => {
    if (!cvData.personalInfo.fullName?.trim()) {
      toast.error('Please enter your full name before saving');
      return;
    }
    const token = localStorage.getItem('user_token');
    if (!token) {
      toast.error('Please log in to save your CV to the database');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API.cv}/save`, cvData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLastSavedId(response.data._id);
      setCvData(prev => ({ ...prev, _id: response.data._id }));
      toast.success('CV saved successfully! ✅');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.error || 'Failed to save CV');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (type) => {
    const id = lastSavedId || cvData._id;

    if (!id) {
      toast.error('Save the CV first before downloading');
      return;
    }

    try {
      const downloadUrl = `${API.cv}/generate-${type}/${id}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Starting your ${type.toUpperCase()} download... 🚀`);
    } catch (error) {
      console.error('Download Error:', error);
      toast.error(`Failed to download ${type.toUpperCase()}`);
    }
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
              <p className="text-xs text-slate-500 mt-1">CV, ID, Certificates — AI merges everything! (Max 5 files)</p>
              {loading && <div className="mt-2 text-xs text-indigo-400 animate-pulse">Extracting data...</div>}
            </div>
          </section>

          {/* Photo & Shape */}
          <section className="form-section">
            <h3 className="section-title"><LucideImage size={18} className="text-emerald-400" /> Profile Photo</h3>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="relative group cursor-pointer" onClick={() => photoInputRef.current.click()}>
                <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <div className={`w-32 h-32 bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center transition-all group-hover:border-emerald-400 ${getPhotoShapeClass(cvData.photoShape)}`}>
                  {uploadingImage ? <LucideLoader2 className="animate-spin text-emerald-400" />
                    : cvData.photoUrl ? <img src={cvData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      : <LucideUser size={40} className="text-white/30" />}
                </div>
                <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold ${getPhotoShapeClass(cvData.photoShape)}`}>
                  CHANGE
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <label className="text-sm text-slate-400 block mb-1">Photo Shape</label>
                <div className="flex gap-3">
                  {['circle', 'rounded', 'square'].map(shape => (
                    <button
                      key={shape}
                      onClick={() => setCvData(p => ({ ...p, photoShape: shape }))}
                      className={`flex-1 py-2 px-3 rounded-xl capitalize font-medium text-sm transition-all border ${cvData.photoShape === shape ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>

                <label className="text-sm text-slate-400 block mt-4 mb-1">CV Template Format</label>
                <div className="flex flex-wrap gap-3">
                  {['europass', 'modern', 'minimal', 'general', 'plain', 'elegant'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setCvData(p => ({ ...p, cvFormat: fmt }))}
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
                      onClick={() => setCvData(p => ({ ...p, themeColor: color.hex }))}
                      className={`w-8 h-8 rounded-full transition-all border border-white/20 ${color.bg} ${cvData.themeColor === color.hex ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                      title={color.name}
                    />
                  ))}
                </div>

                {cvData.cvFormat === 'europass' && (
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Europass Settings</h4>
                    
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Template Variant</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['v1', 'v2', 'v3', 'v4'].map(v => (
                          <button
                            key={v}
                            onClick={() => setCvData(p => ({ ...p, europassVariant: v }))}
                            className={`py-1.5 px-3 rounded-lg capitalize font-medium text-xs transition-all border ${cvData.europassVariant === v || (!cvData.europassVariant && v === 'v1') ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                          >
                            Layout {v.replace('v', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Text Size</label>
                      <div className="flex gap-2">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            onClick={() => setCvData(p => ({ ...p, textSize: size }))}
                            className={`flex-1 py-1.5 px-3 rounded-lg capitalize font-medium text-xs transition-all border ${cvData.textSize === size || (!cvData.textSize && size === 'medium') ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Add Europass Logo</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { val: 'every_page', label: 'Every page' },
                          { val: 'first_page', label: 'First page only' },
                          { val: 'no', label: 'No' }
                        ].map(opt => (
                          <label key={opt.val} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="europassLogo"
                              checked={cvData.europassLogo === opt.val || (!cvData.europassLogo && opt.val === 'first_page')}
                              onChange={() => setCvData(p => ({ ...p, europassLogo: opt.val }))}
                              className="accent-indigo-500"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Add Page Numbers</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="pageNumbers"
                            checked={cvData.pageNumbers !== false}
                            onChange={() => setCvData(p => ({ ...p, pageNumbers: true }))}
                            className="accent-indigo-500"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="pageNumbers"
                            checked={cvData.pageNumbers === false}
                            onChange={() => setCvData(p => ({ ...p, pageNumbers: false }))}
                            className="accent-indigo-500"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Personal Info */}
          <section className="form-section">
            <h3 className="section-title"><LucideUser size={18} className="text-indigo-400" /> Personal Details</h3>
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
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-lg font-bold flex items-center gap-2"><LucideGraduationCap size={20} className="text-amber-400" /> Education</h3>
                <label className="cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={14} /> AI Auto-fill (Max 5)
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleSectionAIExtract(e, 'education')} />
                </label>
              </div>
              <button onClick={() => addList('education', { qualification: '', organization: '', city: '', country: '', from: '', to: '', website: '', fieldOfStudy: '', eqfLevel: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-amber-400 transition" title="Add Education Manually"><LucidePlus size={20} /></button>
            </div>
            {cvData.education.map((edu, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('education', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16} /></button>
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
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-lg font-bold flex items-center gap-2"><LucideAward size={20} className="text-rose-400" /> Extra Certificates</h3>
                <label className="cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={14} /> AI Auto-fill (Max 5)
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleSectionAIExtract(e, 'certificates')} />
                </label>
              </div>
              <button onClick={() => addList('certificates', { title: '', issuer: '', date: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-rose-400 transition" title="Add Certificate Manually"><LucidePlus size={20} /></button>
            </div>
            {cvData.certificates.map((cert, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('certificates', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16} /></button>
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
              <h3 className="text-lg font-bold flex items-center gap-2"><LucideLanguages size={20} className="text-cyan-400" /> Languages</h3>
              <button onClick={() => addList('languages', { language: '', listening: '', reading: '', spokenInteraction: '', spokenProduction: '', writing: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition"><LucidePlus size={20} /></button>
            </div>

            <div className="mb-5 bg-black/20 border border-white/5 rounded-2xl p-4">
              <label className="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1.5">Mother Tongue(s)</label>
              <input placeholder="e.g. Nepali" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-cyan-400 outline-none text-cyan-300 font-medium text-sm" value={cvData.personalInfo.motherTongue || ''} onChange={(e) => updatePI('motherTongue', e.target.value)} />
            </div>

            {cvData.languages.map((lang, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('languages', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16} /></button>
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
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-lg font-bold flex items-center gap-2"><LucideBriefcase size={20} className="text-fuchsia-400" /> Work Experience</h3>
                <label className="cursor-pointer bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={14} /> AI Auto-fill (Max 5)
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleSectionAIExtract(e, 'workExperience')} />
                </label>
              </div>
              <button onClick={() => addList('workExperience', { occupation: '', employer: '', city: '', country: '', from: '', to: '', responsibilities: [], documentUrl: '', documentName: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-fuchsia-400 transition" title="Add Experience Manually"><LucidePlus size={20} /></button>
            </div>
            {cvData.workExperience.map((exp, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-4 mb-4 relative">
                <button onClick={() => removeList('workExperience', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><LucideTrash size={16} /></button>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-fuchsia-400 outline-none min-h-[80px] mb-3"
                  value={exp.responsibilities.join('\n')}
                  onChange={(e) => updateList('workExperience', i, 'responsibilities', e.target.value.split('\n'))}
                />
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
                    <LucideFileText size={14} /> Upload Doc
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                      const doc = await handleDocUpload(e.target.files[0], 'experience');
                      if (doc) { updateList('workExperience', i, 'documentUrl', doc.url); updateList('workExperience', i, 'documentName', doc.name); }
                    }} />
                  </label>
                  {exp.documentName && (
                    <a href={exp.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[150px] flex items-center gap-1 underline underline-offset-2">
                      <LucideFileText size={12} /> Preview {exp.documentName}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-lg font-bold flex items-center gap-2"><LucideWrench size={20} className="text-blue-400" /> Skills</h3>
                <label className="cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={14} /> AI Auto-fill (Max 5)
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const formData = new FormData();
                    for (let i = 0; i < files.length; i++) formData.append('documents', files[i]);
                    setLoading(true);
                    const toastId = toast.loading('AI is extracting skills...');
                    try {
                      const response = await axios.post(`${API.ai}/extract`, formData);
                      const aiData = response.data;
                      setCvData(prev => ({
                        ...prev,
                        digitalSkills: [...new Set([...prev.digitalSkills, ...(aiData.digitalSkills || [])])],
                        otherSkills: [...new Set([...prev.otherSkills, ...(aiData.otherSkills || [])])],
                      }));
                      toast.success('Skills extracted successfully!', { id: toastId });
                    } catch (error) {
                      toast.error(`AI Extraction failed: ${error.response?.data?.error || error.message}`, { id: toastId });
                    } finally {
                      setLoading(false);
                      e.target.value = null;
                    }
                  }} />
                </label>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-slate-300 block mb-2 font-medium">Digital Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Microsoft Office, Photoshop, Python, Excel"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 focus:border-blue-500 outline-none text-white text-sm"
                  value={cvData._rawDigitalSkills !== undefined ? cvData._rawDigitalSkills : cvData.digitalSkills.join(', ')}
                  onChange={(e) => setCvData({ ...cvData, _rawDigitalSkills: e.target.value, digitalSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  onBlur={() => setCvData(prev => ({ ...prev, _rawDigitalSkills: undefined }))}
                />
              </div>
              <div className="mt-4">
                <label className="text-sm text-slate-300 block mb-2 font-medium">Other Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Communication, Leadership, Public Speaking"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 focus:border-blue-500 outline-none text-white text-sm"
                  value={cvData._rawOtherSkills !== undefined ? cvData._rawOtherSkills : cvData.otherSkills.join(', ')}
                  onChange={(e) => setCvData({ ...cvData, _rawOtherSkills: e.target.value, otherSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  onBlur={() => setCvData(prev => ({ ...prev, _rawOtherSkills: undefined }))}
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
              {loading ? <LucideLoader2 size={16} className="animate-spin" /> : <LucideSave size={16} />}
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => downloadFile('pdf')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              <LucideDownload size={16} /> PDF
            </button>
            <button onClick={() => downloadFile('jpg')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              <LucideDownload size={16} /> JPG
            </button>
            <button onClick={() => downloadFile('docx')} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              <LucideDownload size={16} /> Word
            </button>
          </div>

          {/* Rich Mini Preview Box */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            {cvData.cvFormat === 'europass' ? (
              <div className="p-8 font-sans relative bg-white" style={{ color: '#222', minHeight: '800px', transform: `scale(${cvData.textSize === 'small' ? 0.9 : cvData.textSize === 'large' ? 1.1 : 1})`, transformOrigin: 'top center' }}>
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                  {/* Photo Left */}
                  <div className="w-[130px] shrink-0 text-left">
                    <div className={`w-[110px] h-[110px] border-[2px] flex items-center justify-center overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`} style={{ borderColor: cvData.themeColor || '#0e4a8e' }}>
                      {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover" /> : <LucideUser size={26} className="text-gray-400" />}
                    </div>
                  </div>
                  
                  {/* Center Name & Meta */}
                  <div className="flex-1 px-2">
                    <h1 className="text-[24px] font-bold uppercase tracking-wide mb-3" style={{ color: cvData.themeColor || '#222' }}>{cvData.personalInfo.fullName || 'YOUR NAME'}</h1>
                    <div className="text-[10px] text-gray-800 leading-tight border-t border-gray-300 pt-2 mb-1">
                      {[
                        cvData.personalInfo.passportNumber ? <span key="1"><strong>Passport:</strong> {cvData.personalInfo.passportNumber}</span> : null,
                        cvData.personalInfo.dateOfBirth ? <span key="2"><strong>Date of birth:</strong> {cvData.personalInfo.dateOfBirth}</span> : null,
                        cvData.personalInfo.nationality ? <span key="3"><strong>Nationality:</strong> {cvData.personalInfo.nationality}</span> : null,
                        cvData.personalInfo.gender ? <span key="4"><strong>Gender:</strong> {cvData.personalInfo.gender}</span> : null,
                      ].filter(Boolean).map((el, i, arr) => <span key={'top'+i}>{el}{i < arr.length - 1 ? ' | ' : ''}</span>)}
                    </div>
                    <div className="text-[10px] text-gray-800 leading-tight">
                      {[
                        cvData.personalInfo.email ? <span key="5"><strong>Email address:</strong> <span className="text-blue-600 underline">{cvData.personalInfo.email}</span></span> : null,
                        (cvData.personalInfo.address || cvData.personalInfo.city) ? <span key="6"><strong>Address:</strong> {[cvData.personalInfo.address, cvData.personalInfo.postalCode, cvData.personalInfo.city, cvData.personalInfo.country].filter(Boolean).join(', ')} (Home)</span> : null,
                      ].filter(Boolean).map((el, i, arr) => <span key={'bot'+i}>{el}{i < arr.length - 1 ? ' | ' : ''}</span>)}
                    </div>
                  </div>

                  {/* Logo Right */}
                  <div className="w-[140px] shrink-0 text-right">
                    {cvData.europassLogo !== 'no' && (
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/06/Europass_-_European_Union_-_Logo.svg" className="h-[32px] ml-auto" alt="Europass" />
                    )}
                  </div>
                </div>

                {/* ABOUT ME */}
                {cvData.personalInfo.aboutMe && (
                  <div className="flex mb-5 group">
                    <div className="w-[20px] shrink-0 flex justify-start pt-[6px]">
                      <div className="w-[6px] h-[6px] bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest mb-1">About Me</h2>
                      <div className="border-b border-gray-400 w-full mb-3"></div>
                      <div className="text-[10px] text-gray-800 leading-relaxed text-justify">{cvData.personalInfo.aboutMe}</div>
                    </div>
                  </div>
                )}

                {/* EDUCATION */}
                {cvData.education.length > 0 && (
                  <div className="flex mb-5 group">
                    <div className="w-[20px] shrink-0 flex justify-start pt-[6px]">
                      <div className="w-[6px] h-[6px] bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest mb-1">Education and Training</h2>
                      <div className="border-b border-gray-400 w-full mb-3"></div>
                      {cvData.education.slice(0, 3).map((edu, i) => (
                        <div key={i} className="mb-4">
                          <div className="text-[9px] text-gray-500 mb-0.5">{edu.from} {edu.city}{edu.country ? ', ' + edu.country : ''}</div>
                          <div className="text-[10px] uppercase mb-0.5"><strong>{edu.qualification}</strong> <span className="text-gray-700 capitalize">{edu.organization}</span></div>
                          <div className="border-b border-gray-200 w-full mb-1.5"></div>
                          <div className="text-[9px] text-gray-800">
                            <strong>Field of study</strong> {edu.fieldOfStudy || 'General'} <span className="mx-1 text-gray-400">|</span> <strong>Level in EQF</strong> {edu.eqfLevel || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WORK EXPERIENCE */}
                {cvData.workExperience.length > 0 && (
                  <div className="flex mb-5 group">
                    <div className="w-[20px] shrink-0 flex justify-start pt-[6px]">
                      <div className="w-[6px] h-[6px] bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest mb-1">Work Experience</h2>
                      <div className="border-b border-gray-400 w-full mb-3"></div>
                      {cvData.workExperience.slice(0, 3).map((exp, i) => (
                        <div key={i} className="mb-4">
                          <div className="text-[9px] text-gray-500 mb-0.5">{exp.from} – {exp.to || 'Current'} {exp.city}{exp.country ? ', ' + exp.country : ''}</div>
                          <div className="text-[10px] uppercase mb-0.5"><strong>{exp.occupation}</strong> <span className="text-gray-700 capitalize">{exp.employer}</span></div>
                          <div className="border-b border-gray-200 w-full mb-1.5"></div>
                          {exp.responsibilities && exp.responsibilities.filter(Boolean).length > 0 && (
                            <ul className="text-[9px] text-gray-800 list-disc pl-3 mt-1">
                              {exp.responsibilities.filter(Boolean).map((resp, idx) => <li key={idx}>{resp}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CERTIFICATIONS */}
                {cvData.certificates.length > 0 && (
                  <div className="flex mb-5 group">
                    <div className="w-[20px] shrink-0 flex justify-start pt-[6px]">
                      <div className="w-[6px] h-[6px] bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest mb-1">Certifications</h2>
                      <div className="border-b border-gray-400 w-full mb-3"></div>
                      {cvData.certificates.slice(0, 3).map((cert, i) => (
                        <div key={i} className="mb-4">
                          <div className="text-[9px] text-gray-500 mb-0.5">{cert.issuer} {cert.date ? '— ' + cert.date : ''}</div>
                          <div className="text-[10px] mb-1.5"><strong>{cert.title}</strong></div>
                          <div className="text-[9px] text-gray-800">
                            <strong>Mode of learning:</strong> Project based
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LANGUAGE SKILLS */}
                {(cvData.personalInfo.motherTongue || cvData.languages.length > 0) && (
                  <div className="flex mb-5 group">
                    <div className="w-[20px] shrink-0 flex justify-start pt-[6px]">
                      <div className="w-[6px] h-[6px] bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest mb-1">Language Skills</h2>
                      <div className="border-b border-gray-400 w-full mb-3"></div>
                      
                      {cvData.personalInfo.motherTongue && (
                        <div className="text-[10px] mb-3">Mother tongue(s): <strong className="uppercase ml-2">{cvData.personalInfo.motherTongue}</strong></div>
                      )}
                      
                      {cvData.languages.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[10px] mb-2">Other language(s):</div>
                          <div className="w-full text-[9px] text-center">
                            <div className="flex font-bold mb-1">
                              <div className="w-[20%]"></div>
                              <div className="w-[30%] uppercase">Understanding</div>
                              <div className="w-[30%] uppercase">Speaking</div>
                              <div className="w-[20%] uppercase">Writing</div>
                            </div>
                            <div className="flex text-[8px] text-gray-800 border-t border-b border-gray-200 py-1">
                              <div className="w-[20%]"></div>
                              <div className="w-[15%]">Listening</div>
                              <div className="w-[15%]">Reading</div>
                              <div className="w-[15%]">Spoken production</div>
                              <div className="w-[15%]">Spoken interaction</div>
                              <div className="w-[20%]"></div>
                            </div>
                            {cvData.languages.slice(0, 3).map((l, i) => (
                              <div key={i} className="flex border-b border-gray-200 py-1.5">
                                <div className="w-[20%] font-extrabold text-left pl-2 uppercase">{l.language}</div>
                                <div className="w-[15%]">{l.listening || '-'}</div>
                                <div className="w-[15%]">{l.reading || '-'}</div>
                                <div className="w-[15%]">{l.spokenProduction || '-'}</div>
                                <div className="w-[15%]">{l.spokenInteraction || '-'}</div>
                                <div className="w-[20%]">{l.writing || '-'}</div>
                              </div>
                            ))}
                          </div>
                          <div className="text-[8px] text-gray-500 italic mt-2">Levels: A1 and A2: Basic user; B1 and B2: Independent user; C1 and C2: Proficient user</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SKILLS */}
                {(cvData.digitalSkills.length > 0 || cvData.otherSkills.length > 0) && (
                  <div className="flex mb-5 group">
                    <div className="w-[20px] shrink-0 flex justify-start pt-[6px]">
                      <div className="w-[6px] h-[6px] bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-[11px] font-extrabold uppercase tracking-widest mb-1">Skills</h2>
                      <div className="border-b border-gray-400 w-full mb-3"></div>
                      <div className="text-[10px] text-gray-800 leading-relaxed">
                        {[...cvData.digitalSkills, ...cvData.otherSkills].join(' | ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Page Number */}
                {cvData.pageNumbers !== false && (
                  <div className="absolute bottom-4 right-6 text-[9px] text-gray-400">Page 1 / 1</div>
                )}
              </div>
) : cvData.cvFormat === 'modern' ? (
              /* ─── MODERN PREVIEW (dark sidebar) ─── */
              <div className="flex min-h-[400px]">
                <div className="w-[35%] p-4 text-white" style={{ background: '#2c3e50' }}>
                  <div className={`w-16 h-16 mx-auto mb-3 border-2 border-[#34495e] overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`}>
                    {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover" /> : <LucideUser size={22} className="text-[#7f8c8d] mx-auto mt-4" />}
                  </div>
                  <h2 className="text-center text-[11px] font-bold uppercase tracking-widest text-white mb-0.5">{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
                  <div className="text-center text-[8px] text-[#1abc9c] uppercase tracking-wider mb-3 border-b border-[#34495e] pb-3">{cvData.personalInfo.nationality || 'Professional'}</div>
                  <div className="text-[8px] text-[#1abc9c] font-bold uppercase mt-3 mb-2">Contact</div>
                  {cvData.personalInfo.phone && <div className="text-[8px] text-white/80 mb-1.5"><span className="text-[7px] text-[#bdc3c7] block uppercase">Phone</span>{cvData.personalInfo.phone}</div>}
                  {cvData.personalInfo.email && <div className="text-[8px] text-white/80 mb-1.5"><span className="text-[7px] text-[#bdc3c7] block uppercase">Email</span>{cvData.personalInfo.email}</div>}
                  {cvData.digitalSkills.length > 0 && (
                    <>
                      <div className="text-[8px] text-[#1abc9c] font-bold uppercase mt-3 mb-2">Expertise</div>
                      {cvData.digitalSkills.slice(0, 5).map((s, i) => <div key={i} className="text-[8px] text-white/80 mb-1 pl-2 relative before:content-['■'] before:text-[#1abc9c] before:absolute before:left-0 before:text-[6px]">{s}</div>)}
                    </>
                  )}
                </div>
                <div className="w-[65%] p-4 bg-white text-gray-800">
                  {cvData.personalInfo.aboutMe && (
                    <><div className="text-[10px] font-bold text-[#2c3e50] uppercase border-b-2 border-[#ecf0f1] pb-1 mb-2">Profile</div>
                    <p className="text-[8px] text-gray-500 italic mb-3 line-clamp-3">"{cvData.personalInfo.aboutMe}"</p></>
                  )}
                  {cvData.workExperience.length > 0 && (
                    <><div className="text-[10px] font-bold text-[#2c3e50] uppercase border-b-2 border-[#ecf0f1] pb-1 mb-2">Experience</div>
                    {cvData.workExperience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-[#34495e]">{exp.occupation}</span><span className="text-[8px] text-[#1abc9c] font-semibold">{exp.from}-{exp.to}</span></div>
                        <div className="text-[8px] italic text-[#7f8c8d]">{exp.employer}</div>
                      </div>
                    ))}</>
                  )}
                  {cvData.education.length > 0 && (
                    <><div className="text-[10px] font-bold text-[#2c3e50] uppercase border-b-2 border-[#ecf0f1] pb-1 mb-2 mt-3">Education</div>
                    {cvData.education.slice(0, 2).map((edu, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-[#34495e]">{edu.qualification}</span><span className="text-[8px] text-[#1abc9c] font-semibold">{edu.from}-{edu.to}</span></div>
                        <div className="text-[8px] italic text-[#7f8c8d]">{edu.organization}</div>
                      </div>
                    ))}</>
                  )}
                  {cvData.certificates.length > 0 && (
                    <><div className="text-[10px] font-bold text-[#2c3e50] uppercase border-b-2 border-[#ecf0f1] pb-1 mb-2 mt-3">Certifications</div>
                    {cvData.certificates.slice(0, 2).map((cert, i) => (
                      <div key={i} className="mb-1"><span className="text-[9px] font-bold text-[#34495e]">{cert.title}</span><span className="text-[8px] text-[#7f8c8d] ml-1">— {cert.issuer}</span></div>
                    ))}</>
                  )}
                </div>
              </div>
            ) : cvData.cvFormat === 'minimal' ? (
              /* ─── MINIMAL PREVIEW (centered, lots of whitespace) ─── */
              <div className="p-6 bg-white text-gray-900">
                <div className="text-center border-b border-gray-200 pb-4 mb-5">
                  {cvData.photoUrl && (
                    <div className={`w-14 h-14 mx-auto mb-2 border border-gray-200 overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`}>
                      <img src={cvData.photoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h2 className="text-[16px] font-light uppercase tracking-[3px] text-gray-900 mb-1">{cvData.personalInfo.fullName || 'NAME SURNAME'}</h2>
                  <div className="text-[8px] text-gray-500" style={{ wordSpacing: '5px' }}>{[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.city].filter(Boolean).join(' | ')}</div>
                </div>
                {cvData.personalInfo.aboutMe && <p className="text-[8px] text-gray-500 italic text-center max-w-[80%] mx-auto mb-4 line-clamp-2">"{cvData.personalInfo.aboutMe}"</p>}
                {cvData.workExperience.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[9px] font-bold uppercase tracking-[2px] text-gray-900 mb-3">Experience</div>
                    {cvData.workExperience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="flex mb-3">
                        <div className="w-[60px] text-[8px] font-semibold text-gray-900 shrink-0">{exp.from}—{exp.to}</div>
                        <div className="flex-1 border-l border-gray-100 pl-3">
                          <div className="text-[9px] font-semibold">{exp.occupation}</div>
                          <div className="text-[8px] text-gray-500 italic">{exp.employer}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cvData.education.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[9px] font-bold uppercase tracking-[2px] text-gray-900 mb-3">Education</div>
                    {cvData.education.slice(0, 2).map((edu, i) => (
                      <div key={i} className="flex mb-3">
                        <div className="w-[60px] text-[8px] font-semibold text-gray-900 shrink-0">{edu.from}—{edu.to}</div>
                        <div className="flex-1 border-l border-gray-100 pl-3">
                          <div className="text-[9px] font-semibold">{edu.qualification}</div>
                          <div className="text-[8px] text-gray-500 italic">{edu.organization}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cvData.digitalSkills.length > 0 && (
                  <div><div className="text-[9px] font-bold uppercase tracking-[2px] text-gray-900 mb-2">Skills</div>
                  <div className="text-[8px] text-gray-600">{cvData.digitalSkills.join(' · ')}</div></div>
                )}
              </div>
            ) : cvData.cvFormat === 'plain' ? (
              /* ─── PLAIN PREVIEW (no photo, serif, professional) ─── */
              <div className="p-6 bg-white text-black" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                  <h2 className="text-[16px] font-bold uppercase mb-1">{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
                  <div className="text-[8px]">{[cvData.personalInfo.address, cvData.personalInfo.city, cvData.personalInfo.phone, cvData.personalInfo.email].filter(Boolean).join(' | ')}</div>
                </div>
                {cvData.personalInfo.aboutMe && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase border-b border-black mb-1 pb-0.5">Summary</div>
                    <div className="text-[8px] leading-relaxed">{cvData.personalInfo.aboutMe}</div>
                  </div>
                )}
                {cvData.workExperience.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase border-b border-black mb-1 pb-0.5">Experience</div>
                    {cvData.workExperience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between text-[9px] font-bold"><span>{exp.occupation}</span><span>{exp.from} - {exp.to}</span></div>
                        <div className="text-[8px] italic">{exp.employer}{exp.city ? ', ' + exp.city : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
                {cvData.education.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase border-b border-black mb-1 pb-0.5">Education</div>
                    {cvData.education.slice(0, 2).map((edu, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between text-[9px] font-bold"><span>{edu.qualification}</span><span>{edu.from} - {edu.to}</span></div>
                        <div className="text-[8px] italic">{edu.organization}</div>
                      </div>
                    ))}
                  </div>
                )}
                {(cvData.digitalSkills.length > 0 || cvData.otherSkills.length > 0) && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase border-b border-black mb-1 pb-0.5">Skills</div>
                    <div className="text-[8px]">{[...cvData.digitalSkills, ...cvData.otherSkills].join(', ')}</div>
                  </div>
                )}
              </div>
            ) : cvData.cvFormat === 'elegant' ? (
              /* ─── ELEGANT PREVIEW (themed sidebar) ─── */
              <div className="flex min-h-[400px]">
                <div className="w-[35%] p-4 text-white/90" style={{ background: cvData.themeColor || '#0e4a8e' }}>
                  <div className={`w-16 h-16 mx-auto mb-3 border-2 border-white/30 overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`}>
                    {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover" /> : <LucideUser size={22} className="text-white/40 mx-auto mt-4" />}
                  </div>
                  <div className="text-center text-[11px] font-bold tracking-wider text-white mb-0.5">{cvData.personalInfo.fullName || 'YOUR NAME'}</div>
                  <div className="text-center text-[8px] font-light uppercase tracking-[2px] mb-3">{cvData.personalInfo.nationality || 'Professional'}</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-2 mt-3 text-white">Contact</div>
                  {cvData.personalInfo.phone && <div className="text-[8px] mb-1.5"><span className="text-white/50 text-[7px] block uppercase">Phone</span>{cvData.personalInfo.phone}</div>}
                  {cvData.personalInfo.email && <div className="text-[8px] mb-1.5"><span className="text-white/50 text-[7px] block uppercase">Email</span>{cvData.personalInfo.email}</div>}
                  {cvData.digitalSkills.length > 0 && (
                    <>
                      <div className="text-[8px] font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-2 mt-3 text-white">Skills</div>
                      <div className="text-[8px] leading-[1.8]">{cvData.digitalSkills.slice(0, 5).join('\n').split('\n').map((s, i) => <div key={i}>{s}</div>)}</div>
                    </>
                  )}
                  {cvData.languages.length > 0 && (
                    <>
                      <div className="text-[8px] font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-2 mt-3 text-white">Languages</div>
                      {cvData.languages.slice(0, 3).map((l, i) => <div key={i} className="text-[8px] mb-1"><span className="text-white/50 text-[7px] block uppercase">{l.language}</span>{l.listening || 'Proficient'}</div>)}
                    </>
                  )}
                </div>
                <div className="w-[65%] p-4 bg-white text-gray-800">
                  {cvData.personalInfo.aboutMe && (
                    <><div className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-100 pb-1" style={{ color: cvData.themeColor || '#0e4a8e' }}>Profile</div>
                    <p className="text-[8px] text-gray-500 italic mb-3 line-clamp-3">"{cvData.personalInfo.aboutMe}"</p></>
                  )}
                  {cvData.workExperience.length > 0 && (
                    <><div className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-100 pb-1 mt-2" style={{ color: cvData.themeColor || '#0e4a8e' }}>Experience</div>
                    {cvData.workExperience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-gray-700">{exp.occupation}</span><span className="text-[8px] font-semibold" style={{ color: cvData.themeColor || '#0e4a8e' }}>{exp.from}-{exp.to}</span></div>
                        <div className="text-[8px] italic text-gray-500">{exp.employer}</div>
                      </div>
                    ))}</>
                  )}
                  {cvData.education.length > 0 && (
                    <><div className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-100 pb-1 mt-2" style={{ color: cvData.themeColor || '#0e4a8e' }}>Education</div>
                    {cvData.education.slice(0, 2).map((edu, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between"><span className="text-[9px] font-bold text-gray-700">{edu.qualification}</span><span className="text-[8px] font-semibold" style={{ color: cvData.themeColor || '#0e4a8e' }}>{edu.from}-{edu.to}</span></div>
                        <div className="text-[8px] italic text-gray-500">{edu.organization}</div>
                      </div>
                    ))}</>
                  )}
                  {cvData.certificates.length > 0 && (
                    <><div className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-100 pb-1 mt-2" style={{ color: cvData.themeColor || '#0e4a8e' }}>Certifications</div>
                    {cvData.certificates.slice(0, 2).map((cert, i) => (
                      <div key={i} className="mb-1"><span className="text-[9px] font-bold text-gray-700">{cert.title}</span><span className="text-[8px] text-gray-500 ml-1">— {cert.issuer}</span></div>
                    ))}</>
                  )}
                </div>
              </div>
            ) : (
              /* ─── GENERAL (DEFAULT) PREVIEW ─── */
              <>
                <div className="p-5 flex items-center gap-3 border-b-2" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}>
                  {cvData.photoUrl && (
                    <div className={`w-14 h-14 overflow-hidden shrink-0 ${getPhotoShapeClass(cvData.photoShape)}`}>
                      <img src={cvData.photoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-[14px] font-bold uppercase tracking-wider" style={{ color: cvData.themeColor || '#0e4a8e' }}>{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
                    <div className="text-[8px] text-gray-500">{[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.city].filter(Boolean).join(' • ')}</div>
                  </div>
                </div>
                <div className="p-5 space-y-4 text-gray-800">
                  {cvData.personalInfo.aboutMe && (
                    <div>
                      <div className="text-[9px] font-bold uppercase pb-1 mb-1 border-b border-gray-200" style={{ color: cvData.themeColor || '#0e4a8e' }}>Professional Summary</div>
                      <div className="text-[8px] text-gray-600 leading-relaxed">{cvData.personalInfo.aboutMe}</div>
                    </div>
                  )}
                  {cvData.workExperience.length > 0 && (
                    <div>
                      <div className="text-[9px] font-bold uppercase pb-1 mb-1 border-b border-gray-200" style={{ color: cvData.themeColor || '#0e4a8e' }}>Work Experience</div>
                      {cvData.workExperience.slice(0, 2).map((exp, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between"><span className="text-[9px] font-bold text-gray-800">{exp.occupation}</span><span className="text-[8px] font-semibold text-gray-500">{exp.from}-{exp.to}</span></div>
                          <div className="text-[8px] italic text-gray-500">{exp.employer}{exp.city ? ' | ' + exp.city : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cvData.education.length > 0 && (
                    <div>
                      <div className="text-[9px] font-bold uppercase pb-1 mb-1 border-b border-gray-200" style={{ color: cvData.themeColor || '#0e4a8e' }}>Education</div>
                      {cvData.education.slice(0, 2).map((edu, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between"><span className="text-[9px] font-bold text-gray-800">{edu.qualification}</span><span className="text-[8px] font-semibold text-gray-500">{edu.from}-{edu.to}</span></div>
                          <div className="text-[8px] italic text-gray-500">{edu.organization}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cvData.certificates.length > 0 && (
                    <div>
                      <div className="text-[9px] font-bold uppercase pb-1 mb-1 border-b border-gray-200" style={{ color: cvData.themeColor || '#0e4a8e' }}>Certifications</div>
                      {cvData.certificates.slice(0, 2).map((cert, i) => (
                        <div key={i} className="mb-1"><span className="text-[9px] font-bold">{cert.title}</span><span className="text-[8px] text-gray-500"> ({cert.issuer}{cert.date ? ', ' + cert.date : ''})</span></div>
                      ))}
                    </div>
                  )}
                  {(cvData.digitalSkills.length > 0 || cvData.otherSkills.length > 0) && (
                    <div>
                      <div className="text-[9px] font-bold uppercase pb-1 mb-1 border-b border-gray-200" style={{ color: cvData.themeColor || '#0e4a8e' }}>Skills</div>
                      <div className="text-[8px] text-gray-600">
                        {cvData.digitalSkills.length > 0 && <><strong>Technical:</strong> {cvData.digitalSkills.join(', ')}<br /></>}
                        {cvData.otherSkills.length > 0 && <><strong>Other:</strong> {cvData.otherSkills.join(', ')}</>}
                      </div>
                    </div>
                  )}
                  {cvData.languages.length > 0 && (
                    <div>
                      <div className="text-[9px] font-bold uppercase pb-1 mb-1 border-b border-gray-200" style={{ color: cvData.themeColor || '#0e4a8e' }}>Languages</div>
                      <div className="flex flex-wrap gap-1">
                        {cvData.languages.slice(0, 4).map((l, i) => <span key={i} className="text-[8px] font-medium text-gray-700">{l.language}{i < cvData.languages.length - 1 ? ' •' : ''}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <p className="text-center text-slate-500 text-xs mt-2">{lastSavedId ? '✅ Saved — ready to download' : 'Fill form → Save → Download PDF/JPG/Word'}</p>
        </div>

      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="mobile-action-bar">
        <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          {loading ? <LucideLoader2 size={16} className="animate-spin" /> : <LucideSave size={16} />}
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => downloadFile('pdf')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={16} /> PDF
        </button>
        <button onClick={() => downloadFile('jpg')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={16} /> JPG
        </button>
        <button onClick={() => downloadFile('docx')} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={16} /> Word
        </button>
      </div>
    </div>
  );
};

export default CVBuilder;
