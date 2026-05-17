const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../client/src/components/CVBuilder.jsx');
console.log("Reading CVBuilder.jsx from:", targetPath);

let content = fs.readFileSync(targetPath, 'utf8');

// Target the whole skills section block
const originalSkillsSection = `          {/* Skills */}
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
          </section>`;

// Let's use a simpler regex or direct replacement for the textareas to avoid exact whitespace issues
const newSkillsSection = `          {/* Skills */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
             <h3 className="text-lg font-bold mb-5 flex items-center gap-2"><LucideWrench size={20} className="text-blue-400"/> Skills</h3>
             <div className="space-y-5">
                <div>
                   <label className="text-sm text-slate-300 block mb-2 font-medium">Digital Skills (Comma separated)</label>
                   <input 
                     type="text"
                     placeholder="e.g. Microsoft Office, Photoshop, Python, Excel"
                     className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 focus:border-blue-500 outline-none text-white text-sm" 
                     value={cvData.digitalSkills.join(', ')} 
                     onChange={(e) => setCvData({...cvData, digitalSkills: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                   />
                </div>
                <div className="mt-4">
                   <label className="text-sm text-slate-300 block mb-2 font-medium">Other Skills (Comma separated)</label>
                   <input 
                     type="text"
                     placeholder="e.g. Communication, Leadership, Public Speaking"
                     className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 focus:border-blue-500 outline-none text-white text-sm" 
                     value={cvData.otherSkills.join(', ')} 
                     onChange={(e) => setCvData({...cvData, otherSkills: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                   />
                </div>
             </div>
          </section>`;

// Regex replacement that matches the textareas structure in CVBuilder.jsx
const regex = /\{\/\*\s*Skills\s*\*\/\}\s*<section[\s\S]*?<\/section>/;

if (regex.test(content)) {
  content = content.replace(regex, newSkillsSection);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log("✅ Successfully replaced Skills section with beautiful inputs!");
} else {
  console.log("❌ Could not match the Skills section in the file using Regex.");
}
