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
    resetResumeData,
    supabaseClient
} from './state.js';
import { syncFromForm, renderForm } from './form.js';
import { setResumeType } from './resumeType.js';
import { prepareApiData, renderPreview, clearPreview } from './api.js';
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
        <div class="resume-item" data-id="${r.id}" onclick="loadCloudResume('${r.id}')">
            <span>${r.name}</span>
            <div class="resume-actions">
                <button class="btn-icon" title="Rename" onclick="event.stopPropagation(); renameCloudResume('${r.id}')"><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-remove" title="Delete" onclick="event.stopPropagation(); deleteCloudResume('${r.id}')"><span class="material-symbols-outlined">delete</span></button>
            </div>
        </div>
    `).join('');
}

export async function renameCloudResume(id) {
    const resume = cachedResumes.find(r => r.id === id);
    if (!resume) return;

    const newName = await showPrompt('Rename resume:', resume.name);
    if (!newName || newName === resume.name) return;

    try {
        const { error } = await supabaseClient
            .from('resumes')
            .update({ name: newName })
            .eq('id', id);

        if (error) throw error;
        
        // Update local cache immediately for potential UI responsiveness
        const idx = cachedResumes.findIndex(r => r.id === id);
        if (idx !== -1) cachedResumes[idx].name = newName;
        
        // Also update current resume name if it's the one loaded
        if (currentResumeId === id) {
            setCurrentResumeName(newName);
            const nameInput = document.getElementById('resumeName');
            if (nameInput) nameInput.value = newName;
        }

        showAlert('Resume renamed');
        loadResumes(); // Refresh list to ensure consistency
    } catch (e) {
        showAlert('Failed to rename: ' + e.message);
    }
}

// Expose to window
window.renameCloudResume = renameCloudResume;

export async function saveToCloud() {
    syncFromForm();
    
    let defaultName = 'Untitled Resume';
    
    // Always prompt for name (as per user request)
    // Use input field value as default if available? NO, user requested strict 'Untitled Resume' fallback.
    // "fallback should always be "Untitled Resume" not loaded resume." -> This implies ignoring current loaded name.
    
    // However, if the user typed something into the input field *manually* before hitting save, maybe we should respect that?
    // "if none is given, there should be a default name for fallback."
    // I will interpret this as:
    // 1. If user typed in #resumeName input -> use that.
    // 2. If not -> use "Untitled Resume".
    // 3. NEVER use currentResumeName (the loaded resume's name).

    const nameInput = document.getElementById('resumeName');
    if (nameInput && nameInput.value.trim()) {
        defaultName = nameInput.value.trim();
    }

    const p = await showPrompt('Enter resume name:', defaultName);
    if (!p) return; // Cancelled
    let name = p; 
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
    
    // Always enforce unique name for new snapshot
    name = getUniqueName(name);
    if (nameInput) nameInput.value = name;
    
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
            full_resume: prepareApiData()
            // Note: tailored_resume intentionally not saved - each load starts fresh
        };
        
        // Snapshot Model: ALWAYS create new entry (POST)
        // Ignoring currentResumeId for update.
        // But do we want to support updating the SAME snapshot if we haven't changed name?
        // User requested: "Every save operation should create a new...".
        // OK, adhering to strict snapshot model.
        
        let res = await fetch(`${API_BASE}/resumes`, {
            method: 'POST',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        /* 
           Legacy Update Logic (Disabled for Snapshot Model)
        if (currentResumeId) {
             res = await fetch(`${API_BASE}/resumes/${currentResumeId}`, ... PUT ...);
        } else { ... POST ... }
        */
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const detail = errData.detail ? (typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail)) : 'Failed to save';
            throw new Error(detail);
        }
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
            
            // Set data (Strict replacement, no merging with previous state)
            const newData = {
                full_name: fr.full_name || '',
                contacts: { ...{ phone: '', email: '', github: '', linkedin: '' }, ...(fr.contacts || {}) },
                education: fr.education || [],
                experience: fr.experience || [],
                projects: fr.projects || [],
                volunteer: fr.volunteer || [],
                certifications: fr.certifications || [],
                spoken_languages: fr.spoken_languages || [],
                technical_skills: fr.technical_skills || [],
                programming_languages: fr.programming_languages || [],
                technologies: fr.technologies_tech || []
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
            
            // Determine Type
            let targetType = 'general';
            if (resume.resume_type) {
                targetType = resume.resume_type;
            } else {
                // Guess based on content
                if ((newData.volunteer && newData.volunteer.length > 0) || (newData.certifications && newData.certifications.length > 0)) {
                    targetType = 'general';
                } else {
                    targetType = 'tech';
                }
            }
            
            setResumeType(targetType, true);

            // REPLACE global resumeData
            resetResumeData(newData);
            
            renderForm();
            saveToStorage();
        }
        
        if (resume.tailored_resume) {
            setTailoredResume(resume.tailored_resume);
            renderPreview(resume.tailored_resume);
            const p = document.getElementById('btnPdf');
            const l = document.getElementById('btnLatex');
            if(p) p.disabled = false;
            if(l) l.disabled = false;
        } else {
            // Clear preview when loading resume without tailored version
            clearPreview();
        }
        
        if (container) container.innerHTML = originalContent;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const formSection = document.querySelector('.form-section');
        if (formSection) formSection.scrollTo({ top: 0, behavior: 'smooth' });
        
        showAlert(`Resume "${resume.name}" loaded`);
        
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
        showAlert('Resume deleted');
    } catch (e) {
        showAlert('Failed to delete: ' + e.message);
    }
}
