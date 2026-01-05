// Configuration
export const IS_DEV = window.location.hostname === 'localhost' 
    || window.location.hostname === '127.0.0.1' 
    || window.location.hostname === ''  
    || window.location.protocol === 'file:';

export const API_BASE = IS_DEV 
    ? 'http://localhost:8000'
    : 'https://jasonwastaken-resumer-api.hf.space';

export const STORAGE_KEY = 'resumeData';
export const SECTION_STATES_KEY = 'sectionStates';
export const THEME_KEY = 'themeMode';
export const RESUME_TYPE_KEY = 'resumeType';

export const SUPABASE_URL = window.RESUMER_CONFIG?.SUPABASE_URL || 'https://yrfedqgzzrhxnozaopvf.supabase.co';
export const SUPABASE_ANON_KEY = window.RESUMER_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZmVkcWd6enJoeG5vemFvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDMwMTUsImV4cCI6MjA4MjYxOTAxNX0.w9LoNN2Q-C-_5fUNDhgGgkbhQenQYeT3p14zGafAUEE';


