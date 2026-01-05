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
import * as Cloud from './cloud.js';
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

window.addItem = Form.addItem;
window.removeItem = Form.removeItem;
window.addBullet = Form.addBullet;
window.removeBullet = Form.removeBullet;
window.toggleSection = Form.toggleSection;
window.clearSection = Form.clearSection;
window.clearAll = Form.clearAll;
window.loadFromJson = Form.loadFromJson;
window.clampGpa = Form.clampGpa;
window.clampImpressiveness = Form.clampImpressiveness;

// Cloud
window.loadCloudResume = Cloud.loadCloudResume;
window.deleteCloudResume = Cloud.deleteCloudResume;
window.saveCurrentToCloud = Cloud.saveToCloud; // Mapping for updated HTML

// API
window.tailorResume = API.generatePreview; // Mapped
window.downloadPdf = API.downloadPdf;
window.exportToLatex = API.exportToLatex; // Mapped
window.downloadJson = API.downloadJson;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Config global check?
    // Not needed, we import config.
    
    Theme.initTheme();
    ResumeType.initResumeType();
    Storage.loadFromStorage();
    
    // Initial Render
    Form.renderForm();
    
    // Auth Init
    await Auth.initSupabase();
    
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
