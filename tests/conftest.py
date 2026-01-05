"""
Shared test fixtures for the resume builder tests.
"""
import pytest
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models import Resume, Education, Experience, Project, Volunteer, Certification, Tech, Language, Bullet


# === Sample Data Fixtures ===

@pytest.fixture
def sample_bullet_data():
    """Sample bullet point data."""
    return {
        "text": "Developed a web application using React and Node.js",
        "impressiveness": 0.8,
        "similarity": None,
        "score": None
    }


@pytest.fixture
def sample_experience_data():
    """Sample experience entry data."""
    return {
        "employer": "Tech Corp",
        "title": "Software Engineer",
        "location": "San Francisco, CA",
        "duration": "Jan 2022 - Present",
        "bullets": [
            {"text": "Built REST APIs serving 1M requests/day", "impressiveness": 0.9},
            {"text": "Mentored 3 junior developers", "impressiveness": 0.7},
            {"text": "Reduced deployment time by 50%", "impressiveness": 0.85}
        ]
    }


@pytest.fixture
def sample_project_data():
    """Sample project entry data."""
    return {
        "title": "Resume Builder",
        "languages": ["Python", "JavaScript", "React"],
        "bullets": [
            {"text": "Built a full-stack resume tailoring application", "impressiveness": 0.85},
            {"text": "Integrated AI-powered similarity scoring", "impressiveness": 0.9}
        ]
    }


@pytest.fixture
def sample_volunteer_data():
    """Sample volunteer entry data."""
    return {
        "organization": "Code for Good",
        "location": "New York, NY",
        "title": "Volunteer Developer",
        "duration": "2021 - Present",
        "bullets": [
            {"text": "Built websites for 5 non-profit organizations", "impressiveness": 0.75},
            {"text": "Trained 10 volunteers in web development basics", "impressiveness": 0.65}
        ]
    }


@pytest.fixture
def sample_education_data():
    """Sample education entry data."""
    return {
        "est_name": "University of Technology",
        "location": "Boston, MA",
        "degree": "B.S. in Computer Science",
        "year": "2018 - 2022",
        "gpa": "3.8"
    }


@pytest.fixture
def sample_certification_data():
    """Sample certification entry data."""
    return {
        "name": "AWS Solutions Architect",
        "issuer": "Amazon Web Services",
        "date": "2023"
    }


@pytest.fixture
def sample_tech_resume_data(sample_experience_data, sample_project_data, sample_education_data):
    """Complete tech resume data."""
    return {
        "full_name": "John Developer",
        "contacts": {
            "phone": "(555) 123-4567",
            "email": "john@example.com",
            "github": "github.com/johndeveloper",
            "linkedin": "linkedin.com/in/johndeveloper"
        },
        "education": [sample_education_data],
        "experience": [sample_experience_data],
        "projects": [sample_project_data],
        "volunteer": [],
        "certifications": [],
        "languages": [{"text": "Python"}, {"text": "JavaScript"}, {"text": "Go"}],
        "technologies": [{"text": "React"}, {"text": "Docker"}, {"text": "PostgreSQL"}]
    }


@pytest.fixture
def sample_general_resume_data(sample_experience_data, sample_volunteer_data, sample_education_data, sample_certification_data):
    """Complete general resume data."""
    return {
        "full_name": "Jane Professional",
        "contacts": {
            "phone": "(555) 987-6543",
            "email": "jane@example.com",
            "github": "",
            "linkedin": "linkedin.com/in/janeprofessional"
        },
        "education": [sample_education_data],
        "experience": [sample_experience_data],
        "projects": [],
        "volunteer": [sample_volunteer_data],
        "certifications": [sample_certification_data],
        "languages": [{"text": "English"}, {"text": "Spanish"}],
        "technologies": [{"text": "Microsoft Office"}, {"text": "Salesforce"}]
    }


@pytest.fixture
def sample_job_description():
    """Sample job description for tailoring tests."""
    return """
    Senior Software Engineer
    
    We are looking for an experienced software engineer to join our team.
    
    Requirements:
    - 5+ years of experience with Python and JavaScript
    - Experience with React and Node.js
    - Strong understanding of REST APIs
    - Experience with Docker and Kubernetes
    - PostgreSQL or similar database experience
    
    Nice to have:
    - Experience with AI/ML
    - Open source contributions
    """


@pytest.fixture
def tech_resume(sample_tech_resume_data):
    """Create a Resume object for tech resume."""
    return Resume(sample_tech_resume_data)


@pytest.fixture
def general_resume(sample_general_resume_data):
    """Create a Resume object for general resume."""
    return Resume(sample_general_resume_data)
