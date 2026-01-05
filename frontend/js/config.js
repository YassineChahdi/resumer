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

export const PLACEHOLDER_RESUME_TECH = {
    full_name: 'John Doe',
    contacts: { phone: '(555) 123-4567', email: 'john.doe@email.com', github: 'github.com/johndoe', linkedin: 'linkedin.com/in/johndoe' },
    education: [
        { est_name: 'University of Technology', location: 'San Francisco, CA', degree: 'B.S. in Computer Science', year: '2020-2024', gpa: '3.8' }
    ],
    experience: [
        { employer: 'Tech Company Inc.', location: 'San Francisco, CA', title: 'Software Engineer', duration: 'June 2023 - Present',
          bullets: [{ text: 'Developed and maintained web applications using React and Node.js.' }, { text: 'Collaborated with cross-functional teams to deliver features on schedule.' }] }
    ],
    projects: [
        { title: 'Portfolio Website', languages: ['JavaScript', 'React', 'CSS'],
          bullets: [{ text: 'Built a responsive personal portfolio showcasing projects and skills.' }, { text: 'Implemented dynamic content loading and smooth animations.' }] }
    ],
    languages: [{ text: 'Python' }, { text: 'JavaScript' }, { text: 'TypeScript' }, { text: 'Java' }],
    technologies: [{ text: 'React' }, { text: 'Node.js' }, { text: 'PostgreSQL' }, { text: 'Docker' }],
    isPlaceholder: true
};

export const PLACEHOLDER_RESUME_GENERAL = {
    full_name: 'Jordan Smith',
    contacts: { phone: '(555) 987-6543', email: 'jordan.smith@example.com', github: '', linkedin: 'linkedin.com/in/jordansmith' },
    education: [
        { est_name: 'State University', location: 'New York, NY', degree: 'Bachelor of Business Administration', year: '2018 - 2022', gpa: '3.8' }
    ],
    experience: [
        { employer: 'Global Marketing Solutions', location: 'New York, NY', title: 'Marketing Coordinator', duration: 'June 2022 - Present',
          bullets: [
              { text: 'Managed social media campaigns across 3 platforms, increasing engagement by 40%.' },
              { text: 'Coordinated with cross-functional teams to launch 5 major product campaigns.' },
              { text: 'Analyzed market trends to optimize ad spend, reducing CPA by 15%.' }
          ] }
    ],
    volunteer: [
        { organization: 'Community Food Bank', location: 'Brooklyn, NY', title: 'Volunteer Shift Leader', duration: 'Jan 2023 - Present',
          bullets: [
              { text: 'Supervise groups of 15+ volunteers in food sorting and distribution.' },
              { text: 'Streamlined inventory tracking process, reducing waste by 20%.' }
          ] }
    ],
    certifications: [
        { name: 'Google Data Analytics Professional Certificate', issuer: 'Coursera', date: 'Aug 2023' }
    ],
    languages: [{ text: 'English (Native)' }, { text: 'Spanish (Professional Working Proficiency)' }],
    technologies: [{ text: 'Microsoft Office Suite (Advanced Excel)' }, { text: 'Google Analytics' }],
    isPlaceholder: true
};
