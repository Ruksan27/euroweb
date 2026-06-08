import React from 'react';
import axios from 'axios';
import {
  LucideUsers, LucideDownload, LucideX, LucideMail, LucidePhone,
  LucideCalendar, LucideBriefcase, LucideGraduationCap, LucideCode2,
  LucideGlobe, LucideLink, LucideAward, LucideFileText, LucideMapPin,
  LucideShield, LucideLoader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API } from '../config/api';

export default function CVModal({ cv, onClose }) {
  const [downloading, setDownloading] = React.useState(false);

  const downloadPDF = async () => {
    const toastId = toast.loading('Generating PDF...');
    setDownloading(true);
    try {
      const downloadUrl = `${API.cv}/generate-pdf/${cv._id}?t=${Date.now()}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PDF download started! 🚀', { id: toastId });
    } catch (error) {
      console.error('Download Error:', error);
      toast.error('Failed to start PDF download', { id: toastId });
    } finally {
      setDownloading(false);
    }
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
              disabled={downloading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              {downloading ? <LucideLoader2 size={16} className="animate-spin" /> : <LucideDownload size={16} />}
              {downloading ? 'Generating...' : 'Download PDF'}
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
