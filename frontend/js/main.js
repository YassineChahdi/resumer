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

// Cloud
window.loadCloudResume = Cloud.loadCloudResume;
window.deleteCloudResume = Cloud.deleteCloudResume;

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
    // If logged in, this logic should be handled by cloud loader or we treat ID as Cloud ID?
    // cloud.js loadCloudResume handles cloud loading.
    // If logged in, the list rendered uses Cloud IDs.
    // If logged out, we shouldn't see the list (as per new Guest UI).
    // So this function effectively becomes Cloud Load if logged in?
    
    // Actually, refreshResumesList (below) decides what to render.
    // If Cloud list, we should call Cloud load.
    if (State.currentUser) {
        Cloud.loadCloudResume(id);
    } else {
        // Should not happen for guest in new UI, but fallback:
        UI.showAlert('Please log in to load resumes');
    }
};

window.deleteLocalResume = async (id) => {
    // Generic Delete Handler
    if (State.currentUser) {
        await Cloud.deleteCloudResume(id);
    } else {
        // Local delete (if we ever show local list)
        if (await UI.showConfirm('Delete this resume?')) {
            Storage.deleteResume(id);
            if (State.currentResumeId === id) {
                State.setCurrentResumeId(null);
                State.setCurrentResumeName(null);
            }
            refreshResumesList();
        }
    }
};

window.handleSaveSnapshot = async () => {
    if (State.currentUser) {
        await Cloud.saveToCloud();
    } else {
        // Guest Save - Hidden in UI but good to guard
        UI.showToast('Please log in to save resumes', 'info');
    }
};

// API
window.tailorResume = API.generatePreview;
window.downloadPdf = API.downloadPdf;
window.exportToLatex = API.exportToLatex;
window.downloadJson = API.downloadJson;

// Helper to refresh list
function refreshResumesList() {
    if (State.currentUser) {
        Cloud.loadResumes(); // Loads and renders
    } else {
        // Guest - Clear or show local?
        // UI spec: Empty list / Guest Message shown via Auth UI toggle.
        // We can just clear the list container to be sure.
        const list = document.getElementById('resumesList');
        if (list) list.innerHTML = '';
    }
}

window.renameLocalResume = async (id, currentName) => {
    // Rename not implemented in Cloud API yet (mocked via Cloud save-as?)
    // If Cloud supports renaming (PUT update name), we do it.
    // user instruction didn't explicitly ask for rename, but we have the button.
    // For now, disabling rename for Cloud or implement simple PUT?
    // Cloud.js saveToCloud does a PUT if ID exists.
    // Let's defer rename since it's not critical for "Saving", or implement if easy.
    // We'll simplisticly alert "Rename not supported in cloud yet" or try to implement.
    UI.showToast('Renaming not available in cloud mode yet', 'info');
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    
    Theme.initTheme();
    ResumeType.initResumeType();
    Storage.loadFromStorage();
    
    // Initial Render
    Form.renderForm();
    
    // Reveal UI
    document.querySelector('main').classList.remove('loading');
    
    // Render Saved Resumes & Button State
    refreshResumesList();
    
    // Auth Init (Keep for optional cloud features if any, but don't block local)
    try {
        await Auth.initSupabase();
    } catch(e) { console.log('Auth init skipped/failed'); }
    
    // UI Init (listeners)
    UI.initModals();
    UI.initSmartTooltips();
});
