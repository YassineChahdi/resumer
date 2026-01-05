// Supabase & Authentication

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { 
    setSupabaseClient, setCurrentUser, setCurrentResumeId, setCurrentResumeName, setCachedResumes, 
    resetResumeData, updateResumeData, setTailoredResume,
    currentUser, supabaseClient // For check
} from './state.js';
import { renderForm } from './form.js'; // Will be created
import { loadResumes } from './cloud.js'; // Will be created
import { showAlert } from './ui.js';
import { STORAGE_KEY } from './config.js';

let isSignupMode = false;

// Initialize Supabase
export async function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase not loaded');
        return;
    }
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured');
        return;
    }
    
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setSupabaseClient(client);
    
    // Listen for auth changes
    client.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            setCurrentUser(session.user);
            updateAuthUI(true);
            loadResumes();
        } else {
            setCurrentUser(null);
            updateAuthUI(false);
        }
    });
    
    // Check current session
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
        setCurrentUser(session.user);
        updateAuthUI(true);
        loadResumes();
    }
}

export async function getAuthHeader() {
    if (!supabaseClient) {
        // Try getting from state or re-init? 
        // We expect initiation to be done
        return null;
    }
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : null;
}

export function updateAuthUI(loggedIn) {
    const btnLogin = document.getElementById('btnLogin');
    const userInfo = document.getElementById('userInfo');
    const myResumes = document.getElementById('myResumesSection');
    const userEmail = document.getElementById('userEmail');
    
    if (btnLogin) btnLogin.style.display = loggedIn ? 'none' : '';
    if (userInfo) userInfo.style.display = loggedIn ? '' : 'none';
    if (myResumes) myResumes.style.display = loggedIn ? '' : 'none';
    if (loggedIn && currentUser && userEmail) {
        userEmail.textContent = currentUser.email || 'Logged in';
    }
}

// Modal Interaction
export function showLoginModal() {
    isSignupMode = false;
    updateAuthModalUI();
    document.getElementById('loginModal').style.display = 'flex';
}

export function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    const email = document.getElementById('authEmail');
    const pass = document.getElementById('authPassword');
    if (email) email.value = '';
    if (pass) pass.value = '';
}

export function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    updateAuthModalUI();
}

function updateAuthModalUI() {
    document.getElementById('authModalTitle').textContent = isSignupMode ? 'Sign Up' : 'Log In';
    document.getElementById('authSubmitBtn').textContent = isSignupMode ? 'Sign Up' : 'Log In';
    document.getElementById('authToggleText').textContent = isSignupMode ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('authToggleLink').textContent = isSignupMode ? 'Log in' : 'Sign up';
}

export async function submitAuth() {
    if (isSignupMode) {
        await signupWithEmail();
    } else {
        await loginWithEmail();
    }
}

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
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
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
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

// Google
export async function loginWithGoogle() {
    if (!supabaseClient) {
        showAlert('Supabase not configured');
        return;
    }
    await supabaseClient.auth.signInWithOAuth({ 
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
}

// Logout
export async function logout() {
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
    
    // Reset State
    setCurrentUser(null);
    setCurrentResumeId(null);
    setCurrentResumeName(null);
    setCachedResumes([]);
    updateAuthUI(false);
    
    // Clear all fields
    resetResumeData();
    setTailoredResume(null);
    localStorage.removeItem(STORAGE_KEY);
    
    // Re-render
    renderForm();
    document.getElementById('preview').innerHTML = 'Fill in your resume and click Preview.';
    document.getElementById('btnPdf').disabled = true;
    document.getElementById('btnLatex').disabled = true;
}
