import { STORAGE_KEY, SECTION_STATES_KEY } from './config.js';
import { resumeData, sectionStates, setSectionStates, currentResumeType } from './state.js';
import { debounce } from './utils.js';

const SAVED_RESUMES_KEY = 'saved_resumes_list';

// --- Single (Working Copy) Persistence ---

export function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
}

export function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            // resetResumeData(data) should be used if imported, but avoiding circular dep?
            // storage.js imports state.js. state.js doesn't import storage.js.
            // We can just Object.assign here as before, or use resetResumeData if available.
            // state.js DOES export resetResumeData. Use it?
            // "import { ... } from './state.js'" 
            // We need to change the import above to include resetResumeData if we use it.
            // But let's stick to Object.assign for now to be safe or update imports.
            Object.assign(resumeData, data);
        } catch (e) { console.warn('Failed to load from localStorage'); }
    }
    const states = localStorage.getItem(SECTION_STATES_KEY);
    if (states) {
        try { 
            const parsed = JSON.parse(states);
            Object.assign(sectionStates, parsed);
        } catch (e) {}
    }
}

export function saveSectionStates() {
    localStorage.setItem(SECTION_STATES_KEY, JSON.stringify(sectionStates));
}

export const debouncedSave = debounce(saveToStorage, 300);


// --- Saved Resumes List Management (LocalDB) ---

export function getSavedResumes() {
    try {
        const stored = localStorage.getItem(SAVED_RESUMES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
}

export function saveResume(name) {
    const saved = getSavedResumes();
    const now = new Date().toISOString();
    
    // Always create NEW snapshot
    // Ensure unique name
    let uniqueName = name;
    let counter = 1;
    // Check if name exists in saved list
    while (saved.some(r => r.name === uniqueName)) {
        uniqueName = `${name} (${counter++})`;
    }
    
    const resumeToSave = {
        id: crypto.randomUUID(),
        name: uniqueName,
        type: currentResumeType, // Save current type
        data: JSON.parse(JSON.stringify(resumeData)), // Deep copy
        updated: now
    };

    saved.unshift(resumeToSave); // Add to top
    localStorage.setItem(SAVED_RESUMES_KEY, JSON.stringify(saved));
    return resumeToSave;
}

export function loadResume(id) {
    const saved = getSavedResumes();
    const resume = saved.find(r => r.id === id);
    if (resume) {
        return resume.data;
    }
    return null;
}

export function deleteResume(id) {
    let saved = getSavedResumes();
    saved = saved.filter(r => r.id !== id);
    localStorage.setItem(SAVED_RESUMES_KEY, JSON.stringify(saved));
}

export function renameResume(id, newName) {
    const saved = getSavedResumes();
    const resume = saved.find(r => r.id === id);
    if (resume) {
        resume.name = newName;
        resume.updated = new Date().toISOString();
        localStorage.setItem(SAVED_RESUMES_KEY, JSON.stringify(saved));
        return true;
    }
    return false;
}
