// Cloud Resume Operations

import { API_BASE } from './config.js';
import { 
    getAuthHeader, updateAuthUI // updateAuthUI needed? No.
} from './auth.js';
import { 
    cachedResumes, setCachedResumes, 
    currentResumeId, setCurrentResumeId, 
    currentResumeName, setCurrentResumeName,
    currentResumeType, 
    resumeData, updateResumeData, tailoredResume, setTailoredResume,
    resetResumeData
} from './state.js';
import { syncFromForm, renderForm } from './form.js';
import { setResumeType } from './resumeType.js';
import { prepareApiData, renderPreview } from './api.js'; // Will be created
import { saveToStorage } from './storage.js';
import { showAlert, showConfirm, showPrompt } from './ui.js';

export async function loadResumes() {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    
    // Show loading state
    const list = document.getElementById('resumesList');
    if (list) list.innerHTML = 'Loading...';
    
    try {
        const res = await fetch(`${API_BASE}/resumes`, { headers: authHeader });
        if (!res.ok) throw new Error('Failed to load resumes');
        const data = await res.json();
        setCachedResumes(data.resumes || []);
        renderResumesList(data.resumes || []);
    } catch (e) {
        console.error('Failed to load resumes:', e);
        if (list) list.innerHTML = 'Failed to load resumes.';
    }
}

export function getUniqueName(baseName) {
    const existingNames = cachedResumes.map(r => r.name);
    if (!existingNames.includes(baseName)) return baseName;
    
    let counter = 1;
    let uniqueName = `${baseName} (${counter})`;
    while (existingNames.includes(uniqueName)) {
        counter++;
        uniqueName = `${baseName} (${counter})`;
    }
    return uniqueName;
}

export function renderResumesList(resumes) {
    const container = document.getElementById('resumesList');
    if (!container) return;
    
    if (!resumes.length) {
        container.innerHTML = 'No saved resumes. Save your first resume!';
        return;
    }
    container.innerHTML = resumes.map(r => `
        <div class="resume-item" data-id="${r.id}">
            <span onclick="loadCloudResume('${r.id}')">${r.name}</span>
            <button class="btn-remove" onclick="deleteCloudResume('${r.id}')">×</button>
        </div>
    `).join('');
}

export async function saveToCloud() {
    syncFromForm();
    
    let name = currentResumeName || 'Untitled Resume';
    // Logic deviation: Use prompt if new resume or just to confirm
    // Original used input field. If input field missed, I use prompt.
    const nameInput = document.getElementById('resumeName');
    if (nameInput) {
        name = nameInput.value.trim() || name;
    } else if (!currentResumeId) {
        // If no input field and new resume, prompt
        const p = showPrompt('Enter resume name:', name);
        if (!p) return; // Cancelled
        name = p;
    }
    // If existing resume, we keep name unless prompt? 
    // Without input field, we need a way to rename. "Save As" button?
    // For now, assume simple save updates existing name.
    
    const authHeader = await getAuthHeader();
    if (!authHeader) {
        showAlert('Please login first');
        return;
    }
    
    // Check "Save As" condition (name changed from loaded)
    if (currentResumeId && currentResumeName && name !== currentResumeName) {
        setCurrentResumeId(null); // Treat as new
    }
    
    // Unique name check for new
    if (!currentResumeId) {
        name = getUniqueName(name);
        if (nameInput) nameInput.value = name;
    }
    
    // UI Loading state
    // We check for button with saveToCloud onclick
    const saveBtn = document.querySelector('[onclick="saveToCloud()"]') || document.getElementById('btnSaveCloud');
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }
    
    try {
        const body = {
            name,
            resume_type: currentResumeType,
            full_resume: prepareApiData(),
            tailored_resume: tailoredResume
        };
        
        let res;
        if (currentResumeId) {
            // Update
            res = await fetch(`${API_BASE}/resumes/${currentResumeId}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            // Create
            res = await fetch(`${API_BASE}/resumes`, {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        
        if (!res.ok) throw new Error('Failed to save');
        const data = await res.json();
        if (data.resume?.id) {
            setCurrentResumeId(data.resume.id);
            setCurrentResumeName(data.resume.name);
        }
        showAlert('Resume saved!');
        loadResumes();
    } catch (e) {
        showAlert('Failed to save: ' + e.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}

export async function loadCloudResume(id) {
    // Need to handle both string ID and event? No, logic passes string ID.
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    
    const container = document.getElementById('resumesList');
    const originalContent = container ? container.innerHTML : '';
    if (container) container.innerHTML = 'Loading resume...';
    
    try {
        const res = await fetch(`${API_BASE}/resumes/${id}`, { headers: authHeader });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const resume = data.resume;
        
        setCurrentResumeId(resume.id);
        setCurrentResumeName(resume.name);
        
        const nameInput = document.getElementById('resumeName');
        if (nameInput) nameInput.value = resume.name || '';
        
        if (resume.full_resume) {
            const fr = resume.full_resume;
            
            // Extract .text logic
            const extractSkills = (arr) => (arr || []).map(l => typeof l === 'string' ? l : l.text || '');
            const savedLangs = extractSkills(fr.languages);
            const savedTechs = extractSkills(fr.technologies);
            
            // Set data
            const newData = {
                full_name: fr.full_name || resumeData.full_name,
                contacts: { ...resumeData.contacts, ...(fr.contacts || {}) },
                education: fr.education || [],
                experience: fr.experience || [],
                projects: fr.projects || [],
                volunteer: fr.volunteer || [],
                certifications: fr.certifications || [],
                spoken_languages: fr.spoken_languages || [],
                technical_skills: fr.technical_skills || [],
                programming_languages: fr.programming_languages || [],
                technologies: fr.technologies_tech || resumeData.technologies || []
            };
            
            // Backward compat
            if (!fr.spoken_languages && !fr.programming_languages && savedLangs.length > 0) {
                if (resume.resume_type === 'general') {
                    newData.spoken_languages = savedLangs;
                    newData.technical_skills = savedTechs;
                } else {
                    newData.programming_languages = savedLangs;
                    newData.technologies = savedTechs;
                }
            }
            
            // REPLACE global resumeData
            resetResumeData(newData);
            
            renderForm();
            saveToStorage();
        }
        
        // Load Type
        if (resume.resume_type) {
            setResumeType(resume.resume_type, true);
        } else {
            // Guess
            if (resumeData.volunteer.length > 0 || resumeData.certifications.length > 0) {
                setResumeType('general', true);
            } else {
                setResumeType('tech', true);
            }
        }
        
        if (resume.tailored_resume) {
            setTailoredResume(resume.tailored_resume);
            renderPreview(resume.tailored_resume);
            const p = document.getElementById('btnPdf');
            const l = document.getElementById('btnLatex');
            if(p) p.disabled = false;
            if(l) l.disabled = false;
        }
        
        if (container) container.innerHTML = originalContent;
        
    } catch (e) {
        showAlert('Failed to load resume: ' + e.message);
        if (container) container.innerHTML = originalContent;
    }
}

export async function deleteCloudResume(id) {
    if (!await showConfirm('Delete this resume from the cloud?')) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    
    try {
        const res = await fetch(`${API_BASE}/resumes/${id}`, { 
            method: 'DELETE', 
            headers: authHeader 
        });
        if (!res.ok) throw new Error('Failed to delete');
        if (currentResumeId === id) setCurrentResumeId(null);
        loadResumes();
    } catch (e) {
        showAlert('Failed to delete: ' + e.message);
    }
}
