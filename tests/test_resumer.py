"""
Unit tests for the Resumer class (tailoring and export logic).
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models import Resume
from resumer import Resumer


class TestResumerTailoring:
    """Tests for resume tailoring functionality."""
    
    @pytest.fixture
    def resumer(self):
        """Create a Resumer instance."""
        return Resumer()
    
    def test_tailor_resume_returns_resume(self, resumer, tech_resume, sample_job_description):
        """Test tailor_resume returns a Resume object."""
        result = resumer.tailor_resume(tech_resume, sample_job_description)
        assert isinstance(result, Resume)
    
    def test_tailor_resume_sets_bullet_similarities(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring sets similarity scores on bullets."""
        resumer.tailor_resume(tech_resume, sample_job_description)
        
        # Check experience bullets have similarity scores
        for exp in tech_resume.experience:
            for bullet in exp.bullets:
                assert bullet.similarity is not None
                assert 0 <= bullet.similarity <= 1
    
    def test_tailor_resume_sets_bullet_scores(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring sets overall scores on bullets."""
        resumer.tailor_resume(tech_resume, sample_job_description)
        
        for exp in tech_resume.experience:
            for bullet in exp.bullets:
                assert bullet.score is not None
    
    def test_tailor_resume_sets_experience_scores(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring sets scores on experience entries."""
        resumer.tailor_resume(tech_resume, sample_job_description)
        
        for exp in tech_resume.experience:
            assert exp.similarity is not None
            assert exp.impressiveness is not None
            assert exp.score is not None
    
    def test_tailor_resume_sets_project_scores(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring sets scores on project entries."""
        resumer.tailor_resume(tech_resume, sample_job_description)
        
        for proj in tech_resume.projects:
            assert proj.similarity is not None
            assert proj.impressiveness is not None
            assert proj.score is not None
    
    def test_tailor_resume_sets_volunteer_scores(self, resumer, general_resume, sample_job_description):
        """Test that tailoring sets scores on volunteer entries."""
        resumer.tailor_resume(general_resume, sample_job_description)
        
        for vol in general_resume.volunteer:
            assert vol.similarity is not None
            assert vol.impressiveness is not None
            assert vol.score is not None
    
    def test_tailor_resume_sets_keyword_scores(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring sets scores on keywords."""
        resumer.tailor_resume(tech_resume, sample_job_description)
        
        for lang in tech_resume.languages:
            assert lang.score is not None
        for tech in tech_resume.techs:
            assert tech.score is not None
    
    def test_keyword_matching_exact_match(self, resumer, tech_resume):
        """Test that exact keyword match gets score 1.0."""
        job_desc = "We need someone with Python experience"
        resumer.tailor_resume(tech_resume, job_desc)
        
        python_lang = next((l for l in tech_resume.languages if l.text == "Python"), None)
        assert python_lang is not None
        assert python_lang.score == 1.0
    
    def test_keyword_matching_no_match(self, resumer, tech_resume):
        """Test that non-matching keyword gets score 0.0."""
        job_desc = "We need someone with Ruby experience"
        resumer.tailor_resume(tech_resume, job_desc)
        
        python_lang = next((l for l in tech_resume.languages if l.text == "Python"), None)
        assert python_lang is not None
        assert python_lang.score == 0.0
    
    def test_keyword_matching_case_insensitive(self, resumer, tech_resume):
        """Test that keyword matching is case insensitive."""
        job_desc = "We need someone with PYTHON experience"
        resumer.tailor_resume(tech_resume, job_desc)
        
        python_lang = next((l for l in tech_resume.languages if l.text == "Python"), None)
        assert python_lang is not None
        assert python_lang.score == 1.0
    
    def test_trim_respects_bullet_counts(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring respects bullet count limits."""
        resumer.tailor_resume(
            tech_resume, 
            sample_job_description,
            exp_bullet_count=2,
            proj_bullet_count=1
        )
        
        assert len(tech_resume.experience[0].bullets) <= 2
        assert len(tech_resume.projects[0].bullets) <= 1
    
    def test_trim_respects_keyword_counts(self, resumer, tech_resume, sample_job_description):
        """Test that tailoring respects keyword count limits."""
        resumer.tailor_resume(
            tech_resume, 
            sample_job_description,
            tech_count=2,
            lang_count=2
        )
        
        assert len(tech_resume.techs) <= 2
        assert len(tech_resume.languages) <= 2
    
    def test_bullets_sorted_by_score_after_tailoring(self, resumer, tech_resume, sample_job_description):
        """Test that bullets are sorted by score after tailoring."""
        resumer.tailor_resume(tech_resume, sample_job_description)
        
        for exp in tech_resume.experience:
            if len(exp.bullets) > 1:
                for i in range(len(exp.bullets) - 1):
                    assert exp.bullets[i].score >= exp.bullets[i + 1].score


class TestResumerLatexExport:
    """Tests for LaTeX export functionality."""
    
    @pytest.fixture
    def resumer(self):
        """Create a Resumer instance."""
        return Resumer()
    
    def test_latex_export_contains_name(self, resumer, tech_resume):
        """Test LaTeX export contains the full name."""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'templates', 'jake_template.tex')
        # Fallback if backend/data structure differs from assumption, assume running from root
        if not os.path.exists(template_path):
             template_path = os.path.abspath("data/templates/jake_template.tex")

        latex = resumer.resume_to_latex_from_template(
            tech_resume, 
            template_path=template_path
        )
        assert "John Developer" in latex
    
    def test_latex_export_contains_experience(self, resumer, tech_resume):
        """Test LaTeX export contains experience section."""
        template_path = os.path.abspath("data/templates/jake_template.tex")
        latex = resumer.resume_to_latex_from_template(
            tech_resume,
            template_path=template_path
        )
        assert "Tech Corp" in latex
        assert "Software Engineer" in latex
    
    def test_latex_export_contains_projects(self, resumer, tech_resume):
        """Test LaTeX export contains projects section."""
        template_path = os.path.abspath("data/templates/jake_template.tex")
        latex = resumer.resume_to_latex_from_template(
            tech_resume,
            template_path=template_path
        )
        assert "Resume Builder" in latex
    
    def test_latex_export_contains_volunteer(self, resumer, general_resume):
        """Test LaTeX export contains volunteer section."""
        template_path = os.path.abspath("data/templates/jake_template.tex")
        latex = resumer.resume_to_latex_from_template(
            general_resume,
            template_path=template_path
        )
        assert "Code for Good" in latex
        assert "Volunteer Developer" in latex
    
    def test_latex_export_contains_certifications(self, resumer, general_resume):
        """Test LaTeX export contains certifications section."""
        template_path = os.path.abspath("data/templates/jake_template.tex")
        latex = resumer.resume_to_latex_from_template(
            general_resume,
            template_path=template_path
        )
        assert "AWS Solutions Architect" in latex
    
    def test_latex_export_escapes_special_chars(self, resumer):
        """Test LaTeX export escapes special characters."""
        resume_data = {
            "full_name": "John & Jane's Resume",
            "contacts": {"phone": "", "email": "", "github": "", "linkedin": ""},
            "education": [],
            "experience": [],
            "projects": [],
            "volunteer": [],
            "certifications": [],
            "languages": [],
            "technologies": []
        }
        resume = Resume(resume_data)
        template_path = os.path.abspath("data/templates/jake_template.tex")
        latex = resumer.resume_to_latex_from_template(
            resume,
            template_path=template_path
        )
        # & should be escaped as \&
        assert r"\&" in latex
    
    def test_latex_export_empty_sections_no_crash(self, resumer):
        """Test LaTeX export handles empty sections gracefully."""
        resume_data = {
            "full_name": "Empty Resume",
            "contacts": {"phone": "", "email": "", "github": "", "linkedin": ""},
            "education": [],
            "experience": [],
            "projects": [],
            "volunteer": [],
            "certifications": [],
            "languages": [],
            "technologies": []
        }
        resume = Resume(resume_data)
        template_path = os.path.abspath("data/templates/jake_template.tex")
        latex = resumer.resume_to_latex_from_template(
            resume,
            template_path=template_path
        )
        assert "Empty Resume" in latex


class TestResumerHelpers:
    """Tests for helper methods."""
    
    @pytest.fixture
    def resumer(self):
        """Create a Resumer instance."""
        return Resumer()
    
    def test_escape_latex_ampersand(self, resumer):
        """Test ampersand is escaped."""
        result = resumer._escape_latex("Tom & Jerry")
        assert r"\&" in result
    
    def test_escape_latex_percent(self, resumer):
        """Test percent is escaped."""
        result = resumer._escape_latex("100% complete")
        assert r"\%" in result
    
    def test_escape_latex_underscore(self, resumer):
        """Test underscore is escaped."""
        result = resumer._escape_latex("variable_name")
        assert r"\_" in result
    
    def test_escape_latex_dollar(self, resumer):
        """Test dollar sign is escaped."""
        result = resumer._escape_latex("$100")
        assert r"\$" in result
    
    def test_escape_latex_hash(self, resumer):
        """Test hash is escaped."""
        result = resumer._escape_latex("#1 ranked")
        assert r"\#" in result
    
    def test_escape_latex_empty_string(self, resumer):
        """Test empty string returns empty."""
        result = resumer._escape_latex("")
        assert result == ""
    
    def test_escape_latex_none(self, resumer):
        """Test None returns empty string."""
        result = resumer._escape_latex(None)
        assert result == ""
