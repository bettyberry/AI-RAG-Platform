import { similaritySearch } from "./vectorStore"

export async function buildPrompt(question: string) {
  const contextChunks = await similaritySearch(question)

  return `
You are a helpful assistant.
Answer ONLY using the context below.
If the answer is not in the context, say "I don’t know."

Context:
${contextChunks.join("\n\n")}

Question:
${question}
`
}