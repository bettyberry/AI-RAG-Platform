// lib/pdf.ts
export function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// lib/rag.ts
export function buildPrompt(context: string, query: string) {
  return `
    Use the following pieces of context to answer the user's question. 
    If you don't know the answer based on the context, just say you don't know.
    
    CONTEXT:
    ${context}
    
    USER QUESTION: 
    ${query}
  `;
}