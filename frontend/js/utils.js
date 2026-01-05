// Utilities

import { currentResumeId, cachedResumes } from './state.js';

export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function scrollToPreviewOnMobile() {
    if (window.innerWidth <= 900) {
        document.querySelector('.preview-section')?.scrollIntoView({ behavior: 'smooth' });
    }
}

export function getDownloadFileName(ext) {
    if (currentResumeId && cachedResumes.length) {
        const saved = cachedResumes.find(r => r.id === currentResumeId);
        if (saved?.name) return `${saved.name}.${ext}`;
    }
    return `resume.${ext}`;
}

export function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}
