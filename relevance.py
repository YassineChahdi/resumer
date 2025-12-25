from sentence_transformers import SentenceTransformer


class Relevance():
    def __init__(self, model_name="Qwen/Qwen3-Embedding-0.6B"):
        self.model = SentenceTransformer(model_name)

    def calculate_similarities(self, strings: list[str], target: str) -> list[float]:
        query_embeddings = self.model.encode(strings, prompt_name="query")
        document_embeddings = self.model.encode([target])

        # Compute the (cosine) similarity between the query and document embeddings
        similarities = self.model.similarity(query_embeddings, document_embeddings) # each in [-1, 1]
        # Normalize similarities
        normalized_sims = [(float(sim) + 1) / 2 for sim in similarities] # each in [0, 1]

        return normalized_sims
