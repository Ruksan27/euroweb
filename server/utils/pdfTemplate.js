const generateHTML = (data) => {
  const p = data.personalInfo || {};
  const photoShape = data.photoShape || 'circle';
  const format = data.cvFormat || 'europass';
  const themeColor = data.themeColor || '#0e4a8e';
  const photoRadius = photoShape === 'circle' ? '50%' : photoShape === 'square' ? '0' : '10px';

  let css = '';
  let bodyContent = '';

  const renderPhoto = (width, height, extra = '') =>
    data.photoUrl
      ? `<img src="${data.photoUrl}" alt="Photo" style="width:${width}px;height:${height}px;object-fit:cover;border-radius:${photoRadius};display:block;${extra}" />`
      : `<div style="width:${width}px;height:${height}px;border-radius:${photoRadius};background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:${Math.round(width*0.35)}px;color:#9ca3af;${extra}">👤</div>`;

  const joinList = (arr) => (arr || []).filter(Boolean).join(', ');

  const europassVariant = data.europassVariant || 'v1';
  const textSize = data.textSize || 'medium';
  const europassLogo = data.europassLogo || 'first_page';

  // Font scale
  let scale = 1;
  if (textSize === 'small') scale = 0.9;
  if (textSize === 'large') scale = 1.1;

  const fs = (base) => `${Math.round(base * scale)}px`;

  if (format === 'europass') {
    // ─────────────────────────────────────────────────────────────────────────────
    // EUROPASS TEMPLATE — compact, no excessive gaps, pixel-accurate
    // ─────────────────────────────────────────────────────────────────────────────

    const logoSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" style="height:28px;margin-right:6px;vertical-align:middle;">
        <rect width="120" height="80" fill="#034ea2"/>
        <circle cx="60" cy="15" r="3" fill="#ffcc00"/><circle cx="60" cy="65" r="3" fill="#ffcc00"/>
        <circle cx="35" cy="40" r="3" fill="#ffcc00"/><circle cx="85" cy="40" r="3" fill="#ffcc00"/>
        <circle cx="42" cy="22" r="3" fill="#ffcc00"/><circle cx="78" cy="58" r="3" fill="#ffcc00"/>
        <circle cx="78" cy="22" r="3" fill="#ffcc00"/><circle cx="42" cy="58" r="3" fill="#ffcc00"/>
        <circle cx="37" cy="30" r="3" fill="#ffcc00"/><circle cx="83" cy="50" r="3" fill="#ffcc00"/>
        <circle cx="83" cy="30" r="3" fill="#ffcc00"/><circle cx="37" cy="50" r="3" fill="#ffcc00"/>
      </svg>
      <span style="font-size:26px;font-weight:400;color:#5c2d91;font-family:Arial,sans-serif;letter-spacing:-1px;vertical-align:middle;">europass</span>
    `;

    const logoHtml = europassLogo !== 'no'
      ? `<div style="display:flex;align-items:center;margin-bottom:12px;${(europassVariant === 'v3' || europassVariant === 'v4') ? 'justify-content:center;' : 'justify-content:flex-end;'}">${logoSvg}</div>`
      : '';

    // Build contact rows
    const row1 = [];
    if (p.passportNumber) row1.push(`<strong>Residence permit:</strong> ${p.passportNumber}`);
    if (p.dateOfBirth)    row1.push(`<strong>Date of birth:</strong> ${p.dateOfBirth}`);
    if (p.nationality)    row1.push(`<strong>Nationality:</strong> ${p.nationality}`);
    if (p.gender)         row1.push(`<strong>Gender:</strong> ${p.gender}`);

    const row2 = [];
    if (p.phone) row2.push(`<strong>Phone:</strong> ${p.phone}`);
    if (p.email) row2.push(`<strong>Email:</strong> <a href="mailto:${p.email}" style="color:#2563eb;text-decoration:underline;">${p.email}</a>`);

    const row3 = [];
    if (p.address || p.city) row3.push(`<strong>Address:</strong> ${[p.address, p.postalCode, p.city, p.country].filter(Boolean).join(', ')}`);
    if (p.website) row3.push(`<strong>Website:</strong> <a href="${p.website.startsWith('http') ? p.website : 'https://' + p.website}" style="color:#2563eb;text-decoration:underline;">${p.website}</a>`);
    if (p.linkedIn) row3.push(`<strong>LinkedIn:</strong> ${p.linkedIn}`);

    const pipe = `<span style="color:#9ca3af;margin:0 5px;">|</span>`;
    const contactHtml = `
      ${row1.length ? `<div style="margin-bottom:3px;font-size:${fs(9)};line-height:1.7;">${row1.join(pipe)}</div>` : ''}
      ${row2.length ? `<div style="margin-bottom:3px;font-size:${fs(9)};line-height:1.7;">${row2.join(pipe)}</div>` : ''}
      ${row3.length ? `<div style="font-size:${fs(9)};line-height:1.7;">${row3.join(pipe)}</div>` : ''}
    `;

    const nameHtml = `
      <h1 style="font-size:${fs(22)};font-weight:700;color:#4b5563;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.5px;">${p.fullName || 'YOUR NAME'}</h1>
      <div style="border-bottom:1px solid #9ca3af;margin-bottom:8px;"></div>
      <div style="color:#111827;font-weight:400;">${contactHtml}</div>
    `;

    // Header variants
    let headerHtml = '';
    if (europassVariant === 'v2') {
      headerHtml = `
        <div style="background:#f3f4f6;padding:22px 36px 16px 36px;">
          ${logoHtml}
          <div style="display:flex;flex-direction:row-reverse;align-items:flex-start;gap:16px;">
            <div style="flex-shrink:0;">${renderPhoto(100, 100)}</div>
            <div style="flex:1;text-align:right;">${nameHtml}</div>
          </div>
        </div>`;
    } else if (europassVariant === 'v3') {
      headerHtml = `
        <div style="background:#f3f4f6;padding:22px 36px 16px 36px;text-align:center;">
          ${logoHtml}
          <div style="display:flex;justify-content:center;margin-bottom:10px;">${renderPhoto(100, 100)}</div>
          ${nameHtml}
        </div>`;
    } else if (europassVariant === 'v4') {
      headerHtml = `
        <div style="background:#f3f4f6;padding:22px 36px 16px 36px;text-align:center;">
          ${logoHtml}
          ${nameHtml}
        </div>`;
    } else {
      // v1 default — photo left, text right
      headerHtml = `
        <div style="background:#f3f4f6;padding:22px 36px 16px 36px;">
          ${logoHtml}
          <div style="display:flex;align-items:flex-start;gap:16px;">
            <div style="flex-shrink:0;">${renderPhoto(100, 100)}</div>
            <div style="flex:1;padding-top:4px;">${nameHtml}</div>
          </div>
        </div>`;
    }

    // Section builder — compact, dot marker
    const section = (title, inner) => `
      <div style="display:flex;margin-bottom:14px;">
        <div style="width:16px;flex-shrink:0;padding-top:4px;">
          <div style="width:5px;height:5px;background:#6b7280;border-radius:50%;"></div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:${fs(10)};font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#000;margin-bottom:3px;">${title}</div>
          <div style="border-bottom:1px solid #9ca3af;margin-bottom:10px;"></div>
          ${inner}
        </div>
      </div>`;

    // About Me
    const aboutSection = p.aboutMe ? section('About Me',
      `<div style="font-size:${fs(9.5)};color:#1f2937;line-height:1.65;text-align:justify;">${p.aboutMe}</div>`
    ) : '';

    // Education
    const eduSection = (data.education && data.education.length > 0) ? section('Education and Training',
      data.education.map(edu => `
        <div style="margin-bottom:10px;">
          <div style="font-size:${fs(8.5)};color:#6b7280;margin-bottom:2px;">
            ${[edu.from, edu.to ? '– ' + edu.to : ''].filter(Boolean).join(' ')}${edu.city ? ' ' + edu.city : ''}${edu.country ? ', ' + edu.country : ''}
          </div>
          <div style="font-size:${fs(9.5)};margin-bottom:2px;">
            <strong style="text-transform:uppercase;">${edu.qualification || ''}</strong>
            ${edu.organization ? `<span style="color:#374151;"> — ${edu.organization}</span>` : ''}
          </div>
          <div style="border-bottom:1px solid #e5e7eb;margin-bottom:4px;"></div>
          <div style="font-size:${fs(8.5)};color:#1f2937;">
            <strong>Field of study</strong> ${edu.fieldOfStudy || 'General'}
            <span style="margin:0 4px;color:#9ca3af;">|</span>
            <strong>Level in EQF</strong> ${edu.eqfLevel || 'N/A'}
          </div>
        </div>`).join('')
    ) : '';

    // Work Experience
    const workSection = (data.workExperience && data.workExperience.length > 0) ? section('Work Experience',
      data.workExperience.map(exp => `
        <div style="margin-bottom:10px;">
          <div style="font-size:${fs(8.5)};color:#6b7280;margin-bottom:2px;">
            ${exp.from || ''}${exp.from ? ' – ' : ''}${exp.to || 'Current'}${exp.city ? ' ' + exp.city : ''}${exp.country ? ', ' + exp.country : ''}
          </div>
          <div style="font-size:${fs(9.5)};margin-bottom:2px;">
            <strong style="text-transform:uppercase;">${exp.occupation || ''}</strong>
            ${exp.employer ? `<span style="color:#374151;"> — ${exp.employer}</span>` : ''}
          </div>
          <div style="border-bottom:1px solid #e5e7eb;margin-bottom:4px;"></div>
          ${(exp.responsibilities && exp.responsibilities.filter(Boolean).length > 0) ? `
            <ul style="font-size:${fs(8.5)};color:#1f2937;padding-left:14px;margin:0;list-style-type:disc;">
              ${exp.responsibilities.filter(Boolean).map(r => `<li style="margin-bottom:1px;">${r}</li>`).join('')}
            </ul>` : ''}
        </div>`).join('')
    ) : '';

    // Certificates
    const certSection = (data.certificates && data.certificates.length > 0) ? section('Certifications',
      data.certificates.map(cert => `
        <div style="margin-bottom:10px;">
          <div style="font-size:${fs(8.5)};color:#6b7280;margin-bottom:2px;">${cert.issuer || ''}${cert.date ? ' — ' + cert.date : ''}</div>
          <div style="font-size:${fs(9.5)};margin-bottom:3px;"><strong>${cert.title || ''}</strong></div>
          <div style="border-bottom:1px solid #e5e7eb;margin-bottom:4px;"></div>
          <div style="font-size:${fs(8.5)};color:#1f2937;"><strong>Mode of learning:</strong> Project based</div>
        </div>`).join('')
    ) : '';

    // Languages
    let langSection = '';
    if (p.motherTongue || (data.languages && data.languages.length > 0)) {
      const langInner = `
        ${p.motherTongue ? `<div style="font-size:${fs(9.5)};margin-bottom:8px;">Mother tongue(s): <strong style="text-transform:uppercase;margin-left:6px;">${p.motherTongue}</strong></div>` : ''}
        ${(data.languages && data.languages.length > 0) ? `
          <div style="font-size:${fs(9.5)};margin-bottom:6px;">Other language(s):</div>
          <div style="font-size:${fs(8.5)};text-align:center;">
            <div style="display:flex;font-weight:bold;margin-bottom:3px;border-bottom:1px solid #d1d5db;padding-bottom:3px;">
              <div style="width:20%;"></div>
              <div style="width:30%;text-transform:uppercase;font-size:${fs(7.5)};">Understanding</div>
              <div style="width:30%;text-transform:uppercase;font-size:${fs(7.5)};">Speaking</div>
              <div style="width:20%;text-transform:uppercase;font-size:${fs(7.5)};">Writing</div>
            </div>
            <div style="display:flex;font-size:${fs(7.5)};color:#374151;border-bottom:1px solid #e5e7eb;padding:3px 0;margin-bottom:2px;">
              <div style="width:20%;"></div>
              <div style="width:15%;">Listening</div>
              <div style="width:15%;">Reading</div>
              <div style="width:15%;">Spoken prod.</div>
              <div style="width:15%;">Spoken inter.</div>
              <div style="width:20%;"></div>
            </div>
            ${data.languages.map((l, idx) => `
              <div style="display:flex;border-bottom:1px solid #e5e7eb;padding:4px 0;background:${idx % 2 === 0 ? '#f9fafb' : 'transparent'};">
                <div style="width:20%;font-weight:800;text-align:left;padding-left:6px;text-transform:uppercase;">${l.language || ''}</div>
                <div style="width:15%;">${l.listening || '-'}</div>
                <div style="width:15%;">${l.reading || '-'}</div>
                <div style="width:15%;">${l.spokenProduction || '-'}</div>
                <div style="width:15%;">${l.spokenInteraction || '-'}</div>
                <div style="width:20%;">${l.writing || '-'}</div>
              </div>`).join('')}
            <div style="font-size:${fs(7.5)};color:#6b7280;font-style:italic;margin-top:6px;text-align:left;">Levels: A1/A2: Basic user; B1/B2: Independent user; C1/C2: Proficient user</div>
          </div>` : ''}
      `;
      langSection = section('Language Skills', langInner);
    }

    // Skills
    const skillsSection = (data.digitalSkills?.length > 0 || data.otherSkills?.length > 0) ? section('Skills',
      `<div style="font-size:${fs(9.5)};color:#1f2937;line-height:1.7;">
        ${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join(`<span style="color:#9ca3af;margin:0 5px;">|</span>`)}
      </div>`
    ) : '';

    // Page number
    const pageNum = data.pageNumbers !== false
      ? `<div style="text-align:right;font-size:${fs(8)};color:#9ca3af;margin-top:8px;">Page 1 / 1</div>`
      : '';

    bodyContent = `
      ${headerHtml}
      <div style="background:#fff;padding:20px 36px 30px 36px;">
        ${aboutSection}
        ${eduSection}
        ${workSection}
        ${certSection}
        ${langSection}
        ${skillsSection}
        ${pageNum}
      </div>
    `;

  } else if (format === 'modern') {
    // ─────────────────────────────────────────────────────────────────────────────
    // MODERN TEMPLATE (Left dark sidebar)
    // ─────────────────────────────────────────────────────────────────────────────
    css = `
      .page { display: flex; min-height: 297mm; font-family: 'Open Sans', Arial, sans-serif; }
      .sidebar { width: 32%; background: #2c3e50; color: #ecf0f1; padding: 36px 20px; box-sizing: border-box; }
      .main { width: 68%; padding: 36px 32px; background: white; box-sizing: border-box; }

      .name-title { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #34495e; padding-bottom: 16px; }
      .name-title h1 { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; color: white; }
      .name-title p { font-size: 11px; color: #1abc9c; letter-spacing: 1px; text-transform: uppercase; margin: 0; }

      .side-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #1abc9c; margin: 22px 0 10px; letter-spacing: 1px; }
      .contact-item { display: flex; flex-direction: column; margin-bottom: 10px; font-size: 10px; }
      .contact-item strong { color: #bdc3c7; margin-bottom: 1px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
      .contact-item span { color: white; word-break: break-all; }

      .skill-list { list-style: none; padding: 0; margin: 0; }
      .skill-list li { font-size: 10px; margin-bottom: 6px; position: relative; padding-left: 14px; }
      .skill-list li::before { content: '■'; color: #1abc9c; position: absolute; left: 0; font-size: 7px; top: 1px; }

      .main-title { font-size: 16px; font-weight: 700; color: #2c3e50; text-transform: uppercase; border-bottom: 2px solid #ecf0f1; padding-bottom: 6px; margin: 0 0 16px 0; }
      .main-item { margin-bottom: 18px; }
      .main-item-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
      .main-item-title { font-size: 13px; font-weight: 700; color: #34495e; }
      .main-item-date { font-size: 10px; color: #1abc9c; font-weight: 600; white-space: nowrap; }
      .main-item-sub { font-size: 11px; font-style: italic; color: #7f8c8d; margin-bottom: 6px; }
      .main-item ul { padding-left: 16px; font-size: 10px; color: #555; line-height: 1.55; margin: 4px 0 0 0; }
      .main-item li { margin-bottom: 2px; }

      .profile-text { font-size: 11px; color: #555; line-height: 1.6; margin-bottom: 22px; font-style: italic; }
    `;

    bodyContent = `
      <div class="sidebar">
        <div style="text-align:center;margin-bottom:16px;">
          ${renderPhoto(120, 120, 'margin:0 auto 14px;display:block;border:3px solid #34495e;')}
        </div>
        <div class="name-title">
          <h1>${p.fullName || 'YOUR NAME'}</h1>
          <p>${p.nationality || 'PROFESSIONAL'}</p>
        </div>

        <div class="side-title">Contact</div>
        ${p.phone ? `<div class="contact-item"><strong>Phone</strong><span>${p.phone}</span></div>` : ''}
        ${p.email ? `<div class="contact-item"><strong>Email</strong><span>${p.email}</span></div>` : ''}
        ${(p.address || p.city) ? `<div class="contact-item"><strong>Address</strong><span>${[p.address, p.city, p.country].filter(Boolean).join(', ')}</span></div>` : ''}
        ${p.website ? `<div class="contact-item"><strong>Website</strong><span>${p.website}</span></div>` : ''}
        ${p.linkedIn ? `<div class="contact-item"><strong>LinkedIn</strong><span>${p.linkedIn}</span></div>` : ''}

        ${data.digitalSkills?.length ? `
        <div class="side-title">Expertise</div>
        <ul class="skill-list">
          ${data.digitalSkills.map(s => `<li>${s}</li>`).join('')}
        </ul>` : ''}

        ${(data.languages?.length) ? `
        <div class="side-title">Languages</div>
        ${data.languages.map(l => `<div class="contact-item"><strong>${l.language}</strong><span>${l.listening || 'Proficient'}</span></div>`).join('')}
        ` : ''}

        ${(p.dateOfBirth || p.nationality) ? `
        <div class="side-title">Details</div>
        ${p.dateOfBirth ? `<div class="contact-item"><strong>Date of Birth</strong><span>${p.dateOfBirth}</span></div>` : ''}
        ${p.nationality ? `<div class="contact-item"><strong>Nationality</strong><span>${p.nationality}</span></div>` : ''}
        ` : ''}
      </div>

      <div class="main">
        ${p.aboutMe ? `
        <div class="main-title">Profile</div>
        <p class="profile-text">"${p.aboutMe}"</p>
        ` : ''}

        ${data.workExperience?.length ? `
        <div class="main-title">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="main-item">
            <div class="main-item-head">
              <div class="main-item-title">${exp.occupation || ''}</div>
              <div class="main-item-date">${exp.from || ''}${exp.from && exp.to ? ' – ' : ''}${exp.to || ''}</div>
            </div>
            <div class="main-item-sub">${exp.employer || ''}${exp.city ? ' | ' + exp.city : ''}</div>
            ${exp.responsibilities?.filter(Boolean).length ? `<ul>${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
        ` : ''}

        ${data.education?.length ? `
        <div class="main-title">Education</div>
        ${data.education.map(edu => `
          <div class="main-item">
            <div class="main-item-head">
              <div class="main-item-title">${edu.qualification || ''}</div>
              <div class="main-item-date">${edu.from || ''}${edu.from && edu.to ? ' – ' : ''}${edu.to || ''}</div>
            </div>
            <div class="main-item-sub">${edu.organization || ''}${edu.city ? ' | ' + edu.city : ''}</div>
          </div>`).join('')}
        ` : ''}

        ${data.certificates?.length ? `
        <div class="main-title">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="main-item">
            <div class="main-item-head">
              <div class="main-item-title">${cert.title || ''}</div>
              <div class="main-item-date">${cert.date || ''}</div>
            </div>
            <div class="main-item-sub">${cert.issuer || ''}</div>
          </div>`).join('')}
        ` : ''}

        ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
        <div class="main-title">Skills</div>
        <div style="font-size:11px;color:#444;line-height:1.6;">
          ${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join(' &bull; ')}
        </div>
        ` : ''}
      </div>
    `;
  }

  else if (format === 'minimal') {
    // ─────────────────────────────────────────────────────────────────────────────
    // MINIMAL TEMPLATE (Clean, centered, lots of whitespace)
    // ─────────────────────────────────────────────────────────────────────────────
    css = `
      .page { padding: 50px 60px; color: #111; font-family: 'Inter', Arial, sans-serif; }
      .header-minimal { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 26px; margin-bottom: 32px; }
      .header-minimal h1 { font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 8px 0; }
      .contact-minimal { font-size: 11px; color: #666; }

      .section-min { margin-bottom: 28px; }
      .title-min { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #111; margin-bottom: 18px; }

      .item-min { display: flex; margin-bottom: 18px; }
      .date-min { width: 110px; font-size: 10px; font-weight: 600; color: #111; flex-shrink: 0; padding-top: 1px; }
      .content-min { flex: 1; border-left: 1px solid #efefef; padding-left: 18px; }
      .content-min h3 { font-size: 13px; font-weight: 600; margin: 0 0 3px 0; }
      .content-min h4 { font-size: 11px; font-weight: 400; color: #666; margin: 0 0 8px 0; font-style: italic; }
      .content-min ul { padding-left: 14px; font-size: 10px; color: #444; line-height: 1.55; margin: 0; }
      .content-min li { margin-bottom: 2px; }

      .skills-min { font-size: 11px; color: #333; line-height: 1.8; }
      .about-min { font-size: 11px; color: #555; line-height: 1.6; font-style: italic; text-align: center; max-width: 580px; margin: 0 auto 28px; }
    `;

    bodyContent = `
      <div class="header-minimal">
        ${data.photoUrl ? `<div style="margin-bottom:12px;">${renderPhoto(72, 72, 'margin:0 auto;display:block;border:1px solid #eee;')}</div>` : ''}
        <h1>${p.fullName || 'Name Surname'}</h1>
        <div class="contact-minimal">${[p.email, p.phone, p.city, p.website].filter(Boolean).join(' &nbsp;|&nbsp; ')}</div>
      </div>

      ${p.aboutMe ? `<div class="about-min">"${p.aboutMe}"</div>` : ''}

      ${data.workExperience?.length ? `
      <div class="section-min">
        <div class="title-min">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="item-min">
            <div class="date-min">${exp.from || ''}${exp.from && exp.to ? '—' : ''}${exp.to || ''}</div>
            <div class="content-min">
              <h3>${exp.occupation || ''}</h3>
              <h4>${exp.employer || ''}${exp.city ? ', ' + exp.city : ''}</h4>
              ${exp.responsibilities?.filter(Boolean).length ? `<ul>${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
            </div>
          </div>`).join('')}
      </div>` : ''}

      ${data.education?.length ? `
      <div class="section-min">
        <div class="title-min">Education</div>
        ${data.education.map(edu => `
          <div class="item-min">
            <div class="date-min">${edu.from || ''}${edu.from && edu.to ? '—' : ''}${edu.to || ''}</div>
            <div class="content-min">
              <h3>${edu.qualification || ''}</h3>
              <h4>${edu.organization || ''}${edu.city ? ', ' + edu.city : ''}</h4>
            </div>
          </div>`).join('')}
      </div>` : ''}

      ${data.certificates?.length ? `
      <div class="section-min">
        <div class="title-min">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="item-min">
            <div class="date-min">${cert.date || ''}</div>
            <div class="content-min">
              <h3>${cert.title || ''}</h3>
              <h4>${cert.issuer || ''}</h4>
            </div>
          </div>`).join('')}
      </div>` : ''}

      ${data.digitalSkills?.length ? `
      <div class="section-min">
        <div class="title-min">Skills</div>
        <div class="skills-min">${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join(' &middot; ')}</div>
      </div>` : ''}
    `;
  }

  else if (format === 'general') {
    // ─────────────────────────────────────────────────────────────────────────────
    // GENERAL TEMPLATE (Standard corporate format)
    // ─────────────────────────────────────────────────────────────────────────────
    css = `
      .page { padding: 36px 48px; color: #333; font-family: 'Open Sans', Arial, sans-serif; }
      .header-general { border-bottom: 2px solid ${themeColor}; padding-bottom: 14px; margin-bottom: 22px; display: flex; align-items: center; gap: 18px; }
      .header-general-info h1 { font-size: 26px; color: ${themeColor}; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px; }
      .contact-general { font-size: 10px; color: #555; }

      .section-gen { margin-bottom: 18px; }
      .title-gen { font-size: 13px; font-weight: 700; color: ${themeColor}; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

      .item-gen { margin-bottom: 12px; }
      .item-gen-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; font-weight: 700; color: #222; margin-bottom: 2px; }
      .item-gen-date { font-size: 10px; font-weight: 600; color: #666; white-space: nowrap; }
      .item-gen-sub { font-size: 11px; font-style: italic; color: #666; margin-bottom: 4px; }
      .item-gen ul { padding-left: 16px; font-size: 10px; line-height: 1.5; color: #444; margin: 4px 0 0 0; }
      .item-gen li { margin-bottom: 2px; }

      .text-gen { font-size: 11px; line-height: 1.6; color: #444; }
    `;

    bodyContent = `
      <div class="header-general">
        ${data.photoUrl ? `<div>${renderPhoto(80, 80)}</div>` : ''}
        <div class="header-general-info">
          <h1>${p.fullName || 'YOUR NAME'}</h1>
          <div class="contact-general">
            ${[p.email, p.phone, p.address ? p.address + (p.city ? ', ' + p.city : '') : p.city, p.linkedIn].filter(Boolean).join(' &bull; ')}
          </div>
        </div>
      </div>

      ${p.aboutMe ? `
      <div class="section-gen">
        <div class="title-gen">Professional Summary</div>
        <div class="text-gen">${p.aboutMe}</div>
      </div>` : ''}

      ${data.workExperience?.length ? `
      <div class="section-gen">
        <div class="title-gen">Work Experience</div>
        ${data.workExperience.map(exp => `
          <div class="item-gen">
            <div class="item-gen-head">
              <span>${exp.occupation || ''}</span>
              <span class="item-gen-date">${exp.from || ''}${exp.from && exp.to ? ' – ' : ''}${exp.to || ''}</span>
            </div>
            <div class="item-gen-sub">${exp.employer || ''}${exp.city ? ' | ' + exp.city : ''}</div>
            ${exp.responsibilities?.filter(Boolean).length ? `<ul>${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
      </div>` : ''}

      ${data.education?.length ? `
      <div class="section-gen">
        <div class="title-gen">Education</div>
        ${data.education.map(edu => `
          <div class="item-gen">
            <div class="item-gen-head">
              <span>${edu.qualification || ''}</span>
              <span class="item-gen-date">${edu.from || ''}${edu.from && edu.to ? ' – ' : ''}${edu.to || ''}</span>
            </div>
            <div class="item-gen-sub">${edu.organization || ''}${edu.city ? ' | ' + edu.city : ''}</div>
          </div>`).join('')}
      </div>` : ''}

      ${data.certificates?.length ? `
      <div class="section-gen">
        <div class="title-gen">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="item-gen" style="margin-bottom:8px;">
            <div style="font-size:12px;font-weight:700;color:#222;">${cert.title || ''}</div>
            <div style="font-size:10px;color:#666;">${cert.issuer || ''}${cert.date ? ' (' + cert.date + ')' : ''}</div>
          </div>`).join('')}
      </div>` : ''}

      ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
      <div class="section-gen">
        <div class="title-gen">Skills</div>
        <div class="text-gen">
          ${data.digitalSkills?.length ? `<strong>Technical:</strong> ${data.digitalSkills.join(', ')}<br/>` : ''}
          ${data.otherSkills?.length ? `<strong>Other:</strong> ${data.otherSkills.join(', ')}` : ''}
        </div>
      </div>` : ''}

      ${data.languages?.length ? `
      <div class="section-gen">
        <div class="title-gen">Languages</div>
        <div class="text-gen">${data.languages.map(l => `<strong>${l.language}</strong> (${l.listening || 'Proficient'})`).join(' &nbsp;&bull;&nbsp; ')}</div>
      </div>` : ''}
    `;
  }

  else if (format === 'plain') {
    // ─────────────────────────────────────────────────────────────────────────────
    // PLAIN TEMPLATE (No photos, Times New Roman, professional)
    // ─────────────────────────────────────────────────────────────────────────────
    css = `
      .page { padding: 48px 60px; color: #000; font-family: "Times New Roman", Times, serif; }
      .header-plain { text-align: center; margin-bottom: 22px; border-bottom: 2px solid #000; padding-bottom: 12px; }
      .header-plain h1 { font-size: 24px; text-transform: uppercase; margin: 0 0 6px 0; font-weight: bold; }
      .header-plain .contact { font-size: 10px; }
      .section-plain { margin-bottom: 14px; }
      .section-title-plain { font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 2px; }
      .item-header-plain { display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-bottom: 1px; }
      .item-sub-plain { font-style: italic; font-size: 10px; margin-bottom: 3px; }
      .item-ul-plain { padding-left: 18px; font-size: 10px; margin-bottom: 8px; list-style-type: disc; line-height: 1.5; }
      .skills-text-plain { font-size: 10px; }
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
        <div class="section-title-plain">Summary</div>
        <div style="font-size:10px;line-height:1.55;">${p.aboutMe}</div>
      </div>` : ''}

      ${data.workExperience?.length ? `
      <div class="section-plain">
        <div class="section-title-plain">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="item-header-plain">
            <span>${exp.occupation || ''}</span>
            <span>${exp.from || ''}${exp.from && exp.to ? ' – ' : ''}${exp.to || ''}</span>
          </div>
          <div class="item-sub-plain">${exp.employer || ''}${exp.city ? ', ' + exp.city : ''}</div>
          ${exp.responsibilities?.filter(Boolean).length
            ? `<ul class="item-ul-plain">${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>`
            : '<div style="margin-bottom:8px;"></div>'}`).join('')}
      </div>` : ''}

      ${data.education?.length ? `
      <div class="section-plain">
        <div class="section-title-plain">Education</div>
        ${data.education.map(edu => `
          <div class="item-header-plain">
            <span>${edu.qualification || ''}</span>
            <span>${edu.from || ''}${edu.from && edu.to ? ' – ' : ''}${edu.to || ''}</span>
          </div>
          <div class="item-sub-plain">${edu.organization || ''}${edu.city ? ', ' + edu.city : ''}</div>
          <div style="margin-bottom:8px;"></div>`).join('')}
      </div>` : ''}

      ${data.certificates?.length ? `
      <div class="section-plain">
        <div class="section-title-plain">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="item-header-plain">
            <span>${cert.title || ''}</span>
            <span>${cert.date || ''}</span>
          </div>
          <div class="item-sub-plain">${cert.issuer || ''}</div>
          <div style="margin-bottom:6px;"></div>`).join('')}
      </div>` : ''}

      ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
      <div class="section-plain">
        <div class="section-title-plain">Skills</div>
        <div class="skills-text-plain">
          ${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join(', ')}
        </div>
      </div>` : ''}

      ${data.languages?.length ? `
      <div class="section-plain">
        <div class="section-title-plain">Languages</div>
        <div class="skills-text-plain">
          ${data.languages.map(l => `${l.language} (${l.listening || 'Proficient'})`).join(', ')}
        </div>
      </div>` : ''}
    `;
  }

  else if (format === 'elegant') {
    // ─────────────────────────────────────────────────────────────────────────────
    // ELEGANT TEMPLATE (Two columns, themed sidebar)
    // ─────────────────────────────────────────────────────────────────────────────
    css = `
      .page { display: flex; min-height: 297mm; font-family: 'Inter', 'Open Sans', Arial, sans-serif; background: #fff; }
      .left-col { width: 34%; background: ${themeColor}; color: rgba(255,255,255,0.92); padding: 36px 22px; box-sizing: border-box; }
      .right-col { width: 66%; padding: 36px 32px; background: #ffffff; box-sizing: border-box; }

      .name-text { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 3px; color: #fff; letter-spacing: 0.5px; }
      .role-text { text-align: center; font-size: 10px; font-weight: 300; margin-bottom: 22px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; }

      .side-head { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid rgba(255,255,255,0.2); margin: 20px 0 10px 0; padding-bottom: 5px; color: #fff; }
      .side-item { font-size: 10px; margin-bottom: 8px; line-height: 1.5; }
      .side-item strong { display: block; font-size: 8.5px; color: rgba(255,255,255,0.55); text-transform: uppercase; margin-bottom: 1px; letter-spacing: 0.5px; }

      .main-head { font-size: 16px; font-weight: 700; color: ${themeColor}; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
      .main-block { margin-bottom: 16px; }
      .mb-title { font-size: 13px; font-weight: 700; color: #333; display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
      .mb-date { font-size: 10px; font-weight: 600; color: ${themeColor}; white-space: nowrap; }
      .mb-sub { font-size: 11px; font-style: italic; color: #777; margin-bottom: 6px; }
      .mb-text { font-size: 11px; color: #555; line-height: 1.6; }
      .mb-ul { padding-left: 16px; list-style: disc; margin: 4px 0 0 0; }
      .mb-ul li { margin-bottom: 3px; font-size: 10px; }
    `;

    bodyContent = `
      <div class="left-col">
        <div style="text-align:center;margin-bottom:14px;">
          ${renderPhoto(110, 110, 'margin:0 auto 12px;display:block;border:3px solid rgba(255,255,255,0.3);')}
        </div>
        <div class="name-text">${p.fullName || 'YOUR NAME'}</div>
        <div class="role-text">${p.nationality || 'Professional'}</div>

        <div class="side-head">Contact</div>
        ${p.phone ? `<div class="side-item"><strong>Phone</strong>${p.phone}</div>` : ''}
        ${p.email ? `<div class="side-item"><strong>Email</strong>${p.email}</div>` : ''}
        ${(p.address || p.city) ? `<div class="side-item"><strong>Address</strong>${[p.address, p.city, p.country].filter(Boolean).join(', ')}</div>` : ''}
        ${p.linkedIn ? `<div class="side-item"><strong>LinkedIn</strong>${p.linkedIn}</div>` : ''}
        ${p.website ? `<div class="side-item"><strong>Website</strong>${p.website}</div>` : ''}

        ${(data.digitalSkills?.length || data.otherSkills?.length) ? `
        <div class="side-head">Skills</div>
        <div class="side-item" style="line-height:1.9;">
          ${[...(data.digitalSkills || []), ...(data.otherSkills || [])].join('<br/>')}
        </div>` : ''}

        ${data.languages?.length ? `
        <div class="side-head">Languages</div>
        ${data.languages.map(l => `<div class="side-item"><strong>${l.language}</strong>${l.listening || 'Proficient'}</div>`).join('')}
        ` : ''}

        ${(p.dateOfBirth || p.nationality) ? `
        <div class="side-head">Details</div>
        ${p.dateOfBirth ? `<div class="side-item"><strong>Date of Birth</strong>${p.dateOfBirth}</div>` : ''}
        ${p.nationality ? `<div class="side-item"><strong>Nationality</strong>${p.nationality}</div>` : ''}
        ` : ''}
      </div>

      <div class="right-col">
        ${p.aboutMe ? `
        <div class="main-head">Profile</div>
        <div class="main-block mb-text" style="font-style:italic;margin-bottom:22px;">"${p.aboutMe}"</div>
        ` : ''}

        ${data.workExperience?.length ? `
        <div class="main-head">Experience</div>
        ${data.workExperience.map(exp => `
          <div class="main-block">
            <div class="mb-title">
              <span>${exp.occupation || ''}</span>
              <span class="mb-date">${exp.from || ''}${exp.from && exp.to ? ' – ' : ''}${exp.to || ''}</span>
            </div>
            <div class="mb-sub">${exp.employer || ''}${exp.city ? ' | ' + exp.city : ''}</div>
            ${exp.responsibilities?.filter(Boolean).length ? `<ul class="mb-ul mb-text">${exp.responsibilities.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
        ` : ''}

        ${data.education?.length ? `
        <div class="main-head">Education</div>
        ${data.education.map(edu => `
          <div class="main-block">
            <div class="mb-title">
              <span>${edu.qualification || ''}</span>
              <span class="mb-date">${edu.from || ''}${edu.from && edu.to ? ' – ' : ''}${edu.to || ''}</span>
            </div>
            <div class="mb-sub">${edu.organization || ''}${edu.city ? ' | ' + edu.city : ''}</div>
          </div>`).join('')}
        ` : ''}

        ${data.certificates?.length ? `
        <div class="main-head">Certifications</div>
        ${data.certificates.map(cert => `
          <div class="main-block" style="margin-bottom:10px;">
            <div class="mb-title">
              <span>${cert.title || ''}</span>
              <span class="mb-date">${cert.date || ''}</span>
            </div>
            <div class="mb-sub">${cert.issuer || ''}</div>
          </div>`).join('')}
        ` : ''}
      </div>
    `;
  }

  // ─── Final HTML wrapper ────────────────────────────────────────────────────
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Inter:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Open Sans', 'Inter', Arial, sans-serif; color: #1a1a2e; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        img { max-width: 100%; display: block; }
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
