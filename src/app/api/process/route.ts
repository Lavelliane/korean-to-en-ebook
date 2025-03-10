import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple function to detect Korean text
function containsKorean(text: string): boolean {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
  return koreanRegex.test(text);
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const sourceLanguage = formData.get('sourceLanguage') as string || 'auto';
    const targetLanguage = formData.get('targetLanguage') as string || 'English';
    const skipTranslation = formData.get('skipTranslation') === 'true';

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const cleanedText = cleanText(text);
    
    // Auto-detect Korean if source language is 'auto'
    const detectSource = sourceLanguage === 'auto' && containsKorean(cleanedText) 
      ? 'Korean' 
      : sourceLanguage;

    // Skip translation if specifically requested or if source and target languages are the same
    if (skipTranslation || (detectSource !== 'auto' && detectSource === targetLanguage)) {
      return NextResponse.json({ 
        translated: cleanedText,
        sourceLanguage: detectSource 
      });
    }

    // Translate the text
    const translatedText = await translateText(
      cleanedText,
      detectSource,
      targetLanguage
    );

    return NextResponse.json({
      original: cleanedText,
      translated: translatedText,
      sourceLanguage: detectSource,
    });
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
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

async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the text from ${sourceLanguage === 'auto' ? 'the detected language' : sourceLanguage} to ${targetLanguage}. Maintain the original meaning, formatting, and style. Preserve paragraph breaks and section headings. Keep technical terms accurate.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
} 