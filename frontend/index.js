const API_BASE = 'http://localhost:8000';

// Single source of truth
let resumeData = {
    full_name: '',
    contacts: { phone: '', email: '', github: '', linkedin: '' },
    education: [],
    experience: [],
    projects: [],
    languages: [],
    technologies: []
};

let tailoredResume = null;

// === Init ===
document.addEventListener('DOMContentLoaded', () => renderForm());

// === Load JSON ===
function loadFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            // Only copy known fields
            resumeData.full_name = data.full_name || '';
            resumeData.contacts = { ...resumeData.contacts, ...data.contacts };
            resumeData.education = (data.education || []).map(e => ({
                est_name: e.est_name || '', location: e.location || '',
                degree: e.degree || '', year: e.year || '', gpa: e.gpa || ''
            }));
            resumeData.experience = (data.experience || []).map(e => ({
                employer: e.employer || '', location: e.location || '',
                title: e.title || '', duration: e.duration || '',
                bullets: (e.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? 0.7 }))
            }));
            resumeData.projects = (data.projects || []).map(p => ({
                title: p.title || '',
                languages: Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages || ''),
                bullets: (p.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? 0.7 }))
            }));
            resumeData.languages = (data.languages || []).map(l => typeof l === 'string' ? l : l.text || '');
            resumeData.technologies = (data.technologies || []).map(t => typeof t === 'string' ? t : t.text || '');
            renderForm();
        } catch (err) { alert('Invalid JSON'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// === Render Form from resumeData ===
function renderForm() {
    // Personal
    document.getElementById('fullName').value = resumeData.full_name;
    document.getElementById('phone').value = resumeData.contacts.phone;
    document.getElementById('email').value = resumeData.contacts.email;
    document.getElementById('github').value = resumeData.contacts.github;
    document.getElementById('linkedin').value = resumeData.contacts.linkedin;

    // Education
    const eduList = document.getElementById('educationList');
    eduList.innerHTML = resumeData.education.length ? '' : itemHtml('edu', 0, eduFields());
    resumeData.education.forEach((e, i) => eduList.innerHTML += itemHtml('edu', i, eduFields(e)));

    // Experience
    const expList = document.getElementById('experienceList');
    expList.innerHTML = resumeData.experience.length ? '' : itemHtml('exp', 0, expFields(), true);
    resumeData.experience.forEach((e, i) => expList.innerHTML += itemHtml('exp', i, expFields(e), true, e.bullets));

    // Projects
    const projList = document.getElementById('projectList');
    projList.innerHTML = resumeData.projects.length ? '' : itemHtml('proj', 0, projFields(), true);
    resumeData.projects.forEach((p, i) => projList.innerHTML += itemHtml('proj', i, projFields(p), true, p.bullets));

    // Skills
    document.getElementById('languages').value = resumeData.languages.join(', ');
    document.getElementById('technologies').value = resumeData.technologies.join(', ');
}

// === HTML Generators ===
function itemHtml(type, idx, fields, hasBullets = false, bullets = []) {
    const label = { edu: 'Education', exp: 'Experience', proj: 'Project' }[type];
    let html = `<div class="list-item" data-type="${type}" data-idx="${idx}">
        <div class="list-item-header"><span>${label} #${idx + 1}</span><button class="btn-remove" onclick="removeItem('${type}',${idx})">×</button></div>
        <div class="row">${fields.slice(0, 2).map(f => fieldInput(f)).join('')}</div>
        <div class="row">${fields.slice(2, 4).map(f => fieldInput(f)).join('')}</div>
        ${fields[4] ? fieldInput(fields[4]) : ''}`;
    if (hasBullets) {
        html += `<div class="bullets" data-type="${type}" data-idx="${idx}">
            ${bullets.length ? bullets.map((b, bi) => bulletHtml(type, idx, bi, b)).join('') : bulletHtml(type, idx, 0)}
        </div><button class="btn-add-bullet" onclick="addBullet('${type}',${idx})">+ Bullet</button>`;
    }
    return html + '</div>';
}

function fieldInput(f) {
    return `<input type="${f.type || 'text'}" placeholder="${f.ph}" data-field="${f.field}" value="${f.val || ''}" ${f.step ? 'step="' + f.step + '"' : ''}/>`;
}

function bulletHtml(type, idx, bi, b = {}) {
    return `<div class="bullet-row">
        <input type="text" placeholder="Bullet" data-field="text" value="${b.text || ''}"/>
        <input type="number" step="0.1" min="0" max="1" placeholder="Imp" data-field="impressiveness" value="${b.impressiveness ?? 0.7}"/>
        <button class="btn-remove" onclick="removeBullet('${type}',${idx},${bi})">×</button>
    </div>`;
}

function eduFields(e = {}) {
    return [
        { ph: 'Institution', field: 'est_name', val: e.est_name },
        { ph: 'Location', field: 'location', val: e.location },
        { ph: 'Degree', field: 'degree', val: e.degree },
        { ph: 'Year', field: 'year', val: e.year },
        { ph: 'GPA', field: 'gpa', val: e.gpa, type: 'number', step: '0.1' }
    ];
}

function expFields(e = {}) {
    return [
        { ph: 'Employer', field: 'employer', val: e.employer },
        { ph: 'Location', field: 'location', val: e.location },
        { ph: 'Title', field: 'title', val: e.title },
        { ph: 'Duration', field: 'duration', val: e.duration }
    ];
}

function projFields(p = {}) {
    return [
        { ph: 'Title', field: 'title', val: p.title },
        { ph: 'Languages', field: 'languages', val: p.languages }
    ];
}

// === Add/Remove ===
function addItem(type) {
    const arr = { edu: resumeData.education, exp: resumeData.experience, proj: resumeData.projects }[type];
    syncFromForm();
    if (type === 'edu') arr.push({ est_name: '', location: '', degree: '', year: '', gpa: '' });
    else if (type === 'exp') arr.push({ employer: '', location: '', title: '', duration: '', bullets: [{ text: '', impressiveness: 0.7 }] });
    else arr.push({ title: '', languages: '', bullets: [{ text: '', impressiveness: 0.7 }] });
    renderForm();
}

function removeItem(type, idx) {
    syncFromForm();
    const arr = { edu: resumeData.education, exp: resumeData.experience, proj: resumeData.projects }[type];
    arr.splice(idx, 1);
    renderForm();
}

function addBullet(type, idx) {
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects }[type];
    arr[idx].bullets.push({ text: '', impressiveness: 0.7 });
    renderForm();
}

function removeBullet(type, idx, bi) {
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects }[type];
    arr[idx].bullets.splice(bi, 1);
    if (arr[idx].bullets.length === 0) arr[idx].bullets.push({ text: '', impressiveness: 0.7 });
    renderForm();
}

// === Sync Form → resumeData ===
function syncFromForm() {
    resumeData.full_name = document.getElementById('fullName').value;
    resumeData.contacts = {
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        github: document.getElementById('github').value,
        linkedin: document.getElementById('linkedin').value
    };
    resumeData.education = [...document.querySelectorAll('#educationList .list-item')].map(el => ({
        est_name: el.querySelector('[data-field="est_name"]').value,
        location: el.querySelector('[data-field="location"]').value,
        degree: el.querySelector('[data-field="degree"]').value,
        year: el.querySelector('[data-field="year"]').value,
        gpa: el.querySelector('[data-field="gpa"]').value
    })).filter(e => e.est_name || e.degree);

    resumeData.experience = [...document.querySelectorAll('#experienceList .list-item')].map(el => ({
        employer: el.querySelector('[data-field="employer"]').value,
        location: el.querySelector('[data-field="location"]').value,
        title: el.querySelector('[data-field="title"]').value,
        duration: el.querySelector('[data-field="duration"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => ({
            text: b.querySelector('[data-field="text"]').value,
            impressiveness: parseFloat(b.querySelector('[data-field="impressiveness"]').value) || 0.7
        })).filter(b => b.text)
    })).filter(e => e.employer || e.title);

    resumeData.projects = [...document.querySelectorAll('#projectList .list-item')].map(el => ({
        title: el.querySelector('[data-field="title"]').value,
        languages: el.querySelector('[data-field="languages"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => ({
            text: b.querySelector('[data-field="text"]').value,
            impressiveness: parseFloat(b.querySelector('[data-field="impressiveness"]').value) || 0.7
        })).filter(b => b.text)
    })).filter(p => p.title);

    resumeData.languages = document.getElementById('languages').value.split(',').map(s => s.trim()).filter(Boolean);
    resumeData.technologies = document.getElementById('technologies').value.split(',').map(s => s.trim()).filter(Boolean);
}

// === API Calls ===
async function generatePreview() {
    syncFromForm();
    const preview = document.getElementById('preview');
    preview.innerHTML = '<span class="loading">Loading...</span>';

    // Prepare data for API (convert languages string back to array for projects)
    const apiData = {
        ...resumeData,
        projects: resumeData.projects.map(p => ({ ...p, languages: p.languages.split(',').map(s => s.trim()).filter(Boolean) })),
        languages: resumeData.languages.map(l => ({ text: l })),
        technologies: resumeData.technologies.map(t => ({ text: t }))
    };

    try {
        const res = await fetch(`${API_BASE}/tailor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: apiData, job_description: document.getElementById('jobDescription').value })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        tailoredResume = await res.json();
        renderPreview(tailoredResume);
        document.getElementById('btnPdf').disabled = false;
        document.getElementById('btnLatex').disabled = false;
    } catch (e) {
        preview.innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }
}

function renderPreview(r) {
    let html = `<div class="preview-header"><h2>${r.full_name || 'Name'}</h2>
        <div>${[r.contacts?.phone, r.contacts?.email, r.contacts?.github, r.contacts?.linkedin].filter(Boolean).join(' | ')}</div></div>`;

    if (r.education?.length) {
        html += '<div class="preview-section-title">Education</div>';
        r.education.forEach(e => html += `<div class="preview-entry">
            <div class="preview-entry-header"><span>${e.est_name}</span><span>${e.location}</span></div>
            <div class="preview-entry-subtitle"><span>${e.degree}${e.gpa ? ', GPA: ' + e.gpa : ''}</span><span>${e.year}</span></div></div>`);
    }
    if (r.experience?.length) {
        html += '<div class="preview-section-title">Experience</div>';
        r.experience.forEach(e => html += `<div class="preview-entry">
            <div class="preview-entry-header"><span>${e.employer}</span><span>${e.location}</span></div>
            <div class="preview-entry-subtitle"><span>${e.title}</span><span>${e.duration}</span></div>
            <ul class="preview-bullets">${(e.bullets || []).map(b => `<li>${b.text}</li>`).join('')}</ul></div>`);
    }
    if (r.projects?.length) {
        html += '<div class="preview-section-title">Projects</div>';
        r.projects.forEach(p => html += `<div class="preview-entry">
            <div class="preview-entry-header"><span>${p.title} | ${(p.languages || []).join(', ')}</span></div>
            <ul class="preview-bullets">${(p.bullets || []).map(b => `<li>${b.text}</li>`).join('')}</ul></div>`);
    }
    const langs = (r.languages || []).map(l => l.text).join(', ');
    const techs = (r.technologies || []).map(t => t.text).join(', ');
    if (langs || techs) {
        html += '<div class="preview-section-title">Skills</div>';
        if (langs) html += `<div><b>Languages:</b> ${langs}</div>`;
        if (techs) html += `<div><b>Technologies:</b> ${techs}</div>`;
    }
    document.getElementById('preview').innerHTML = html;
}

async function downloadPDF() {
    if (!tailoredResume) return;
    try {
        const res = await fetch(`${API_BASE}/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume, template: document.getElementById('template').value })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        download(await res.blob(), 'resume.pdf');
    } catch (e) { alert('Error: ' + e.message); }
}

async function downloadLatex() {
    if (!tailoredResume) return;
    try {
        const res = await fetch(`${API_BASE}/export/latex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume, template: document.getElementById('template').value })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        download(new Blob([await res.text()], { type: 'text/plain' }), 'resume.tex');
    } catch (e) { alert('Error: ' + e.message); }
}

function downloadJson() {
    syncFromForm();
    const data = {
        ...resumeData,
        projects: resumeData.projects.map(p => ({ ...p, languages: p.languages.split(',').map(s => s.trim()).filter(Boolean) })),
        languages: resumeData.languages.map(l => ({ text: l })),
        technologies: resumeData.technologies.map(t => ({ text: t }))
    };
    download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'resume.json');
}

function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}
