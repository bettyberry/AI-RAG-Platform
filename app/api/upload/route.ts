import { NextRequest, NextResponse } from "next/server";
// Use the modern fork that fixes the DOMMatrix error
import pdf from "pdf-parse-fork";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse-fork handles the server environment correctly
    const data = await pdf(buffer);

    return NextResponse.json({
      id: Math.random().toString(36).substring(7),
      text: data.text,
      pages: data.numpages,
      status: "ready"
    });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ 
      error: "Failed to parse PDF", 
      details: error.message 
    }, { status: 500 });
  }
}