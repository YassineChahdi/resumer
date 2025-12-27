// === Configuration ===
const API_BASE = 'http://localhost:8000';

// Store the tailored resume for downloads
let tailoredResume = null;

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    // Add initial entries
    addEducation();
    addExperience();
    addProject();
});

// === Education ===
let educationCount = 0;

function addEducation() {
    educationCount++;
    const id = `edu-${educationCount}`;
    const html = `
        <div class="list-item" id="${id}">
            <div class="list-item-header">
                <h3>Education #${educationCount}</h3>
                <button class="btn-remove" onclick="removeItem('${id}')">✕</button>
            </div>
            <div class="form-row two-cols">
                <input type="text" placeholder="Institution Name" data-field="est_name" />
                <input type="text" placeholder="Location" data-field="location" />
            </div>
            <div class="form-row two-cols">
                <input type="text" placeholder="Degree" data-field="degree" />
                <input type="text" placeholder="Year (e.g. May 2025)" data-field="year" />
            </div>
            <div class="form-row">
                <input type="number" step="0.1" min="0" max="4" placeholder="GPA (optional)" data-field="gpa" />
            </div>
        </div>
    `;
    document.getElementById('educationList').insertAdjacentHTML('beforeend', html);
}

// === Experience ===
let experienceCount = 0;

function addExperience() {
    experienceCount++;
    const id = `exp-${experienceCount}`;
    const html = `
        <div class="list-item" id="${id}">
            <div class="list-item-header">
                <h3>Experience #${experienceCount}</h3>
                <button class="btn-remove" onclick="removeItem('${id}')">✕</button>
            </div>
            <div class="form-row two-cols">
                <input type="text" placeholder="Employer" data-field="employer" />
                <input type="text" placeholder="Location" data-field="location" />
            </div>
            <div class="form-row two-cols">
                <input type="text" placeholder="Job Title" data-field="title" />
                <input type="text" placeholder="Duration (e.g. Jan 2024 - Present)" data-field="duration" />
            </div>
            <div class="bullets-section">
                <label>Bullets (with impressiveness score 0-1)</label>
                <div class="bullets-container" id="${id}-bullets"></div>
                <button class="btn-add-bullet" onclick="addBullet('${id}-bullets')">+ Add Bullet</button>
            </div>
        </div>
    `;
    document.getElementById('experienceList').insertAdjacentHTML('beforeend', html);
    // Add initial bullet
    addBullet(`${id}-bullets`);
}

// === Projects ===
let projectCount = 0;

function addProject() {
    projectCount++;
    const id = `proj-${projectCount}`;
    const html = `
        <div class="list-item" id="${id}">
            <div class="list-item-header">
                <h3>Project #${projectCount}</h3>
                <button class="btn-remove" onclick="removeItem('${id}')">✕</button>
            </div>
            <div class="form-row two-cols">
                <input type="text" placeholder="Project Title" data-field="title" />
                <input type="text" placeholder="Languages (comma-separated)" data-field="languages" />
            </div>
            <div class="bullets-section">
                <label>Bullets (with impressiveness score 0-1)</label>
                <div class="bullets-container" id="${id}-bullets"></div>
                <button class="btn-add-bullet" onclick="addBullet('${id}-bullets')">+ Add Bullet</button>
            </div>
        </div>
    `;
    document.getElementById('projectList').insertAdjacentHTML('beforeend', html);
    // Add initial bullet
    addBullet(`${id}-bullets`);
}

// === Bullets ===
function addBullet(containerId) {
    const html = `
        <div class="bullet-item">
            <input type="text" placeholder="Bullet point text" data-field="text" />
            <input type="number" step="0.1" min="0" max="1" placeholder="Imp" data-field="impressiveness" value="0.7" />
            <button class="btn-remove" onclick="this.parentElement.remove()">✕</button>
        </div>
    `;
    document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
}

// === Remove Item ===
function removeItem(id) {
    document.getElementById(id).remove();
}

// === Collect Form Data ===
function collectFormData() {
    // Personal Info
    const resume = {
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

    // Education
    document.querySelectorAll('#educationList .list-item').forEach(item => {
        const edu = {
            est_name: item.querySelector('[data-field="est_name"]').value,
            location: item.querySelector('[data-field="location"]').value,
            degree: item.querySelector('[data-field="degree"]').value,
            year: item.querySelector('[data-field="year"]').value,
            gpa: parseFloat(item.querySelector('[data-field="gpa"]').value) || null,
        };
        if (edu.est_name || edu.degree) resume.education.push(edu);
    });

    // Experience
    document.querySelectorAll('#experienceList .list-item').forEach(item => {
        const exp = {
            employer: item.querySelector('[data-field="employer"]').value,
            location: item.querySelector('[data-field="location"]').value,
            title: item.querySelector('[data-field="title"]').value,
            duration: item.querySelector('[data-field="duration"]').value,
            bullets: [],
        };
        item.querySelectorAll('.bullet-item').forEach(bullet => {
            const text = bullet.querySelector('[data-field="text"]').value;
            const imp = parseFloat(bullet.querySelector('[data-field="impressiveness"]').value) || 0.5;
            if (text) exp.bullets.push({ text, impressiveness: imp });
        });
        if (exp.employer || exp.title) resume.experience.push(exp);
    });

    // Projects
    document.querySelectorAll('#projectList .list-item').forEach(item => {
        const proj = {
            title: item.querySelector('[data-field="title"]').value,
            languages: item.querySelector('[data-field="languages"]').value.split(',').map(s => s.trim()).filter(Boolean),
            bullets: [],
        };
        item.querySelectorAll('.bullet-item').forEach(bullet => {
            const text = bullet.querySelector('[data-field="text"]').value;
            const imp = parseFloat(bullet.querySelector('[data-field="impressiveness"]').value) || 0.5;
            if (text) proj.bullets.push({ text, impressiveness: imp });
        });
        if (proj.title) resume.projects.push(proj);
    });

    // Skills
    const langs = document.getElementById('languages').value;
    resume.languages = langs.split(',').map(s => s.trim()).filter(Boolean).map(text => ({ text }));

    const techs = document.getElementById('technologies').value;
    resume.technologies = techs.split(',').map(s => s.trim()).filter(Boolean).map(text => ({ text }));

    return resume;
}

// === Generate Preview ===
async function generatePreview() {
    const resumeData = collectFormData();
    const jobDescription = document.getElementById('jobDescription').value;

    if (!jobDescription) {
        alert('Please enter a job description');
        return;
    }

    const previewEl = document.getElementById('preview');
    previewEl.innerHTML = '<p class="placeholder-text"><span class="loading"></span> Generating preview...</p>';

    try {
        const response = await fetch(`${API_BASE}/tailor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume: resumeData,
                job_description: jobDescription,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to tailor resume');
        }

        tailoredResume = await response.json();
        renderPreview(tailoredResume);

        // Enable download buttons
        document.getElementById('downloadPdfBtn').disabled = false;
        document.getElementById('downloadLatexBtn').disabled = false;

    } catch (error) {
        previewEl.innerHTML = `<p class="placeholder-text" style="color: var(--danger);">Error: ${error.message}</p>`;
    }
}

// === Render Preview ===
function renderPreview(resume) {
    const previewEl = document.getElementById('preview');

    let html = `
        <div class="preview-header">
            <h1>${resume.full_name || 'Your Name'}</h1>
            <p class="preview-contact">
                ${[resume.contacts?.phone, resume.contacts?.email, resume.contacts?.github, resume.contacts?.linkedin]
                    .filter(Boolean).join(' | ')}
            </p>
        </div>
    `;

    // Education
    if (resume.education?.length) {
        html += '<h3 class="preview-section-title">Education</h3>';
        resume.education.forEach(edu => {
            html += `
                <div class="preview-entry">
                    <div class="preview-entry-header">
                        <span>${edu.est_name || ''}</span>
                        <span>${edu.location || ''}</span>
                    </div>
                    <div class="preview-entry-subtitle">
                        <span>${edu.degree || ''}${edu.gpa ? `, GPA: ${edu.gpa}` : ''}</span>
                        <span>${edu.year || ''}</span>
                    </div>
                </div>
            `;
        });
    }

    // Experience
    if (resume.experience?.length) {
        html += '<h3 class="preview-section-title">Experience</h3>';
        resume.experience.forEach(exp => {
            html += `
                <div class="preview-entry">
                    <div class="preview-entry-header">
                        <span>${exp.employer || ''}</span>
                        <span>${exp.location || ''}</span>
                    </div>
                    <div class="preview-entry-subtitle">
                        <span>${exp.title || ''}</span>
                        <span>${exp.duration || ''}</span>
                    </div>
                    <ul class="preview-bullets">
                        ${(exp.bullets || []).map(b => `<li>${b.text}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }

    // Projects
    if (resume.projects?.length) {
        html += '<h3 class="preview-section-title">Projects</h3>';
        resume.projects.forEach(proj => {
            html += `
                <div class="preview-entry">
                    <div class="preview-entry-header">
                        <span><strong>${proj.title || ''}</strong> | <em>${(proj.languages || []).join(', ')}</em></span>
                    </div>
                    <ul class="preview-bullets">
                        ${(proj.bullets || []).map(b => `<li>${b.text}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }

    // Skills
    const languages = (resume.languages || []).map(l => l.text).join(', ');
    const technologies = (resume.technologies || []).map(t => t.text).join(', ');
    if (languages || technologies) {
        html += '<h3 class="preview-section-title">Skills</h3>';
        html += '<div class="preview-skills">';
        if (languages) html += `<p><strong>Languages:</strong> ${languages}</p>`;
        if (technologies) html += `<p><strong>Technologies:</strong> ${technologies}</p>`;
        html += '</div>';
    }

    previewEl.innerHTML = html;
}

// === Download PDF ===
async function downloadPDF() {
    if (!tailoredResume) return;

    const template = document.getElementById('template').value;

    try {
        const response = await fetch(`${API_BASE}/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume: tailoredResume,
                template: template,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate PDF');
        }

        const blob = await response.blob();
        downloadBlob(blob, 'resume.pdf');

    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// === Download LaTeX ===
async function downloadLatex() {
    if (!tailoredResume) return;

    const template = document.getElementById('template').value;

    try {
        const response = await fetch(`${API_BASE}/export/latex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume: tailoredResume,
                template: template,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate LaTeX');
        }

        const text = await response.text();
        const blob = new Blob([text], { type: 'text/plain' });
        downloadBlob(blob, 'resume.tex');

    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// === Helper: Download Blob ===
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
