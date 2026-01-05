// Resume Type Logic

import { RESUME_TYPE_KEY } from './config.js';
import { currentResumeType, setCurrentResumeType } from './state.js';
import { syncFromForm, renderForm } from './form.js';
import { clearPreview } from './api.js';

export function initResumeType() {
    const savedType = localStorage.getItem(RESUME_TYPE_KEY);
    if (savedType === 'general' || savedType === 'tech') {
        setCurrentResumeType(savedType);
    }
    applyResumeType();
}

export function setResumeType(type, skipSync = false) {
    // Sync current form data before switching (saves to current mode's fields)
    // Skip sync when loading data (JSON, cloud) to avoid overwriting loaded data
    if (!skipSync && document.getElementById('fullName')) {
        syncFromForm();
    }
    setCurrentResumeType(type);
    localStorage.setItem(RESUME_TYPE_KEY, type);
    applyResumeType();
    // Re-render form to show the new mode's skill values
    if (!skipSync && document.getElementById('fullName')) {
        renderForm();
    }
    clearPreview();
}

export function applyResumeType() {
    const btnGeneral = document.getElementById('btnGeneral');
    const btnTech = document.getElementById('btnTech');
    const languagesInput = document.getElementById('languages');
    const technologiesInput = document.getElementById('technologies');
    const languagesTooltip = document.getElementById('languagesTooltip');
    const technologiesTooltip = document.getElementById('technologiesTooltip');
    const skillsLegend = document.getElementById('skillsLegend');
    const projectsSection = document.getElementById('projectsSection');
    const certificationsSection = document.getElementById('certificationsSection');
    const volunteerSection = document.getElementById('volunteerSection');
    
    // Update button states
    if (btnGeneral && btnTech) {
        btnGeneral.classList.toggle('active', currentResumeType === 'general');
        btnTech.classList.toggle('active', currentResumeType === 'tech');
    }
    
    // Toggle section visibility based on mode
    if (projectsSection) projectsSection.style.display = currentResumeType === 'tech' ? '' : 'none';
    if (certificationsSection) certificationsSection.style.display = currentResumeType === 'general' ? '' : 'none';
    if (volunteerSection) volunteerSection.style.display = currentResumeType === 'general' ? '' : 'none';
    
    // Update labels and tooltips based on mode
    if (currentResumeType === 'general') {
        if (skillsLegend) skillsLegend.textContent = 'Additional Information';
        if (languagesInput) languagesInput.placeholder = 'Spoken Languages';
        if (technologiesInput) technologiesInput.placeholder = 'Technical Skills';
        if (languagesTooltip) languagesTooltip.textContent = 'Languages you speak: English, French, etc.';
        if (technologiesTooltip) technologiesTooltip.textContent = 'Software skills: Excel, PowerPoint, etc.';
    } else {
        if (skillsLegend) skillsLegend.textContent = 'Skills';
        if (languagesInput) languagesInput.placeholder = 'Programming Languages';
        if (technologiesInput) technologiesInput.placeholder = 'Technologies';
        if (languagesTooltip) languagesTooltip.textContent = 'Programming languages: Python, JS, etc.';
        if (technologiesTooltip) technologiesTooltip.textContent = 'Tools & frameworks: React, Docker, etc.';
    }
}
