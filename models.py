from __future__ import annotations


class Resume:
    def __init__(self, resume: dict):
        self.experience = [Experience(item) for item in resume["experience"]]
        self.projects = [Project(item) for item in resume["projects"]]
        self.techs = [Tech(item) for item in resume["technologies"]]
        self.languages = [Language(item) for item in resume["languages"]]

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
    def __init__(self, tech: dict):
        self.text = tech["text"]
        self.similarity = tech["similarity"]

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "similarity": self.similarity,
        }


class Language:
    def __init__(self, language: dict):
        self.text = language["text"]
        self.similarity = language["similarity"]

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "similarity": self.similarity,
        }


class Bullet:
    def __init__(self, bullet: dict):
        self.text = bullet["text"]
        self.impressiveness = bullet["impressiveness"]
        self.similarity = bullet["similarity"]

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "impressiveness": self.impressiveness,
            "similarity": self.similarity,
        }
