import { NextResponse } from "next/server";
import pdf from "pdf-parse"; // npm install pdf-parse
import { splitText } from "@/lib/textSplitter";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfData = await pdf(buffer);
  const chunks = await splitText(pdfData.text);

  return NextResponse.json({
    success: true,
    name: file.name,
    chunks,
  });
}