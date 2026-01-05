import json
import subprocess
import tempfile
import shutil
import os
import re
from models import Resume, Bullet
from relevance import Relevance


class Resumer:

    def __init__(self):
        self.relevance_engine = Relevance()

    def load_resume(self, data_file_path: str = "../data/data.json") -> Resume:
        with open(data_file_path, 'r') as f:
            data = json.load(f)
        return Resume(data)

    def export_to_json(self, resume: Resume, output_path: str = "../data/my_facts.json"):
        with open(output_path, 'w') as f:
            json.dump(resume.to_dict(), f)

    def export_to_pdf(self, resume: Resume, template_path: str = "../data/templates/jake_template.tex", output_path: str = "../data/my_resume.pdf"):
        latex_resume = self.resume_to_latex_from_template(resume, template_path)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_file = os.path.join(temp_dir, "resume.tex")

            with open(tex_file, 'w') as f:
                f.write(latex_resume)

            # Use Tectonic (lightweight LaTeX) - handles everything in one pass
            result = subprocess.run(
                ["tectonic", "-X", "compile", tex_file],
                capture_output=True,
                text=True,
                cwd=temp_dir
            )
            if result.returncode != 0:
                raise RuntimeError(f"Tectonic compilation failed:\n{result.stdout}\n{result.stderr}")

            pdf_file = os.path.join(temp_dir, "resume.pdf")
            shutil.copy(pdf_file, output_path)

    def export_to_latex(self, resume: Resume, template_path: str = "../data/templates/jake_template.tex", output_path: str = "../data/my_resume.tex"):
        latex_resume = self.resume_to_latex_from_template(resume, template_path)
        
        with open(output_path, 'w') as f:
            f.write(latex_resume)
    
    def resume_to_latex_from_template(self, resume: Resume, template_path: str = "../data/templates/jake_template.tex") -> str:
        with open(template_path, 'r') as f:
            content = f.read()
        
        # Detect template type for section formatting
        is_mirage = "mirage" in template_path.lower()
        section_cmd = "\\section*" if is_mirage else "\\section"
        
        content = content.replace("{{FULL_NAME}}", self._escape_latex(resume.full_name or ""))
        content = content.replace("{{CONTACT_LINE}}", self._generate_contact_line(resume))
        
        # Each section is now self-contained (includes header) and returns "" if empty
        content = content.replace("{{EDUCATION_SECTION}}", self._generate_education_latex(resume, section_cmd))
        content = content.replace("{{EXPERIENCE_SECTION}}", self._generate_experience_latex(resume, section_cmd, is_mirage))
        content = content.replace("{{PROJECTS_SECTION}}", self._generate_projects_latex(resume, section_cmd))
        content = content.replace("{{VOLUNTEER_SECTION}}", self._generate_volunteer_latex(resume, section_cmd))
        content = content.replace("{{CERTIFICATIONS_SECTION}}", self._generate_certifications_latex(resume, section_cmd))
        content = content.replace("{{SKILLS_SECTION}}", self._generate_skills_latex(resume, section_cmd, is_mirage))

        return content

    def _generate_contact_line(self, resume: Resume) -> str:
        parts = []
        phone = resume.contacts.get("phone", "")
        email = resume.contacts.get("email", "")
        github = resume.contacts.get("github", "")
        linkedin = resume.contacts.get("linkedin", "")
        
        if phone:
            # Strip non-digit characters for the tel: URI, keep original for display
            phone_digits = ''.join(c for c in phone if c.isdigit() or c == '+')
            parts.append(f"\\href{{tel:{phone_digits}}}{{{self._escape_latex(phone)}}}")
        if email:
            parts.append(f"\\href{{mailto:{email}}}{{{email}}}")
        if github:
            parts.append(f"\\href{{https://{github}}}{{{github}}}")
        if linkedin:
            parts.append(f"\\href{{https://{linkedin}}}{{{linkedin}}}")
        
        return " $|$ ".join(parts)

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
    
    def _generate_education_latex(self, resume: Resume, section_cmd: str = "\\section") -> str:
        if not resume.education:
            return ""
        entries = []
        for edu in resume.education:
            est_name = self._escape_latex(edu.est_name or "")
            location = self._escape_latex(edu.location or "")
            degree = self._escape_latex(edu.degree or "")
            gpa_str = f", GPA: {edu.gpa}" if edu.gpa else ""
            year = self._escape_latex(edu.year or "")
            
            entry = f"    \\resumeSubheading\n      {{{est_name}}}{{{location}}}\n      {{{degree}{gpa_str}}}{{{year}}}"
            entries.append(entry)
        
        content = "\n".join(entries)
        return f"""{section_cmd}{{Education}}
  \\resumeSubHeadingListStart
{content}
  \\resumeSubHeadingListEnd"""
    
    def _generate_experience_latex(self, resume: Resume, section_cmd: str = "\\section", is_mirage: bool = False) -> str:
        if not resume.experience:
            return ""
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
        
        content = "\n".join(entries)
        title = "Professional Experience" if is_mirage else "Experience"
        return f"""{section_cmd}{{{title}}}
  \\resumeSubHeadingListStart
{content}
  \\resumeSubHeadingListEnd"""
    
    def _generate_projects_latex(self, resume: Resume, section_cmd: str = "\\section") -> str:
        if not resume.projects:
            return ""
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
        
        content = "\n".join(entries)
        return f"""{section_cmd}{{Projects}}
    \\resumeSubHeadingListStart
{content}
    \\resumeSubHeadingListEnd"""

    def _generate_volunteer_latex(self, resume: Resume, section_cmd: str = "\\section") -> str:
        if not resume.volunteer:
            return ""
        entries = []
        for vol in resume.volunteer:
            organization = self._escape_latex(vol.organization or "")
            location = self._escape_latex(vol.location or "")
            title = self._escape_latex(vol.title or "")
            duration = self._escape_latex(vol.duration or "")
            
            # Use resumeSubheading to match Experience format exactly (Organization, Location, Title, Duration)
            entry_lines = [
                f"    \\resumeSubheading",
                f"      {{{organization}}}{{{location}}}",
                f"      {{{title}}}{{{duration}}}",
                f"      \\resumeItemListStart",
            ]
            for bullet in vol.bullets:
                bullet_text = self._escape_latex(bullet.text or "")
                entry_lines.append(f"            \\resumeItem{{{bullet_text}}}")
            entry_lines.append("    \\resumeItemListEnd")
            entries.append("\n".join(entry_lines))
        
        content = "\n".join(entries)
        return f"""{section_cmd}{{Volunteer Work}}
    \\resumeSubHeadingListStart
{content}
    \\resumeSubHeadingListEnd"""

    def _generate_certifications_latex(self, resume: Resume, section_cmd: str = "\\section") -> str:
        if not resume.certifications:
            return ""
        entries = []
        for cert in resume.certifications:
            name = self._escape_latex(cert.name or "")
            issuer = self._escape_latex(cert.issuer or "")
            date = self._escape_latex(cert.date or "")
            
            # Format: Left(Name - Issuer) Right(Date)
            left_content = f"\\textbf{{{name}}}"
            if issuer:
                left_content += f" -- {issuer}"
            
            # Use simple hfill layout - safer than tabular inside section
            entries.append(f"    {left_content} \\hfill {date}\\\\")
        
        content = "\n".join(entries)
        return f"""{section_cmd}{{Certifications}}
{content}"""
    
    def _generate_skills_latex(self, resume: Resume, section_cmd: str = "\\section", is_mirage: bool = False) -> str:
        langs = ", ".join(self._escape_latex(lang.text or "") for lang in resume.languages)
        techs = ", ".join(self._escape_latex(tech.text or "") for tech in resume.techs)
        
        if not langs and not techs:
            return ""
        
        title = "Skills \\& Interests" if is_mirage else "Skills"
        
        if is_mirage:
            # Mirage uses itemize list format
            items = []
            if langs:
                items.append(f"    \\item \\textbf{{Languages:}} {langs}")
            if techs:
                items.append(f"    \\item \\textbf{{Technologies:}} {techs}")
            content = "\n".join(items)
            return f"""{section_cmd}{{{title}}}
\\begin{{itemize}}
{content}
\\end{{itemize}}"""
        else:
            # Jake template format
            items = []
            if langs:
                items.append(f"    \\textbf{{Languages}}{{: {langs}}}")
            if techs:
                items.append(f"    \\textbf{{Technologies}}{{: {techs}}}")
            content = " \\\\ \n".join(items)
            return f"""{section_cmd}{{{title}}}
 \\begin{{itemize}}[leftmargin=0.15in, label={{}}]
    \\small{{\\item{{
{content}
    }}}}
 \\end{{itemize}}"""

    def tailor_resume(self, resume: Resume, job_description: str, exp_bullet_count: int = 7, proj_bullet_count: int = 5, tech_count: int = 5, lang_count: int = 5, vol_bullet_count: int = 5) -> Resume:
        self._populate_resume_metrics(resume, job_description)
        resume.trim(exp_bullet_count, proj_bullet_count, tech_count, lang_count, vol_bullet_count)
        return resume

    def _populate_resume_metrics(self, resume: Resume, job_description: str):
        bullets = resume.all_bullets()
        
        bullet_sims = self._get_bullet_similarities(bullets, job_description)
        self._set_bullet_similarities(bullets, bullet_sims)
        
        bullet_scores = [bullet.calculate_score(sim_weight=0.4, imp_weight=0.6) for bullet in bullets]
        self._set_bullet_scores(bullets, bullet_scores)

        self._populate_experience_metrics(resume)
        self._populate_project_metrics(resume)
        self._populate_volunteer_metrics(resume)

        keywords = resume.all_keywords()
        keyword_scores = self._get_keyword_scores(keywords, job_description)
        self._set_keyword_scores(keywords, keyword_scores)
        resume.sort_keywords_by_score()

    def _populate_experience_metrics(self, resume: Resume):
        for experience in resume.experience:
            experience.similarity = experience.avg_similarity()
            experience.impressiveness = experience.avg_impressiveness()
            experience.score = experience.calculate_score(sim_weight=0.4, imp_weight=0.6)
            experience.sort_bullets_by_score()
        resume.sort_experience_by_score()

    def _populate_project_metrics(self, resume: Resume):
        for project in resume.projects:
            project.similarity = project.avg_similarity()
            project.impressiveness = project.avg_impressiveness()
            project.score = project.calculate_score(sim_weight=0.4, imp_weight=0.6)
            project.sort_bullets_by_score()
        resume.sort_projects_by_score()

    def _populate_volunteer_metrics(self, resume: Resume):
        for volunteer in resume.volunteer:
            volunteer.similarity = volunteer.avg_similarity()
            volunteer.impressiveness = volunteer.avg_impressiveness()
            volunteer.score = volunteer.calculate_score(sim_weight=0.4, imp_weight=0.6)
            volunteer.sort_bullets_by_score()
        resume.sort_volunteer_by_score()

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
        return [self._calculate_keyword_score(kw.text, job_description) for kw in keywords]
    
    def _calculate_keyword_score(self, keyword: str, job_description: str) -> float:
        pattern = rf'\b{re.escape(keyword)}\b'
        return 1.0 if re.search(pattern, job_description, re.IGNORECASE) else 0.0

    def _set_keyword_scores(self, keywords: list, scores: list[float]):
        for keyword, score in zip(keywords, scores):
            keyword.score = score
