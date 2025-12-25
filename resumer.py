import json
from models import Resume, Bullet, Experience, Project
from relevance import Relevance

class Resumer():

    def __init__(self, data_file_path="./data/data.json"):
        self.resume = self.extract_resume_from_json(data_file_path)
        self.bullets = [bullet for exp in self.resume.experience for bullet in exp.bullets] + [bullet for project in self.resume.projects for bullet in project.bullets]
        self.relevance_engine = Relevance()



    def extract_resume_from_json(self, filepath: str) -> Resume:
        with open(filepath, 'r') as f:
            data = json.load(f)

        return Resume(data)



    def populate_resume_metrics(self, job_description: str):
        bullet_sims = self.get_all_bullet_similarities(job_description)
        self.set_all_bullet_similarities(bullet_sims)
        bullet_scores = self.get_all_bullet_scores()
        self.set_all_bullet_scores(bullet_scores)

        self.populate_experience_metrics()
        self.populate_project_metrics()

        keyword_scores = self.get_all_keyword_scores(job_description)
        self.set_all_keyword_scores(keyword_scores)



    def calculate_experience_score(self, experience: Experience):
        return (experience.similarity + experience.impressiveness) / 2

    def populate_experience_metrics(self):
        for experience in self.resume.experience:
            experience.similarity = self.get_avg_bullets_similarity(experience.bullets)
            experience.impressiveness = self.get_avg_bullets_impressiveness(experience.bullets)
            experience.score = self.calculate_experience_score(experience)

    def calculate_project_score(self, project: Project):
        return (project.similarity + project.impressiveness) / 2

    def populate_project_metrics(self):
        for project in self.resume.projects:
            project.similarity = self.get_avg_bullets_similarity(project.bullets)
            project.impressiveness = self.get_avg_bullets_impressiveness(project.bullets)
            project.score = self.calculate_project_score(project)



    def calculate_bullet_score(self, bullet: Bullet) -> float:
        return (bullet.similarity + bullet.impressiveness) / 2
    
    def get_all_bullet_scores(self) -> list[float]:
        scores = [self.calculate_bullet_score(bullet) for bullet in self.bullets]

        return scores
    
    def set_all_bullet_scores(self, scores: list[float]):
        for bullet, score in zip(self.bullets, scores):
            bullet.score = score

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



    def calculate_keyword_score(self, keyword: str, job_description: str):
        return float(keyword in job_description) # 0.0 if in job desc, else 1.0

    def get_all_keyword_scores(self, job_description: str) -> list[float]:
        keywords = [lang.text for lang in self.resume.languages] + [tech.text for tech in self.resume.techs]
        scores = [self.calculate_keyword_score(keyword, job_description) for keyword in keywords]

        return scores
    
    def set_all_keyword_scores(self, scores: list[float]):
        keywords = [lang for lang in self.resume.languages] + [tech for tech in self.resume.techs]

        for keyword, score in zip(keywords, scores):
            keyword.score = score
