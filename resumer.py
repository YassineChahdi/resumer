import json
from models import Resume, Bullet, Experience, Project
from relevance import Relevance

class Resumer():

    def __init__(self, data_file_path="./data/data.json"):
        self.resume = self.extract_resume_from_json(data_file_path)
        self.exp_bullets = [bullet for exp in self.resume.experience for bullet in exp.bullets]
        self.proj_bullets = [bullet for project in self.resume.projects for bullet in project.bullets]
        self.bullets = self.exp_bullets + self.proj_bullets
        self.relevance_engine = Relevance()

    def extract_resume_from_json(self, filepath: str) -> Resume:
        with open(filepath, 'r') as f:
            data = json.load(f)
        return Resume(data)

    def export_to_json(self, output_path="./data/my_facts.json"):
        with open(output_path, 'w') as f:
            json.dump(self.resume.to_dict(), f)

    def export_to_latex(self, template_path="./data/jake_template.tex", output_path="./data/my_resume.tex"):
        with open(template_path, 'r') as f:
            content = f.read()
        
        content = content.replace("{{FULL_NAME}}", self._escape_latex(self.resume.full_name or ""))
        content = content.replace("{{PHONE}}", self._escape_latex(self.resume.contacts.get("phone", "")))
        content = content.replace("{{EMAIL}}", self.resume.contacts.get("email", ""))
        content = content.replace("{{GITHUB}}", self.resume.contacts.get("github", ""))
        content = content.replace("{{LINKEDIN}}", self.resume.contacts.get("linkedin", ""))
        
        content = content.replace("{{EDUCATION_ENTRIES}}", self._generate_education_latex())
        content = content.replace("{{EXPERIENCE_ENTRIES}}", self._generate_experience_latex())
        content = content.replace("{{PROJECT_ENTRIES}}", self._generate_projects_latex())
        content = content.replace("{{LANGUAGES_LIST}}", self._generate_languages_list())
        content = content.replace("{{TECHNOLOGIES_LIST}}", self._generate_technologies_list())
        
        with open(output_path, 'w') as f:
            f.write(content)
    
    def _escape_latex(self, text: str) -> str:
        if not text:
            return ""
        replacements = [
            ('\\', r'\textbackslash{}'),
            ('&', r'\&'),
            ('%', r'\%'),
            ('$', r'\$'),
            ('#', r'\#'),
            ('_', r'\_'),
            ('{', r'\{'),
            ('}', r'\}'),
            ('~', r'\textasciitilde{}'),
            ('^', r'\textasciicircum{}'),
        ]
        for char, escape in replacements:
            text = text.replace(char, escape)
        return text
    
    def _generate_education_latex(self) -> str:
        entries = []
        for edu in self.resume.education:
            est_name = self._escape_latex(edu.est_name or "")
            location = self._escape_latex(edu.location or "")
            degree = self._escape_latex(edu.degree or "")
            gpa_str = f", GPA: {edu.gpa}" if edu.gpa else ""
            year = self._escape_latex(edu.year or "")
            
            entry = f"    \\resumeSubheading\n      {{{est_name}}}{{{location}}}\n      {{{degree}{gpa_str}}}{{{year}}}"
            entries.append(entry)
        return "\n".join(entries)
    
    def _generate_experience_latex(self) -> str:
        entries = []
        for exp in self.resume.experience:
            employer = self._escape_latex(exp.employer or "")
            location = self._escape_latex(exp.location or "")
            title = self._escape_latex(exp.title or "")
            duration = self._escape_latex(exp.duration or "")
            
            entry_lines = [
                f"    \\resumeSubheading",
                f"      {{{employer}}}{{{location}}}",
                f"      {{{title}}}{{{duration}}}",
                f"      \\resumeItemListStart",
            ]
            for bullet in exp.bullets:
                bullet_text = self._escape_latex(bullet.text or "")
                entry_lines.append(f"        \\resumeItem{{{bullet_text}}}")
            entry_lines.append("      \\resumeItemListEnd")
            entries.append("\n".join(entry_lines))
        return "\n".join(entries)
    
    def _generate_projects_latex(self) -> str:
        entries = []
        for proj in self.resume.projects:
            title = self._escape_latex(proj.title or "")
            languages = ", ".join(self._escape_latex(lang) for lang in (proj.languages or []))
            
            entry_lines = [
                f"    \\resumeProjectHeading",
                f"        {{\\textbf{{{title}}} $|$ \\emph{{{languages}}}}}{{}}",
                f"        \\resumeItemListStart",
            ]
            for bullet in proj.bullets:
                bullet_text = self._escape_latex(bullet.text or "")
                entry_lines.append(f"            \\resumeItem{{{bullet_text}}}")
            entry_lines.append("        \\resumeItemListEnd")
            entries.append("\n".join(entry_lines))
        return "\n".join(entries)
    
    def _generate_languages_list(self) -> str:
        return ", ".join(self._escape_latex(lang.text or "") for lang in self.resume.languages)
    
    def _generate_technologies_list(self) -> str:
        return ", ".join(self._escape_latex(tech.text or "") for tech in self.resume.techs)

    def build_resume(self, job_description: str, exp_bullet_count=7, proj_bullet_count=5, tech_count=5, lang_count=5) -> Resume:
        self.populate_resume_metrics(job_description)
        self.trim_resume(exp_bullet_count, proj_bullet_count, tech_count, lang_count)
        return self.resume

    def trim_resume(self, exp_bullet_count=7, proj_bullet_count=5, tech_count=5, lang_count=5):
        for exp in self.resume.experience:
            exp.bullets = exp.bullets[:exp_bullet_count]
        for proj in self.resume.projects:
            proj.bullets = proj.bullets[:proj_bullet_count]
        self.resume.techs = self.resume.techs[:tech_count]
        self.resume.languages = self.resume.languages[:lang_count]

    def populate_resume_metrics(self, job_description: str):
        bullet_sims = self.get_all_bullet_similarities(job_description)
        self.set_all_bullet_similarities(bullet_sims)
        bullet_scores = self.get_all_bullet_scores()
        self.set_all_bullet_scores(bullet_scores)

        self.populate_experience_metrics()
        self.populate_project_metrics()

        keyword_scores = self.get_all_keyword_scores(job_description)
        self.set_all_keyword_scores(keyword_scores)

    def sort_experience_by_score(self):
        self.resume.experience.sort(key=lambda exp: exp.score, reverse=True)

    def calculate_experience_score(self, experience: Experience) -> float:
        return (experience.similarity + experience.impressiveness) / 2

    def populate_experience_metrics(self):
        for experience in self.resume.experience:
            experience.similarity = self.get_avg_bullets_similarity(experience.bullets)
            experience.impressiveness = self.get_avg_bullets_impressiveness(experience.bullets)
            experience.score = self.calculate_experience_score(experience)
        self.sort_experience_by_score()

    def sort_projects_by_score(self):
        self.resume.projects.sort(key=lambda proj: proj.score, reverse=True)

    def calculate_project_score(self, project: Project) -> float:
        return (project.similarity + project.impressiveness) / 2

    def populate_project_metrics(self):
        for project in self.resume.projects:
            project.similarity = self.get_avg_bullets_similarity(project.bullets)
            project.impressiveness = self.get_avg_bullets_impressiveness(project.bullets)
            project.score = self.calculate_project_score(project)
        self.sort_projects_by_score()

    def sort_all_bullets_by_score(self):
        for exp in self.resume.experience:
            exp.bullets.sort(key=lambda b: b.score, reverse=True)
        for proj in self.resume.projects:
            proj.bullets.sort(key=lambda b: b.score, reverse=True)

    def calculate_bullet_score(self, bullet: Bullet) -> float:
        return (bullet.similarity + bullet.impressiveness) / 2

    def get_all_bullet_scores(self) -> list[float]:
        scores = [self.calculate_bullet_score(bullet) for bullet in self.bullets]
        return scores

    def set_all_bullet_scores(self, scores: list[float]):
        for bullet, score in zip(self.bullets, scores):
            bullet.score = score
        self.sort_all_bullets_by_score()

    def get_all_bullet_similarities(self, job_description: str) -> list[float]:
        bullet_texts = [bullet.text for bullet in self.bullets]
        return self.relevance_engine.calculate_similarities(bullet_texts, job_description)

    def set_all_bullet_similarities(self, similarities: list[float]):
        for bullet, sim in zip(self.bullets, similarities):
            bullet.similarity = sim

    def get_avg_bullets_similarity(self, bullets: list[Bullet]) -> float:
        total_sum = sum(bullet.similarity if bullet.similarity else 0.5 for bullet in bullets)
        return total_sum / len(bullets)

    def get_avg_bullets_impressiveness(self, bullets: list[Bullet]) -> float:
        total_sum = sum(bullet.impressiveness if bullet.impressiveness else 0.5 for bullet in bullets)
        return total_sum / len(bullets)

    def get_avg_bullets_score(self, bullets: list[Bullet]) -> float:
        total_sum = sum(bullet.score if bullet.score else 0.5 for bullet in bullets)
        return total_sum / len(bullets)

    def sort_all_keywords_by_score(self):
        self.resume.techs.sort(key=lambda t: t.score, reverse=True)
        self.resume.languages.sort(key=lambda l: l.score, reverse=True)

    def calculate_keyword_score(self, keyword: str):
        #TODO
        return 1

    def get_all_keyword_scores(self, job_description: str) -> list[float]:
        keywords = [lang.text for lang in self.resume.languages] + [tech.text for tech in self.resume.techs]
        scores = [self.calculate_keyword_score(keyword) for keyword in keywords]
        return scores
    
    def set_all_keyword_scores(self, scores: list[float]):
        keywords = [lang for lang in self.resume.languages] + [tech for tech in self.resume.techs]
        for keyword, score in zip(keywords, scores):
            keyword.score = score
        self.sort_all_keywords_by_score()
