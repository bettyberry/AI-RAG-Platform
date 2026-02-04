import { NextResponse } from "next/server";
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // For Node.js environment, we need to set up the worker differently
    // You can disable worker or use a different approach
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

    // Load PDF document
    const loadingTask = getDocument({ 
      data: uint8Array,
      useWorkerFetch: false, // Disable worker in Node.js
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdfDoc = await loadingTask.promise;

    let text = "";
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(" ") + "\n";
    }

    return NextResponse.json({
      id: Date.now().toString(),
      name: file.name,
      pages: pdfDoc.numPages,
      status: "ready",
      text,
    });
  } catch (err) {
    console.error("PDF parse failed", err);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}