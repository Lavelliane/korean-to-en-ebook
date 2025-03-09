import { complete } from './openai';

/**
 * Checks if text contains Korean characters
 * @param text The text to check
 * @returns True if Korean characters are detected
 */
function containsKorean(text: string): boolean {
  // The Unicode range for Hangul (Korean alphabet)
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
  return koreanRegex.test(text);
}

/**
 * Translates text to English, optimized for Korean academic content
 * @param text The text to translate (any language, but optimized for Korean)
 * @returns The translated English text
 */
export async function translateKoreanToEnglish(text: string): Promise<string> {
  try {
    // Check if the text contains Korean characters
    const hasKorean = containsKorean(text);
    
    let promptTemplate = '';
    if (hasKorean) {
      promptTemplate = `
        Translate the following Korean text to English.
        This is academic content from a lecture or textbook.
        Please maintain the academic terminology and formatting.
        Preserve paragraph breaks, bullet points, and section headers.
        If there are mathematical formulas or scientific notation, preserve their meaning accurately.
        
        Korean text:
        ${text}
      `;
    } else {
      // If no Korean detected, just improve the existing text (might be poor OCR results)
      promptTemplate = `
        The following text may be the result of OCR on a Korean document.
        Please correct any OCR errors and translate to proper English if needed.
        Maintain academic terminology and formatting.
        
        Text:
        ${text}
      `;
    }
    
    // Use our custom complete function instead of the previous implementation
    const translatedText = await complete(promptTemplate, 4000);
    
    return translatedText.trim() || '';
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text. Please try again.');
  }
} 