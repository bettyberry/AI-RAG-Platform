
type VectorRecord = {
  content: string
  embedding: number[]
  metadata?: Record<string, any>
}

// In-memory store (dev only)
const store: VectorRecord[] = []

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0))
  return dot / (magA * magB)
}

export const vectorDB = {
  async upsert(record: VectorRecord) {
    store.push(record)
  },

  async query({
    embedding,
    topK = 5,
    filter,
  }: {
    embedding: number[]
    topK?: number
    filter?: Record<string, any>
  }) {
    let results = store

    if (filter) {
      results = results.filter(r =>
        Object.entries(filter).every(
          ([key, value]) => r.metadata?.[key] === value
        )
      )
    }

    return results
      .map(r => ({
        ...r,
        score: cosineSimilarity(embedding, r.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  },
}