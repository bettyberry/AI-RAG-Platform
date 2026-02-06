import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("=== /api/upload START ===");
  
  try {
    const headers = Object.fromEntries(req.headers.entries());
    console.log("Request headers:", headers);
    
    // Get form data
    const formData = await req.formData();
    console.log("Form data received");
    
    const file = formData.get("file") as File | null;
    
    if (!file) {
      console.error("No file in form data");
      const formDataKeys = Array.from(formData.keys());
      return NextResponse.json(
        { 
          success: false, 
          error: "No file uploaded",
          debug: { formDataKeys }
        }, 
        { status: 400 }
      );
    }

    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type
    const isPDF = file.type === "application/pdf" || 
                  file.name.toLowerCase().endsWith('.pdf');
    
    if (!isPDF) {
      console.error("Invalid file type:", file.type);
      return NextResponse.json(
        { 
          success: false, 
          error: "Only PDF files are allowed",
          receivedType: file.type,
          fileName: file.name
        }, 
        { status: 400 }
      );
    }

    // Check file size (optional)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error("File too large:", file.size);
      return NextResponse.json(
        { 
          success: false, 
          error: "File size exceeds 50MB limit",
          fileSize: file.size,
          maxSize
        }, 
        { status: 400 }
      );
    }

    
    console.log("Returning mock response (PDF parsing disabled for testing)");
    
    return NextResponse.json({
      success: true,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      pages: Math.max(1, Math.floor(file.size / 50000)), // Estimate pages
      status: "ready",
      text: `Mock text extracted from ${file.name}. This is a placeholder until PDF parsing is enabled. File size: ${file.size} bytes.`,
      debug: {
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        note: "PDF parsing is currently disabled for testing"
      }
    });

  } catch (error: any) {
    console.error("=== /api/upload ERROR ===");
    console.error("Error:", error);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS (important for file uploads)
export async function OPTIONS() {
  console.log("CORS OPTIONS request received");
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}