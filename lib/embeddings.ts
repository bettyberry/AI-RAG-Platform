import OpenAI from "openai"
import { splitText } from "./textSplitter"
import { vectorDB } from "./vectorDB"

const openai = new OpenAI()

export async function embedAndStore(
  text: string,
  meta: { source: string; name: string }
) {
  const chunks = await splitText(text)

  for (const chunk of chunks) {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: chunk,
    })

    await vectorDB.upsert({
      content: chunk,
      embedding: embedding.data[0].embedding,
      metadata: meta,
    })
  }
}