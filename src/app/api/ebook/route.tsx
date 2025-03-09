import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import EbookTemplate from '../../../utils/EbookTemplate';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const title = formData.get('title') as string || 'Translated E-Book';
    const author = formData.get('author') as string || '';

    if (!content) {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      );
    }

    // Ensure the tmp directory exists
    const tmpDir = join(process.cwd(), 'tmp');
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }

    // Process content to enhance formatting
    const enhancedContent = enhanceContent(content);
    
    // Generate PDF using React PDF
    const pdfBuffer = await renderToBuffer(
      <EbookTemplate 
        content={enhancedContent} 
        title={title} 
        author={author} 
      />
    );
    
    // Create response with PDF content
    const response = new NextResponse(pdfBuffer);
    
    // Set headers
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.pdf"`);

    return response;
  } catch (error: any) {
    console.error('E-book generation error:', error.message);
    return NextResponse.json(
      { error: `Failed to generate e-book: ${error.message}` },
      { status: 500 }
    );
  }
}

// Helper function to clean text
function cleanText(text: string): string {
  return text
    // Replace common OCR mistakes
    .replace(/¶/g, '') // Paragraph markers
    .replace(/•/g, '•') // Fix bullet points
    .replace(/\u2022/g, '•') // Unicode bullet point
    .replace(/"|"/g, '"') // Smart quotes
    .replace(/'/g, "'") // Smart apostrophes
    .replace(/…/g, '...') // Ellipsis
    .replace(/–/g, '-') // En dash
    .replace(/—/g, '-') // Em dash
    .replace(/\s{2,}/g, ' ') // Multiple spaces
    .replace(/\n{3,}/g, '\n\n') // Multiple line breaks
    .replace(/\r\n/g, '\n') // Windows line endings
    .replace(/[^\x00-\x7F]/g, match => { // Replace non-ASCII characters
      // Map common Unicode characters to ASCII equivalents
      const charMap: Record<string, string> = {
        '©': '(c)',
        '®': '(R)',
        '™': '(TM)',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        '°': 'deg',
        '±': '+/-',
        '×': 'x',
        '÷': '/',
        'é': 'e',
        'è': 'e',
        'ê': 'e',
        'ë': 'e',
        'à': 'a',
        'á': 'a',
        'â': 'a',
        'ä': 'a',
        'ô': 'o',
        'ö': 'o',
        'ò': 'o',
        'ó': 'o',
        'ù': 'u',
        'ú': 'u',
        'û': 'u',
        'ü': 'u',
        'ç': 'c',
      };
      return charMap[match] || '';
    });
}

// Helper function to enhance content formatting
function enhanceContent(content: string): string {
  // Clean the text first
  let enhancedContent = cleanText(content);
  
  // Improve recognition of section headers
  
  // 1. Find and format network terminology headers that appear in the text
  const networkTermRegex = /\n([A-Z][a-z]+(\s+[A-Z][a-z]+){1,3})\s*\n/g;
  enhancedContent = enhancedContent.replace(networkTermRegex, '\n\n# $1\n\n');
  
  // 2. Format single capitalized terms that might be section headers
  const singleTermRegex = /\n([A-Z][a-z]+)\s*\n(?![a-z])/g;
  enhancedContent = enhancedContent.replace(singleTermRegex, '\n\n# $1\n\n');
  
  // 3. Detect figure references
  const figureRegex = /\bFigure\s+(\d+-\d+|\d+\.\d+|\d+)\s+([A-Z][^\.]+\.)/g;
  enhancedContent = enhancedContent.replace(figureRegex, '\n\n**Figure $1**: $2\n\n');
  
  // 4. Identify and format definitions
  const definitionRegex = /\n([A-Z][a-z]+):\s+([A-Z][^\.]+\.)/g;
  enhancedContent = enhancedContent.replace(definitionRegex, '\n\n## $1\n$2\n\n');
  
  // 5. Add formatting for emphasis (try to identify phrases that might need emphasis)
  enhancedContent = enhancedContent.replace(/\b(important|note|remember|key|critical|essential|significant|crucial)\b/gi, 
    (match) => `**${match}**`);
  
  // 6. Add italics for academic or technical terms
  const technicalTerms = [
    'network', 'physical', 'transmission medium', 'communication', 'protocols',
    'internet', 'standardization', 'system', 'node', 'host', 'client', 'server'
  ];
  
  technicalTerms.forEach(term => {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    enhancedContent = enhancedContent.replace(regex, '*$1*');
  });
  
  // 7. Format bullet points consistently
  enhancedContent = enhancedContent.replace(/(?:^|\n)[-•∙] /gm, '\n* ');
  
  // 8. Ensure proper spacing around headers
  enhancedContent = enhancedContent
    .replace(/([^\n])(\n#+\s)/g, '$1\n\n$2')  // Add space before headers
    .replace(/(#+\s[^\n]+)(\n[^\n#])/g, '$1\n\n$2');  // Add space after headers
  
  // 9. Fix spacing around paragraphs
  enhancedContent = enhancedContent
    .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2')  // Ensure paragraph breaks after sentences
    .replace(/\n{3,}/g, '\n\n');  // Remove excessive line breaks
  
  // 10. Improve formatting of PDF extraction artifacts
  enhancedContent = enhancedContent
    .replace(/(\w)-\n(\w)/g, '$1$2') // Fix word breaks
    .replace(/(\w)\s*\n\s*(\w)/g, '$1 $2'); // Join lines within paragraphs
  
  return enhancedContent;
} 