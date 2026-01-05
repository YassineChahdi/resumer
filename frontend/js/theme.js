// Theme Logic

import { THEME_KEY } from './config.js';

export function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isLight = savedTheme === 'light';
    if (isLight) {
        document.body.classList.add('light-mode');
    }
    updateThemeIcon(isLight);
}

export function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
}

export function updateThemeIcon(isLight) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = isLight ? '<span class="material-symbols-outlined">dark_mode</span>' : '<span class="material-symbols-outlined">light_mode</span>';
}
