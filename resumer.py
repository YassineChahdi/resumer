import json

from sentence_transformers import SentenceTransformer
from models import Resume, Bullet


class Resumer():
    def __init__(self, model="Qwen/Qwen3-Embedding-0.6B"):
        self.model = SentenceTransformer(model)    

    def build_resume_from_json(self, filepath: str) -> Resume:
        with open(filepath, 'r') as f:
            data = json.load(f)

        return Resume(data)

    def calculate_similarities(self, bullets: list[Bullet], job_description: str) -> list[float]:
        bullet_texts = [bullet.text for bullet in bullets]

        query_embeddings = self.model.encode(bullet_texts, prompt_name="query")
        document_embeddings = self.model.encode([job_description])

        # Compute the (cosine) similarity between the query and document embeddings
        similarities = self.model.similarity(query_embeddings, document_embeddings)

        return [float(sim) for sim in similarities]
