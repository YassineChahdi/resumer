class Resume:
    def __init__(self, resume: dict):
        self.experience = [Experience(item) for item in resume["experience"]]
        self.projects = [Project(item) for item in resume["projects"]]
        self.techs = [Tech(item) for item in resume["technologies"]]
        self.languages = [Language(item) for item in resume["languages"]]

    def __str__(self) -> str:
        def metrics(obj, keys):
            def fmt(value):
                return f"{value:.2f}" if isinstance(value, float) else str(value)

            parts = []
            for key, label in keys:
                value = getattr(obj, key, None)
                if value is not None:
                    parts.append(f"{label}={fmt(value)}")
            return f" ({', '.join(parts)})" if parts else ""

        sections = []
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
        self.similarity = None
        self.impressiveness = None
        self.score = None

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
        self.similarity = None
        self.impressiveness = None
        self.score = None

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
    def __init__(self, tech: str):
        self.text = tech
        self.score = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "score": self.score,
        }


class Language:
    def __init__(self, language: str):
        self.text = language
        self.score = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "score": self.score,
        }


class Bullet:
    def __init__(self, bullet: dict):
        self.text = bullet.get("text")
        self.impressiveness = bullet.get("impressiveness")
        self.similarity = None
        self.score = None

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "impressiveness": self.impressiveness,
            "similarity": self.similarity,
            "score": self.score,
        }
