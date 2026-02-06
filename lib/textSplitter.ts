import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

export function splitText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  })

  return splitter.splitText(text)
}