import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define Zod schemas for our e-book structure
const ParagraphSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string(),
});

const TermSchema = z.object({
  type: z.literal('term'),
  term: z.string(),
  definition: z.string(),
});

const ListSchema = z.object({
  type: z.literal('list'),
  items: z.array(z.string()),
  ordered: z.boolean().optional(),
});

const FigureSchema = z.object({
  type: z.literal('figure'),
  caption: z.string(),
  image: z.string().optional(),
});

// Define recursive types for nested structures
const ContentItemSchema: any = z.union([
  ParagraphSchema,
  TermSchema,
  ListSchema,
  FigureSchema,
  z.lazy(() => SubsectionSchema),
]);

const SubsectionSchema = z.object({
  type: z.literal('subsection'),
  heading: z.string(),
  content: z.array(ContentItemSchema),
});

const SectionSchema = z.object({
  type: z.literal('section'),
  heading: z.string(),
  content: z.array(ContentItemSchema),
});

const DocumentSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  content: z.array(SectionSchema),
});

// Create a parser based on the Zod schema
const outputParser = StructuredOutputParser.fromZodSchema(DocumentSchema);

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

    // Get the format instructions from our parser
    const formatInstructions = outputParser.getFormatInstructions();

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

${formatInstructions}
`;

    try {
      // Make direct call to OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a document structuring expert that organizes documents into well-structured e-books. Always return valid, parseable JSON that matches the format instructions exactly." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const structureJson = response.choices[0]?.message?.content || '{}';
      
      try {
        // Parse and validate the JSON with our schema
        const structure = JSON.parse(structureJson);
        
        // Validate with Zod
        const validationResult = DocumentSchema.safeParse(structure);
        
        if (!validationResult.success) {
          console.error('Validation error:', validationResult.error);
          
          // Try to use the structure anyway as a fallback
          // Add images to figures if we have figure references
          if (imageData && parsedFigureReferences.length > 0) {
            addImagesToFigures(structure, imageData, parsedFigureReferences);
          }
          
          // Return the structure with a warning
          return NextResponse.json({ 
            structure,
            warning: 'Document structure may not be fully valid'
          });
        }
        
        const validatedStructure = validationResult.data;
        
        // Add images to figures if we have figure references
        if (imageData && parsedFigureReferences.length > 0) {
          addImagesToFigures(validatedStructure, imageData, parsedFigureReferences);
        }
        
        return NextResponse.json({ structure: validatedStructure });
      } catch (parseError) {
        console.error("Error parsing structure JSON:", parseError, structureJson);
        return NextResponse.json(
          { error: "Invalid structure format returned from LLM", details: String(parseError) },
          { status: 500 }
        );
      }
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        { error: "Error from language model API", details: String(openaiError) },
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