// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use pdf2json which is more reliable
    const PDFParser = (await import('pdf2json')).default;
    const pdfParser = new PDFParser();
    
    const text = await new Promise<string>((resolve, reject) => {
      let extractedText = '';
      
      pdfParser.on('pdfParser_dataError', reject);
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        extractedText = pdfData.Pages.map((page: any) => 
          page.Texts.map((text: any) => 
            decodeURIComponent(text.R[0].T)
          ).join(' ')
        ).join('\n');
        resolve(extractedText);
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    return NextResponse.json({ 
      success: true, 
      text,
      pages: text.split('\n').length 
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'PDF processing failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}