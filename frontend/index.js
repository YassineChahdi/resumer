const API_BASE = 'http://localhost:8000';
let tailoredResume = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
    addEducation();
    addExperience();
    addProject();
});

// Education
let eduCount = 0;
function addEducation() {
    eduCount++;
    const id = `edu-${eduCount}`;
    const html = `
        <div class="list-item" id="${id}">
            <div class="list-item-header">
                <span>Education #${eduCount}</span>
                <button class="btn-remove" onclick="remove('${id}')">×</button>
            </div>
            <div class="row">
                <input type="text" placeholder="Institution" data-field="est_name" />
                <input type="text" placeholder="Location" data-field="location" />
            </div>
            <div class="row">
                <input type="text" placeholder="Degree" data-field="degree" />
                <input type="text" placeholder="Year" data-field="year" />
            </div>
            <input type="number" step="0.1" placeholder="GPA (optional)" data-field="gpa" />
        </div>
    `;
    document.getElementById('educationList').insertAdjacentHTML('beforeend', html);
}

// Experience
let expCount = 0;
function addExperience() {
    expCount++;
    const id = `exp-${expCount}`;
    const html = `
        <div class="list-item" id="${id}">
            <div class="list-item-header">
                <span>Experience #${expCount}</span>
                <button class="btn-remove" onclick="remove('${id}')">×</button>
            </div>
            <div class="row">
                <input type="text" placeholder="Employer" data-field="employer" />
                <input type="text" placeholder="Location" data-field="location" />
            </div>
            <div class="row">
                <input type="text" placeholder="Title" data-field="title" />
                <input type="text" placeholder="Duration" data-field="duration" />
            </div>
            <div class="bullets" id="${id}-bullets"></div>
            <button class="btn-add-bullet" onclick="addBullet('${id}-bullets')">+ Bullet</button>
        </div>
    `;
    document.getElementById('experienceList').insertAdjacentHTML('beforeend', html);
    addBullet(`${id}-bullets`);
}

// Projects
let projCount = 0;
function addProject() {
    projCount++;
    const id = `proj-${projCount}`;
    const html = `
        <div class="list-item" id="${id}">
            <div class="list-item-header">
                <span>Project #${projCount}</span>
                <button class="btn-remove" onclick="remove('${id}')">×</button>
            </div>
            <div class="row">
                <input type="text" placeholder="Title" data-field="title" />
                <input type="text" placeholder="Languages (comma-sep)" data-field="languages" />
            </div>
            <div class="bullets" id="${id}-bullets"></div>
            <button class="btn-add-bullet" onclick="addBullet('${id}-bullets')">+ Bullet</button>
        </div>
    `;
    document.getElementById('projectList').insertAdjacentHTML('beforeend', html);
    addBullet(`${id}-bullets`);
}

// Bullets
function addBullet(containerId) {
    const html = `
        <div class="bullet-row">
            <input type="text" placeholder="Bullet text" data-field="text" />
            <input type="number" step="0.1" min="0" max="1" placeholder="Imp" data-field="impressiveness" value="0.7" />
            <button class="btn-remove" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
}

function remove(id) {
    const el = document.getElementById(id);
    const parent = el.parentElement;
    el.remove();
    // Decrement counter and renumber remaining items
    if (id.startsWith('edu')) {
        eduCount--;
        parent.querySelectorAll('.list-item').forEach((item, i) => {
            item.querySelector('.list-item-header span').textContent = `Education #${i + 1}`;
        });
    } else if (id.startsWith('exp')) {
        expCount--;
        parent.querySelectorAll('.list-item').forEach((item, i) => {
            item.querySelector('.list-item-header span').textContent = `Experience #${i + 1}`;
        });
    } else {
        projCount--;
        parent.querySelectorAll('.list-item').forEach((item, i) => {
            item.querySelector('.list-item-header span').textContent = `Project #${i + 1}`;
        });
    }
}

// Collect form data
function collectData() {
    const data = {
        full_name: document.getElementById('fullName').value,
        contacts: {
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            github: document.getElementById('github').value,
            linkedin: document.getElementById('linkedin').value,
        },
        education: [],
        experience: [],
        projects: [],
        technologies: [],
        languages: [],
    };

    document.querySelectorAll('#educationList .list-item').forEach(item => {
        const edu = {
            est_name: item.querySelector('[data-field="est_name"]').value,
            location: item.querySelector('[data-field="location"]').value,
            degree: item.querySelector('[data-field="degree"]').value,
            year: item.querySelector('[data-field="year"]').value,
            gpa: parseFloat(item.querySelector('[data-field="gpa"]').value) || null,
        };
        if (edu.est_name || edu.degree) data.education.push(edu);
    });

    document.querySelectorAll('#experienceList .list-item').forEach(item => {
        const exp = {
            employer: item.querySelector('[data-field="employer"]').value,
            location: item.querySelector('[data-field="location"]').value,
            title: item.querySelector('[data-field="title"]').value,
            duration: item.querySelector('[data-field="duration"]').value,
            bullets: [],
        };
        item.querySelectorAll('.bullet-row').forEach(b => {
            const text = b.querySelector('[data-field="text"]').value;
            const imp = parseFloat(b.querySelector('[data-field="impressiveness"]').value) || 0.5;
            if (text) exp.bullets.push({ text, impressiveness: imp });
        });
        if (exp.employer || exp.title) data.experience.push(exp);
    });

    document.querySelectorAll('#projectList .list-item').forEach(item => {
        const proj = {
            title: item.querySelector('[data-field="title"]').value,
            languages: item.querySelector('[data-field="languages"]').value.split(',').map(s => s.trim()).filter(Boolean),
            bullets: [],
        };
        item.querySelectorAll('.bullet-row').forEach(b => {
            const text = b.querySelector('[data-field="text"]').value;
            const imp = parseFloat(b.querySelector('[data-field="impressiveness"]').value) || 0.5;
            if (text) proj.bullets.push({ text, impressiveness: imp });
        });
        if (proj.title) data.projects.push(proj);
    });

    const langs = document.getElementById('languages').value;
    data.languages = langs.split(',').map(s => s.trim()).filter(Boolean).map(text => ({ text }));

    const techs = document.getElementById('technologies').value;
    data.technologies = techs.split(',').map(s => s.trim()).filter(Boolean).map(text => ({ text }));

    return data;
}

// Preview
async function generatePreview() {
    const resume = collectData();
    const jobDesc = document.getElementById('jobDescription').value;
    const preview = document.getElementById('preview');

    preview.innerHTML = '<span class="loading">Loading...</span>';

    try {
        const res = await fetch(`${API_BASE}/tailor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume, job_description: jobDesc }),
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
    let html = `
        <div class="preview-header">
            <h2>${r.full_name || 'Name'}</h2>
            <div>${[r.contacts?.phone, r.contacts?.email, r.contacts?.github, r.contacts?.linkedin].filter(Boolean).join(' | ')}</div>
        </div>
    `;

    if (r.education?.length) {
        html += '<div class="preview-section-title">Education</div>';
        r.education.forEach(e => {
            html += `<div class="preview-entry">
                <div class="preview-entry-header"><span>${e.est_name}</span><span>${e.location}</span></div>
                <div class="preview-entry-subtitle"><span>${e.degree}${e.gpa ? ', GPA: ' + e.gpa : ''}</span><span>${e.year}</span></div>
            </div>`;
        });
    }

    if (r.experience?.length) {
        html += '<div class="preview-section-title">Experience</div>';
        r.experience.forEach(e => {
            html += `<div class="preview-entry">
                <div class="preview-entry-header"><span>${e.employer}</span><span>${e.location}</span></div>
                <div class="preview-entry-subtitle"><span>${e.title}</span><span>${e.duration}</span></div>
                <ul class="preview-bullets">${(e.bullets || []).map(b => `<li>${b.text}</li>`).join('')}</ul>
            </div>`;
        });
    }

    if (r.projects?.length) {
        html += '<div class="preview-section-title">Projects</div>';
        r.projects.forEach(p => {
            html += `<div class="preview-entry">
                <div class="preview-entry-header"><span>${p.title} | ${(p.languages || []).join(', ')}</span></div>
                <ul class="preview-bullets">${(p.bullets || []).map(b => `<li>${b.text}</li>`).join('')}</ul>
            </div>`;
        });
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

// Downloads
async function downloadPDF() {
    if (!tailoredResume) return;
    const template = document.getElementById('template').value;

    try {
        const res = await fetch(`${API_BASE}/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume, template }),
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const blob = await res.blob();
        download(blob, 'resume.pdf');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function downloadLatex() {
    if (!tailoredResume) return;
    const template = document.getElementById('template').value;

    try {
        const res = await fetch(`${API_BASE}/export/latex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume, template }),
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const text = await res.text();
        download(new Blob([text], { type: 'text/plain' }), 'resume.tex');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
