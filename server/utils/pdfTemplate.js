const generateHTML = (data) => {
  const p = data.personalInfo || {};
  const photoShape = data.photoShape || 'circle';
  const format = data.cvFormat || 'europass';
  const themeColor = data.themeColor || '#0e4a8e';
  const photoRadius = photoShape === 'circle' ? '50%' : photoShape === 'square' ? '0' : '12px';

  let css = '';
  let bodyContent = '';

  // Helper functions for content generation
  const renderPhoto = (className) => `
    <div class="${className}">
      ${data.photoUrl 
        ? `<img src="${data.photoUrl}" alt="Photo" style="border-radius: ${photoRadius}" />` 
        : `<div class="no-photo" style="border-radius: ${photoRadius}">👤</div>`
      }
    </div>
  `;

  const joinList = (arr) => (arr || []).filter(Boolean).join(', ');

  const europassVariant = data.europassVariant || 'v1';
  const textSize = data.textSize || 'medium';
  const europassLogo = data.europassLogo || 'first_page';

  let baseFontSize = '11px';
  let titleFontSize = '26px';
  let sectionTitleSize = '12px';
  let metaFontSize = '9.5px';
  
  if (textSize === 'small') {
    baseFontSize = '10px';
    titleFontSize = '22px';
    sectionTitleSize = '11px';
    metaFontSize = '8.5px';
  } else if (textSize === 'large') {
    baseFontSize = '12px';
    titleFontSize = '30px';
    sectionTitleSize = '14px';
    metaFontSize = '10.5px';
  }

  if (format === 'europass') {
    css = `
      .section-dot { width: 10px; height: 10px; background-color: #9ca3af; border-radius: 50%; display: inline-block; }
      body { -webkit-print-color-adjust: exact; }
    `;

    bodyContent = `
      <div class="bg-white p-8 md:p-12 print-area w-full max-w-[210mm] min-h-[297mm] text-gray-800">
          
          ${data.europassLogo !== 'no' ? `
          <div class="flex justify-end mb-6">
              <div class="flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg" alt="EU" class="w-12 border">
                  <span class="text-3xl font-bold text-[#0f3a8b] tracking-wider">europass</span>
              </div>
          </div>
          ` : ''}

          <header class="flex flex-col md:flex-row gap-6 border-b pb-6 mb-6">
              <div class="w-32 h-32 bg-gray-200 rounded-full overflow-hidden shrink-0 border-2 border-gray-300">
                  <img src="${data.photoUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" alt="Profile" class="w-full h-full object-cover">
              </div>
              <div class="flex-1">
                  <h1 class="text-4xl font-bold text-[#0f3a8b] border-b pb-2 mb-2">${p.fullName || 'YOUR NAME'}</h1>
                  <div class="text-sm text-gray-700 space-y-1.5 leading-relaxed">
                      <p>
                          ${p.passportNumber ? `<span class="font-bold">Passport:</span> <span>${p.passportNumber}</span> | ` : ''}
                          ${p.dateOfBirth ? `<span class="font-bold">Date of birth:</span> <span>${p.dateOfBirth}</span> | ` : ''}
                          ${p.nationality ? `<span class="font-bold">Nationality:</span> <span>${p.nationality}</span> | ` : ''}
                          ${p.gender ? `<span class="font-bold">Gender:</span> <span>${p.gender}</span>` : ''}
                      </p>
                      ${p.phone ? `<p><span class="font-bold">Phone number:</span> <span>${p.phone}</span></p>` : ''}
                      ${p.email ? `<p><span class="font-bold">Email address:</span> <a href="mailto:${p.email}" class="text-blue-600 hover:underline">${p.email}</a></p>` : ''}
                      ${(p.address || p.city) ? `<p><span class="font-bold">Address:</span> <span>${[p.address, p.city, p.postalCode, p.country].filter(Boolean).join(', ')}</span></p>` : ''}
                  </div>
              </div>
          </header>

          ${p.aboutMe ? `
          <section class="mb-6">
              <h2 class="text-lg font-bold text-gray-900 uppercase flex items-center gap-3 border-b pb-1 mb-2">
                  <span class="section-dot"></span> ABOUT ME
              </h2>
              <p class="text-sm text-gray-800 text-justify">${p.aboutMe.replace(/\n/g, '<br/>')}</p>
          </section>
          ` : ''}

          ${(data.education && data.education.length > 0) ? `
          <section class="mb-6">
              <h2 class="text-lg font-bold text-gray-900 uppercase flex items-center gap-3 border-b pb-1 mb-2">
                  <span class="section-dot"></span> EDUCATION AND TRAINING
              </h2>
              ${data.education.map(edu => `
              <div class="pl-5 mb-4">
                  <p class="text-xs text-gray-500 italic">${edu.from} - ${edu.to || ''} ${edu.city}${edu.country ? ', ' + edu.country : ''}</p>
                  <h3 class="font-bold text-gray-800 mt-1 uppercase">${edu.qualification}</h3>
                  <p class="text-sm text-gray-800 mt-1">
                      <span class="font-bold">Field of study:</span> <span>${edu.fieldOfStudy || 'General'}</span> | 
                      <span class="font-bold">Level in EQF:</span> <span>${edu.eqfLevel || 'N/A'}</span>
                  </p>
              </div>
              `).join('')}
          </section>
          ` : ''}

          ${(p.motherTongue || (data.languages && data.languages.length > 0)) ? `
          <section class="mb-6">
              <h2 class="text-lg font-bold text-gray-900 uppercase flex items-center gap-3 border-b pb-1 mb-2">
                  <span class="section-dot"></span> LANGUAGE SKILLS
              </h2>
              <div class="pl-5">
                  ${p.motherTongue ? `<p class="text-sm text-gray-800 mb-2"><span class="font-bold">Mother tongue(s):</span> <span class="font-bold uppercase">${p.motherTongue}</span></p>` : ''}
                  
                  ${(data.languages && data.languages.length > 0) ? `
                  <div class="mt-4">
                      <p class="text-sm text-gray-800 font-bold mb-2">Other language(s):</p>
                      <div class="w-full text-sm">
                          <div class="flex font-bold border-b pb-2 mb-2 text-xs uppercase text-gray-600">
                              <div class="w-1/4"></div>
                              <div class="w-1/4 text-center">Understanding</div>
                              <div class="w-1/4 text-center">Speaking</div>
                              <div class="w-1/4 text-center">Writing</div>
                          </div>
                          <div class="flex text-xs text-gray-500 border-b pb-2 mb-2">
                              <div class="w-1/4"></div>
                              <div class="w-[12.5%] text-center">Listening</div>
                              <div class="w-[12.5%] text-center">Reading</div>
                              <div class="w-[12.5%] text-center">Spoken prod.</div>
                              <div class="w-[12.5%] text-center">Spoken int.</div>
                              <div class="w-1/4"></div>
                          </div>
                          ${data.languages.map((l, index) => `
                          <div class="flex py-2 border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}">
                              <div class="w-1/4 font-bold pl-2 uppercase">${l.language}</div>
                              <div class="w-[12.5%] text-center">${l.listening || '-'}</div>
                              <div class="w-[12.5%] text-center">${l.reading || '-'}</div>
                              <div class="w-[12.5%] text-center">${l.spokenProduction || '-'}</div>
                              <div class="w-[12.5%] text-center">${l.spokenInteraction || '-'}</div>
                              <div class="w-1/4 text-center">${l.writing || '-'}</div>
                          </div>
                          `).join('')}
                      </div>
                  </div>
                  ` : ''}
              </div>
          </section>
          ` : ''}

          ${(data.digitalSkills?.length > 0 || data.otherSkills?.length > 0) ? `
          <section class="mb-6">
              <h2 class="text-lg font-bold text-gray-900 uppercase flex items-center gap-3 border-b pb-1 mb-2">
                  <span class="section-dot"></span> SKILLS
              </h2>
              <div class="pl-5">
                  <p class="text-sm text-gray-800 leading-relaxed">${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join(' | ')}</p>
              </div>
          </section>
          ` : ''}

          ${(data.workExperience && data.workExperience.length > 0) ? `
          <section class="mb-6">
              <h2 class="text-lg font-bold text-gray-900 uppercase flex items-center gap-3 border-b pb-1 mb-2">
                  <span class="section-dot"></span> WORK EXPERIENCE
              </h2>
              <div class="pl-5 mt-2">
                  ${data.workExperience.map(exp => `
                  <div class="mb-4">
                      <h3 class="font-bold text-gray-800 uppercase">${exp.occupation} <span class="text-xs font-normal text-gray-600 ml-2 uppercase">– ${exp.from} – ${exp.to || 'Current'} – ${exp.city}${exp.country ? ', ' + exp.country : ''}</span></h3>
                      ${exp.responsibilities?.length > 0 ? `
                      <ul class="list-disc ml-5 mt-2 text-sm text-gray-800 space-y-1">
                          ${exp.responsibilities.filter(Boolean).map(resp => `<li>${resp}</li>`).join('')}
                      </ul>
                      ` : ''}
                  </div>
                  `).join('')}
              </div>
          </section>
          ` : ''}

          ${(data.certificates && data.certificates.length > 0) ? `
          <section class="mb-6">
              <h2 class="text-lg font-bold text-gray-900 uppercase flex items-center gap-3 border-b pb-1 mb-2">
                  <span class="section-dot"></span> CERTIFICATIONS
              </h2>
              <div class="pl-5 mt-2">
                  ${data.certificates.map(cert => `
                  <div class="mb-4">
                      <h3 class="font-bold text-gray-800 uppercase">${cert.title} <span class="text-xs font-normal text-gray-600 ml-2 uppercase">– ${cert.issuer} ${cert.date ? '(' + cert.date + ')' : ''}</span></h3>
                  </div>
                  `).join('')}
              </div>
          </section>
          ` : ''}
      </div>
    `;
  }  
  
  else if (format === 'modern') {
    // -------------------------------------------------------------------------
    // MODERN TEMPLATE (Left dark sidebar)
    // -------------------------------------------------------------------------
    css = `
      .page { display: flex; min-height: 297mm; }
      .sidebar { width: 30%; background: #2c3e50; color: #ecf0f1; padding: 40px 20px; }
      .main { width: 70%; padding: 40px; background: white; }
      
      .photo-modern img, .photo-modern .no-photo { width: 140px; height: 140px; object-fit: cover; border: 4px solid #34495e; margin: 0 auto 20px; display: block; }
      .photo-modern .no-photo { background: #34495e; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #7f8c8d; }
      
      .name-title { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #34495e; padding-bottom: 20px; }
      .name-title h1 { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; color: white; }
      .name-title p { font-size: 12px; color: #1abc9c; letter-spacing: 1px; text-transform: uppercase; }
      
      .side-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #1abc9c; margin: 30px 0 15px; letter-spacing: 1px; }
      .contact-item { display: flex; flex-direction: column; margin-bottom: 12px; font-size: 11px; }
      .contact-item strong { color: #bdc3c7; margin-bottom: 2px; font-size: 10px; text-transform: uppercase; }
      .contact-item span { color: white; }
      
      .skill-list { list-style: none; padding: 0; }
      .skill-list li { font-size: 11px; margin-bottom: 8px; position: relative; padding-left: 15px; }
      .skill-list li::before { content: '■'; color: #1abc9c; position: absolute; left: 0; font-size: 8px; top: 2px; }

      .main-title { font-size: 20px; font-weight: 700; color: #2c3e50; text-transform: uppercase; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; margin-bottom: 20px; }
      .main-item { margin-bottom: 25px; }
      .main-item-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
      .main-item-title { font-size: 14px; font-weight: 700; color: #34495e; }
      .main-item-date { font-size: 11px; color: #1abc9c; font-weight: 600; }
      .main-item-sub { font-size: 12px; font-style: italic; color: #7f8c8d; margin-bottom: 8px; }
      .main-item ul { padding-left: 20px; font-size: 11px; color: #555; line-height: 1.6; }
    `;

    bodyContent = `
      <div class="sidebar">
        ${renderPhoto('photo-modern')}
        <div class="name-title">
          <h1>${p.fullName || 'YOUR NAME'}</h1>
          <p>${p.nationality || 'PROFESSIONAL'}</p>
        </div>
        
        <div class="side-title">Contact</div>
        ${p.phone ? `<div class="contact-item"><strong>Phone</strong><span>${p.phone}</span></div>` : ''}
        ${p.email ? `<div class="contact-item"><strong>Email</strong><span>${p.email}</span></div>` : ''}
        ${p.address || p.city ? `<div class="contact-item"><strong>Address</strong><span>${[p.address, p.city, p.country].filter(Boolean).join(', ')}</span></div>` : ''}
        ${p.website ? `<div class="contact-item"><strong>Website</strong><span>${p.website}</span></div>` : ''}
        ${p.linkedIn ? `<div class="contact-item"><strong>LinkedIn</strong><span>${p.linkedIn}</span></div>` : ''}

        ${(data.digitalSkills?.length) ? `
        <div class="side-title">Expertise</div>
        <ul class="skill-list">
          ${data.digitalSkills.map(s => `<li>${s}</li>`).join('')}
        </ul>` : ''}

        ${(p.dateOfBirth || p.nationalId) ? `
        <div class="side-title">Details</div>
        ${p.dateOfBirth ? `<div class="contact-item"><strong>Date of Birth</strong><span>${p.dateOfBirth}</span></div>` : ''}
        ${p.nationalId ? `<div class="contact-item"><strong>National ID</strong><span>${p.nationalId}</span></div>` : ''}
        ` : ''}
      </div>

      <div class="main">
        ${p.aboutMe ? `
        <div class="main-title">Profile</div>
        <p style="font-size: 11px; color: #555; line-height: 1.6; margin-bottom: 25px; font-style: italic;">
          "${p.aboutMe}"
        </p>
        ` : ''}
        ${(data.workExperience?.length) ? `
        <div class="main-title">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="main-item">
            <div class="main-item-head">
              <div class="main-item-title">${exp.occupation}</div>
              <div class="main-item-date">${exp.from} - ${exp.to}</div>
            </div>
            <div class="main-item-sub">${exp.employer} ${exp.city ? ' | ' + exp.city : ''}</div>
            ${exp.responsibilities?.length ? `<ul>${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
        ` : ''}

        ${(data.education?.length) ? `
        <div class="main-title">Education</div>
        ${data.education.map(edu => `
          <div class="main-item">
            <div class="main-item-head">
              <div class="main-item-title">${edu.qualification}</div>
              <div class="main-item-date">${edu.from} - ${edu.to}</div>
            </div>
            <div class="main-item-sub">${edu.organization} ${edu.city ? ' | ' + edu.city : ''}</div>
          </div>
        `).join('')}
        ` : ''}

        ${(data.certificates?.length) ? `
        <div class="main-title">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="main-item">
            <div class="main-item-head">
              <div class="main-item-title">${cert.title}</div>
              <div class="main-item-date">${cert.date || ''}</div>
            </div>
            <div class="main-item-sub">${cert.issuer}</div>
          </div>
        `).join('')}
        ` : ''}
      </div>
    `;
  }

  else if (format === 'minimal') {
    // -------------------------------------------------------------------------
    // MINIMAL TEMPLATE (Clean, centered header, lots of whitespace)
    // -------------------------------------------------------------------------
    css = `
      .page { padding: 50px 60px; color: #111; }
      .header-minimal { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 30px; margin-bottom: 40px; }
      .photo-minimal img, .photo-minimal .no-photo { width: 80px; height: 80px; object-fit: cover; margin: 0 auto 15px; display: block; border: 1px solid #eee; }
      .photo-minimal .no-photo { background: #f9f9f9; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #ccc; }
      .header-minimal h1 { font-size: 32px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
      .contact-minimal { font-size: 11px; color: #666; word-spacing: 5px; }
      
      .section-min { margin-bottom: 30px; }
      .title-min { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #000; margin-bottom: 20px; }
      
      .item-min { display: flex; margin-bottom: 20px; }
      .date-min { width: 120px; font-size: 11px; font-weight: 600; color: #000; }
      .content-min { flex: 1; border-left: 1px solid #eee; padding-left: 20px; }
      .content-min h3 { font-size: 14px; font-weight: 600; margin-bottom: 5px; }
      .content-min h4 { font-size: 12px; font-weight: 400; color: #555; margin-bottom: 10px; font-style: italic; }
      .content-min ul { padding-left: 15px; font-size: 11px; color: #444; line-height: 1.6; }
      
      .skills-min { font-size: 11px; color: #333; line-height: 1.8; }
    `;

    bodyContent = `
      <div class="header-minimal">
        ${data.photoUrl ? renderPhoto('photo-minimal') : ''}
        <h1>${p.fullName || 'Name Surname'}</h1>
        <div class="contact-minimal">
          ${[p.email, p.phone, p.city, p.website, p.linkedIn].filter(Boolean).join(' | ')}
        </div>
      </div>

      ${p.aboutMe ? `
      <div class="section-min" style="text-align: center; max-width: 600px; margin: 0 auto 30px;">
        <p style="font-size: 11px; color: #555; line-height: 1.6; font-style: italic;">
          "${p.aboutMe}"
        </p>
      </div>` : ''}

      ${(data.workExperience?.length) ? `
      <div class="section-min">
        <div class="title-min">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="item-min">
            <div class="date-min">${exp.from} — ${exp.to}</div>
            <div class="content-min">
              <h3>${exp.occupation}</h3>
              <h4>${exp.employer}</h4>
              ${exp.responsibilities?.length ? `<ul>${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      ${(data.education?.length) ? `
      <div class="section-min">
        <div class="title-min">Education</div>
        ${data.education.map(edu => `
          <div class="item-min">
            <div class="date-min">${edu.from} — ${edu.to}</div>
            <div class="content-min">
              <h3>${edu.qualification}</h3>
              <h4>${edu.organization}</h4>
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      ${(data.certificates?.length) ? `
      <div class="section-min">
        <div class="title-min">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="item-min">
            <div class="date-min">${cert.date || ''}</div>
            <div class="content-min">
              <h3>${cert.title}</h3>
              <h4>${cert.issuer}</h4>
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      ${(data.digitalSkills?.length) ? `
      <div class="section-min">
        <div class="title-min">Skills</div>
        <div class="skills-min">
          ${data.digitalSkills.join(' · ')}
        </div>
      </div>` : ''}
    `;
  }

  else if (format === 'general') {
    // -------------------------------------------------------------------------
    // GENERAL TEMPLATE (Standard, clean corporate resume format)
    // -------------------------------------------------------------------------
    css = `
      .page { padding: 40px 50px; color: #333; }
      .header-general { border-bottom: 2px solid ${themeColor}; padding-bottom: 15px; margin-bottom: 25px; display: flex; align-items: center; gap: 20px; }
      .photo-general img, .photo-general .no-photo { width: 90px; height: 90px; object-fit: cover; }
      .photo-general .no-photo { background: #eee; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #999; }
      .header-general-info h1 { font-size: 28px; color: ${themeColor}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
      .contact-general { font-size: 11px; color: #555; }
      
      .section-gen { margin-bottom: 20px; }
      .title-gen { font-size: 14px; font-weight: 700; color: ${themeColor}; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase; }
      
      .item-gen { margin-bottom: 15px; }
      .item-gen-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; font-weight: 700; color: #222; }
      .item-gen-sub { font-size: 12px; font-style: italic; color: #666; margin-bottom: 6px; }
      .item-gen ul { padding-left: 18px; font-size: 11px; line-height: 1.5; color: #444; }
      
      .text-gen { font-size: 11px; line-height: 1.6; color: #444; }
    `;

    bodyContent = `
      <div class="header-general">
        ${data.photoUrl ? renderPhoto('photo-general') : ''}
        <div class="header-general-info">
          <h1>${p.fullName || 'YOUR NAME'}</h1>
          <div class="contact-general">
            ${[p.email, p.phone, p.address ? p.address + (p.city ? ', ' + p.city : '') : '', p.linkedIn].filter(Boolean).join(' &bull; ')}
          </div>
        </div>
      </div>

      ${p.aboutMe ? `
      <div class="section-gen">
        <div class="title-gen">Professional Summary</div>
        <div class="text-gen">${p.aboutMe}</div>
      </div>` : ''}

      ${(data.workExperience?.length) ? `
      <div class="section-gen">
        <div class="title-gen">Work Experience</div>
        ${data.workExperience.map(exp => `
          <div class="item-gen">
            <div class="item-gen-head">
              <span>${exp.occupation}</span>
              <span style="font-size: 11px; font-weight: 600; color: #666;">${exp.from} - ${exp.to}</span>
            </div>
            <div class="item-gen-sub">${exp.employer} ${exp.city ? '| ' + exp.city : ''}</div>
            ${exp.responsibilities?.length ? `<ul>${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      ${(data.education?.length) ? `
      <div class="section-gen">
        <div class="title-gen">Education</div>
        ${data.education.map(edu => `
          <div class="item-gen">
            <div class="item-gen-head">
              <span>${edu.qualification}</span>
              <span style="font-size: 11px; font-weight: 600; color: #666;">${edu.from} - ${edu.to}</span>
            </div>
            <div class="item-gen-sub">${edu.organization} ${edu.city ? '| ' + edu.city : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}

      ${(data.certificates?.length) ? `
      <div class="section-gen">
        <div class="title-gen">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="item-gen" style="margin-bottom: 8px;">
            <div style="font-size: 12px; font-weight: 700; color: #222;">${cert.title}</div>
            <div style="font-size: 11px; color: #666;">${cert.issuer} ${cert.date ? '(' + cert.date + ')' : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}

      ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
      <div class="section-gen">
        <div class="title-gen">Skills</div>
        <div class="text-gen">
          <strong>Technical/Digital:</strong> ${(data.digitalSkills || []).join(', ')}<br/>
          <strong>Other:</strong> ${(data.otherSkills || []).join(', ')}
        </div>
      </div>` : ''}
    `;
  }

  else if (format === 'plain') {
    // -------------------------------------------------------------------------
    // PLAIN TEMPLATE (No photos, clean text only, professional)
    // -------------------------------------------------------------------------
    css = `
      .page { padding: 50px 60px; color: #000; font-family: "Times New Roman", Times, serif; }
      .header-plain { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 15px; }
      .header-plain h1 { font-size: 26px; text-transform: uppercase; margin-bottom: 8px; font-weight: bold; }
      .header-plain .contact { font-size: 11px; }
      .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 2px; }
      .section-plain { margin-bottom: 15px; }
      .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
      .item-sub { font-style: italic; font-size: 11px; margin-bottom: 4px; }
      .item-ul { padding-left: 20px; font-size: 11px; margin-bottom: 10px; list-style-type: disc; }
      .skills-text { font-size: 11px; margin-bottom: 10px; }
    `;

    bodyContent = `
      <div class="header-plain">
        <h1>${p.fullName || 'YOUR NAME'}</h1>
        <div class="contact">
          ${[p.address, p.city, p.country, p.phone, p.email, p.linkedIn].filter(Boolean).join(' | ')}
        </div>
      </div>
      
      ${p.aboutMe ? `
      <div class="section-plain">
        <div class="section-title">Summary</div>
        <div style="font-size: 11px; line-height: 1.5;">${p.aboutMe}</div>
      </div>` : ''}

      ${(data.workExperience?.length) ? `
      <div class="section-plain">
        <div class="section-title">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="item-header">
            <span>${exp.occupation}</span>
            <span>${exp.from} - ${exp.to}</span>
          </div>
          <div class="item-sub">${exp.employer} ${exp.city ? ', ' + exp.city : ''}</div>
          ${exp.responsibilities?.length ? `<ul class="item-ul">${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : '<div style="margin-bottom:10px;"></div>'}
        `).join('')}
      </div>` : ''}

      ${(data.education?.length) ? `
      <div class="section-plain">
        <div class="section-title">Education</div>
        ${data.education.map(edu => `
          <div class="item-header">
            <span>${edu.qualification}</span>
            <span>${edu.from} - ${edu.to}</span>
          </div>
          <div class="item-sub">${edu.organization} ${edu.city ? ', ' + edu.city : ''}</div>
          <div style="margin-bottom:10px;"></div>
        `).join('')}
      </div>` : ''}
      
      ${(data.certificates?.length) ? `
      <div class="section-plain">
        <div class="section-title">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="item-header">
            <span>${cert.title}</span>
            <span>${cert.date || ''}</span>
          </div>
          <div class="item-sub">${cert.issuer}</div>
          <div style="margin-bottom:6px;"></div>
        `).join('')}
      </div>` : ''}

      ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
      <div class="section-plain">
        <div class="section-title">Skills</div>
        <div class="skills-text">
          ${(data.digitalSkills || []).concat(data.otherSkills || []).join(', ')}
        </div>
      </div>` : ''}
    `;
  }

  else if (format === 'elegant') {
    // -------------------------------------------------------------------------
    // ELEGANT TEMPLATE (Two columns, soft background, elegant typography)
    // -------------------------------------------------------------------------
    css = `
      .page { display: flex; min-height: 297mm; font-family: 'Inter', sans-serif; background: #fafafa; }
      .left-col { width: 35%; background: ${themeColor}; color: rgba(255,255,255,0.9); padding: 40px 25px; }
      .right-col { width: 65%; padding: 40px 35px; background: #ffffff; }
      .left-col a { color: #fff; text-decoration: none; }
      .photo-wrap { text-align: center; margin-bottom: 20px; }
      .photo-wrap img, .photo-wrap .no-photo { width: 130px; height: 130px; object-fit: cover; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); margin: 0 auto; display: block; }
      .photo-wrap .no-photo { background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 32px; }
      .name-text { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 5px; color: #fff; letter-spacing: 1px; }
      .role-text { text-align: center; font-size: 12px; font-weight: 300; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; }
      
      .side-head { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 15px; padding-bottom: 5px; margin-top: 25px; color: #fff; }
      .side-item { font-size: 11px; margin-bottom: 10px; line-height: 1.5; }
      .side-item strong { display: block; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 2px; }
      
      .main-head { font-size: 18px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
      .main-block { margin-bottom: 20px; }
      .mb-title { font-size: 14px; font-weight: 700; color: #333; display: flex; justify-content: space-between; }
      .mb-date { font-size: 11px; font-weight: 600; color: ${themeColor}; }
      .mb-sub { font-size: 12px; font-style: italic; color: #777; margin-bottom: 8px; }
      .mb-text { font-size: 11.5px; color: #555; line-height: 1.6; }
      .mb-ul { padding-left: 18px; list-style: disc; margin-top: 5px; }
      .mb-ul li { margin-bottom: 4px; }
      .skill-pill { display: inline-block; background: #f0f0f0; color: #444; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; margin: 0 4px 6px 0; }
    `;

    bodyContent = `
      <div class="left-col">
        <div class="photo-wrap">
          ${data.photoUrl ? `<img src="${data.photoUrl}" style="border-radius: ${photoRadius}" />` : `<div class="no-photo" style="border-radius: ${photoRadius}">👤</div>`}
        </div>
        <div class="name-text">${p.fullName || 'YOUR NAME'}</div>
        <div class="role-text">${p.nationality || 'Professional'}</div>
        
        <div class="side-head">Contact</div>
        ${p.phone ? `<div class="side-item"><strong>Phone</strong>${p.phone}</div>` : ''}
        ${p.email ? `<div class="side-item"><strong>Email</strong>${p.email}</div>` : ''}
        ${(p.address || p.city) ? `<div class="side-item"><strong>Address</strong>${[p.address, p.city, p.country].filter(Boolean).join(', ')}</div>` : ''}
        ${p.linkedIn ? `<div class="side-item"><strong>LinkedIn</strong>${p.linkedIn}</div>` : ''}
        
        ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
        <div class="side-head">Skills</div>
        <div class="side-item" style="line-height: 1.8;">
          ${(data.digitalSkills || []).concat(data.otherSkills || []).join('<br>')}
        </div>` : ''}
        
        ${(data.languages?.length) ? `
        <div class="side-head">Languages</div>
        ${data.languages.map(l => `<div class="side-item"><strong>${l.language}</strong>${l.listening || 'Proficient'}</div>`).join('')}
        ` : ''}
      </div>
      <div class="right-col">
        ${p.aboutMe ? `
        <div class="main-head">Profile</div>
        <div class="main-block mb-text" style="font-style: italic;">
          "${p.aboutMe}"
        </div>` : ''}
        
        ${(data.workExperience?.length) ? `
        <div class="main-head">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="main-block">
            <div class="mb-title"><span>${exp.occupation}</span><span class="mb-date">${exp.from} - ${exp.to}</span></div>
            <div class="mb-sub">${exp.employer} ${exp.city ? ' | ' + exp.city : ''}</div>
            ${exp.responsibilities?.length ? `<ul class="mb-ul mb-text">${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
        ` : ''}
        
        ${(data.education?.length) ? `
        <div class="main-head">Education</div>
        ${data.education.map(edu => `
          <div class="main-block">
            <div class="mb-title"><span>${edu.qualification}</span><span class="mb-date">${edu.from} - ${edu.to}</span></div>
            <div class="mb-sub">${edu.organization} ${edu.city ? ' | ' + edu.city : ''}</div>
          </div>
        `).join('')}
        ` : ''}
        
        ${(data.certificates?.length) ? `
        <div class="main-head">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="main-block" style="margin-bottom: 12px;">
            <div class="mb-title"><span>${cert.title}</span><span class="mb-date">${cert.date || ''}</span></div>
            <div class="mb-sub">${cert.issuer}</div>
          </div>
        `).join('')}
        ` : ''}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${format === 'europass' ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Inter:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Open Sans', 'Inter', Arial, sans-serif; color: #1a1a2e; background: #fff; }
        .page { width: 210mm; margin: 0 auto; background: #fff; }
        ${css}
      </style>
    </head>
    <body>
      <div class="${format === 'europass' ? 'flex justify-center bg-white' : 'page'}" id="cv-root">
        ${bodyContent}
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateHTML };
