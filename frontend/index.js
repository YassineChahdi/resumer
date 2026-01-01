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

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
    loadFromStorage();
    renderForm();
    await initSupabase();
});

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

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
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
        alert('Supabase not configured');
        return;
    }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) {
        alert('Please enter email and password');
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
        alert('Login failed: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function signupWithEmail() {
    if (!supabaseClient) {
        alert('Supabase not configured');
        return;
    }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    const btn = document.getElementById('authSubmitBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Signing up...';
    try {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for a confirmation link!');
        hideLoginModal();
    } catch (e) {
        alert('Signup failed: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Google OAuth
async function loginWithGoogle() {
    if (!supabaseClient) {
        alert('Supabase not configured');
        return;
    }
    await supabaseClient.auth.signInWithOAuth({ 
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
}

async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentResumeId = null;
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
        alert('Please login first');
        return;
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
        alert('Resume saved!');
        loadResumes();
    } catch (e) {
        alert('Failed to save: ' + e.message);
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
        
        // Load full_resume into form (don't populate save name field)
        if (resume.full_resume) {
            const fr = resume.full_resume;
            resumeData = {
                ...resumeData,
                ...fr,
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
        alert('Failed to load resume: ' + e.message);
        container.innerHTML = originalContent;
    }
}

async function deleteCloudResume(id) {
    if (!confirm('Delete this resume from the cloud?')) return;
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
        alert('Failed to delete: ' + e.message);
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
                bullets: (e.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? 0.7 }))
            }));
            resumeData.projects = (data.projects || []).map(p => ({
                title: p.title || '',
                languages: Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages || ''),
                bullets: (p.bullets || []).map(b => ({ text: b.text || '', impressiveness: b.impressiveness ?? 0.7 }))
            }));
            resumeData.languages = (data.languages || []).map(l => typeof l === 'string' ? l : l.text || '');
            resumeData.technologies = (data.technologies || []).map(t => typeof t === 'string' ? t : t.text || '');
            renderForm();
        } catch (err) { alert('Invalid JSON'); }
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
    eduList.innerHTML = resumeData.education.length ? '' : itemHtml('edu', 0, eduFields());
    resumeData.education.forEach((e, i) => eduList.innerHTML += itemHtml('edu', i, eduFields(e)));

    // Experience
    const expList = document.getElementById('experienceList');
    expList.innerHTML = resumeData.experience.length ? '' : itemHtml('exp', 0, expFields(), true);
    resumeData.experience.forEach((e, i) => expList.innerHTML += itemHtml('exp', i, expFields(e), true, e.bullets));

    // Projects
    const projList = document.getElementById('projectList');
    projList.innerHTML = resumeData.projects.length ? '' : itemHtml('proj', 0, projFields(), true);
    resumeData.projects.forEach((p, i) => projList.innerHTML += itemHtml('proj', i, projFields(p), true, p.bullets));

    // Skills
    document.getElementById('languages').value = resumeData.languages.join(', ');
    document.getElementById('technologies').value = resumeData.technologies.join(', ');
    
    // Apply section toggle states
    applyAllToggleStates();
}

// === HTML Generators ===
function itemHtml(type, idx, fields, hasBullets = false, bullets = []) {
    const label = { edu: 'Education', exp: 'Experience', proj: 'Project' }[type];
    let html = `<div class="list-item" data-type="${type}" data-idx="${idx}">
        <div class="list-item-header"><span>${label} #${idx + 1}</span><button class="btn-remove" onclick="removeItem('${type}',${idx})">×</button></div>
        <div class="row">${fields.slice(0, 2).map(f => fieldInput(f)).join('')}</div>
        <div class="row">${fields.slice(2, 4).map(f => fieldInput(f)).join('')}</div>
        ${fields[4] ? fieldInput(fields[4]) : ''}`;
    if (hasBullets) {
        html += `<div class="bullets" data-type="${type}" data-idx="${idx}">
            ${bullets.length ? bullets.map((b, bi) => bulletHtml(type, idx, bi, b)).join('') : bulletHtml(type, idx, 0)}
        </div><button class="btn-add-bullet" onclick="addBullet('${type}',${idx})">+ Bullet</button>`;
    }
    return html + '</div>';
}

function fieldInput(f) {
    return `<input type="${f.type || 'text'}" placeholder="${f.ph}" data-field="${f.field}" value="${f.val || ''}" ${f.step ? 'step="' + f.step + '"' : ''}/>`;
}

function bulletHtml(type, idx, bi, b = {}) {
    return `<div class="bullet-row">
        <input type="text" placeholder="Bullet" data-field="text" value="${b.text || ''}"/>
        <span class="tooltip tooltip-right"><input type="text" inputmode="decimal" placeholder="Imp" data-field="impressiveness" value="${b.impressiveness ?? 0.7}" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*)\\./g, '$1')" onchange="clampImpressiveness(this)" style="margin-bottom:0;"/><span class="tooltip-text">Impressiveness in [0, 1]</span></span>
        <button class="btn-remove" onclick="removeBullet('${type}',${idx},${bi})">×</button>
    </div>`;
}

function clampImpressiveness(input) {
    let val = parseFloat(input.value);
    if (isNaN(val)) val = 0.7;
    input.value = Math.min(1, Math.max(0, val));
    syncFromForm();
}

function eduFields(e = {}) {
    return [
        { ph: 'Institution', field: 'est_name', val: e.est_name },
        { ph: 'Location', field: 'location', val: e.location },
        { ph: 'Degree', field: 'degree', val: e.degree },
        { ph: 'Year', field: 'year', val: e.year },
        { ph: 'GPA', field: 'gpa', val: e.gpa, type: 'number', step: '0.1' }
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
    const arr = { edu: resumeData.education, exp: resumeData.experience, proj: resumeData.projects }[type];
    syncFromForm();
    if (type === 'edu') arr.push({ est_name: '', location: '', degree: '', year: '', gpa: '' });
    else if (type === 'exp') arr.push({ employer: '', location: '', title: '', duration: '', bullets: [{ text: '', impressiveness: 0.7 }] });
    else arr.push({ title: '', languages: '', bullets: [{ text: '', impressiveness: 0.7 }] });
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
    arr[idx].bullets.push({ text: '', impressiveness: 0.7 });
    renderForm();
}

function removeBullet(type, idx, bi) {
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects }[type];
    arr[idx].bullets.splice(bi, 1);
    if (arr[idx].bullets.length === 0) arr[idx].bullets.push({ text: '', impressiveness: 0.7 });
    renderForm();
}

// === Clear Functions ===
function clearSection(type) {
    const labels = { edu: 'Education', exp: 'Experience', proj: 'Projects' };
    if (!confirm(`Clear all ${labels[type]} entries?`)) return;
    syncFromForm();
    if (type === 'edu') resumeData.education = [];
    else if (type === 'exp') resumeData.experience = [];
    else resumeData.projects = [];
    saveToStorage();
    renderForm();
}

function clearBullets(type, idx) {
    if (!confirm('Clear all bullets for this item?')) return;
    syncFromForm();
    const arr = { exp: resumeData.experience, proj: resumeData.projects }[type];
    arr[idx].bullets = [{ text: '', impressiveness: 0.7 }];
    saveToStorage();
    renderForm();
}

function clearAll() {
    if (!confirm('Clear entire resume? This cannot be undone.')) return;
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
    })).filter(e => e.est_name || e.degree);

    resumeData.experience = [...document.querySelectorAll('#experienceList .list-item')].map(el => ({
        employer: el.querySelector('[data-field="employer"]').value,
        location: el.querySelector('[data-field="location"]').value,
        title: el.querySelector('[data-field="title"]').value,
        duration: el.querySelector('[data-field="duration"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => ({
            text: b.querySelector('[data-field="text"]').value,
            impressiveness: Math.min(1, Math.max(0, parseFloat(b.querySelector('[data-field="impressiveness"]').value) || 0.7))
        })).filter(b => b.text)
    })).filter(e => e.employer || e.title);

    resumeData.projects = [...document.querySelectorAll('#projectList .list-item')].map(el => ({
        title: el.querySelector('[data-field="title"]').value,
        languages: el.querySelector('[data-field="languages"]').value,
        bullets: [...el.querySelectorAll('.bullet-row')].map(b => ({
            text: b.querySelector('[data-field="text"]').value,
            impressiveness: Math.min(1, Math.max(0, parseFloat(b.querySelector('[data-field="impressiveness"]').value) || 0.7))
        })).filter(b => b.text)
    })).filter(p => p.title);

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
    } catch (e) {
        preview.innerHTML = `<span class="error">Error: ${e.message}</span>`;
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
    } catch (e) { alert('Error: ' + e.message); }
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
    } catch (e) { alert('Error: ' + e.message); }
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
        ...resumeData,
        projects: resumeData.projects.map(p => ({ ...p, languages: p.languages.split(',').map(s => s.trim()).filter(Boolean) })),
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
