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
    const translatedText = formData.get('translatedText') as string;
    const sourceLanguage = formData.get('sourceLanguage') as string || 'Korean';
    const targetLanguage = formData.get('targetLanguage') as string || 'English';

    if (!translatedText) {
      return NextResponse.json(
        { error: 'No translated text provided' },
        { status: 400 }
      );
    }

    // Create the message for GPT-4 to improve the translation
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional translator and editor specializing in high-quality e-book translations."
        },
        {
          role: "user",
          content: `The following text was machine translated from ${sourceLanguage} to ${targetLanguage}. 
          Please review and improve the translation to make it sound natural and fluent, while maintaining the original 
          meaning and formatting. Fix any translation errors, awkward phrasing, and ensure consistency in terminology. 
          Preserve paragraph breaks, chapter headings, and other structural elements exactly as they appear in the original text.
          
          Here is the text to improve:
          
          ${translatedText}`
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    // Extract the improved text from the response
    const improvedText = response.choices[0].message.content || '';

    if (!improvedText) {
      throw new Error('Failed to improve the translation');
    }

    // Return the improved text
    return NextResponse.json({ improvedText });
  } catch (error: any) {
    console.error('Translation improvement error:', error.message);
    return NextResponse.json(
      { error: `Failed to improve translation: ${error.message}` },
      { status: 500 }
    );
  }
} 