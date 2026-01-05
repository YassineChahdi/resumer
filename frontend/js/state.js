// Global State

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export let supabaseClient = null;
export let currentUser = null;
export let currentResumeId = null;
export let currentResumeName = null;
export let tailoredResume = null;
export let currentResumeType = 'general';
export let sectionStates = { edu: true, exp: true, proj: true, cert: true, vol: true };
export let cachedResumes = []; // Moved from global scope of loadResumes

export const resumeData = {
    full_name: '',
    contacts: { phone: '', email: '', github: '', linkedin: '' },
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    volunteer: [],
    spoken_languages: [],      
    technical_skills: [],      
    programming_languages: [], 
    technologies: []           
};

// State Setters
export function setSupabaseClient(client) { supabaseClient = client; }
export function setCurrentUser(user) { currentUser = user; }
export function setCurrentResumeId(id) { currentResumeId = id; }
export function setCurrentResumeName(name) { currentResumeName = name; }
export function setTailoredResume(resume) { tailoredResume = resume; }
export function setCurrentResumeType(type) { currentResumeType = type; }
export function setSectionStates(states) { 
    // Reassign properties to preserve reference if exported as const? 
    // sectionStates is let, so reassignment works for internal logic, but exports are live bindings?
    // Yes, 'export let' creates live binding.
    sectionStates = states; 
}
export function setCachedResumes(resumes) { cachedResumes = resumes; }

// Resume Data Helper to reset/replace
export function resetResumeData(newData = {}) {
    // Clear all keys
    for (const key in resumeData) delete resumeData[key];
    
    // Default structure if not provided fully
    const defaults = {
        full_name: '',
        contacts: { phone: '', email: '', github: '', linkedin: '' },
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        volunteer: [],
        spoken_languages: [],      
        technical_skills: [],      
        programming_languages: [], 
        technologies: []  
    };
    
    // Assign defaults then overrides
    Object.assign(resumeData, defaults, newData);
}

export function updateResumeData(partialData) {
    Object.assign(resumeData, partialData);
}
