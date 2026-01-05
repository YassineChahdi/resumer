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
