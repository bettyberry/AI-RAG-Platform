import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("=== DEBUG API ROUTE START ===");
    
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    console.log("File received:", file ? {
      name: file.name,
      type: file.type,
      size: file.size,
    } : "No file");
    
    if (!file) {
      console.log("No file uploaded");
      return NextResponse.json({ 
        success: false, 
        error: "No file uploaded",
        debug: { formDataKeys: Array.from(formData.keys()) }
      }, { status: 400 });
    }

    // Check file type
    if (file.type !== "application/pdf") {
      console.log("Invalid file type:", file.type);
      return NextResponse.json({ 
        success: false, 
        error: "Only PDF files are allowed",
        debug: { fileType: file.type }
      }, { status: 400 });
    }

    console.log("File validation passed");
    
    // Return a simple success response without PDF parsing
    return NextResponse.json({
      success: true,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      pages: 5, // Mock value
      status: "ready",
      text: "This is mock text from the debug endpoint.",
      debug: {
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type
      }
    });

  } catch (err) {
    console.error("DEBUG - Server error:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      debug: { 
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined
      }
    }, { status: 500 });
  }
}