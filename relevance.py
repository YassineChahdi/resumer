from sentence_transformers import SentenceTransformer


class Relevance():
    def __init__(self, model_name="Qwen/Qwen3-Embedding-0.6B"):
        self.model = SentenceTransformer(model_name)
        self._embedding_cache = {}

    def _get_embeddings(self, strings: list[str]) -> list:
        to_embed = [s for s in strings if s not in self._embedding_cache]

        if to_embed:
            new_embeddings = self.model.encode(to_embed, prompt_name="query")
            for s, emb in zip(to_embed, new_embeddings):
                self._embedding_cache[s] = emb
        
        return [self._embedding_cache[s] for s in strings]

    def calculate_similarities(self, strings: list[str], target: str) -> list[float]:
        query_embeddings = self.model.encode(strings, prompt_name="query")
        document_embeddings = self.model.encode([target])

        # Compute the (cosine) similarity between the query and document embeddings
        similarities = self.model.similarity(query_embeddings, document_embeddings) # each in [-1, 1]
        # Normalize similarities
        normalized_sims = [(float(sim) + 1) / 2 for sim in similarities] # each in [0, 1]

        return normalized_sims
