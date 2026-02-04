import { NextResponse } from "next/server"
import pdf from "pdf-parse"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 })
  }

  // Convert File → Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Extract text
  const data = await pdf(buffer)

  console.log("PDF text length:", data.text.length)

  return NextResponse.json({
    id: Date.now().toString(),
    name: file.name,
    pages: data.numpages,
    status: "ready",
  })
}
