// Storage Logic

import { STORAGE_KEY, SECTION_STATES_KEY } from './config.js';
import { resumeData, sectionStates, setSectionStates } from './state.js';
import { debounce } from './utils.js';

export function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
}

export function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
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
