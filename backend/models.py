class Resume:
    def __init__(self, resume: dict):
        self.full_name = resume.get("full_name")
        self.contacts = resume.get("contacts", {})
        self.education = [Education(item) for item in resume.get("education", [])]
        self.experience = [Experience(item) for item in resume.get("experience", [])]
        self.projects = [Project(item) for item in resume.get("projects", [])]
        self.volunteer = [Volunteer(item) for item in resume.get("volunteer", [])]
        self.certifications = [Certification(item) for item in resume.get("certifications", [])]
        self.techs = [Tech(item) for item in resume.get("technologies", [])]
        self.languages = [Language(item) for item in resume.get("languages", [])]

    def all_bullets(self) -> list["Bullet"]:
        exp_bullets = [bullet for exp in self.experience for bullet in exp.bullets]
        proj_bullets = [bullet for project in self.projects for bullet in project.bullets]
        vol_bullets = [bullet for vol in self.volunteer for bullet in vol.bullets]
        return exp_bullets + proj_bullets + vol_bullets

    def all_keywords(self) -> list:
        return self.languages + self.techs

    def trim(self, exp_bullet_count: int, proj_bullet_count: int, tech_count: int, lang_count: int, vol_bullet_count: int = 5):
        for exp in self.experience:
            exp.bullets = exp.bullets[:exp_bullet_count]
        for proj in self.projects:
            proj.bullets = proj.bullets[:proj_bullet_count]
        for vol in self.volunteer:
            vol.bullets = vol.bullets[:vol_bullet_count]
        self.techs = self.techs[:tech_count]
        self.languages = self.languages[:lang_count]

    def sort_experience_by_score(self):
        self.experience.sort(key=lambda exp: exp.score if exp.score is not None else 0, reverse=True)

    def sort_projects_by_score(self):
        self.projects.sort(key=lambda proj: proj.score if proj.score is not None else 0, reverse=True)

    def sort_volunteer_by_score(self):
        self.volunteer.sort(key=lambda vol: vol.score if vol.score is not None else 0, reverse=True)

    def sort_keywords_by_score(self):
        self.techs.sort(key=lambda t: t.score if t.score is not None else 0, reverse=True)
        self.languages.sort(key=lambda l: l.score if l.score is not None else 0, reverse=True)

    def __str__(self) -> str:
        def fmt(value):
            return f"{value:.2f}" if isinstance(value, float) else str(value)

        def metrics(obj, keys):
            parts = []
            for key, label in keys:
                value = getattr(obj, key, None)
                if value is not None:
                    parts.append(f"{label}={fmt(value)}")
            return f" ({', '.join(parts)})" if parts else ""

        sections = []
        header_lines = []
        if self.full_name:
            header_lines.append(self.full_name)
        if self.contacts:
            contact_parts = [
                self.contacts.get("phone"),
                self.contacts.get("email"),
                self.contacts.get("github"),
                self.contacts.get("linkedin"),
            ]
            contact_parts = [part for part in contact_parts if part]
            if contact_parts:
                header_lines.append(" | ".join(contact_parts))
        if header_lines:
            sections.append("\n".join(header_lines))

        if self.education:
            lines = ["Education"]
            for edu in self.education:
                header = f"- {edu.degree} @ {edu.est_name}" if edu.degree and edu.est_name else f"- {edu.est_name or edu.degree}"
                details = []
                if edu.location:
                    details.append(edu.location)
                if edu.gpa is not None:
                    details.append(f"GPA {fmt(edu.gpa)}")
                if edu.year:
                    details.append(edu.year)
                if details:
                    header += f" ({', '.join(details)})"
                lines.append(header)
            sections.append("\n".join(lines))

        if self.experience:
            lines = ["Experience"]
            for exp in self.experience:
                header = f"- {exp.title} @ {exp.employer}"
                if exp.duration:
                    header += f" ({exp.duration})"
                header += metrics(exp, [("similarity", "sim"), ("impressiveness", "imp"), ("score", "score")])
                lines.append(header)
                lines.extend(
                    f"  - {bullet.text}{metrics(bullet, [('impressiveness', 'imp'), ('similarity', 'sim'), ('score', 'score')])}"
                    for bullet in exp.bullets
                )
            sections.append("\n".join(lines))

        if self.projects:
            lines = ["Projects"]
            for project in self.projects:
                suffix = f" [{', '.join(project.languages)}]" if project.languages else ""
                header = f"- {project.title}{suffix}"
                header += metrics(project, [("similarity", "sim"), ("impressiveness", "imp"), ("score", "score")])
                lines.append(header)
                lines.extend(
                    f"  - {bullet.text}{metrics(bullet, [('impressiveness', 'imp'), ('similarity', 'sim'), ('score', 'score')])}"
                    for bullet in project.bullets
                )
            sections.append("\n".join(lines))

        if self.techs:
            tech_items = [f"{item.text}{metrics(item, [('score', 'score')])}" for item in self.techs]
            sections.append("Technologies\n" + ", ".join(tech_items))
        if self.languages:
            language_items = [f"{item.text}{metrics(item, [('score', 'score')])}" for item in self.languages]
            sections.append("Languages\n" + ", ".join(language_items))
        return "\n\n".join(sections)

    def to_dict(self) -> dict:
        return {
            "full_name": self.full_name,
            "contacts": self.contacts,
            "education": [item.to_dict() for item in self.education],
            "experience": [item.to_dict() for item in self.experience],
            "projects": [item.to_dict() for item in self.projects],
            "volunteer": [item.to_dict() for item in self.volunteer],
            "certifications": [item.to_dict() for item in self.certifications],
            "technologies": [item.to_dict() for item in self.techs],
            "languages": [item.to_dict() for item in self.languages],
        }


class Education:
    def __init__(self, education: dict):
        self.est_name = education.get("est_name")
        self.location = education.get("location")
        self.degree = education.get("degree")
        self.gpa = education.get("gpa")
        self.year = education.get("year")

    def to_dict(self) -> dict:
        return {
            "est_name": self.est_name,
            "location": self.location,
            "degree": self.degree,
            "gpa": self.gpa,
            "year": self.year,
        }


class Experience:
    def __init__(self, experience: dict):
        self.employer = experience["employer"]
        self.title = experience["title"]
        self.location = experience["location"]
        self.duration = experience["duration"]
        self.bullets = [Bullet(bullet) for bullet in experience["bullets"]]
        self.similarity = experience.get("similarity")
        self.impressiveness = experience.get("impressiveness")
        self.score = experience.get("score")

    def calculate_score(self, sim_weight: float, imp_weight: float) -> float:
        sim = self.similarity if self.similarity is not None else 0.5
        imp = self.impressiveness if self.impressiveness is not None else 0.5
        return sim * sim_weight + imp * imp_weight

    def avg_similarity(self) -> float:
        if not self.bullets:
            return 0.5
        total = sum(bullet.similarity if bullet.similarity else 0.5 for bullet in self.bullets)
        return total / len(self.bullets)

    def avg_impressiveness(self) -> float:
        if not self.bullets:
            return 0.5
        total = sum(bullet.impressiveness if bullet.impressiveness else 0.5 for bullet in self.bullets)
        return total / len(self.bullets)

    def sort_bullets_by_score(self):
        self.bullets.sort(key=lambda b: b.score if b.score is not None else 0, reverse=True)

    def to_dict(self) -> dict:
        return {
            "employer": self.employer,
            "title": self.title,
            "location": self.location,
            "duration": self.duration,
            "bullets": [bullet.to_dict() for bullet in self.bullets],
            "similarity": self.similarity,
            "impressiveness": self.impressiveness,
            "score": self.score,
        }


class Project:
    def __init__(self, project: dict):
        self.title = project["title"]
        self.languages = project["languages"]
        self.bullets = [Bullet(bullet) for bullet in project["bullets"]]
        self.similarity = project.get("similarity")
        self.impressiveness = project.get("impressiveness")
        self.score = project.get("score")

    def calculate_score(self, sim_weight: float, imp_weight: float) -> float:
        sim = self.similarity if self.similarity is not None else 0.5
        imp = self.impressiveness if self.impressiveness is not None else 0.5
        return sim * sim_weight + imp * imp_weight

    def avg_similarity(self) -> float:
        if not self.bullets:
            return 0.5
        total = sum(bullet.similarity if bullet.similarity else 0.5 for bullet in self.bullets)
        return total / len(self.bullets)

    def avg_impressiveness(self) -> float:
        if not self.bullets:
            return 0.5
        total = sum(bullet.impressiveness if bullet.impressiveness else 0.5 for bullet in self.bullets)
        return total / len(self.bullets)

    def sort_bullets_by_score(self):
        self.bullets.sort(key=lambda b: b.score if b.score is not None else 0, reverse=True)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "languages": self.languages,
            "bullets": [bullet.to_dict() for bullet in self.bullets],
            "similarity": self.similarity,
            "impressiveness": self.impressiveness,
            "score": self.score,
        }


class Tech:
    def __init__(self, tech: dict):
        self.text = tech.get("text")
        self.score = tech.get("score")

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "score": self.score,
        }


class Language:
    def __init__(self, language: dict):
        self.text = language.get("text")
        self.score = language.get("score")

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "score": self.score,
        }


class Bullet:
    def __init__(self, bullet: dict):
        self.text = bullet.get("text")
        self.impressiveness = bullet.get("impressiveness")
        self.similarity = bullet.get("similarity")
        self.score = bullet.get("score")

    def calculate_score(self, sim_weight: float, imp_weight: float) -> float:
        sim = self.similarity if self.similarity is not None else 0.5
        imp = self.impressiveness if self.impressiveness is not None else 0.5
        return sim * sim_weight + imp * imp_weight

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "impressiveness": self.impressiveness,
            "similarity": self.similarity,
            "score": self.score,
        }


class Volunteer:
    def __init__(self, volunteer: dict):
        self.organization = volunteer.get("organization", "")
        self.location = volunteer.get("location", "")
        self.title = volunteer.get("title", "")
        self.duration = volunteer.get("duration", "")
        self.bullets = [Bullet(bullet) for bullet in volunteer.get("bullets", [])]
        self.similarity = volunteer.get("similarity")
        self.impressiveness = volunteer.get("impressiveness")
        self.score = volunteer.get("score")

    def calculate_score(self, sim_weight: float, imp_weight: float) -> float:
        sim = self.similarity if self.similarity is not None else 0.5
        imp = self.impressiveness if self.impressiveness is not None else 0.5
        return sim * sim_weight + imp * imp_weight

    def avg_similarity(self) -> float:
        if not self.bullets:
            return 0.5
        total = sum(bullet.similarity if bullet.similarity else 0.5 for bullet in self.bullets)
        return total / len(self.bullets)

    def avg_impressiveness(self) -> float:
        if not self.bullets:
            return 0.5
        total = sum(bullet.impressiveness if bullet.impressiveness else 0.5 for bullet in self.bullets)
        return total / len(self.bullets)

    def sort_bullets_by_score(self):
        self.bullets.sort(key=lambda b: b.score if b.score is not None else 0, reverse=True)

    def to_dict(self) -> dict:
        return {
            "organization": self.organization,
            "location": self.location,
            "title": self.title,
            "duration": self.duration,
            "bullets": [bullet.to_dict() for bullet in self.bullets],
            "similarity": self.similarity,
            "impressiveness": self.impressiveness,
            "score": self.score,
        }


class Certification:
    """Certification entry - name, issuer, and date."""
    def __init__(self, certification: dict):
        self.name = certification.get("name", "")
        self.issuer = certification.get("issuer", "")
        self.date = certification.get("date", "")

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "issuer": self.issuer,
            "date": self.date,
        }
