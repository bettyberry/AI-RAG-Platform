import { createEmbedding } from "./embeddings"

let vectors: number[][] = []
let documents: string[] = []

export async function embedAndStore(chunks: string[]) {
  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk)
    vectors.push(embedding)
    documents.push(chunk)
  }
}

export async function similaritySearch(query: string, k = 4) {
  const queryEmbedding = await createEmbedding(query)

  const scores = vectors.map((v, i) => ({
    text: documents[i],
    score: cosineSimilarity(v, queryEmbedding),
  }))

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(s => s.text)
}

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const normA = Math.sqrt(a.reduce((s, x) => s + x * x, 0))
  const normB = Math.sqrt(b.reduce((s, x) => s + x * x, 0))
  return dot / (normA * normB)
}