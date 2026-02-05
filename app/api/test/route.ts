import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Test endpoint is working!",
    timestamp: new Date().toISOString(),
    status: "ok"
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      message: "POST request received",
      data: body,
      timestamp: new Date().toISOString(),
      status: "ok"
    });
  } catch {
    return NextResponse.json({
      message: "No JSON body provided",
      timestamp: new Date().toISOString(),
      status: "ok"
    });
  }
}