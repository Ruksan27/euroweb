import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  LucideUpload, LucideSparkles, LucidePlus, LucideTrash, LucideDownload,
  LucideBriefcase, LucideGraduationCap, LucideWrench, LucideUser, LucideImage,
  LucideFileText, LucideLanguages, LucideAward, LucideLoader2, LucideSave,
  LucideX
} from 'lucide-react';
import { API } from '../config/api';

const CVBuilder = ({ initialData }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(initialData?._id || null);
  const [aboutSuggestions, setAboutSuggestions] = useState([]);
  const [loadingAbout, setLoadingAbout] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
      e.target.value = null;
    }
  };

  const handleSuggestAboutMe = async () => {
    try {
      setLoadingAbout(true);
      const response = await axios.post(`${API.ai}/suggest-about`, {
        skills: [...(cvData.digitalSkills || []), ...(cvData.otherSkills || [])],
        experience: cvData.workExperience || [],
        currentAboutMe: cvData.personalInfo.aboutMe || ''
      });
      if (response.data && response.data.options) {
        setAboutSuggestions(response.data.options);
        setShowSuggestions(true);
      } else {
        toast.error('Failed to get suggestions');
      }
    } catch (error) {
      toast.error('Error generating suggestions');
    } finally {
      setLoadingAbout(false);
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
    if (!cvData.personalInfo.fullName?.trim()) {
      toast.error('Please enter your full name before downloading');
      return;
    }
    const token = localStorage.getItem('user_token');
    if (!token) {
      toast.error('Please log in to download your CV');
      return;
    }

    const toastId = toast.loading('Saving & generating your file...');
    try {
      const saveResponse = await axios.post(`${API.cv}/save`, cvData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const savedId = saveResponse.data._id;
      setLastSavedId(savedId);
      setCvData(prev => ({ ...prev, _id: savedId }));

      toast.loading(`Generating ${type.toUpperCase()}...`, { id: toastId });

      const mimeTypes = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const extensions = { pdf: 'pdf', jpg: 'jpg', docx: 'docx' };

      const fileResponse = await axios.get(`${API.cv}/generate-${type}/${savedId}?t=${Date.now()}`, {
        responseType: 'blob',
        timeout: 60000,
      });

      const blob = new Blob([fileResponse.data], { type: mimeTypes[type] || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      const name = (cvData.personalInfo.fullName || 'CV').replace(/\s+/g, '_');
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${name}_Europass.${extensions[type] || type}`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      toast.success(`${type.toUpperCase()} downloaded successfully! 🚀`, { id: toastId });
    } catch (error) {
      console.error('Download Error:', error);
      toast.error(`Failed to download ${type.toUpperCase()}`, { id: toastId });
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

  const getPhotoShapeClass = (shape) => {
    switch (shape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-none';
      default: return 'rounded-2xl';
    }
  };

  // ─── EUROPASS PREVIEW COMPONENT ─────────────────────────────────────────────
  const EuropassPreview = () => {
    const p = cvData.personalInfo;
    const europassVariant = cvData.europassVariant || 'v1';

    const contactItems = [
      p.passportNumber ? <span key="pp"><strong>Residence permit:</strong> {p.passportNumber}</span> : null,
      p.dateOfBirth ? <span key="dob"><strong>Date of birth:</strong> {p.dateOfBirth}</span> : null,
      p.nationality ? <span key="nat"><strong>Nationality:</strong> {p.nationality}</span> : null,
      p.gender ? <span key="gen"><strong>Gender:</strong> {p.gender}</span> : null,
    ].filter(Boolean);

    const contactItems2 = [
      p.phone ? <span key="ph"><strong>Phone:</strong> {p.phone}</span> : null,
      p.email ? <span key="em"><strong>Email:</strong> <span className="text-blue-700 underline">{p.email}</span></span> : null,
    ].filter(Boolean);

    const addressLine = [p.address, p.postalCode, p.city, p.country].filter(Boolean).join(', ');

    const photoStyle = cvData.photoShape === 'circle' ? 'rounded-full' : cvData.photoShape === 'square' ? 'rounded-none' : 'rounded-xl';

    const isV3 = europassVariant === 'v3';
    const isV4 = europassVariant === 'v4';
    const isV2 = europassVariant === 'v2';

    return (
      <div className="font-sans bg-white text-[#111]" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* HEADER */}
        <div className="bg-[#f3f4f6] px-7 pt-5 pb-4">
          {/* Europass Logo */}
          {cvData.europassLogo !== 'no' && (
            <div className={`flex items-center gap-1.5 mb-3 ${isV3 || isV4 ? 'justify-center' : 'justify-end'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" className="h-[20px]">
                <rect width="120" height="80" fill="#034ea2" />
                <circle cx="60" cy="15" r="3" fill="#ffcc00" /><circle cx="60" cy="65" r="3" fill="#ffcc00" />
                <circle cx="35" cy="40" r="3" fill="#ffcc00" /><circle cx="85" cy="40" r="3" fill="#ffcc00" />
                <circle cx="42" cy="22" r="3" fill="#ffcc00" /><circle cx="78" cy="58" r="3" fill="#ffcc00" />
                <circle cx="78" cy="22" r="3" fill="#ffcc00" /><circle cx="42" cy="58" r="3" fill="#ffcc00" />
                <circle cx="37" cy="30" r="3" fill="#ffcc00" /><circle cx="83" cy="50" r="3" fill="#ffcc00" />
                <circle cx="83" cy="30" r="3" fill="#ffcc00" /><circle cx="37" cy="50" r="3" fill="#ffcc00" />
              </svg>
              <span className="text-[#5c2d91] font-sans text-[18px] tracking-tighter leading-none">europass</span>
            </div>
          )}

          {/* Header layout based on variant */}
          <div className={`flex ${isV2 ? 'flex-row-reverse' : isV3 || isV4 ? 'flex-col items-center' : 'flex-row'} gap-3`}>
            {/* Photo */}
            {!isV4 && (
              <div className={`shrink-0 ${isV3 ? 'mb-2' : ''}`}>
                <div className={`w-[90px] h-[90px] border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-gray-100 ${photoStyle}`}>
                  {cvData.photoUrl
                    ? <img src={cvData.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                    : <LucideUser size={22} className="text-gray-400" />}
                </div>
              </div>
            )}

            {/* Name & Contact */}
            <div className={`flex-1 min-w-0 ${isV2 ? 'pr-3' : isV3 || isV4 ? 'text-center' : 'pl-2'}`}>
              <h1 className="text-[20px] font-bold uppercase tracking-wide text-[#4b5563] mb-1">
                {p.fullName || 'YOUR NAME'}
              </h1>
              <div className={`border-b border-gray-400 mb-2 ${isV2 ? '' : isV3 || isV4 ? 'w-1/2 mx-auto' : ''}`}></div>
              <div className="text-[9px] text-gray-900 leading-[1.8] font-medium">
                {contactItems.length > 0 && (
                  <div className="mb-0.5">{contactItems.map((el, idx) => <span key={idx}>{el}{idx < contactItems.length - 1 ? <span className="text-gray-400 mx-1">|</span> : ''}</span>)}</div>
                )}
                {contactItems2.length > 0 && (
                  <div className="mb-0.5">{contactItems2.map((el, idx) => <span key={idx}>{el}{idx < contactItems2.length - 1 ? <span className="text-gray-400 mx-1">|</span> : ''}</span>)}</div>
                )}
                {addressLine && (
                  <div><strong>Address:</strong> {addressLine}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="bg-white px-7 py-4">

          {/* ABOUT ME */}
          {p.aboutMe && (
            <div className="flex mb-3">
              <div className="w-[14px] shrink-0 pt-[5px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-black">About Me</h2>
                <div className="border-b border-gray-400 w-full mb-2"></div>
                <div className="text-[9px] text-gray-800 leading-[1.6] text-justify">{p.aboutMe}</div>
              </div>
            </div>
          )}

          {/* EDUCATION */}
          {cvData.education.length > 0 && (
            <div className="flex mb-3">
              <div className="w-[14px] shrink-0 pt-[5px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-black">Education and Training</h2>
                <div className="border-b border-gray-400 w-full mb-2"></div>
                {cvData.education.map((edu, i) => (
                  <div key={i} className="mb-2.5 last:mb-0">
                    <div className="text-[8.5px] text-gray-500 mb-0.5">{[edu.from, edu.to ? '– ' + edu.to : ''].filter(Boolean).join(' ')} {edu.city}{edu.country ? ', ' + edu.country : ''}</div>
                    <div className="text-[9px] mb-0.5"><strong className="uppercase">{edu.qualification}</strong> {edu.organization && <span className="text-gray-700 capitalize">— {edu.organization}</span>}</div>
                    <div className="border-b border-gray-200 w-full mb-1"></div>
                    <div className="text-[8.5px] text-gray-800">
                      <strong>Field of study</strong> {edu.fieldOfStudy || 'General'} <span className="mx-1 text-gray-400">|</span> <strong>Level in EQF</strong> {edu.eqfLevel || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORK EXPERIENCE */}
          {cvData.workExperience.length > 0 && (
            <div className="flex mb-3">
              <div className="w-[14px] shrink-0 pt-[5px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-black">Work Experience</h2>
                <div className="border-b border-gray-400 w-full mb-2"></div>
                {cvData.workExperience.map((exp, i) => (
                  <div key={i} className="mb-2.5 last:mb-0">
                    <div className="text-[8.5px] text-gray-500 mb-0.5">{exp.from}{exp.from ? ' – ' : ''}{exp.to || 'Current'} {exp.city}{exp.country ? ', ' + exp.country : ''}</div>
                    <div className="text-[9px] mb-0.5"><strong className="uppercase">{exp.occupation}</strong> {exp.employer && <span className="text-gray-700 capitalize">— {exp.employer}</span>}</div>
                    <div className="border-b border-gray-200 w-full mb-1"></div>
                    {exp.responsibilities && exp.responsibilities.filter(Boolean).length > 0 && (
                      <ul className="text-[8.5px] text-gray-800 list-disc pl-3 mt-0.5 space-y-0.5">
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
            <div className="flex mb-3">
              <div className="w-[14px] shrink-0 pt-[5px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-black">Certifications</h2>
                <div className="border-b border-gray-400 w-full mb-2"></div>
                {cvData.certificates.map((cert, i) => (
                  <div key={i} className="mb-2.5 last:mb-0">
                    <div className="text-[8.5px] text-gray-500 mb-0.5">{cert.issuer}{cert.date ? ' — ' + cert.date : ''}</div>
                    <div className="text-[9px] mb-1"><strong>{cert.title}</strong></div>
                    <div className="border-b border-gray-200 w-full mb-1"></div>
                    <div className="text-[8.5px] text-gray-800"><strong>Mode of learning:</strong> Project based</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LANGUAGE SKILLS */}
          {(p.motherTongue || cvData.languages.length > 0) && (
            <div className="flex mb-3">
              <div className="w-[14px] shrink-0 pt-[5px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-black">Language Skills</h2>
                <div className="border-b border-gray-400 w-full mb-2"></div>
                {p.motherTongue && (
                  <div className="text-[9px] mb-2">Mother tongue(s): <strong className="uppercase ml-1">{p.motherTongue}</strong></div>
                )}
                {cvData.languages.length > 0 && (
                  <div>
                    <div className="text-[9px] mb-1.5">Other language(s):</div>
                    <div className="w-full text-[8px] text-center">
                      <div className="flex font-bold mb-1 border-b border-gray-300 pb-1">
                        <div className="w-[22%] text-left"></div>
                        <div className="w-[30%] uppercase">Understanding</div>
                        <div className="w-[30%] uppercase">Speaking</div>
                        <div className="w-[18%] uppercase">Writing</div>
                      </div>
                      <div className="flex text-[7.5px] text-gray-600 border-b border-gray-200 pb-1 mb-1">
                        <div className="w-[22%]"></div>
                        <div className="w-[15%]">Listening</div>
                        <div className="w-[15%]">Reading</div>
                        <div className="w-[15%]">Spoken prod.</div>
                        <div className="w-[15%]">Spoken inter.</div>
                        <div className="w-[18%]"></div>
                      </div>
                      {cvData.languages.map((l, i) => (
                        <div key={i} className={`flex border-b border-gray-200 py-1 ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                          <div className="w-[22%] font-extrabold text-left pl-1 uppercase text-[8px]">{l.language}</div>
                          <div className="w-[15%]">{l.listening || '-'}</div>
                          <div className="w-[15%]">{l.reading || '-'}</div>
                          <div className="w-[15%]">{l.spokenProduction || '-'}</div>
                          <div className="w-[15%]">{l.spokenInteraction || '-'}</div>
                          <div className="w-[18%]">{l.writing || '-'}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[7.5px] text-gray-500 italic mt-1.5">Levels: A1/A2: Basic; B1/B2: Independent; C1/C2: Proficient</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SKILLS */}
          {(cvData.digitalSkills.length > 0 || cvData.otherSkills.length > 0) && (
            <div className="flex mb-3">
              <div className="w-[14px] shrink-0 pt-[5px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-black">Skills</h2>
                <div className="border-b border-gray-400 w-full mb-2"></div>
                <div className="text-[9px] text-gray-800 leading-[1.7]">
                  {[...cvData.digitalSkills, ...cvData.otherSkills].join(' | ')}
                </div>
              </div>
            </div>
          )}

          {/* Page number */}
          {cvData.pageNumbers !== false && (
            <div className="text-right text-[8px] text-gray-400 mt-2">Page 1 / 1</div>
          )}
        </div>
      </div>
    );
  };

  // ─── OTHER FORMAT PREVIEWS ───────────────────────────────────────────────────
  const ModernPreview = () => (
    <div className="flex min-h-[380px]">
      <div className="w-[35%] p-4 text-white" style={{ background: '#2c3e50' }}>
        <div className={`w-16 h-16 mx-auto mb-3 border-2 border-[#34495e] overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`}>
          {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover" alt="Profile" /> : <LucideUser size={22} className="text-[#7f8c8d] mx-auto mt-4" />}
        </div>
        <h2 className="text-center text-[11px] font-bold uppercase tracking-widest text-white mb-0.5">{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
        <div className="text-center text-[8px] text-[#1abc9c] uppercase tracking-wider mb-3 border-b border-[#34495e] pb-2">{cvData.personalInfo.nationality || 'Professional'}</div>
        <div className="text-[8px] text-[#1abc9c] font-bold uppercase mb-1.5">Contact</div>
        {cvData.personalInfo.phone && <div className="text-[8px] text-white/80 mb-1"><span className="text-[7px] text-[#bdc3c7] block uppercase">Phone</span>{cvData.personalInfo.phone}</div>}
        {cvData.personalInfo.email && <div className="text-[8px] text-white/80 mb-1"><span className="text-[7px] text-[#bdc3c7] block uppercase">Email</span>{cvData.personalInfo.email}</div>}
        {cvData.digitalSkills.length > 0 && (
          <>
            <div className="text-[8px] text-[#1abc9c] font-bold uppercase mt-2 mb-1.5">Expertise</div>
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
  );

  const MinimalPreview = () => (
    <div className="p-6 bg-white text-gray-900">
      <div className="text-center border-b border-gray-200 pb-4 mb-5">
        {cvData.photoUrl && (
          <div className={`w-14 h-14 mx-auto mb-2 border border-gray-200 overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`}>
            <img src={cvData.photoUrl} className="w-full h-full object-cover" alt="Profile" />
          </div>
        )}
        <h2 className="text-[16px] font-light uppercase tracking-[3px] text-gray-900 mb-1">{cvData.personalInfo.fullName || 'NAME SURNAME'}</h2>
        <div className="text-[8px] text-gray-500">{[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.city].filter(Boolean).join(' | ')}</div>
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
  );

  const PlainPreview = () => (
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
  );

  const ElegantPreview = () => (
    <div className="flex min-h-[380px]">
      <div className="w-[35%] p-4 text-white/90" style={{ background: cvData.themeColor || '#0e4a8e' }}>
        <div className={`w-16 h-16 mx-auto mb-3 border-2 border-white/30 overflow-hidden ${getPhotoShapeClass(cvData.photoShape)}`}>
          {cvData.photoUrl ? <img src={cvData.photoUrl} className="w-full h-full object-cover" alt="Profile" /> : <LucideUser size={22} className="text-white/40 mx-auto mt-4" />}
        </div>
        <div className="text-center text-[11px] font-bold tracking-wider text-white mb-0.5">{cvData.personalInfo.fullName || 'YOUR NAME'}</div>
        <div className="text-center text-[8px] font-light uppercase tracking-[2px] mb-3 opacity-70">{cvData.personalInfo.nationality || 'Professional'}</div>
        <div className="text-[8px] font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-2 mt-3 text-white">Contact</div>
        {cvData.personalInfo.phone && <div className="text-[8px] mb-1.5"><span className="text-white/50 text-[7px] block uppercase">Phone</span>{cvData.personalInfo.phone}</div>}
        {cvData.personalInfo.email && <div className="text-[8px] mb-1.5"><span className="text-white/50 text-[7px] block uppercase">Email</span>{cvData.personalInfo.email}</div>}
        {cvData.digitalSkills.length > 0 && (
          <>
            <div className="text-[8px] font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-2 mt-3 text-white">Skills</div>
            <div className="text-[8px] leading-[1.8]">{cvData.digitalSkills.slice(0, 5).map((s, i) => <div key={i}>{s}</div>)}</div>
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
  );

  const GeneralPreview = () => (
    <>
      <div className="px-5 py-4 flex items-center gap-3 border-b-2" style={{ borderColor: cvData.themeColor || '#0e4a8e' }}>
        {cvData.photoUrl && (
          <div className={`w-14 h-14 overflow-hidden shrink-0 ${getPhotoShapeClass(cvData.photoShape)}`}>
            <img src={cvData.photoUrl} className="w-full h-full object-cover" alt="Profile" />
          </div>
        )}
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-wider" style={{ color: cvData.themeColor || '#0e4a8e' }}>{cvData.personalInfo.fullName || 'YOUR NAME'}</h2>
          <div className="text-[8px] text-gray-500">{[cvData.personalInfo.email, cvData.personalInfo.phone, cvData.personalInfo.city].filter(Boolean).join(' • ')}</div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3 text-gray-800">
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
  );

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1600px] mx-auto py-6 px-4 sm:px-8 lg:px-12 pb-24 lg:pb-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT SIDE: BUILDER FORM */}
        <div className="w-full lg:w-[58%] space-y-5">

          {/* AI Magic */}
          <section className="form-section">
            <div className="flex justify-between items-center mb-3">
              <h3 className="section-title text-indigo-400 mb-0">
                <LucideSparkles size={18} /> AI Smart Extract
              </h3>
            </div>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-4 sm:p-5 text-center hover:border-indigo-500/50 transition-all cursor-pointer relative bg-black/20">
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleAIExtract} disabled={loading} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              <LucideUpload className="mx-auto mb-2 text-indigo-400" size={24} />
              <p className="text-slate-300 font-semibold text-sm">Upload Multiple Documents</p>
              <p className="text-xs text-slate-500 mt-0.5">CV, ID, Certificates — AI merges everything! (Max 5 files)</p>
              {loading && <div className="mt-2 text-xs text-indigo-400 animate-pulse">Extracting data...</div>}
            </div>
          </section>

          {/* Photo & Shape */}
          <section className="form-section">
            <h3 className="section-title"><LucideImage size={16} className="text-emerald-400" /> Profile Photo</h3>
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="relative group cursor-pointer shrink-0" onClick={() => photoInputRef.current.click()}>
                <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <div className={`w-28 h-28 bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center transition-all group-hover:border-emerald-400 ${getPhotoShapeClass(cvData.photoShape)}`}>
                  {uploadingImage ? <LucideLoader2 className="animate-spin text-emerald-400" />
                    : cvData.photoUrl ? <img src={cvData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      : <LucideUser size={36} className="text-white/30" />}
                </div>
                <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold ${getPhotoShapeClass(cvData.photoShape)}`}>
                  CHANGE
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Photo Shape</label>
                  <div className="flex gap-2">
                    {['circle', 'rounded', 'square'].map(shape => (
                      <button
                        key={shape}
                        onClick={() => setCvData(p => ({ ...p, photoShape: shape }))}
                        className={`flex-1 py-2 px-3 rounded-xl capitalize font-medium text-xs transition-all border ${cvData.photoShape === shape ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">CV Template Format</label>
                  <div className="flex flex-wrap gap-2">
                    {['europass', 'modern', 'minimal', 'general', 'plain', 'elegant'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setCvData(p => ({ ...p, cvFormat: fmt }))}
                        className={`py-1.5 px-3 rounded-xl capitalize font-medium text-xs transition-all border ${cvData.cvFormat === fmt ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Accent Theme Color</label>
                  <div className="flex gap-2 flex-wrap items-center">
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
                        className={`w-7 h-7 rounded-full transition-all border border-white/20 ${color.bg} ${cvData.themeColor === color.hex ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {cvData.cvFormat === 'europass' && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Europass Settings</h4>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Template Variant</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['v1', 'v2', 'v3', 'v4'].map(v => (
                          <button
                            key={v}
                            onClick={() => setCvData(p => ({ ...p, europassVariant: v }))}
                            className={`py-1.5 px-2 rounded-lg capitalize font-medium text-xs transition-all border ${cvData.europassVariant === v || (!cvData.europassVariant && v === 'v1') ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                          >
                            Layout {v.replace('v', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Text Size</label>
                      <div className="flex gap-1.5">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            onClick={() => setCvData(p => ({ ...p, textSize: size }))}
                            className={`flex-1 py-1.5 px-2 rounded-lg capitalize font-medium text-xs transition-all border ${cvData.textSize === size || (!cvData.textSize && size === 'medium') ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Europass Logo</label>
                      <div className="flex flex-col gap-1.5">
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
                      <label className="text-[11px] text-slate-400 block mb-1.5">Page Numbers</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input type="radio" name="pageNumbers" checked={cvData.pageNumbers !== false} onChange={() => setCvData(p => ({ ...p, pageNumbers: true }))} className="accent-indigo-500" />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input type="radio" name="pageNumbers" checked={cvData.pageNumbers === false} onChange={() => setCvData(p => ({ ...p, pageNumbers: false }))} className="accent-indigo-500" />
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
            <h3 className="section-title"><LucideUser size={16} className="text-indigo-400" /> Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="First Name(s)" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.firstName || ''} onChange={(e) => updatePI('firstName', e.target.value)} />
              <input placeholder="Last Name(s)" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.lastName || ''} onChange={(e) => updatePI('lastName', e.target.value)} />
              <input placeholder="Full Name (Auto-computed)" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.fullName} onChange={(e) => updatePI('fullName', e.target.value)} />
              <input placeholder="Email" type="email" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.email} onChange={(e) => updatePI('email', e.target.value)} />
              <input placeholder="Phone" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.phone} onChange={(e) => updatePI('phone', e.target.value)} />
              <input placeholder="Date of Birth (DD/MM/YYYY)" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.dateOfBirth} onChange={(e) => updatePI('dateOfBirth', e.target.value)} />
              <input placeholder="Nationality" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.nationality} onChange={(e) => updatePI('nationality', e.target.value)} />
              <select className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none text-slate-300 transition-colors" value={cvData.personalInfo.gender} onChange={(e) => updatePI('gender', e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input placeholder="National ID / Citizenship No" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.nationalId} onChange={(e) => updatePI('nationalId', e.target.value)} />
              <input placeholder="Passport / Residence Permit No" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.passportNumber} onChange={(e) => updatePI('passportNumber', e.target.value)} />
              <input placeholder="Address" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors sm:col-span-2" value={cvData.personalInfo.address} onChange={(e) => updatePI('address', e.target.value)} />
              <input placeholder="City" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.city} onChange={(e) => updatePI('city', e.target.value)} />
              <input placeholder="Country" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.country} onChange={(e) => updatePI('country', e.target.value)} />
              <input placeholder="Postal Code" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.postalCode} onChange={(e) => updatePI('postalCode', e.target.value)} />
              <input placeholder="Website URL" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" value={cvData.personalInfo.website || ''} onChange={(e) => updatePI('website', e.target.value)} />
              <input placeholder="LinkedIn Profile Link" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors sm:col-span-2" value={cvData.personalInfo.linkedIn || ''} onChange={(e) => updatePI('linkedIn', e.target.value)} />

              {/* About Me with AI Suggest — fixed overlap */}
              <div className="sm:col-span-2" ref={suggestionsRef}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-300 font-medium">About Me / Profile Description</label>
                  <button
                    type="button"
                    onClick={handleSuggestAboutMe}
                    disabled={loadingAbout}
                    className="flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {loadingAbout ? <LucideLoader2 size={13} className="animate-spin" /> : <LucideSparkles size={13} />}
                    AI Suggest
                  </button>
                </div>
                <textarea
                  placeholder="Write a short professional summary about yourself..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 outline-none min-h-[90px] resize-y transition-colors"
                  value={cvData.personalInfo.aboutMe || ''}
                  onChange={(e) => updatePI('aboutMe', e.target.value)}
                />

                {/* AI Suggestions — inline, NOT absolute (no overlap) */}
                {showSuggestions && aboutSuggestions.length > 0 && (
                  <div className="mt-2 bg-slate-800/95 border border-indigo-500/30 rounded-xl p-3 shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <LucideSparkles size={12} /> AI Suggestions
                      </span>
                      <button
                        onClick={() => { setShowSuggestions(false); setAboutSuggestions([]); }}
                        className="text-slate-400 hover:text-white transition-colors p-0.5"
                      >
                        <LucideX size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {aboutSuggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          onClick={() => { updatePI('aboutMe', sug); setShowSuggestions(false); setAboutSuggestions([]); }}
                          className="p-2.5 bg-white/5 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 rounded-lg cursor-pointer text-xs text-slate-300 transition-all leading-relaxed"
                        >
                          {sug}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold flex items-center gap-2"><LucideGraduationCap size={18} className="text-amber-400" /> Education</h3>
                <label className="cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={13} /> AI Auto-fill
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleSectionAIExtract(e, 'education')} />
                </label>
              </div>
              <button onClick={() => addList('education', { qualification: '', organization: '', city: '', country: '', from: '', to: '', website: '', fieldOfStudy: '', eqfLevel: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-amber-400 transition" title="Add Education Manually"><LucidePlus size={18} /></button>
            </div>
            {cvData.education.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-white/10 rounded-2xl">
                No education added yet. Click <span className="text-amber-400 font-semibold">+</span> to add manually or use AI Auto-fill.
              </div>
            )}
            {cvData.education.map((edu, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-4 mb-3 last:mb-0 relative">
                <button onClick={() => removeList('education', i)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"><LucideTrash size={15} /></button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                  <input placeholder="Qualification (e.g. B.Sc CSIT)" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.qualification} onChange={(e) => updateList('education', i, 'qualification', e.target.value)} />
                  <input placeholder="Organization/University" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.organization} onChange={(e) => updateList('education', i, 'organization', e.target.value)} />
                  <div className="flex gap-2">
                    <input placeholder="City" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.city || ''} onChange={(e) => updateList('education', i, 'city', e.target.value)} />
                    <input placeholder="Country" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.country || ''} onChange={(e) => updateList('education', i, 'country', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="From Year" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.from} onChange={(e) => updateList('education', i, 'from', e.target.value)} />
                    <input placeholder="To Year" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.to} onChange={(e) => updateList('education', i, 'to', e.target.value)} />
                  </div>
                  <input placeholder="Website URL" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.website || ''} onChange={(e) => updateList('education', i, 'website', e.target.value)} />
                  <input placeholder="Field of study" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-amber-400 outline-none transition-colors" value={edu.fieldOfStudy || ''} onChange={(e) => updateList('education', i, 'fieldOfStudy', e.target.value)} />
                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-[10px] text-amber-400 mb-1.5 font-semibold uppercase tracking-wide">Level in EQF</label>
                    <select
                      className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:border-amber-400 outline-none text-amber-300 font-medium transition-colors"
                      value={edu.eqfLevel || ''}
                      onChange={(e) => updateList('education', i, 'eqfLevel', e.target.value)}
                    >
                      <option value="" className="bg-slate-900 text-slate-400">Select EQF Level</option>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={`EQF level ${n}`} className="bg-slate-900 text-white">EQF level {n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <label className="cursor-pointer text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                    <LucideFileText size={13} /> {edu.documentName ? 'Change Certificate' : 'Upload Certificate'}
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                      const doc = await handleDocUpload(e.target.files[0], 'education');
                      if (doc) { updateList('education', i, 'documentUrl', doc.url); updateList('education', i, 'documentName', doc.name); }
                    }} />
                  </label>
                  {edu.documentName && (
                    <a href={edu.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[140px] flex items-center gap-1 underline underline-offset-2">
                      <LucideFileText size={11} /> {edu.documentName}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Certificates */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold flex items-center gap-2"><LucideAward size={18} className="text-rose-400" /> Extra Certificates</h3>
                <label className="cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={13} /> AI Auto-fill
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleSectionAIExtract(e, 'certificates')} />
                </label>
              </div>
              <button onClick={() => addList('certificates', { title: '', issuer: '', date: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-rose-400 transition" title="Add Certificate Manually"><LucidePlus size={18} /></button>
            </div>
            {cvData.certificates.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-white/10 rounded-2xl">
                No certificates added yet. Click <span className="text-rose-400 font-semibold">+</span> to add manually.
              </div>
            )}
            {cvData.certificates.map((cert, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-4 mb-3 last:mb-0 relative">
                <button onClick={() => removeList('certificates', i)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"><LucideTrash size={15} /></button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                  <input placeholder="Certificate Title" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-rose-400 outline-none transition-colors sm:col-span-2" value={cert.title} onChange={(e) => updateList('certificates', i, 'title', e.target.value)} />
                  <input placeholder="Issuer / Authority" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-rose-400 outline-none transition-colors" value={cert.issuer} onChange={(e) => updateList('certificates', i, 'issuer', e.target.value)} />
                  <input placeholder="Date / Year" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-rose-400 outline-none transition-colors" value={cert.date} onChange={(e) => updateList('certificates', i, 'date', e.target.value)} />
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <label className="cursor-pointer text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                    <LucideFileText size={13} /> Upload Doc
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                      const doc = await handleDocUpload(e.target.files[0], 'certificate');
                      if (doc) { updateList('certificates', i, 'documentUrl', doc.url); updateList('certificates', i, 'documentName', doc.name); }
                    }} />
                  </label>
                  {cert.documentName && (
                    <a href={cert.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[140px] flex items-center gap-1 underline underline-offset-2">
                      <LucideFileText size={11} /> {cert.documentName}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Languages */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold flex items-center gap-2"><LucideLanguages size={18} className="text-cyan-400" /> Languages</h3>
              <button onClick={() => addList('languages', { language: '', listening: '', reading: '', spokenInteraction: '', spokenProduction: '', writing: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition"><LucidePlus size={18} /></button>
            </div>

            <div className="mb-4 bg-black/20 border border-white/5 rounded-xl p-3">
              <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1.5">Mother Tongue(s)</label>
              <input placeholder="e.g. Nepali" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:border-cyan-400 outline-none text-cyan-300 font-medium text-sm transition-colors" value={cvData.personalInfo.motherTongue || ''} onChange={(e) => updatePI('motherTongue', e.target.value)} />
            </div>

            {cvData.languages.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm border-2 border-dashed border-white/10 rounded-2xl">
                No foreign languages added yet. Click <span className="text-cyan-400 font-semibold">+</span> to add.
              </div>
            )}
            {cvData.languages.map((lang, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-4 mb-3 last:mb-0 relative">
                <button onClick={() => removeList('languages', i)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"><LucideTrash size={15} /></button>
                <input placeholder="Language (e.g. English)" className="w-full font-bold text-cyan-300 bg-transparent border-b border-white/20 px-2 py-1.5 mb-3 text-sm focus:border-cyan-400 outline-none max-w-[75%] transition-colors" value={lang.language} onChange={(e) => updateList('languages', i, 'language', e.target.value)} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {['listening', 'reading', 'spokenInteraction', 'spokenProduction', 'writing'].map(skill => (
                    <div key={skill} className="flex flex-col">
                      <label className="text-[10px] text-cyan-400 capitalize mb-1 font-semibold">{skill.replace(/([A-Z])/g, ' $1')}</label>
                      <select
                        className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-2 focus:border-cyan-400 outline-none text-cyan-300 font-medium transition-colors"
                        value={lang[skill] || ''}
                        onChange={(e) => updateList('languages', i, skill, e.target.value)}
                      >
                        <option value="" className="bg-slate-900 text-slate-400">CEFR Level</option>
                        <option value="A1" className="bg-slate-900 text-white">A1 — Basic</option>
                        <option value="A2" className="bg-slate-900 text-white">A2 — Basic</option>
                        <option value="B1" className="bg-slate-900 text-white">B1 — Independent</option>
                        <option value="B2" className="bg-slate-900 text-white">B2 — Independent</option>
                        <option value="C1" className="bg-slate-900 text-white">C1 — Proficient</option>
                        <option value="C2" className="bg-slate-900 text-white">C2 — Proficient</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Work Experience */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold flex items-center gap-2"><LucideBriefcase size={18} className="text-fuchsia-400" /> Work Experience</h3>
                <label className="cursor-pointer bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={13} /> AI Auto-fill
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleSectionAIExtract(e, 'workExperience')} />
                </label>
              </div>
              <button onClick={() => addList('workExperience', { occupation: '', employer: '', city: '', country: '', from: '', to: '', responsibilities: [], documentUrl: '', documentName: '' })} className="p-1.5 hover:bg-white/10 rounded-lg text-fuchsia-400 transition" title="Add Experience Manually"><LucidePlus size={18} /></button>
            </div>
            {cvData.workExperience.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-white/10 rounded-2xl">
                No work experience added yet. Click <span className="text-fuchsia-400 font-semibold">+</span> to add manually or use AI Auto-fill.
              </div>
            )}
            {cvData.workExperience.map((exp, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-4 mb-3 last:mb-0 relative">
                <button onClick={() => removeList('workExperience', i)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"><LucideTrash size={15} /></button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pr-6">
                  <input placeholder="Occupation / Job Title" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-fuchsia-400 outline-none transition-colors" value={exp.occupation} onChange={(e) => updateList('workExperience', i, 'occupation', e.target.value)} />
                  <input placeholder="Employer / Company" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-fuchsia-400 outline-none transition-colors" value={exp.employer} onChange={(e) => updateList('workExperience', i, 'employer', e.target.value)} />
                  <div className="flex gap-2">
                    <input placeholder="City" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-fuchsia-400 outline-none transition-colors" value={exp.city} onChange={(e) => updateList('workExperience', i, 'city', e.target.value)} />
                    <input placeholder="Country" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-fuchsia-400 outline-none transition-colors" value={exp.country} onChange={(e) => updateList('workExperience', i, 'country', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="From (MM/YYYY)" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-fuchsia-400 outline-none transition-colors" value={exp.from} onChange={(e) => updateList('workExperience', i, 'from', e.target.value)} />
                    <input placeholder="To (or Present)" className="w-full bg-transparent border-b border-white/20 px-2 py-1.5 text-sm focus:border-fuchsia-400 outline-none transition-colors" value={exp.to} onChange={(e) => updateList('workExperience', i, 'to', e.target.value)} />
                  </div>
                </div>
                <textarea
                  placeholder="Responsibilities (one per line)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-fuchsia-400 outline-none min-h-[80px] mb-3 resize-y transition-colors"
                  value={exp.responsibilities.join('\n')}
                  onChange={(e) => updateList('workExperience', i, 'responsibilities', e.target.value.split('\n'))}
                />
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <label className="cursor-pointer text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                    <LucideFileText size={13} /> Upload Doc
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                      const doc = await handleDocUpload(e.target.files[0], 'experience');
                      if (doc) { updateList('workExperience', i, 'documentUrl', doc.url); updateList('workExperience', i, 'documentName', doc.name); }
                    }} />
                  </label>
                  {exp.documentName && (
                    <a href={exp.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-[140px] flex items-center gap-1 underline underline-offset-2">
                      <LucideFileText size={11} /> {exp.documentName}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold flex items-center gap-2"><LucideWrench size={18} className="text-blue-400" /> Skills</h3>
                <label className="cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                  <LucideSparkles size={13} /> AI Auto-fill
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
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-2 font-medium">Digital Skills <span className="text-slate-500">(comma separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Microsoft Office, Photoshop, Python, Excel"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-3 focus:border-blue-500 outline-none text-white text-sm transition-colors"
                  value={cvData._rawDigitalSkills !== undefined ? cvData._rawDigitalSkills : cvData.digitalSkills.join(', ')}
                  onChange={(e) => setCvData({ ...cvData, _rawDigitalSkills: e.target.value, digitalSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  onBlur={() => setCvData(prev => ({ ...prev, _rawDigitalSkills: undefined }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-2 font-medium">Other Skills <span className="text-slate-500">(comma separated)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Communication, Leadership, Public Speaking"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-3 focus:border-blue-500 outline-none text-white text-sm transition-colors"
                  value={cvData._rawOtherSkills !== undefined ? cvData._rawOtherSkills : cvData.otherSkills.join(', ')}
                  onChange={(e) => setCvData({ ...cvData, _rawOtherSkills: e.target.value, otherSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  onBlur={() => setCvData(prev => ({ ...prev, _rawOtherSkills: undefined }))}
                />
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT SIDE: PREVIEW (hidden on mobile) */}
        <div className="preview-panel w-full lg:w-[42%]" style={{ position: 'sticky', top: '24px', alignSelf: 'flex-start' }}>

          {/* Desktop Action Buttons */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex gap-2 mb-4">
            <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              {loading ? <LucideLoader2 size={15} className="animate-spin" /> : <LucideSave size={15} />}
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => downloadFile('pdf')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              <LucideDownload size={15} /> PDF
            </button>
            <button onClick={() => downloadFile('jpg')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              <LucideDownload size={15} /> JPG
            </button>
            <button onClick={() => downloadFile('docx')} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
              <LucideDownload size={15} /> Word
            </button>
          </div>

          {/* Preview Label */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Preview</span>
            <span className="text-xs font-semibold capitalize" style={{ color: cvData.themeColor || '#6366f1' }}>{cvData.cvFormat}</span>
          </div>

          {/* Preview Box */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {cvData.cvFormat === 'europass' ? <EuropassPreview />
                : cvData.cvFormat === 'modern' ? <ModernPreview />
                : cvData.cvFormat === 'minimal' ? <MinimalPreview />
                : cvData.cvFormat === 'plain' ? <PlainPreview />
                : cvData.cvFormat === 'elegant' ? <ElegantPreview />
                : <GeneralPreview />}
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs mt-2">
            {lastSavedId ? '✅ Saved — ready to download' : 'Fill form → Save → Download PDF / JPG / Word'}
          </p>
        </div>

      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="mobile-action-bar">
        <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          {loading ? <LucideLoader2 size={15} className="animate-spin" /> : <LucideSave size={15} />}
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => downloadFile('pdf')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={15} /> PDF
        </button>
        <button onClick={() => downloadFile('jpg')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={15} /> JPG
        </button>
        <button onClick={() => downloadFile('docx')} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition text-sm">
          <LucideDownload size={15} /> Word
        </button>
      </div>
    </div>
  );
};

export default CVBuilder;
