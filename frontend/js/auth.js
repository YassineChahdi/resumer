// Supabase & Authentication

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { 
    setSupabaseClient, setCurrentUser, setCurrentResumeId, setCurrentResumeName, setCachedResumes, 
    resetResumeData, updateResumeData, setTailoredResume,
    currentUser, supabaseClient // For check
} from './state.js';
import { renderForm } from './form.js'; // Will be created
import { loadResumes } from './cloud.js';
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

    // Check for provider redirect flow (Google)
    // Supabase usually puts access_token in hash
    let isRedirectLogin = window.location.hash && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('type=recovery')
    );

    // Listen for auth changes
    client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && isRedirectLogin) {
             showAlert('Logged in successfully');
             isRedirectLogin = false; // Consume
        }

        if (session?.user) {
            setCurrentUser(session.user);
            updateAuthUI(true);
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
    const userEmail = document.getElementById('userEmail');
    
    // Resume Section UI
    const guestMsg = document.getElementById('guestMessage');
    const userCtrl = document.getElementById('userResumesControl');

    if (btnLogin) btnLogin.style.display = loggedIn ? 'none' : '';
    if (userInfo) userInfo.style.display = loggedIn ? '' : 'none';
    
    // Toggle Saved Resumes UI
    if (loggedIn) {
        // Only load if explicit transition or initial load?
        // updateAuthUI is called by onAuthStateChange.
        // loadResumes is safe to call repeatedly but suboptimal?
        // It clears the list so it's visibly refreshing.
        if (guestMsg) guestMsg.style.display = 'none';
        if (userCtrl) userCtrl.style.display = 'block';
        loadResumes(); // Load from cloud
    } else {
        if (guestMsg) guestMsg.style.display = 'block';
        if (userCtrl) userCtrl.style.display = 'none';
        // Clear list (visual only, state cleared in logout)
        const list = document.getElementById('resumesList');
        if (list) list.innerHTML = '';
    }

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
        showAlert('Logged in successfully');
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
    
    showAlert('Logged out successfully');
}
