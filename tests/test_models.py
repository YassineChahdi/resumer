"""
Unit tests for the data models (Resume, Experience, Project, Volunteer, etc.)
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models import Resume, Education, Experience, Project, Volunteer, Certification, Tech, Language, Bullet


class TestBullet:
    """Tests for the Bullet class."""
    
    def test_bullet_creation(self, sample_bullet_data):
        """Test bullet is created with correct fields."""
        bullet = Bullet(sample_bullet_data)
        assert bullet.text == "Developed a web application using React and Node.js"
        assert bullet.impressiveness == 0.8
        assert bullet.similarity is None
        assert bullet.score is None
    
    def test_bullet_empty_data(self):
        """Test bullet handles empty dict."""
        bullet = Bullet({})
        assert bullet.text is None
        assert bullet.impressiveness is None
    
    def test_bullet_calculate_score(self):
        """Test bullet score calculation."""
        bullet = Bullet({"text": "Test", "impressiveness": 0.8, "similarity": 0.6})
        score = bullet.calculate_score(sim_weight=0.4, imp_weight=0.6)
        expected = 0.6 * 0.4 + 0.8 * 0.6  # sim * sim_weight + imp * imp_weight
        assert score == pytest.approx(expected)
    
    def test_bullet_calculate_score_defaults(self):
        """Test bullet score calculation with missing values uses 0.5 default."""
        bullet = Bullet({"text": "Test"})
        score = bullet.calculate_score(sim_weight=0.4, imp_weight=0.6)
        expected = 0.5 * 0.4 + 0.5 * 0.6  # defaults to 0.5
        assert score == pytest.approx(expected)
    
    def test_bullet_to_dict(self, sample_bullet_data):
        """Test bullet serialization."""
        bullet = Bullet(sample_bullet_data)
        result = bullet.to_dict()
        assert result["text"] == sample_bullet_data["text"]
        assert result["impressiveness"] == sample_bullet_data["impressiveness"]


class TestExperience:
    """Tests for the Experience class."""
    
    def test_experience_creation(self, sample_experience_data):
        """Test experience is created with correct fields."""
        exp = Experience(sample_experience_data)
        assert exp.employer == "Tech Corp"
        assert exp.title == "Software Engineer"
        assert exp.location == "San Francisco, CA"
        assert len(exp.bullets) == 3
    
    def test_experience_avg_impressiveness(self, sample_experience_data):
        """Test average impressiveness calculation."""
        exp = Experience(sample_experience_data)
        avg = exp.avg_impressiveness()
        expected = (0.9 + 0.7 + 0.85) / 3
        assert avg == pytest.approx(expected)
    
    def test_experience_avg_impressiveness_empty(self):
        """Test average impressiveness with no bullets returns 0.5."""
        exp = Experience({
            "employer": "Test",
            "title": "Test",
            "location": "Test",
            "duration": "Test",
            "bullets": []
        })
        assert exp.avg_impressiveness() == 0.5
    
    def test_experience_calculate_score(self, sample_experience_data):
        """Test experience score calculation."""
        exp = Experience(sample_experience_data)
        exp.similarity = 0.7
        exp.impressiveness = 0.8
        score = exp.calculate_score(sim_weight=0.4, imp_weight=0.6)
        expected = 0.7 * 0.4 + 0.8 * 0.6
        assert score == pytest.approx(expected)
    
    def test_experience_sort_bullets_by_score(self, sample_experience_data):
        """Test bullets are sorted by score descending."""
        exp = Experience(sample_experience_data)
        # Set scores
        exp.bullets[0].score = 0.5
        exp.bullets[1].score = 0.9
        exp.bullets[2].score = 0.7
        
        exp.sort_bullets_by_score()
        
        assert exp.bullets[0].score == 0.9
        assert exp.bullets[1].score == 0.7
        assert exp.bullets[2].score == 0.5
    
    def test_experience_to_dict(self, sample_experience_data):
        """Test experience serialization."""
        exp = Experience(sample_experience_data)
        result = exp.to_dict()
        assert result["employer"] == "Tech Corp"
        assert len(result["bullets"]) == 3


class TestProject:
    """Tests for the Project class."""
    
    def test_project_creation(self, sample_project_data):
        """Test project is created with correct fields."""
        proj = Project(sample_project_data)
        assert proj.title == "Resume Builder"
        assert proj.languages == ["Python", "JavaScript", "React"]
        assert len(proj.bullets) == 2
    
    def test_project_avg_impressiveness(self, sample_project_data):
        """Test average impressiveness calculation."""
        proj = Project(sample_project_data)
        avg = proj.avg_impressiveness()
        expected = (0.85 + 0.9) / 2
        assert avg == pytest.approx(expected)
    
    def test_project_calculate_score(self, sample_project_data):
        """Test project score calculation."""
        proj = Project(sample_project_data)
        proj.similarity = 0.8
        proj.impressiveness = 0.85
        score = proj.calculate_score(sim_weight=0.4, imp_weight=0.6)
        expected = 0.8 * 0.4 + 0.85 * 0.6
        assert score == pytest.approx(expected)
    
    def test_project_to_dict(self, sample_project_data):
        """Test project serialization."""
        proj = Project(sample_project_data)
        result = proj.to_dict()
        assert result["title"] == "Resume Builder"
        assert result["languages"] == ["Python", "JavaScript", "React"]


class TestVolunteer:
    """Tests for the Volunteer class."""
    
    def test_volunteer_creation(self, sample_volunteer_data):
        """Test volunteer is created with correct fields."""
        vol = Volunteer(sample_volunteer_data)
        assert vol.organization == "Code for Good"
        assert vol.title == "Volunteer Developer"
        assert vol.location == "New York, NY"
        assert len(vol.bullets) == 2
    
    def test_volunteer_avg_impressiveness(self, sample_volunteer_data):
        """Test average impressiveness calculation."""
        vol = Volunteer(sample_volunteer_data)
        avg = vol.avg_impressiveness()
        expected = (0.75 + 0.65) / 2
        assert avg == pytest.approx(expected)
    
    def test_volunteer_calculate_score(self, sample_volunteer_data):
        """Test volunteer score calculation."""
        vol = Volunteer(sample_volunteer_data)
        vol.similarity = 0.6
        vol.impressiveness = 0.7
        score = vol.calculate_score(sim_weight=0.4, imp_weight=0.6)
        expected = 0.6 * 0.4 + 0.7 * 0.6
        assert score == pytest.approx(expected)
    
    def test_volunteer_sort_bullets_by_score(self, sample_volunteer_data):
        """Test volunteer bullets are sorted by score."""
        vol = Volunteer(sample_volunteer_data)
        vol.bullets[0].score = 0.3
        vol.bullets[1].score = 0.8
        
        vol.sort_bullets_by_score()
        
        assert vol.bullets[0].score == 0.8
        assert vol.bullets[1].score == 0.3
    
    def test_volunteer_to_dict(self, sample_volunteer_data):
        """Test volunteer serialization."""
        vol = Volunteer(sample_volunteer_data)
        result = vol.to_dict()
        assert result["organization"] == "Code for Good"
        assert len(result["bullets"]) == 2


class TestCertification:
    """Tests for the Certification class."""
    
    def test_certification_creation(self, sample_certification_data):
        """Test certification is created with correct fields."""
        cert = Certification(sample_certification_data)
        assert cert.name == "AWS Solutions Architect"
        assert cert.issuer == "Amazon Web Services"
        assert cert.date == "2023"
    
    def test_certification_empty_fields(self):
        """Test certification handles empty fields."""
        cert = Certification({})
        assert cert.name == ""
        assert cert.issuer == ""
        assert cert.date == ""
    
    def test_certification_to_dict(self, sample_certification_data):
        """Test certification serialization."""
        cert = Certification(sample_certification_data)
        result = cert.to_dict()
        assert result == sample_certification_data


class TestEducation:
    """Tests for the Education class."""
    
    def test_education_creation(self, sample_education_data):
        """Test education is created with correct fields."""
        edu = Education(sample_education_data)
        assert edu.est_name == "University of Technology"
        assert edu.degree == "B.S. in Computer Science"
        assert edu.gpa == "3.8"
    
    def test_education_to_dict(self, sample_education_data):
        """Test education serialization."""
        edu = Education(sample_education_data)
        result = edu.to_dict()
        assert result == sample_education_data


class TestResume:
    """Tests for the Resume class."""
    
    def test_resume_creation_tech(self, tech_resume):
        """Test tech resume is created correctly."""
        assert tech_resume.full_name == "John Developer"
        assert len(tech_resume.experience) == 1
        assert len(tech_resume.projects) == 1
        assert len(tech_resume.volunteer) == 0
        assert len(tech_resume.certifications) == 0
    
    def test_resume_creation_general(self, general_resume):
        """Test general resume is created correctly."""
        assert general_resume.full_name == "Jane Professional"
        assert len(general_resume.experience) == 1
        assert len(general_resume.projects) == 0
        assert len(general_resume.volunteer) == 1
        assert len(general_resume.certifications) == 1
    
    def test_all_bullets_includes_experience(self, tech_resume):
        """Test all_bullets includes experience bullets."""
        bullets = tech_resume.all_bullets()
        exp_bullet_texts = [b.text for b in tech_resume.experience[0].bullets]
        all_texts = [b.text for b in bullets]
        for text in exp_bullet_texts:
            assert text in all_texts
    
    def test_all_bullets_includes_projects(self, tech_resume):
        """Test all_bullets includes project bullets."""
        bullets = tech_resume.all_bullets()
        proj_bullet_texts = [b.text for b in tech_resume.projects[0].bullets]
        all_texts = [b.text for b in bullets]
        for text in proj_bullet_texts:
            assert text in all_texts
    
    def test_all_bullets_includes_volunteer(self, general_resume):
        """Test all_bullets includes volunteer bullets."""
        bullets = general_resume.all_bullets()
        vol_bullet_texts = [b.text for b in general_resume.volunteer[0].bullets]
        all_texts = [b.text for b in bullets]
        for text in vol_bullet_texts:
            assert text in all_texts
    
    def test_all_keywords(self, tech_resume):
        """Test all_keywords returns languages and technologies."""
        keywords = tech_resume.all_keywords()
        assert len(keywords) == 6  # 3 languages + 3 technologies
    
    def test_trim_experience_bullets(self, tech_resume):
        """Test trim limits experience bullets."""
        tech_resume.trim(exp_bullet_count=2, proj_bullet_count=5, tech_count=10, lang_count=10)
        assert len(tech_resume.experience[0].bullets) == 2
    
    def test_trim_project_bullets(self, tech_resume):
        """Test trim limits project bullets."""
        tech_resume.trim(exp_bullet_count=10, proj_bullet_count=1, tech_count=10, lang_count=10)
        assert len(tech_resume.projects[0].bullets) == 1
    
    def test_trim_volunteer_bullets(self, general_resume):
        """Test trim limits volunteer bullets."""
        general_resume.trim(exp_bullet_count=10, proj_bullet_count=10, tech_count=10, lang_count=10, vol_bullet_count=1)
        assert len(general_resume.volunteer[0].bullets) == 1
    
    def test_trim_technologies(self, tech_resume):
        """Test trim limits technologies."""
        tech_resume.trim(exp_bullet_count=10, proj_bullet_count=10, tech_count=2, lang_count=10)
        assert len(tech_resume.techs) == 2
    
    def test_trim_languages(self, tech_resume):
        """Test trim limits languages."""
        tech_resume.trim(exp_bullet_count=10, proj_bullet_count=10, tech_count=10, lang_count=2)
        assert len(tech_resume.languages) == 2
    
    def test_sort_experience_by_score(self, sample_tech_resume_data):
        """Test experiences are sorted by score descending."""
        # Add another experience
        sample_tech_resume_data["experience"].append({
            "employer": "Second Corp",
            "title": "Junior Dev",
            "location": "NYC",
            "duration": "2020-2021",
            "bullets": []
        })
        resume = Resume(sample_tech_resume_data)
        resume.experience[0].score = 0.5
        resume.experience[1].score = 0.9
        
        resume.sort_experience_by_score()
        
        assert resume.experience[0].score == 0.9
        assert resume.experience[1].score == 0.5
    
    def test_sort_projects_by_score(self, sample_tech_resume_data):
        """Test projects are sorted by score descending."""
        sample_tech_resume_data["projects"].append({
            "title": "Second Project",
            "languages": ["Go"],
            "bullets": []
        })
        resume = Resume(sample_tech_resume_data)
        resume.projects[0].score = 0.3
        resume.projects[1].score = 0.8
        
        resume.sort_projects_by_score()
        
        assert resume.projects[0].score == 0.8
        assert resume.projects[1].score == 0.3
    
    def test_sort_volunteer_by_score(self, sample_general_resume_data):
        """Test volunteer entries are sorted by score descending."""
        sample_general_resume_data["volunteer"].append({
            "organization": "Second Org",
            "location": "LA",
            "title": "Helper",
            "duration": "2020",
            "bullets": []
        })
        resume = Resume(sample_general_resume_data)
        resume.volunteer[0].score = 0.4
        resume.volunteer[1].score = 0.7
        
        resume.sort_volunteer_by_score()
        
        assert resume.volunteer[0].score == 0.7
        assert resume.volunteer[1].score == 0.4
    
    def test_sort_keywords_by_score(self, tech_resume):
        """Test keywords are sorted by score descending."""
        tech_resume.languages[0].score = 0.2
        tech_resume.languages[1].score = 0.9
        tech_resume.languages[2].score = 0.5
        
        tech_resume.sort_keywords_by_score()
        
        assert tech_resume.languages[0].score == 0.9
        assert tech_resume.languages[1].score == 0.5
        assert tech_resume.languages[2].score == 0.2
    
    def test_to_dict_roundtrip(self, sample_tech_resume_data):
        """Test Resume.to_dict produces valid dict that can recreate Resume."""
        resume = Resume(sample_tech_resume_data)
        result = resume.to_dict()
        
        # Verify structure
        assert result["full_name"] == sample_tech_resume_data["full_name"]
        assert len(result["experience"]) == len(sample_tech_resume_data["experience"])
        assert len(result["projects"]) == len(sample_tech_resume_data["projects"])
        
        # Verify can recreate
        resume2 = Resume(result)
        assert resume2.full_name == resume.full_name
