import json
import subprocess
import tempfile
import shutil
import os
from models import Resume, Bullet
from relevance import Relevance


class Resumer:

    def __init__(self):
        self.relevance_engine = Relevance()

    def load_resume(self, data_file_path: str = "./data/data.json") -> Resume:
        with open(data_file_path, 'r') as f:
            data = json.load(f)
        return Resume(data)

    def export_to_json(self, resume: Resume, output_path: str = "./data/my_facts.json"):
        with open(output_path, 'w') as f:
            json.dump(resume.to_dict(), f)

    def export_to_pdf(self, resume: Resume, template_path: str = "./data/jake_template.tex", output_path: str = "./data/my_resume.pdf"):
        latex_resume = self.resume_to_latex_from_template(resume, template_path)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_file = os.path.join(temp_dir, "resume.tex")

            with open(tex_file, 'w') as f:
                f.write(latex_resume)

            for _ in range(2):
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_file],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    raise RuntimeError(f"pdflatex compilation failed:\n{result.stdout}\n{result.stderr}")

            pdf_file = os.path.join(temp_dir, "resume.pdf")
            shutil.copy(pdf_file, output_path)

    def export_to_latex(self, resume: Resume, template_path: str = "./data/jake_template.tex", output_path: str = "./data/my_resume.tex"):
        latex_resume = self.resume_to_latex_from_template(resume, template_path)
        
        with open(output_path, 'w') as f:
            f.write(latex_resume)
    
    def resume_to_latex_from_template(self, resume: Resume, template_path: str = "./data/jake_template.tex") -> str:
        with open(template_path, 'r') as f:
            content = f.read()
        
        content = content.replace("{{FULL_NAME}}", self._escape_latex(resume.full_name or ""))
        content = content.replace("{{PHONE}}", self._escape_latex(resume.contacts.get("phone", "")))
        content = content.replace("{{EMAIL}}", resume.contacts.get("email", ""))
        content = content.replace("{{GITHUB}}", resume.contacts.get("github", ""))
        content = content.replace("{{LINKEDIN}}", resume.contacts.get("linkedin", ""))
        
        content = content.replace("{{EDUCATION_ENTRIES}}", self._generate_education_latex(resume))
        content = content.replace("{{EXPERIENCE_ENTRIES}}", self._generate_experience_latex(resume))
        content = content.replace("{{PROJECT_ENTRIES}}", self._generate_projects_latex(resume))
        content = content.replace("{{LANGUAGES_LIST}}", self._generate_languages_list(resume))
        content = content.replace("{{TECHNOLOGIES_LIST}}", self._generate_technologies_list(resume))

        return content

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
    
    def _generate_education_latex(self, resume: Resume) -> str:
        entries = []
        for edu in resume.education:
            est_name = self._escape_latex(edu.est_name or "")
            location = self._escape_latex(edu.location or "")
            degree = self._escape_latex(edu.degree or "")
            gpa_str = f", GPA: {edu.gpa}" if edu.gpa else ""
            year = self._escape_latex(edu.year or "")
            
            entry = f"    \\resumeSubheading\n      {{{est_name}}}{{{location}}}\n      {{{degree}{gpa_str}}}{{{year}}}"
            entries.append(entry)
        return "\n".join(entries)
    
    def _generate_experience_latex(self, resume: Resume) -> str:
        entries = []
        for exp in resume.experience:
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
    
    def _generate_projects_latex(self, resume: Resume) -> str:
        entries = []
        for proj in resume.projects:
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
    
    def _generate_languages_list(self, resume: Resume) -> str:
        return ", ".join(self._escape_latex(lang.text or "") for lang in resume.languages)
    
    def _generate_technologies_list(self, resume: Resume) -> str:
        return ", ".join(self._escape_latex(tech.text or "") for tech in resume.techs)

    def build_resume(self, resume: Resume, job_description: str, exp_bullet_count: int = 7, proj_bullet_count: int = 5, tech_count: int = 5, lang_count: int = 5) -> Resume:
        self._populate_resume_metrics(resume, job_description)
        resume.trim(exp_bullet_count, proj_bullet_count, tech_count, lang_count)
        return resume

    def _populate_resume_metrics(self, resume: Resume, job_description: str):
        bullets = resume.all_bullets()
        
        bullet_sims = self._get_bullet_similarities(bullets, job_description)
        self._set_bullet_similarities(bullets, bullet_sims)
        
        bullet_scores = [bullet.calculate_score() for bullet in bullets]
        self._set_bullet_scores(bullets, bullet_scores)

        self._populate_experience_metrics(resume)
        self._populate_project_metrics(resume)

        keywords = resume.all_keywords()
        keyword_scores = self._get_keyword_scores(keywords, job_description)
        self._set_keyword_scores(keywords, keyword_scores)
        resume.sort_keywords_by_score()

    def _populate_experience_metrics(self, resume: Resume):
        for experience in resume.experience:
            experience.similarity = experience.avg_similarity()
            experience.impressiveness = experience.avg_impressiveness()
            experience.score = experience.calculate_score()
            experience.sort_bullets_by_score()
        resume.sort_experience_by_score()

    def _populate_project_metrics(self, resume: Resume):
        for project in resume.projects:
            project.similarity = project.avg_similarity()
            project.impressiveness = project.avg_impressiveness()
            project.score = project.calculate_score()
            project.sort_bullets_by_score()
        resume.sort_projects_by_score()

    def _get_bullet_similarities(self, bullets: list[Bullet], job_description: str) -> list[float]:
        bullet_texts = [bullet.text for bullet in bullets]
        return self.relevance_engine.calculate_similarities(bullet_texts, job_description)

    def _set_bullet_similarities(self, bullets: list[Bullet], similarities: list[float]):
        for bullet, sim in zip(bullets, similarities):
            bullet.similarity = sim

    def _set_bullet_scores(self, bullets: list[Bullet], scores: list[float]):
        for bullet, score in zip(bullets, scores):
            bullet.score = score

    def _get_keyword_scores(self, keywords: list, job_description: str) -> list[float]:
        return [self._calculate_keyword_score(kw.text) for kw in keywords]
    
    def _calculate_keyword_score(self, keyword: str) -> float:
        return 1

    def _set_keyword_scores(self, keywords: list, scores: list[float]):
        for keyword, score in zip(keywords, scores):
            keyword.score = score
