export function buildPrompt(context: string, question: string) {
  return `
You are an expert AI. Answer ONLY using the context below.

Context:
${context}

Question:
${question}
`
}