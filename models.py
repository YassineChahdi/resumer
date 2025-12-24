class Resume:
    def __init__(self, resume: dict):
        self.experience = [Experience(item) for item in resume["experience"]]
        self.projects = [Project(item) for item in resume["projects"]]
        self.techs = [Tech(item) for item in resume["technologies"]]
        self.languages = [Language(item) for item in resume["languages"]]

    def __str__(self) -> str:
        sections: list[str] = []
        if self.experience:
            lines = ["Experience"]
            for exp in self.experience:
                header = f"- {exp.title} @ {exp.employer}"
                if exp.duration:
                    header += f" ({exp.duration})"
                lines.append(header)
                lines.extend(f"  - {bullet.text}" for bullet in exp.bullets)
            sections.append("\n".join(lines))

        if self.projects:
            lines = ["Projects"]
            for project in self.projects:
                suffix = f" [{', '.join(project.languages)}]" if project.languages else ""
                lines.append(f"- {project.title}{suffix}")
                lines.extend(f"  - {bullet.text}" for bullet in project.bullets)
            sections.append("\n".join(lines))

        if self.techs:
            sections.append("Technologies\n" + ", ".join(getattr(item, "text", str(item)) for item in self.techs))
        if self.languages:
            sections.append("Languages\n" + ", ".join(getattr(item, "text", str(item)) for item in self.languages))
        return "\n\n".join(sections)

    def to_dict(self) -> dict:
        return {
            "experience": [item.to_dict() for item in self.experience],
            "projects": [item.to_dict() for item in self.projects],
            "technologies": [item.to_dict() for item in self.techs],
            "languages": [item.to_dict() for item in self.languages],
        }


class Experience:
    def __init__(self, experience: dict):
        self.employer = experience["employer"]
        self.title = experience["title"]
        self.location = experience["location"]
        self.duration = experience["duration"]
        self.bullets = [Bullet(bullet) for bullet in experience["bullets"]]

    def to_dict(self) -> dict:
        return {
            "employer": self.employer,
            "title": self.title,
            "location": self.location,
            "duration": self.duration,
            "bullets": [bullet.to_dict() for bullet in self.bullets],
        }


class Project:
    def __init__(self, project: dict):
        self.title = project["title"]
        self.languages = project["languages"]
        self.bullets = [Bullet(bullet) for bullet in project["bullets"]]

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "languages": self.languages,
            "bullets": [bullet.to_dict() for bullet in self.bullets],
        }


class Tech:
    def __init__(self, tech: str):
        self.text = tech
        self.similarity = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "similarity": self.similarity,
        }


class Language:
    def __init__(self, language: str):
        self.text = language
        self.similarity = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "similarity": self.similarity,
        }


class Bullet:
    def __init__(self, bullet: dict):
        self.text = bullet["text"]
        self.impressiveness = bullet["impressiveness"] or 0.5
        self.similarity = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "impressiveness": self.impressiveness,
            "similarity": self.similarity,
        }
