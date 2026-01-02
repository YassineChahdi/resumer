// Configuration - auto-detect environment
// Development: localhost, 127.0.0.1, or file:// protocol
const IS_DEV = window.location.hostname === 'localhost' 
    || window.location.hostname === '127.0.0.1' 
    || window.location.hostname === ''  // file:// protocol
    || window.location.protocol === 'file:';
// Production: Update this URL after deploying backend to HuggingFace Spaces
const API_BASE = IS_DEV 
    ? 'http://localhost:8000'
    : 'https://jasonwastaken-resumer-api.hf.space';  // TODO: Replace with your HF Spaces URL

const STORAGE_KEY = 'resumeData';
const SECTION_STATES_KEY = 'sectionStates';

// Supabase config - loaded from config or defaults
const SUPABASE_URL = window.RESUMER_CONFIG?.SUPABASE_URL || 'https://yrfedqgzzrhxnozaopvf.supabase.co';
const SUPABASE_ANON_KEY = window.RESUMER_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZmVkcWd6enJoeG5vemFvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDMwMTUsImV4cCI6MjA4MjYxOTAxNX0.w9LoNN2Q-C-_5fUNDhgGgkbhQenQYeT3p14zGafAUEE';

// Initialize Supabase client
let supabaseClient = null;
let currentUser = null;
let currentResumeId = null; // Track which resume we're editing
let currentResumeName = null; // Track original name for "Save As" detection

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
let sectionStates = { edu: true, exp: true, proj: true }; // true = expanded

// === Debounce utility ===
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// === LocalStorage persistence ===
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
}

function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            Object.assign(resumeData, data);
        } catch (e) { console.warn('Failed to load from localStorage'); }
    }
    const states = localStorage.getItem(SECTION_STATES_KEY);
    if (states) {
        try { sectionStates = JSON.parse(states); } catch (e) {}
    }
}

function saveSectionStates() {
    localStorage.setItem(SECTION_STATES_KEY, JSON.stringify(sectionStates));
}

const debouncedSave = debounce(saveToStorage, 300);

// === Theme Toggle ===
const THEME_KEY = 'themeMode';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isLight = savedTheme === 'light';
    if (isLight) {
        document.body.classList.add('light-mode');
    }
    updateThemeIcon(isLight);
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
}

function updateThemeIcon(isLight) {
    const btn = document.getElementById('themeToggle');
    // Show sun in dark mode (to switch to light), moon in light mode (to switch to dark)
    if (btn) btn.textContent = isLight ? '🌙' : '☀️';
}

// === Resume Type Toggle ===
const RESUME_TYPE_KEY = 'resumeType';
let currentResumeType = 'general'; // Default to general

function initResumeType() {
    const savedType = localStorage.getItem(RESUME_TYPE_KEY);
    if (savedType === 'general' || savedType === 'tech') {
        currentResumeType = savedType;
    }
    applyResumeType();
}

function setResumeType(type) {
    currentResumeType = type;
    localStorage.setItem(RESUME_TYPE_KEY, type);
    applyResumeType();
}

function applyResumeType() {
    const btnGeneral = document.getElementById('btnGeneral');
    const btnTech = document.getElementById('btnTech');
    const languagesInput = document.getElementById('languages');
    const technologiesInput = document.getElementById('technologies');
    const languagesTooltip = document.getElementById('languagesTooltip');
    const technologiesTooltip = document.getElementById('technologiesTooltip');
    
    // Update button states
    if (btnGeneral && btnTech) {
        btnGeneral.classList.toggle('active', currentResumeType === 'general');
        btnTech.classList.toggle('active', currentResumeType === 'tech');
    }
    
    // Update labels and tooltips based on mode
    if (currentResumeType === 'general') {
        if (languagesInput) languagesInput.placeholder = 'Skills';
        if (technologiesInput) technologiesInput.placeholder = 'Tools & Software';
        if (languagesTooltip) languagesTooltip.textContent = 'Core skills: communication, leadership, etc.';
        if (technologiesTooltip) technologiesTooltip.textContent = 'Software and tools you use professionally';
    } else {
        if (languagesInput) languagesInput.placeholder = 'Programming Languages';
        if (technologiesInput) technologiesInput.placeholder = 'Technologies';
        if (languagesTooltip) languagesTooltip.textContent = 'Programming languages: Python, JS, etc.';
        if (technologiesTooltip) technologiesTooltip.textContent = 'Tools & frameworks: React, Docker, etc.';
    }
}

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initResumeType();
    loadFromStorage();
    renderForm();
    await initSupabase();
    initTooltipTouchHandling();
});

// === Tooltip Touch Handling (mobile tap-to-show) ===
function initTooltipTouchHandling() {
    // Use event delegation for dynamically created tooltips
    document.addEventListener('click', (e) => {
        const tooltipIcon = e.target.closest('.tooltip-icon');
        const tooltip = e.target.closest('.tooltip');
        
        if (tooltipIcon && tooltip) {
            // Clicked on a tooltip icon - toggle its active state
            e.preventDefault();
            e.stopPropagation();
            
            const wasActive = tooltip.classList.contains('tooltip-active');
            // Close any other open tooltips
            document.querySelectorAll('.tooltip-active').forEach(t => t.classList.remove('tooltip-active'));
            // Toggle this one
            if (!wasActive) {
                tooltip.classList.add('tooltip-active');
            }
        } else {
            // Clicked elsewhere - close all tooltips
            document.querySelectorAll('.tooltip-active').forEach(t => t.classList.remove('tooltip-active'));
        }
    });
}

// === Supabase Auth ===
async function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase not loaded');
        return;
    }
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in index.js');
        return;
    }
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            currentUser = session.user;
            updateAuthUI(true);
            loadResumes();
        } else {
            currentUser = null;
            updateAuthUI(false);
        }
    });
    
    // Check current session
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        updateAuthUI(true);
        loadResumes();
    }
}

function updateAuthUI(loggedIn) {
    document.getElementById('btnLogin').style.display = loggedIn ? 'none' : '';
    document.getElementById('userInfo').style.display = loggedIn ? '' : 'none';
    document.getElementById('myResumesSection').style.display = loggedIn ? '' : 'none';
    if (loggedIn && currentUser) {
        document.getElementById('userEmail').textContent = currentUser.email || 'Logged in';
    }
}

// Modal controls
let isSignupMode = false;

function showLoginModal() {
    isSignupMode = false;
    updateAuthModalUI();
    document.getElementById('loginModal').style.display = 'flex';
}

// Close modals when clicking outside the modal content
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') hideLoginModal();
    });
    document.getElementById('alertModal').addEventListener('click', (e) => {
        if (e.target.id === 'alertModal') hideAlert();
    });
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target.id === 'confirmModal') resolveConfirm(false);
    });
});

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
}

// Alert Modal functions
function showAlert(message) {
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'flex';
}

function hideAlert() {
    document.getElementById('alertModal').style.display = 'none';
}

// Confirm Modal functions
let confirmResolve = null;

function showConfirm(message) {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
    });
}

function resolveConfirm(result) {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmResolve) {
        confirmResolve(result);
        confirmResolve = null;
    }
}

function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    updateAuthModalUI();
}

function updateAuthModalUI() {
    document.getElementById('authModalTitle').textContent = isSignupMode ? 'Sign Up' : 'Log In';
    document.getElementById('authSubmitBtn').textContent = isSignupMode ? 'Sign Up' : 'Log In';
    document.getElementById('authToggleText').textContent = isSignupMode ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('authToggleLink').textContent = isSignupMode ? 'Log in' : 'Sign up';
}

async function submitAuth() {
    if (isSignupMode) {
        await signupWithEmail();
    } else {
        await loginWithEmail();
    }
}

// Email/Password Auth
async function loginWithEmail() {
    if (!supabaseClient) {
        showAlert('Supabase not configured');
        return;
    }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) {
        showAlert('Please enter email and password');
        return;
    }
    const btn = document.getElementById('authSubmitBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        hideLoginModal();
    } catch (e) {
        showAlert('Login failed: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function signupWithEmail() {
    if (!supabaseClient) {
        showAlert('Supabase not configured');
        return;
    }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) {
        showAlert('Please enter email and password');
        return;
    }
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters');
        return;
    }
    const btn = document.getElementById('authSubmitBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Signing up...';
    try {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        showAlert('Check your email for a confirmation link!');
        hideLoginModal();
    } catch (e) {
        showAlert('Signup failed: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Google OAuth
async function loginWithGoogle() {
    if (!supabaseClient) {
        showAlert('Supabase not configured');
        return;
    }
    await supabaseClient.auth.signInWithOAuth({ 
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
}

async function logout() {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) console.error('Logout error:', error);
    } catch (e) {
        console.error('Logout failed:', e);
    }
    // Clear Supabase session from localStorage
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    currentUser = null;
    currentResumeId = null;
    currentResumeName = null;
    cachedResumes = [];
    updateAuthUI(false);
    
    // Clear all fields
    resumeData = {
        full_name: '',
        contacts: { phone: '', email: '', github: '', linkedin: '' },
        education: [],
        experience: [],
        projects: [],
        languages: [],
        technologies: []
    };
    tailoredResume = null;
    localStorage.removeItem(STORAGE_KEY);
    renderForm();
    document.getElementById('preview').innerHTML = 'Fill in your resume and click Preview.';
    document.getElementById('btnPdf').disabled = true;
    document.getElementById('btnLatex').disabled = true;
}

// === Cloud Resume Management ===
async function getAuthHeader() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : null;
}

async function loadResumes() {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    
    // Show loading state
    document.getElementById('resumesList').innerHTML = 'Loading...';
    
    try {
        const res = await fetch(`${API_BASE}/resumes`, { headers: authHeader });
        if (!res.ok) throw new Error('Failed to load resumes');
        const data = await res.json();
        cachedResumes = data.resumes || [];
        renderResumesList(cachedResumes);
    } catch (e) {
        console.error('Failed to load resumes:', e);
        document.getElementById('resumesList').innerHTML = 'Failed to load resumes.';
    }
}

// Cache resumes list for duplicate name check
let cachedResumes = [];

function getUniqueName(baseName) {
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

function renderResumesList(resumes) {
    const container = document.getElementById('resumesList');
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

async function saveToCloud() {
    syncFromForm();
    let name = document.getElementById('resumeName').value.trim() || 'Untitled Resume';
    const authHeader = await getAuthHeader();
    if (!authHeader) {
        showAlert('Please login first');
        return;
    }
    
    // If name changed from the loaded resume, treat as "Save As" (create new)
    if (currentResumeId && currentResumeName && name !== currentResumeName) {
        currentResumeId = null;
    }
    
    // For new resumes, ensure unique name
    if (!currentResumeId) {
        name = getUniqueName(name);
        document.getElementById('resumeName').value = name;
    }
    
    // Find save button and show loading
    const saveBtn = document.querySelector('[onclick="saveToCloud()"]');
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }
    
    try {
        const body = {
            name,
            full_resume: prepareApiData(),
            tailored_resume: tailoredResume
        };
        
        let res;
        if (currentResumeId) {
            // Update existing
            res = await fetch(`${API_BASE}/resumes/${currentResumeId}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            // Create new
            res = await fetch(`${API_BASE}/resumes`, {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        
        if (!res.ok) throw new Error('Failed to save');
        const data = await res.json();
        if (data.resume?.id) currentResumeId = data.resume.id;
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

async function loadCloudResume(id) {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    
    // Show loading in resumes list
    const container = document.getElementById('resumesList');
    const originalContent = container.innerHTML;
    container.innerHTML = 'Loading resume...';
    
    try {
        const res = await fetch(`${API_BASE}/resumes/${id}`, { headers: authHeader });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const resume = data.resume;
        
        currentResumeId = resume.id;
        currentResumeName = resume.name;
        
        // Populate the save name field with the loaded resume's name
        document.getElementById('resumeName').value = resume.name || '';
        
        // Load full_resume into form (don't populate save name field)
        if (resume.full_resume) {
            const fr = resume.full_resume;
            resumeData = {
                full_name: fr.full_name || resumeData.full_name,
                contacts: { ...resumeData.contacts, ...(fr.contacts || {}) },
                education: fr.education || [],
                experience: fr.experience || [],
                projects: fr.projects || [],
                // Extract .text from skill objects if needed
                languages: (fr.languages || []).map(l => typeof l === 'string' ? l : l.text || ''),
                technologies: (fr.technologies || []).map(t => typeof t === 'string' ? t : t.text || '')
            };
            renderForm();
            saveToStorage();
        }
        if (resume.tailored_resume) {
            tailoredResume = resume.tailored_resume;
            renderPreview(tailoredResume);
            document.getElementById('btnPdf').disabled = false;
            document.getElementById('btnLatex').disabled = false;
        }
        // Restore list
        container.innerHTML = originalContent;
    } catch (e) {
        showAlert('Failed to load resume: ' + e.message);
        container.innerHTML = originalContent;
    }
}

async function deleteCloudResume(id) {
    if (!await showConfirm('Delete this resume from the cloud?')) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    
    try {
        const res = await fetch(`${API_BASE}/resumes/${id}`, { 
            method: 'DELETE', 
            headers: authHeader 
        });
        if (!res.ok) throw new Error('Failed to delete');
        if (currentResumeId === id) currentResumeId = null;
        loadResumes();
    } catch (e) {
        showAlert('Failed to delete: ' + e.message);
    }
}

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
                bullets: (e.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? null }))
            }));
            resumeData.projects = (data.projects || []).map(p => ({
                title: p.title || '',
                languages: Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages || ''),
                bullets: (p.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? null }))
            }));
            resumeData.languages = (data.languages || []).map(l => typeof l === 'string' ? l : l.text || '');
            resumeData.technologies = (data.technologies || []).map(t => typeof t === 'string' ? t : t.text || '');
            renderForm();
        } catch (err) { showAlert('Invalid JSON'); }
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
    eduList.innerHTML = resumeData.education.length ? '' : itemHtml('edu', 0, eduFields(), false, [], false);
    resumeData.education.forEach((e, i) => eduList.innerHTML += itemHtml('edu', i, eduFields(e), false, [], resumeData.education.length > 1));

    // Experience
    const expList = document.getElementById('experienceList');
    expList.innerHTML = resumeData.experience.length ? '' : itemHtml('exp', 0, expFields(), true, [], false);
    resumeData.experience.forEach((e, i) => expList.innerHTML += itemHtml('exp', i, expFields(e), true, e.bullets, resumeData.experience.length > 1));

    // Projects
    const projList = document.getElementById('projectList');
    projList.innerHTML = resumeData.projects.length ? '' : itemHtml('proj', 0, projFields(), true, [], false);
    resumeData.projects.forEach((p, i) => projList.innerHTML += itemHtml('proj', i, projFields(p), true, p.bullets, resumeData.projects.length > 1));

    // Skills
    document.getElementById('languages').value = resumeData.languages.join(', ');
    document.getElementById('technologies').value = resumeData.technologies.join(', ');
    
    // Apply section toggle states
    applyAllToggleStates();
}

// === HTML Generators ===
function itemHtml(type, idx, fields, hasBullets = false, bullets = [], canDelete = true) {
    const label = { edu: 'Education', exp: 'Experience', proj: 'Project' }[type];
    const removeBtn = canDelete ? `<button class="btn-remove" onclick="removeItem('${type}',${idx})">×</button>` : '';
    let html = `<div class="list-item" data-type="${type}" data-idx="${idx}">
        <div class="list-item-header"><span>${label} #${idx + 1}</span>${removeBtn}</div>
        <div class="row">${fields.slice(0, 2).map(f => fieldInput(f)).join('')}</div>
        <div class="row">${fields.slice(2, 4).map(f => fieldInput(f)).join('')}</div>
        ${fields[4] ? fieldInput(fields[4]) : ''}`;
    if (hasBullets) {
        const bulletCount = bullets.length || 1;
        html += `<div class="bullets" data-type="${type}" data-idx="${idx}">
            ${bullets.length ? bullets.map((b, bi) => bulletHtml(type, idx, bi, b, bulletCount > 1)).join('') : bulletHtml(type, idx, 0, {}, false)}
        </div><button class="btn-add-bullet" onclick="addBullet('${type}',${idx})">+ Bullet</button>`;
    }
    return html + '</div>';
}

function fieldInput(f) {
    if (f.isGpa) {
        return `<input type="text" inputmode="decimal" placeholder="${f.ph}" data-field="${f.field}" value="${f.val || ''}" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*)\\./g, '$1')" onchange="clampGpa(this)"/>`;
    }
    return `<input type="${f.type || 'text'}" placeholder="${f.ph}" data-field="${f.field}" value="${f.val || ''}" ${f.step ? 'step="' + f.step + '"' : ''}/>`;
}

function bulletHtml(type, idx, bi, b = {}, canDelete = true) {
    const removeBtn = canDelete ? `<button class="btn-remove" onclick="removeBullet('${type}',${idx},${bi})">×</button>` : '';
    return `<div class="bullet-row">
        <input type="text" placeholder="Bullet" data-field="text" value="${b.text || ''}"/>
        <span class="tooltip tooltip-right"><input type="text" inputmode="decimal" placeholder="Imp" data-field="impressiveness" value="${b.impressiveness ?? ''}" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*)\\./g, '$1')" onchange="clampImpressiveness(this)" style="margin-bottom:0;"/><span class="tooltip-text">Impressiveness, in [0, 1]</span></span>
        ${removeBtn}
    </div>`;
}

function clampImpressiveness(input) {
    let val = parseFloat(input.value);
    if (isNaN(val) || input.value.trim() === '') {
        input.value = '';
    } else {
        input.value = Math.min(1, Math.max(0, val));
    }
    syncFromForm();
}

function clampGpa(input) {
    let val = parseFloat(input.value);
    if (isNaN(val) || input.value.trim() === '') {
        input.value = '';
    } else {
        input.value = Math.max(0, val);
    }
    syncFromForm();
}

function eduFields(e = {}) {
    return [
        { ph: 'Institution', field: 'est_name', val: e.est_name },
        { ph: 'Location', field: 'location', val: e.location },
        { ph: 'Degree', field: 'degree', val: e.degree },
        { ph: 'Year', field: 'year', val: e.year },
        { ph: 'GPA', field: 'gpa', val: e.gpa, isGpa: true }
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
    syncFromForm();
    const arr = { edu: resumeData.education, exp: resumeData.experience, proj: resumeData.projects }[type];
    if (type === 'edu') arr.push({ est_name: '', location: '', degree: '', year: '', gpa: '' });
    else if (type === 'exp') arr.push({ employer: '', location: '', title: '', duration: '', bullets: [{ text: '', impressiveness: null }] });
    else arr.push({ title: '', languages: '', bullets: [{ text: '', impressiveness: null }] });
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
    arr[idx].bullets.push({ text: '', impressiveness: null });
    renderForm();
}

function removeBullet(type, idx, bi) {
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects }[type];
    arr[idx].bullets.splice(bi, 1);
    if (arr[idx].bullets.length === 0) arr[idx].bullets.push({ text: '', impressiveness: null });
    renderForm();
}

// === Clear Functions ===
async function clearSection(type) {
    const labels = { edu: 'Education', exp: 'Experience', proj: 'Projects' };
    if (!await showConfirm(`Clear all ${labels[type]} entries?`)) return;
    syncFromForm();
    if (type === 'edu') resumeData.education = [];
    else if (type === 'exp') resumeData.experience = [];
    else resumeData.projects = [];
    saveToStorage();
    renderForm();
}

async function clearBullets(type, idx) {
    if (!await showConfirm('Clear all bullets for this item?')) return;
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects }[type];
    arr[idx].bullets = [{ text: '', impressiveness: null }];
    saveToStorage();
    renderForm();
}

async function clearAll() {
    if (!await showConfirm('Clear entire resume? This cannot be undone.')) return;
    resumeData = {
        full_name: '',
        contacts: { phone: '', email: '', github: '', linkedin: '' },
        education: [],
        experience: [],
        projects: [],
        languages: [],
        technologies: []
    };
    tailoredResume = null;
    saveToStorage();
    renderForm();
    document.getElementById('btnPdf').disabled = true;
    document.getElementById('btnLatex').disabled = true;
    document.getElementById('preview').innerHTML = 'Fill in your resume and click Preview.';
}

// === Section Toggles ===
function toggleSection(type) {
    sectionStates[type] = !sectionStates[type];
    saveSectionStates();
    applyToggleState(type);
}

function applyToggleState(type) {
    const listId = { edu: 'educationList', exp: 'experienceList', proj: 'projectList' }[type];
    const list = document.getElementById(listId);
    const btn = document.querySelector(`[data-toggle="${type}"]`);
    if (list) list.style.display = sectionStates[type] ? '' : 'none';
    if (btn) btn.textContent = sectionStates[type] ? '▼' : '▶';
}

function applyAllToggleStates() {
    ['edu', 'exp', 'proj'].forEach(applyToggleState);
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
    }));//.filter(e => e.est_name || e.degree);

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
    }));//.filter(e => e.employer || e.title);

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
    }));//.filter(p => p.title);

    resumeData.languages = document.getElementById('languages').value.split(',').map(s => s.trim()).filter(Boolean);
    resumeData.technologies = document.getElementById('technologies').value.split(',').map(s => s.trim()).filter(Boolean);
    debouncedSave();
}

// === Placeholder Resume ===
const PLACEHOLDER_RESUME = {
    full_name: 'John Doe',
    contacts: { phone: '(555) 123-4567', email: 'john.doe@email.com', github: 'github.com/johndoe', linkedin: 'linkedin.com/in/johndoe' },
    education: [
        { est_name: 'University of Technology', location: 'San Francisco, CA', degree: 'B.S. in Computer Science', year: '2020-2024', gpa: '3.8' }
    ],
    experience: [
        { employer: 'Tech Company Inc.', location: 'San Francisco, CA', title: 'Software Engineer', duration: 'June 2023 - Present',
          bullets: [{ text: 'Developed and maintained web applications using React and Node.js.' }, { text: 'Collaborated with cross-functional teams to deliver features on schedule.' }] }
    ],
    projects: [
        { title: 'Portfolio Website', languages: ['JavaScript', 'React', 'CSS'],
          bullets: [{ text: 'Built a responsive personal portfolio showcasing projects and skills.' }, { text: 'Implemented dynamic content loading and smooth animations.' }] }
    ],
    languages: [{ text: 'Python' }, { text: 'JavaScript' }, { text: 'TypeScript' }, { text: 'Java' }],
    technologies: [{ text: 'React' }, { text: 'Node.js' }, { text: 'PostgreSQL' }, { text: 'Docker' }],
    isPlaceholder: true
};

function isResumeEmpty() {
    return !resumeData.full_name &&
           !resumeData.contacts.phone && !resumeData.contacts.email && 
           !resumeData.contacts.github && !resumeData.contacts.linkedin &&
           resumeData.education.filter(e => e.est_name || e.degree).length === 0 &&
           resumeData.experience.filter(e => e.employer || e.title).length === 0 &&
           resumeData.projects.filter(p => p.title).length === 0 &&
           resumeData.languages.length === 0 && resumeData.technologies.length === 0;
}

// === API Calls ===
async function generatePreview() {
    syncFromForm();
    const preview = document.getElementById('preview');
    
    // If resume is empty, show placeholder preview
    if (isResumeEmpty()) {
        tailoredResume = PLACEHOLDER_RESUME;
        renderPreview(tailoredResume);
        document.getElementById('btnPdf').disabled = false;
        document.getElementById('btnLatex').disabled = false;
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
        tailoredResume = await res.json();
        renderPreview(tailoredResume);
        document.getElementById('btnPdf').disabled = false;
        document.getElementById('btnLatex').disabled = false;
        scrollToPreviewOnMobile();
    } catch (e) {
        preview.innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }
}

function scrollToPreviewOnMobile() {
    if (window.innerWidth <= 900) {
        document.querySelector('.preview-section')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderPreview(r) {
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
    syncFromForm();
    const apiData = prepareApiData();
    const btn = document.getElementById('btnPdf');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Preparing...';
    try {
        const res = await fetch(`${API_BASE}/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume || apiData, template: document.getElementById('template').value })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const fileName = getDownloadFileName('pdf');
        download(await res.blob(), fileName);
    } catch (e) { showAlert('Error: ' + e.message); }
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function downloadLatex() {
    syncFromForm();
    const apiData = prepareApiData();
    const btn = document.getElementById('btnLatex');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Preparing...';
    try {
        const res = await fetch(`${API_BASE}/export/latex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: tailoredResume || apiData, template: document.getElementById('template').value })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
        const fileName = getDownloadFileName('tex');
        download(new Blob([await res.text()], { type: 'text/plain' }), fileName);
    } catch (e) { showAlert('Error: ' + e.message); }
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function getDownloadFileName(ext) {
    if (currentResumeId && cachedResumes.length) {
        const saved = cachedResumes.find(r => r.id === currentResumeId);
        if (saved?.name) return `${saved.name}.${ext}`;
    }
    return `resume.${ext}`;
}

// Prepare data for API (convert formats)
function prepareApiData() {
    return {
        full_name: resumeData.full_name,
        contacts: resumeData.contacts,
        education: resumeData.education.filter(e => e.est_name || e.degree),
        experience: resumeData.experience.filter(e => e.employer || e.title).map(e => ({
            ...e,
            bullets: (e.bullets || []).filter(b => b.text)
        })),
        projects: resumeData.projects.filter(p => p.title).map(p => ({ 
            ...p, 
            languages: p.languages.split(',').map(s => s.trim()).filter(Boolean),
            bullets: (p.bullets || []).filter(b => b.text)
        })),
        languages: resumeData.languages.map(l => ({ text: l })),
        technologies: resumeData.technologies.map(t => ({ text: t }))
    };
}

function downloadJson() {
    syncFromForm();
    download(new Blob([JSON.stringify(prepareApiData(), null, 2)], { type: 'application/json' }), 'resume.json');
}

function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}
