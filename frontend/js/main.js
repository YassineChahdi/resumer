// Main Entry Point

// Import all modules to initialize them or expose them
import * as Config from './config.js';
import * as State from './state.js';
import * as Utils from './utils.js';
import * as Components from './components.js';
import * as Storage from './storage.js';
import * as Theme from './theme.js';
import * as ResumeType from './resumeType.js';
import * as UI from './ui.js';
import * as Auth from './auth.js';
import * as Cloud from './cloud.js'; // Keeping for potential legacy ref, but replacing functional parts
import * as API from './api.js';
import * as Form from './form.js';

// Global Exposure for HTML onclick handlers
window.toggleTheme = Theme.toggleTheme;
window.setResumeType = ResumeType.setResumeType;

// Auth
window.showLoginModal = Auth.showLoginModal;
window.hideLoginModal = Auth.hideLoginModal;
window.toggleAuthMode = Auth.toggleAuthMode;
window.submitAuth = Auth.submitAuth;
window.loginWithGoogle = Auth.loginWithGoogle;
window.logout = Auth.logout;

// Form / UI
window.hideAlert = UI.hideAlert;
window.resolveConfirm = UI.resolveConfirm;
window.resolvePrompt = UI.resolvePrompt; // Exposed for Custom Modal

window.addItem = Form.addItem;
window.removeItem = Form.removeItem;
window.addBullet = Form.addBullet;
window.removeBullet = Form.removeBullet;
window.toggleSection = Form.toggleSection;
window.clearSection = Form.clearSection;
window.clearAll = () => {
    Form.clearAll();
    // Also clear current resume tracking?
    State.setCurrentResumeId(null);
    State.setCurrentResumeName(null);
    refreshResumesList(); // To clear active highlights if any
};
window.loadFromJson = Form.loadFromJson;
window.clampGpa = Form.clampGpa;
window.clampImpressiveness = Form.clampImpressiveness;

// Local Resume Management (Replacing Cloud List)
window.loadLocalResume = (id) => {
    const data = Storage.loadResume(id);
    if (data) {
        // Update State
        State.setCurrentResumeId(id);
        const meta = Storage.getSavedResumes().find(r => r.id === id);
        if (meta) {
            State.setCurrentResumeName(meta.name);
            // Restore Type if exists
            if (meta.type) {
                ResumeType.setResumeType(meta.type, true); // true = updateUI? check sig
            }
        }
        
        // Load Data
        State.resetResumeData(data);
        
        // Render
        Form.renderForm();
        Storage.saveToStorage(); // Save to working copy
        
        // Update UI
        refreshResumesList();
        UI.showAlert(`Loaded resume "${meta ? meta.name : 'resume'}"`);
    } else {
        UI.showAlert('Failed to load resume');
    }
};

window.deleteLocalResume = async (id) => {
    if (await UI.showConfirm('Delete this resume?')) {
        Storage.deleteResume(id);
        if (State.currentResumeId === id) {
            State.setCurrentResumeId(null);
            State.setCurrentResumeName(null);
        }
        refreshResumesList();
    }
};

window.handleSaveSnapshot = async () => {
    // Current name default?
    const defaultName = State.currentResumeName || '';
    const name = await UI.showPrompt('Name your resume:', defaultName);
    if (name) {
        const saved = Storage.saveResume(name); 
        
        // Update State to track this new resume? 
        // User asked for "trails of progress". Loading a trail sets the ID.
        // Saving creates a new trail point. Should we switch to it?
        // Yes, usually "Save As" switches you to the new file.
        State.setCurrentResumeId(saved.id);
        State.setCurrentResumeName(saved.name);
        
        UI.showAlert(`Resume saved as "${saved.name}"`);
        refreshResumesList();
    }
};

// API
window.tailorResume = API.generatePreview;
window.downloadPdf = API.downloadPdf;
window.exportToLatex = API.exportToLatex;
window.downloadJson = API.downloadJson;

// Helper to refresh list
function refreshResumesList() {
    const list = Storage.getSavedResumes();
    UI.renderSavedResumesList(list, window.loadLocalResume, window.deleteLocalResume, window.renameLocalResume);
}

window.renameLocalResume = async (id, currentName) => {
    const newName = await UI.showPrompt('Rename resume:', currentName);
    if (newName && newName !== currentName) {
        if (Storage.renameResume(id, newName)) {
            // Update State if we renamed the currently active one
            if (State.currentResumeId === id) {
                State.setCurrentResumeName(newName);
            }
            refreshResumesList();
        } else {
            UI.showAlert('Failed to rename.');
        }
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    
    Theme.initTheme();
    ResumeType.initResumeType();
    Storage.loadFromStorage();
    
    // Initial Render
    Form.renderForm();
    
    // Render Saved Resumes & Button State
    refreshResumesList();
    
    // Auth Init (Keep for optional cloud features if any, but don't block local)
    try {
        await Auth.initSupabase();
    } catch(e) { console.log('Auth init skipped/failed'); }
    
    // UI Init (listeners)
    UI.initModals();
    
    // Tooltips (Mobile)
    initTooltipTouchHandling();
});


function initTooltipTouchHandling() {
    document.addEventListener('click', (e) => {
        const tooltipIcon = e.target.closest('.tooltip-icon');
        const tooltip = e.target.closest('.tooltip');
        
        if (tooltipIcon && tooltip) {
            e.preventDefault();
            e.stopPropagation();
            
            const wasActive = tooltip.classList.contains('tooltip-active');
            document.querySelectorAll('.tooltip-active').forEach(t => t.classList.remove('tooltip-active'));
            if (!wasActive) {
                tooltip.classList.add('tooltip-active');
            }
        } else {
            document.querySelectorAll('.tooltip-active').forEach(t => t.classList.remove('tooltip-active'));
        }
    });
}
