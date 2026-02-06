export async function splitText(text: string) {
  const chunkSize = 500;
  const chunkOverlap = 100;

  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - chunkOverlap;
    if (start < 0) start = 0;
  }

  return chunks;
}