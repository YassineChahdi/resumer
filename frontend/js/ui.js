// UI & Modals

// Toast Notification
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return; // Should exist from HTML

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Optional: Add icon based on type (simple text char for now)
    // if (type === 'success') toast.innerHTML = '✓ ' + message;
    // if (type === 'error') toast.innerHTML = '⚠ ' + message;
    
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}

// Alert Modal functions -> Redirect to Toast
export function showAlert(message) {
    // Determine type based on message content keywords (heuristic)
    let type = 'info';
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('invalid') || lower.includes('please')) {
        type = 'error';
    } else if (lower.includes('success') || lower.includes('saved')) {
        type = 'success';
    }
    
    showToast(message, type);
}

export function hideAlert() {
    // No-op for toasts as they auto-hide
}

// Confirm Modal functions
let confirmResolve = null;

export function showConfirm(message) {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
    });
}

export function resolveConfirm(result) {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmResolve) {
        confirmResolve(result);
        confirmResolve = null;
    }
}

// Prompt Modal (Custom)
let promptResolve = null;

export function showPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        promptResolve = resolve;
        document.getElementById('promptMessage').textContent = message;
        const input = document.getElementById('promptInput');
        input.value = defaultValue;
        document.getElementById('promptModal').style.display = 'flex';
        input.focus();
        input.select();
    });
}

export function resolvePrompt(value) {
    document.getElementById('promptModal').style.display = 'none';
    if (promptResolve) {
        promptResolve(value); // Returns string or null
        promptResolve = null;
    }
}

// Init Modals - call this from main.js
export function initModals() {
    // Close modals when clicking outside
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') {
                if (window.hideLoginModal) window.hideLoginModal();
            }
        });
    }

    // Alert modal listener removed (replaced by Toasts)

    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') resolveConfirm(false);
        });
    }
    
    const promptModal = document.getElementById('promptModal');
    if (promptModal) {
        promptModal.addEventListener('click', (e) => {
            if (e.target.id === 'promptModal') resolvePrompt(null);
        });
        // Enter key to submit
        const input = document.getElementById('promptInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') resolvePrompt(input.value.trim());
            });
        }
    }

    // Escape key to close any open modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const loginModal = document.getElementById('loginModal');
            const confirmModal = document.getElementById('confirmModal');
            const promptModal = document.getElementById('promptModal');
            const downloadModal = document.getElementById('downloadModal');

            if (loginModal?.style.display === 'flex' || loginModal?.style.display === 'block') {
                if (window.hideLoginModal) window.hideLoginModal();
            }
            if (confirmModal?.style.display === 'flex' || confirmModal?.style.display === 'block') {
                resolveConfirm(false);
            }
            if (promptModal?.style.display === 'flex' || promptModal?.style.display === 'block') {
                resolvePrompt(null);
            }
            if (downloadModal?.style.display === 'flex' || downloadModal?.style.display === 'block') {
                if (window.hideDownloadModal) window.hideDownloadModal();
            }
        }
    });
}

export function renderSavedResumesList(resumes, onLoad, onDelete, onRename) {
    const container = document.getElementById('resumesList');
    if (!container) return;
    
    if (!resumes.length) {
        container.innerHTML = 'No saved resumes. Save your first resume!';
        return;
    }
    
    container.innerHTML = '';
    resumes.forEach(r => {
        const div = document.createElement('div');
        div.className = 'resume-item';
        div.dataset.id = r.id;
        
        const span = document.createElement('span');
        span.textContent = r.name;
        // Highlight active if needed (passed via state? or we allow UI to check state)
        // Ideally we pass activeId to this function
        span.onclick = () => onLoad(r.id);
        
        // Buttons container
        const actions = document.createElement('div');
        actions.className = 'resume-actions';
        actions.style.marginLeft = 'auto'; // Push to right
        
        const btnRename = document.createElement('button');
        btnRename.className = 'btn-icon'; // Need CSS for this? Or reuse btn-remove style
        btnRename.textContent = '✎';
        btnRename.title = 'Rename';
        btnRename.style.marginRight = '0.5rem';
        btnRename.onclick = (e) => {
            e.stopPropagation();
            onRename(r.id, r.name);
        };
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-remove';
        btnDelete.textContent = '×';
        btnDelete.title = 'Delete';
        btnDelete.onclick = (e) => {
            e.stopPropagation();
            onDelete(r.id);
        };
        
        actions.appendChild(btnRename);
        actions.appendChild(btnDelete);
        
        div.appendChild(span);
        div.appendChild(actions); // Instead of appending btn directly
        container.appendChild(div);
    });
}

// End of file (removed updateSaveButtonState)

// Smart Tooltip Portal
export function initSmartTooltips() {
    // Create global tooltip if not exists
    let globalTooltip = document.getElementById('global-tooltip');
    if (!globalTooltip) {
        globalTooltip = document.createElement('div');
        globalTooltip.id = 'global-tooltip';
        document.body.appendChild(globalTooltip);
    }

    let activeTarget = null;
    let hasTouch = false;
    
    // Detect touch capability/usage
    document.addEventListener('touchstart', () => {
        hasTouch = true;
    }, { capture: true, once: true });

    function hideTooltip() {
        if (activeTarget) {
            activeTarget.classList.remove('active'); // Turn off blue
        }
        if (globalTooltip) {
            globalTooltip.classList.remove('active');
        }
        activeTarget = null;
    }

    function showTooltip(target) {
        // If switching targets, hide previous
        if (activeTarget && activeTarget !== target) {
            activeTarget.classList.remove('active');
        }

        const textEl = target.querySelector('.tooltip-text');
        if (!textEl) return;
        
        globalTooltip.innerHTML = textEl.innerHTML;
        
        activeTarget = target;
        activeTarget.classList.add('active'); // Turn on blue
        updatePosition();
        globalTooltip.classList.add('active');
    }

    function updatePosition() {
        if (!activeTarget) return;

        // Move to center of screen for measurement to avoid edge constraints
        // forcing premature wrapping (which leads to wrong width calculation).
        globalTooltip.style.top = '50%';
        globalTooltip.style.left = '50%';
        globalTooltip.style.transform = 'translate(-50%, -50%)';

        const targetRect = activeTarget.getBoundingClientRect();
        const tooltipRect = globalTooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const padding = 10;
        
        // Icon center X position
        const iconCenterX = targetRect.left + (targetRect.width / 2);
        
        // Check vertical overflow (if top < 0, move to bottom)
        let isBottom = false;
        let top = targetRect.top - 10;
        if (top - tooltipRect.height < 0) {
            isBottom = true;
            top = targetRect.bottom + 10;
        } else {
            top = targetRect.top - 10;
        }

        // Calculate tooltip left edge, clamped to viewport
        const tooltipWidth = tooltipRect.width;
        let tooltipLeft = iconCenterX - (tooltipWidth / 2);
        
        // Clamp to viewport bounds
        if (tooltipLeft < padding) {
            tooltipLeft = padding;
        } else if (tooltipLeft + tooltipWidth > viewportWidth - padding) {
            tooltipLeft = viewportWidth - padding - tooltipWidth;
        }

        // Apply Styles - position tooltip box directly (no transform for X)
        globalTooltip.style.top = `${top}px`;
        globalTooltip.style.left = `${tooltipLeft}px`;
        globalTooltip.style.transform = isBottom ? 'translateY(0%)' : 'translateY(-100%)';
        
        // Arrow should point at icon center
        // Arrow position is relative to tooltip left edge, minus half the arrow width (5px border)
        const arrowLeft = iconCenterX - tooltipLeft - 5;
        globalTooltip.style.setProperty('--arrow-x', `${arrowLeft}px`);
        
        if (isBottom) {
             globalTooltip.style.setProperty('--arrow-top', '-10px');
             globalTooltip.style.setProperty('--arrow-rot', '180deg');
        } else {
             globalTooltip.style.setProperty('--arrow-top', '100%');
             globalTooltip.style.setProperty('--arrow-rot', '0deg');
        }
    }

    // Mouse Delegation (Desktop)
    document.addEventListener('mouseover', (e) => {
        if (hasTouch) return; // Ignore if touch user
        const target = e.target.closest('.tooltip');
        if (target) showTooltip(target);
    });
    
    document.addEventListener('mouseout', (e) => {
        if (hasTouch) return;
        const target = e.target.closest('.tooltip');
        if (target) hideTooltip();
    });

    // Click Delegation (Mobile/Touch Toggle)
    document.addEventListener('click', (e) => {
        if (!hasTouch) return; // On desktop, click usually performs action. Tooltip handled by hover.
        
        const target = e.target.closest('.tooltip');
        if (target) {
             // Toggle logic
             if (activeTarget === target) {
                 hideTooltip();
             } else {
                 showTooltip(target);
             }
        } else {
            // Click outside
            hideTooltip();
        }
    });
    
    // Hide on scroll
    window.addEventListener('scroll', () => {
        if (activeTarget) hideTooltip();
    }, true);
    
    window.addEventListener('resize', () => {
        if (activeTarget) hideTooltip();
    });
}
