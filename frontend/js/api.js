// API & Backend Interactions

import { API_BASE } from './config.js';
import { 
    currentResumeId, currentResumeType, cachedResumes,
    resumeData, tailoredResume, setTailoredResume
} from './state.js';
import { syncFromForm } from './form.js'; // Will be created
import { download, getDownloadFileName, scrollToPreviewOnMobile } from './utils.js';
import { showAlert } from './ui.js';

export function prepareApiData() {
    return {
        full_name: resumeData.full_name,
        contacts: resumeData.contacts,
        education: resumeData.education.filter(e => e.est_name || e.degree),
        experience: resumeData.experience.filter(e => e.employer || e.title).map(e => ({
            ...e,
            bullets: (e.bullets || []).filter(b => b.text)
        })),
        projects: currentResumeType === 'general' ? [] : resumeData.projects.filter(p => p.title).map(p => ({ 
            ...p, 
            languages: p.languages.split(',').map(s => s.trim()).filter(Boolean),
            bullets: (p.bullets || []).filter(b => b.text)
        })),
        volunteer: currentResumeType === 'tech' ? [] : resumeData.volunteer.filter(v => v.title || v.organization).map(v => ({
            ...v,
            bullets: (v.bullets || []).filter(b => b.text)
        })),
        certifications: currentResumeType === 'tech' ? [] : resumeData.certifications.filter(c => c.name),
        // Use mode-specific skill fields
        languages: (currentResumeType === 'general' ? resumeData.spoken_languages : resumeData.programming_languages).map(l => ({ text: l })),
        technologies: (currentResumeType === 'general' ? resumeData.technical_skills : resumeData.technologies).map(t => ({ text: t }))
    };
}

export async function generatePreview() {
    syncFromForm();
    const preview = document.getElementById('preview');
    
    // Import isResumeEmpty here from form.js? Circular?
    // Or move isResumeEmpty to utils? It depends on resumeData.
    // I can stick to checking resumeData directly or import logic.
    // Importing from form.js is safe as api.js is called late (on click).
    // I'll assume isResumeEmpty is exported from form.js/api.js?
    // Wait, isResumeEmpty depends on resumeData state.
    // I'll declare isResumeEmpty in api.js or import it.
    // I'll import it from form.js (if I put it there) or implement it here?
    // It's mostly logic. I'll put it in api.js to keep generatePreview self-contained?
    // Actually, `form.js` has `renderForm` which doesn't need `isResumeEmpty`.
    // But `main.js` might call it? No.
    // I'll implement `isResumeEmpty` here or import utils.
    // Let's implement helper here or check form.js logic.
    // I'll implement it here to avoid circular dep if form.js imports api.js (it does not? No, main imports api).
    
    // Check if empty
    if (isResumeEmptyLocal()) {
        const { PLACEHOLDER_RESUME_GENERAL, PLACEHOLDER_RESUME_TECH } = await import('./constants.js');
        setTailoredResume(currentResumeType === 'general' ? PLACEHOLDER_RESUME_GENERAL : PLACEHOLDER_RESUME_TECH);
        renderPreview(tailoredResume);
        scrollToPreviewOnMobile();
        return;
    }
    
    preview.innerHTML = '<span class="loading">Loading...</span>';

    try {
        const res = await fetch(`${API_BASE}/tailor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: prepareApiData(), job_description: document.getElementById('jobDescription').value })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const data = await res.json();
        setTailoredResume(data);
        renderPreview(data);
        scrollToPreviewOnMobile();
    } catch (e) {
        preview.innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }
}

function isResumeEmptyLocal() {
    return !resumeData.full_name &&
           !resumeData.contacts.phone && !resumeData.contacts.email && 
           !resumeData.contacts.github && !resumeData.contacts.linkedin &&
           resumeData.education.filter(e => e.est_name || e.degree).length === 0 &&
           resumeData.experience.filter(e => e.employer || e.title).length === 0 &&
           resumeData.projects.filter(p => p.title).length === 0 &&
           resumeData.volunteer.filter(v => v.title || v.organization).length === 0 &&
           resumeData.certifications.filter(c => c.name).length === 0 &&
           resumeData.spoken_languages.length === 0 && resumeData.technical_skills.length === 0 &&
           resumeData.programming_languages.length === 0 && resumeData.technologies.length === 0;
}

export function renderPreview(r) {
    let html = '';
    if (r.isPlaceholder) {
        html += '<div class="placeholder-banner">📋 Sample Resume</div>';
    }
    // Header: show name and contacts (skip if both are empty)
    const contacts = [r.contacts?.phone, r.contacts?.email, r.contacts?.github, r.contacts?.linkedin].filter(Boolean);
    if (r.full_name || contacts.length) {
        html += `<div class="preview-header">`;
        if (r.full_name) html += `<h2>${r.full_name}</h2>`;
        if (contacts.length) html += `<div>${contacts.join(' | ')}</div>`;
        html += `</div>`;
    }

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
    if (r.volunteer?.length) {
        html += '<div class="preview-section-title">Volunteer Work</div>';
        r.volunteer.forEach(v => html += `<div class="preview-entry">
            <div class="preview-entry-header"><span>${v.organization || ''}</span><span>${v.location || ''}</span></div>
            <div class="preview-entry-subtitle"><span>${v.title}</span><span>${v.duration || ''}</span></div>
            <ul class="preview-bullets">${(v.bullets || []).map(b => `<li>${b.text}</li>`).join('')}</ul></div>`);
    }
    if (r.certifications?.length) {
        html += '<div class="preview-section-title">Certifications</div>';
        r.certifications.forEach(c => html += `<div class="preview-entry">
            <div class="preview-entry-header"><span>${c.name}${c.issuer ? ' - ' + c.issuer : ''}</span><span>${c.date || ''}</span></div></div>`);
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

export async function downloadPdf(template, filename) {
    syncFromForm();
    const apiData = prepareApiData();
    const btn = document.getElementById('btnDoDownload');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Preparing...';
    try {
        const res = await fetch(`${API_BASE}/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume || apiData, template: template || 'jake' })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const finalName = filename && filename.trim() ? `${filename.trim()}.pdf` : getDownloadFileName('pdf');
        download(await res.blob(), finalName);
    } catch (e) { showAlert('Error: ' + e.message); }
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

export async function exportToLatex(template, filename) {
    syncFromForm();
    const apiData = prepareApiData();
    const btn = document.getElementById('btnDoDownload');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Preparing...';
    try {
        const res = await fetch(`${API_BASE}/export/latex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume || apiData, template: template || 'jake' })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const finalName = filename && filename.trim() ? `${filename.trim()}.tex` : getDownloadFileName('tex');
        download(new Blob([await res.text()], { type: 'text/plain' }), finalName);
    } catch (e) { showAlert('Error: ' + e.message); }
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

export function downloadJson(filename) {
    syncFromForm();
    const finalName = filename && filename.trim() ? `${filename.trim()}.json` : getDownloadFileName('json');
    download(new Blob([JSON.stringify(prepareApiData(), null, 2)], { type: 'application/json' }), finalName);
}
