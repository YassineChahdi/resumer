// Form Rendering & Logic

import { resumeData, sectionStates, currentResumeType, resetResumeData, setTailoredResume } from './state.js';
import { debouncedSave, saveSectionStates, saveToStorage } from './storage.js';
import { itemHtml, certItemHtml, volItemHtml, eduFields, expFields, projFields } from './components.js';
import { setResumeType } from './resumeType.js';
import { showConfirm, showAlert } from './ui.js';

export function renderForm() {
    // Personal
    const elFullname = document.getElementById('fullName');
    if (elFullname) elFullname.value = resumeData.full_name;
    const elPhone = document.getElementById('phone');
    if (elPhone) elPhone.value = resumeData.contacts.phone;
    const elEmail = document.getElementById('email');
    if (elEmail) elEmail.value = resumeData.contacts.email;
    const elGithub = document.getElementById('github');
    if (elGithub) elGithub.value = resumeData.contacts.github;
    const elLinkedin = document.getElementById('linkedin');
    if (elLinkedin) elLinkedin.value = resumeData.contacts.linkedin;

    // Education
    const eduList = document.getElementById('educationList');
    if (eduList) {
        eduList.innerHTML = resumeData.education.length ? '' : itemHtml('edu', 0, eduFields(), false, [], false);
        resumeData.education.forEach((e, i) => eduList.innerHTML += itemHtml('edu', i, eduFields(e), false, [], resumeData.education.length > 1));
    }

    // Experience
    const expList = document.getElementById('experienceList');
    if (expList) {
        expList.innerHTML = resumeData.experience.length ? '' : itemHtml('exp', 0, expFields(), true, [], false);
        resumeData.experience.forEach((e, i) => expList.innerHTML += itemHtml('exp', i, expFields(e), true, e.bullets, resumeData.experience.length > 1));
    }

    // Projects
    const projList = document.getElementById('projectList');
    if (projList) {
        projList.innerHTML = resumeData.projects.length ? '' : itemHtml('proj', 0, projFields(), true, [], false);
        resumeData.projects.forEach((p, i) => projList.innerHTML += itemHtml('proj', i, projFields(p), true, p.bullets, resumeData.projects.length > 1));
    }

    // Certifications
    const certList = document.getElementById('certificationList');
    if (certList) {
        certList.innerHTML = resumeData.certifications.length ? '' : certItemHtml(0, {}, false);
        resumeData.certifications.forEach((c, i) => certList.innerHTML += certItemHtml(i, c, resumeData.certifications.length > 1));
    }

    // Volunteer Work
    const volList = document.getElementById('volunteerList');
    if (volList) {
        volList.innerHTML = resumeData.volunteer.length ? '' : volItemHtml(0, {}, false);
        resumeData.volunteer.forEach((v, i) => volList.innerHTML += volItemHtml(i, v, resumeData.volunteer.length > 1));
    }

    // Skills
    const elLang = document.getElementById('languages');
    const elTech = document.getElementById('technologies');
    if (elLang && elTech) {
        if (currentResumeType === 'general') {
            elLang.value = resumeData.spoken_languages.join(', ');
            elTech.value = resumeData.technical_skills.join(', ');
        } else {
            elLang.value = resumeData.programming_languages.join(', ');
            elTech.value = resumeData.technologies.join(', ');
        }
    }
    
    // Apply section toggle states
    applyAllToggleStates();
}

export function syncFromForm() {
    const elFullname = document.getElementById('fullName');
    // Guard against form not loaded (e.g. if called early)
    if (!elFullname) return;

    resumeData.full_name = elFullname.value;
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
    }));

    resumeData.experience = [...document.querySelectorAll('#experienceList .list-item')].map(el => ({
        employer: el.querySelector('[data-field="employer"]').value,
        location: el.querySelector('[data-field="location"]').value,
        title: el.querySelector('[data-field="title"]').value,
        duration: el.querySelector('[data-field="duration"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => {
            const impVal = b.querySelector('[data-field="impressiveness"]').value.trim();
            return {
                text: b.querySelector('[data-field="text"]').value,
                impressiveness: impVal === '' ? null : Math.min(1, Math.max(0, parseFloat(impVal) || 0))
            };
        }).filter(b => b.text || b.impressiveness != null)
    }));

    resumeData.projects = [...document.querySelectorAll('#projectList .list-item')].map(el => ({
        title: el.querySelector('[data-field="title"]').value,
        languages: el.querySelector('[data-field="languages"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => {
            const impVal = b.querySelector('[data-field="impressiveness"]').value.trim();
            return {
                text: b.querySelector('[data-field="text"]').value,
                impressiveness: impVal === '' ? null : Math.min(1, Math.max(0, parseFloat(impVal) || 0))
            };
        }).filter(b => b.text || b.impressiveness != null)
    }));

    resumeData.certifications = [...document.querySelectorAll('#certificationList .list-item')].map(el => ({
        name: el.querySelector('[data-field="name"]').value,
        issuer: el.querySelector('[data-field="issuer"]').value,
        date: el.querySelector('[data-field="date"]').value
    }));

    resumeData.volunteer = [...document.querySelectorAll('#volunteerList .list-item')].map(el => ({
        organization: el.querySelector('[data-field="organization"]').value,
        location: el.querySelector('[data-field="location"]').value,
        title: el.querySelector('[data-field="title"]').value,
        duration: el.querySelector('[data-field="duration"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => {
            const impVal = b.querySelector('[data-field="impressiveness"]').value.trim();
            return {
                text: b.querySelector('[data-field="text"]').value,
                impressiveness: impVal === '' ? null : Math.min(1, Math.max(0, parseFloat(impVal) || 0))
            };
        }).filter(b => b.text || b.impressiveness != null)
    }));

    // Skills
    const langValues = document.getElementById('languages').value.split(',').map(s => s.trim()).filter(Boolean);
    const techValues = document.getElementById('technologies').value.split(',').map(s => s.trim()).filter(Boolean);
    
    if (currentResumeType === 'general') {
        resumeData.spoken_languages = langValues;
        resumeData.technical_skills = techValues;
    } else {
        resumeData.programming_languages = langValues;
        resumeData.technologies = techValues;
    }
    debouncedSave();
}

// Item Management
export function addItem(type) {
    syncFromForm();
    const arr = { edu: resumeData.education, exp: resumeData.experience, proj: resumeData.projects, cert: resumeData.certifications, vol: resumeData.volunteer }[type];
    if (type === 'edu') arr.push({ est_name: '', location: '', degree: '', year: '', gpa: '' });
    else if (type === 'exp') arr.push({ employer: '', location: '', title: '', duration: '', bullets: [{ text: '', impressiveness: null }] });
    else if (type === 'cert') arr.push({ name: '', issuer: '', date: '' });
    else if (type === 'vol') arr.push({ organization: '', location: '', title: '', duration: '', bullets: [{ text: '', impressiveness: null }] });
    else arr.push({ title: '', languages: '', bullets: [{ text: '', impressiveness: null }] });
    renderForm();
}

export function removeItem(type, idx) {
    syncFromForm();
    const arr = { edu: resumeData.education, exp: resumeData.experience, proj: resumeData.projects, cert: resumeData.certifications, vol: resumeData.volunteer }[type];
    arr.splice(idx, 1);
    renderForm();
}

export function addBullet(type, idx) {
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects, vol: resumeData.volunteer }[type];
    arr[idx].bullets.push({ text: '', impressiveness: null });
    renderForm();
}

export function removeBullet(type, idx, bi) {
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects, vol: resumeData.volunteer }[type];
    arr[idx].bullets.splice(bi, 1);
    if (arr[idx].bullets.length === 0) arr[idx].bullets.push({ text: '', impressiveness: null });
    renderForm();
}

// Clear Functions
export async function clearSection(type) {
    const labels = { edu: 'Education', exp: 'Experience', proj: 'Projects', cert: 'Certifications', vol: 'Volunteer Work' };
    if (!await showConfirm(`Clear all ${labels[type]} entries?`)) return;
    syncFromForm();
    if (type === 'edu') resumeData.education = [];
    else if (type === 'exp') resumeData.experience = [];
    else if (type === 'cert') resumeData.certifications = [];
    else if (type === 'vol') resumeData.volunteer = [];
    else resumeData.projects = [];
    saveToStorage();
    renderForm();
}

export async function clearAll() {
    if (!await showConfirm('Clear entire resume? This cannot be undone.')) return;
    
    // Hard reset
    const { resetResumeData, setTailoredResume } = await import('./state.js');
    resetResumeData();
    setTailoredResume(null);
    
    saveToStorage();
    renderForm();
    
    document.getElementById('btnPdf').disabled = true;
    document.getElementById('btnLatex').disabled = true;
    document.getElementById('preview').innerHTML = 'Fill in your resume and click Preview.';
}

// Toggle Section
export function toggleSection(type) {
    sectionStates[type] = !sectionStates[type];
    saveSectionStates();
    applyToggleState(type);
}

function applyToggleState(type) {
    const listId = { edu: 'educationList', exp: 'experienceList', proj: 'projectList', cert: 'certificationList', vol: 'volunteerList' }[type];
    const list = document.getElementById(listId);
    const btn = document.querySelector(`[data-toggle="${type}"]`);
    if (list) list.style.display = sectionStates[type] ? '' : 'none';
    if (btn) btn.textContent = sectionStates[type] ? '▼' : '▶';
}

export function applyAllToggleStates() {
    ['edu', 'exp', 'proj', 'cert', 'vol'].forEach(applyToggleState);
}

// Load JSON
export function loadFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Clear existing data first
            resetResumeData();

            // Populate fresh
            resumeData.full_name = data.full_name || '';
            resumeData.contacts = { ...resumeData.contacts, ...data.contacts };
            resumeData.education = (data.education || []).map(e => ({
                est_name: e.est_name || '', location: e.location || '',
                degree: e.degree || '', year: e.year || '', gpa: e.gpa || ''
            }));
            resumeData.experience = (data.experience || []).map(e => ({
                employer: e.employer || '', location: e.location || '',
                title: e.title || '', duration: e.duration || '',
                bullets: (e.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? null }))
            }));
            resumeData.projects = (data.projects || []).map(p => ({
                title: p.title || '',
                languages: Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages || ''),
                bullets: (p.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? null }))
            }));
            resumeData.volunteer = (data.volunteer || []).map(v => ({
                organization: v.organization || '', location: v.location || '',
                title: v.title || '', duration: v.duration || '',
                bullets: (v.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? null }))
            }));
            resumeData.certifications = (data.certifications || []).map(c => ({
                name: c.name || '', issuer: c.issuer || '', date: c.date || ''
            }));
            
            // Handle new separated skill fields with backward compatibility
            const extractSkills = (arr) => (arr || []).map(l => typeof l === 'string' ? l : l.text || '');
            const savedLangs = extractSkills(data.languages);
            const savedTechs = extractSkills(data.technologies);
            
            if (data.spoken_languages || data.programming_languages) {
                resumeData.spoken_languages = data.spoken_languages || [];
                resumeData.technical_skills = data.technical_skills || [];
                resumeData.programming_languages = data.programming_languages || [];
                resumeData.technologies = data.technologies_tech || [];
            } else {
                if (resumeData.volunteer.length > 0 || resumeData.certifications.length > 0) {
                    resumeData.spoken_languages = savedLangs;
                    resumeData.technical_skills = savedTechs;
                    resumeData.programming_languages = [];
                    resumeData.technologies = [];
                } else {
                    resumeData.spoken_languages = [];
                    resumeData.technical_skills = [];
                    resumeData.programming_languages = savedLangs;
                    resumeData.technologies = savedTechs;
                }
            }
            
            // Auto-switch resume type
            if (resumeData.volunteer.length > 0 || resumeData.certifications.length > 0) {
                setResumeType('general', true);
            } else {
                setResumeType('tech', true);
            }
            
            renderForm();
            
            // Clear preview since we're loading fresh data
            setTailoredResume(null);
            document.getElementById('preview').innerHTML = 'Fill in your resume and click Generate.';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const formSection = document.querySelector('.form-section');
            if (formSection) formSection.scrollTo({ top: 0, behavior: 'smooth' });
            
            showAlert('Resume loaded from JSON');
        } catch (err) { showAlert('Invalid JSON'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Clamp functions for inputs
export function clampImpressiveness(input) {
    let val = parseFloat(input.value);
    if (isNaN(val) || input.value.trim() === '') {
        input.value = '';
    } else {
        input.value = Math.min(1, Math.max(0, val));
    }
    syncFromForm();
}

export function clampGpa(input) {
    let val = parseFloat(input.value);
    if (isNaN(val) || input.value.trim() === '') {
        input.value = '';
    } else {
        input.value = Math.max(0, val);
    }
    syncFromForm();
}
