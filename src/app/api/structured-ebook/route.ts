import { NextRequest } from 'next/server';
import { renderToBuffer } from '@/utils/StructuredEbookTemplate';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const structureJson = formData.get('structure') as string;
    const author = formData.get('author') as string || '';

    if (!structureJson) {
      return new Response(JSON.stringify({ error: 'No document structure provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse structure JSON
    let structure;
    try {
      structure = JSON.parse(structureJson);
      console.log(`Successfully parsed document structure. Title: ${structure.title || 'Untitled'}`);
    } catch (parseError) {
      console.error('Error parsing structure JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid document structure format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate structure has required properties
    if (!structure.title || !structure.content) {
      console.log('Adding missing properties to structure');
      structure.title = structure.title || 'Untitled Document';
      structure.content = structure.content || [];
    }
    
    try {
      console.log('Starting PDF generation process');
      
      // Generate PDF using react-pdf
      const pdfBuffer = await renderToBuffer(structure, author);
      
      // Check if buffer is valid
      if (!pdfBuffer) {
        throw new Error('PDF generation failed - buffer is undefined');
      }
      
      console.log(`PDF generated successfully, buffer size: ${pdfBuffer.length} bytes`);
      
      // Create filename from document title
      const safeTitle = structure.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeTitle || 'document'}.pdf`;
      
      // Return PDF file with proper headers
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate PDF' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 