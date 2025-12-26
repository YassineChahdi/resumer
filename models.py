class Resume:
    def __init__(self, resume: dict):
        self.full_name = resume.get("full_name")
        self.contacts = resume.get("contacts", {})
        self.education = [Education(item) for item in resume.get("education", [])]
        self.experience = [Experience(item) for item in resume["experience"]]
        self.projects = [Project(item) for item in resume["projects"]]
        self.techs = [Tech(item) for item in resume["technologies"]]
        self.languages = [Language(item) for item in resume["languages"]]

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

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "impressiveness": self.impressiveness,
            "similarity": self.similarity,
            "score": self.score,
        }
