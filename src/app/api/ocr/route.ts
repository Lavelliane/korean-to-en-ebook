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
    const base64Image = formData.get('image') as string;

    if (!base64Image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Create the message for Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please read and extract all text from this image. If the text appears to be in Korean, please identify it as such. Maintain the formatting and structure of the text as much as possible."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    // Extract the text from the response
    const extractedText = response.choices[0].message.content;

    if (!extractedText) {
      throw new Error('No text extracted from the image');
    }

    // Clean the extracted text
    const cleanedText = cleanText(extractedText);

    // Return the extracted text
    return NextResponse.json({ extractedText: cleanedText });
  } catch (error: any) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: `OCR error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Function to clean text of special characters and normalize whitespace
function cleanText(text: string): string {
  return text
    // Fix common OCR issues
    .replace(/¶/g, '') // Remove paragraph markers
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove Unicode replacement and invalid characters
    .replace(/[^\x00-\x7F]+/g, match => {
      // Map common Unicode characters to ASCII equivalents
      const charMap: {[key: string]: string} = {
        '\u00A9': '(c)',  // Copyright
        '\u00AE': '(R)',  // Registered trademark
        '\u2122': '(TM)', // Trademark
        '\u20AC': 'EUR',  // Euro
        '\u00A3': 'GBP',  // Pound
        '\u00A5': 'JPY',  // Yen
        '\u00B0': 'deg',  // Degree
        '\u00B1': '+/-',  // Plus-minus
        '\u00D7': 'x',    // Multiplication
        '\u00F7': '/',    // Division
        '\u2026': '...', // Ellipsis
        '\u2013': '-',   // En dash
        '\u2014': '-',   // Em dash
        '\u201C': '"',   // Left double quote
        '\u201D': '"',   // Right double quote
        '\u2018': "'",   // Left single quote
        '\u2019': "'"    // Right single quote
      };
      
      // Try to map the character, if not found, return the original character for non-ASCII characters
      return charMap[match] || match;
    })
    // Handle Korean characters properly by keeping them
    .replace(/[^\x00-\x7F]+/g, match => /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(match) ? match : '')
    // Fix whitespace issues
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks
    .trim(); // Remove leading/trailing whitespace
} 