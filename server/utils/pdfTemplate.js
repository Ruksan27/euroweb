const generateHTML = (data) => {
  const p = data.personalInfo || {};
  const photoShape = data.photoShape || 'rounded';
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
    // -------------------------------------------------------------------------
    // EUROPASS CLASSIC TEMPLATE
    // -------------------------------------------------------------------------
    css = `
      .page { font-family: "Arial", sans-serif; background-color: #ffffff; }
      .ep-header-bg { background-color: #ffffff; padding: 40px 40px 10px 40px; }
      .ep-body-bg { background-color: #ffffff; padding: 20px 40px 40px 40px; }
      
      .ep-row { display: flex; width: 100%; margin-bottom: 20px; position: relative; }
      .ep-left-col { width: 20px; flex-shrink: 0; display: flex; justify-content: flex-start; padding-top: 6px; }
      .ep-right-col { flex: 1; min-width: 0; }
      
      .ep-dot { width: 6px; height: 6px; background-color: #9ca3af; border-radius: 50%; }
      
      .photo-wrap img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #e5e7eb; margin-left: auto; }
      .photo-wrap .no-photo { width: 120px; height: 120px; border-radius: 50%; background: #e5e7eb; color: #888; display: flex; align-items: center; justify-content: center; font-size: 32px; border: 3px solid #e5e7eb; margin-left: auto; }
      
      .ep-name { font-size: ${titleFontSize}; font-weight: 700; color: #4b5563; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1px; }
      .ep-name-line { border-bottom: 1px solid #9ca3af; margin-bottom: 12px; }
      .ep-contact-info { font-size: 10px; color: #111827; line-height: 1.5; font-weight: 600; }
      .ep-contact-info a { color: #2563eb; font-weight: 400; text-decoration: underline; }
      .ep-contact-info strong { color: #000; font-weight: 700; }
      
      .ep-section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #000; margin-bottom: 4px; letter-spacing: 1px; }
      .ep-section-line { border-bottom: 1px solid #9ca3af; margin-bottom: 12px; }
    `;

    const logoHtml = europassLogo !== 'no' ? `
      <div style="text-align: right; margin-bottom: 20px; display: flex; justify-content: flex-end; align-items: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" style="height: 35px; margin-right: 8px;">
          <rect width="120" height="80" fill="#034ea2"/>
          <!-- Simplified stars approximation for SVG footprint -->
          <circle cx="60" cy="15" r="3" fill="#ffcc00"/><circle cx="60" cy="65" r="3" fill="#ffcc00"/>
          <circle cx="35" cy="40" r="3" fill="#ffcc00"/><circle cx="85" cy="40" r="3" fill="#ffcc00"/>
          <circle cx="42" cy="22" r="3" fill="#ffcc00"/><circle cx="78" cy="58" r="3" fill="#ffcc00"/>
          <circle cx="78" cy="22" r="3" fill="#ffcc00"/><circle cx="42" cy="58" r="3" fill="#ffcc00"/>
          <circle cx="37" cy="30" r="3" fill="#ffcc00"/><circle cx="83" cy="50" r="3" fill="#ffcc00"/>
          <circle cx="83" cy="30" r="3" fill="#ffcc00"/><circle cx="37" cy="50" r="3" fill="#ffcc00"/>
        </svg>
        <span style="font-size: 32px; font-weight: 400; color: #5c2d91; font-family: 'Arial', sans-serif; letter-spacing: -1px;">europass</span>
      </div>
    ` : '';

    const contactsHtml = `
      ${p.passportNumber ? `<strong>Residence permit:</strong> ${p.passportNumber} &nbsp;|&nbsp; ` : ''}
      ${p.dateOfBirth ? `<strong>Date of birth:</strong> ${p.dateOfBirth} &nbsp;|&nbsp; ` : ''}
      ${p.nationality ? `<strong>Nationality:</strong> ${p.nationality} &nbsp;|&nbsp; ` : ''}
      ${p.phone ? `<strong>Phone number:</strong> ${p.phone} (Home) &nbsp;|&nbsp; ` : ''}
      ${p.email ? `<strong>Email address:</strong> <a href="mailto:${p.email}">${p.email}</a> &nbsp;|&nbsp; ` : ''}
      ${p.website ? `<strong>Website:</strong> <a href="${p.website.startsWith('http') ? p.website : 'https://' + p.website}" target="_blank">${p.website}</a>` : ''}
      ${p.address || p.city ? `<br/><strong>Address:</strong> ${[p.address, p.city, p.postalCode, p.country].filter(Boolean).join(', ')} (Home)` : ''}
    `;

    // Implement variants changing header alignment
    let headerHtml = '';

    if (europassVariant === 'v2') {
      headerHtml = `
        <div class="ep-header-bg">
          ${logoHtml}
          <div class="ep-row" style="display: flex; flex-direction: row-reverse; margin-bottom: 0;">
            <div style="width: 140px; text-align: left; padding-left: 16px;">
              ${renderPhoto('photo-wrap')}
            </div>
            <div class="ep-right-col" style="text-align: right; padding-right: 16px;">
              <h1 class="ep-name" style="text-align: right;">${p.fullName || 'YOUR NAME'}</h1>
              <div class="ep-name-line" style="margin-left: auto;"></div>
              <div class="ep-contact-info" style="text-align: right;">
                ${contactsHtml.replace(/<br\/>/g, ' ')}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (europassVariant === 'v3') {
      headerHtml = `
        <div class="ep-header-bg" style="text-align: center;">
          ${logoHtml.replace('justify-content: flex-end', 'justify-content: center')}
          <div style="display: flex; justify-content: center; margin-bottom: 15px;">
            ${renderPhoto('photo-wrap')}
          </div>
          <h1 class="ep-name" style="text-align: center;">${p.fullName || 'YOUR NAME'}</h1>
          <div class="ep-name-line" style="width: 50%; margin: 0 auto 12px auto;"></div>
          <div class="ep-contact-info" style="text-align: center;">
            ${contactsHtml}
          </div>
        </div>
      `;
    } else if (europassVariant === 'v4') {
      headerHtml = `
        <div class="ep-header-bg" style="text-align: center;">
          ${logoHtml.replace('justify-content: flex-end', 'justify-content: center')}
          <div>
            <h1 class="ep-name">${p.fullName || 'YOUR NAME'}</h1>
            <div class="ep-name-line" style="width: 50%; margin: 0 auto 12px auto;"></div>
            <div class="ep-contact-info">
              ${contactsHtml}
            </div>
          </div>
        </div>
      `;
    } else {
      // Default (Layout 1)
      headerHtml = `
        <div class="ep-header-bg">
          ${logoHtml}
          <div class="ep-row" style="margin-bottom: 0;">
            <div style="width: 140px; text-align: right; padding-right: 16px; flex-shrink: 0;">
              ${renderPhoto('photo-wrap')}
            </div>
            <div class="ep-right-col" style="padding-left: 8px;">
              <h1 class="ep-name">${p.fullName || 'YOUR NAME'}</h1>
              <div class="ep-name-line"></div>
              <div class="ep-contact-info">
                ${contactsHtml.replace(/<br\/>/g, ' ')}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    bodyContent = `
      ${headerHtml}
      
      <div class="ep-body-bg">
        
        ${p.aboutMe ? `
        <div class="ep-row">
          <div class="ep-left-col"><div class="ep-dot"></div></div>
          <div class="ep-right-col">
            <div class="ep-section-title">About Me</div>
            <div class="ep-section-line"></div>
            <div style="font-size: 10px; color: #1f2937; line-height: 1.6; text-align: justify;">${p.aboutMe}</div>
          </div>
        </div>` : ''}

        ${(data.education && data.education.length > 0) ? `
        <div class="ep-row">
          <div class="ep-left-col"><div class="ep-dot"></div></div>
          <div class="ep-right-col">
            <div class="ep-section-title">Education and Training</div>
            <div class="ep-section-line"></div>
            ${data.education.map(edu => `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 9px; color: #6b7280; margin-bottom: 2px;">${edu.from} - ${edu.to || ''} ${edu.city}${edu.country ? ', ' + edu.country : ''}</div>
                <div style="font-size: 10px; margin-bottom: 2px;"><strong>${(edu.qualification || '').toUpperCase()}</strong> <span style="color: #374151; text-transform: capitalize;">${edu.organization}</span></div>
                <div style="border-bottom: 1px solid #e5e7eb; width: 100%; margin-bottom: 6px;"></div>
                <div style="font-size: 9px; color: #1f2937;">
                  <strong>Field of study</strong> ${edu.fieldOfStudy || 'General'} <span style="margin: 0 4px; color: #9ca3af;">|</span> <strong>Level in EQF</strong> ${edu.eqfLevel || 'N/A'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        ${(data.workExperience && data.workExperience.length > 0) ? `
        <div class="ep-row">
          <div class="ep-left-col"><div class="ep-dot"></div></div>
          <div class="ep-right-col">
            <div class="ep-section-title">Work Experience</div>
            <div class="ep-section-line"></div>
            ${data.workExperience.map(exp => `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 9px; color: #6b7280; margin-bottom: 2px;">${exp.from} – ${exp.to || 'Current'} ${exp.city}${exp.country ? ', ' + exp.country : ''}</div>
                <div style="font-size: 10px; margin-bottom: 2px;"><strong>${(exp.occupation || '').toUpperCase()}</strong> <span style="color: #374151; text-transform: capitalize;">${exp.employer}</span></div>
                <div style="border-bottom: 1px solid #e5e7eb; width: 100%; margin-bottom: 6px;"></div>
                ${exp.responsibilities?.length > 0 ? `
                  <ul style="font-size: 9px; color: #1f2937; padding-left: 12px; margin-top: 4px; list-style-type: disc;">
                    ${exp.responsibilities.filter(Boolean).map(resp => `<li style="margin-bottom: 2px;">${resp}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        ${(data.certificates && data.certificates.length > 0) ? `
        <div class="ep-row">
          <div class="ep-left-col"><div class="ep-dot"></div></div>
          <div class="ep-right-col">
            <div class="ep-section-title">Certifications</div>
            <div class="ep-section-line"></div>
            ${data.certificates.map(cert => `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 9px; color: #6b7280; margin-bottom: 2px;">${cert.issuer} ${cert.date ? '— ' + cert.date : ''}</div>
                <div style="font-size: 10px; margin-bottom: 6px;"><strong>${cert.title}</strong></div>
                <div style="font-size: 9px; color: #1f2937;"><strong>Mode of learning:</strong> Project based</div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        ${(p.motherTongue || (data.languages && data.languages.length > 0)) ? `
        <div class="ep-row">
          <div class="ep-left-col"><div class="ep-dot"></div></div>
          <div class="ep-right-col">
            <div class="ep-section-title">Language Skills</div>
            <div class="ep-section-line"></div>
            
            ${p.motherTongue ? `
            <div style="font-size: 10px; margin-bottom: 12px;">
              Mother tongue(s): <strong style="text-transform: uppercase; margin-left: 8px;">${p.motherTongue}</strong>
            </div>` : ''}
            
            ${(data.languages && data.languages.length > 0) ? `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 10px; margin-bottom: 8px;">Other language(s):</div>
              <div style="width: 100%; font-size: 9px; text-align: center;">
                <div style="display: flex; font-weight: bold; margin-bottom: 4px;">
                  <div style="width: 20%;"></div>
                  <div style="width: 30%; text-transform: uppercase;">Understanding</div>
                  <div style="width: 30%; text-transform: uppercase;">Speaking</div>
                  <div style="width: 20%; text-transform: uppercase;">Writing</div>
                </div>
                <div style="display: flex; font-size: 8px; color: #1f2937; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 4px 0;">
                  <div style="width: 20%;"></div>
                  <div style="width: 15%;">Listening</div>
                  <div style="width: 15%;">Reading</div>
                  <div style="width: 15%;">Spoken production</div>
                  <div style="width: 15%;">Spoken interaction</div>
                  <div style="width: 20%;"></div>
                </div>
                ${data.languages.map(l => `
                  <div style="display: flex; border-bottom: 1px solid #e5e7eb; padding: 6px 0;">
                    <div style="width: 20%; font-weight: 800; text-align: left; padding-left: 8px; text-transform: uppercase;">${l.language}</div>
                    <div style="width: 15%;">${l.listening || '-'}</div>
                    <div style="width: 15%;">${l.reading || '-'}</div>
                    <div style="width: 15%;">${l.spokenProduction || '-'}</div>
                    <div style="width: 15%;">${l.spokenInteraction || '-'}</div>
                    <div style="width: 20%;">${l.writing || '-'}</div>
                  </div>
                `).join('')}
              </div>
              <div style="font-size: 8px; color: #6b7280; font-style: italic; margin-top: 8px;">Levels: A1 and A2: Basic user; B1 and B2: Independent user; C1 and C2: Proficient user</div>
            </div>
            ` : ''}
          </div>
        </div>` : ''}

        ${(data.digitalSkills?.length > 0 || data.otherSkills?.length > 0) ? `
        <div class="ep-row">
          <div class="ep-left-col"><div class="ep-dot"></div></div>
          <div class="ep-right-col">
            <div class="ep-section-title">Skills</div>
            <div class="ep-section-line"></div>
            <div style="font-size: 10px; color: #1f2937; line-height: 1.6;">
              ${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join(' | ')}
            </div>
          </div>
        </div>` : ''}
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
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Inter:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Open Sans', 'Inter', Arial, sans-serif; color: #1a1a2e; background: #fff; }
        .page { width: 210mm; margin: 0 auto; background: #fff; }
        ${css}
      </style>
    </head>
    <body>
      <div class="page" id="cv-root">
        ${bodyContent}
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateHTML };
