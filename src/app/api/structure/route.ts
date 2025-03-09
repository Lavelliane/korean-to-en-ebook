import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const title = formData.get('title') as string || 'Document';
    const imageData = formData.get('imageData') as string || ''; // Base64 encoded image data
    const figureReferences = formData.get('figureReferences') as string || '[]';

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Clean the text before processing
    const cleanedText = cleanText(text);

    // Parse figure references if provided
    let parsedFigureReferences = [];
    try {
      parsedFigureReferences = JSON.parse(figureReferences);
    } catch (error) {
      console.error('Error parsing figure references:', error);
    }

    // Create a prompt for structuring
    const prompt = `
Analyze the provided document and organize it into a structured e-book format.

Document title: ${title}
Content: ${cleanedText}

Your task:
1. Identify the document's title (use the provided title if appropriate)
2. Identify any subtitle or document description
3. Structure the content into sections, subsections, paragraphs, figures, terms, and lists
4. Preserve the original text and meaning - DO NOT summarize or paraphrase
5. Identify any figure references in the text (e.g., "Figure 1", "Figure 2.1", etc.) and mark them as figure type

Return a JSON object with this structure:
{
  "title": "Document Title",
  "subtitle": "Optional Subtitle",
  "content": [
    {
      "type": "section",
      "heading": "Section Heading",
      "content": [
        {
          "type": "paragraph",
          "text": "Paragraph text..."
        },
        {
          "type": "subsection",
          "heading": "Subsection Heading",
          "content": [
            {
              "type": "paragraph",
              "text": "Subsection paragraph text..."
            }
          ]
        },
        {
          "type": "figure",
          "caption": "Figure description"
        },
        {
          "type": "term",
          "term": "Technical term",
          "definition": "Definition of the term"
        },
        {
          "type": "list",
          "items": ["Item 1", "Item 2"],
          "ordered": true
        }
      ]
    }
  ]
}
`;

    // Make direct call to OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a document structuring expert that organizes documents into well-structured e-books." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const structureJson = response.choices[0]?.message?.content;
    
    if (!structureJson) {
      return NextResponse.json(
        { error: "Failed to generate document structure" },
        { status: 500 }
      );
    }

    try {
      // Parse the JSON response
      const structure = JSON.parse(structureJson);
      
      // Add images to figures if we have figure references
      if (imageData && parsedFigureReferences.length > 0) {
        addImagesToFigures(structure, imageData, parsedFigureReferences);
      }
      
      return NextResponse.json({ structure });
    } catch (parseError) {
      console.error("Error parsing structure JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid structure format returned" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error structuring document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to structure document' },
      { status: 500 }
    );
  }
}

// Helper function to add images to figures
function addImagesToFigures(structure: any, imageData: string, figureReferences: any[]): void {
  // Process figures in top-level content
  processContent(structure.content);
  
  // Recursive function to process content
  function processContent(contentArray: any[]): void {
    if (!contentArray || !Array.isArray(contentArray)) return;
    
    contentArray.forEach(item => {
      // Process figure item
      if (item.type === 'figure') {
        // Find matching figure reference
        const figureRef = figureReferences.find((ref: any) => 
          item.caption.includes(ref.caption) || 
          (ref.id && item.caption.includes(ref.id))
        );
        
        if (figureRef && figureRef.imageData) {
          item.image = figureRef.imageData;
        } else if (figureReferences.length === 1 && contentArray.filter(i => i.type === 'figure').length === 1) {
          // If we have only one figure and one image, use it
          item.image = imageData;
        }
      }
      
      // Process sections and subsections (recursive)
      if ((item.type === 'section' || item.type === 'subsection') && item.content) {
        processContent(item.content);
      }
    });
  }
}

function cleanText(text: string): string {
  // Replace common OCR errors and normalize whitespace
  return text
    // Replace Unicode replacement character
    .replace(/\uFFFD/g, '')
    // Replace multiple whitespace with a single space
    .replace(/\s+/g, ' ')
    // Fix common OCR errors with quotes
    .replace(/''|''|"|"/g, '"')
    // Fix common OCR errors with apostrophes
    .replace(/'/g, "'")
    // Fix common OCR errors with hyphens and dashes
    .replace(/—|–/g, '-')
    // Fix common OCR errors with ellipses
    .replace(/\.\.\./g, '…')
    // Normalize Unicode
    .normalize()
    .trim();
} 