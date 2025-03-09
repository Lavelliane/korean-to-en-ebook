import { ChatOpenAI } from '@langchain/openai';

// Initialize the OpenAI client with the API key from environment variables
export const openai = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY || '',
  modelName: 'gpt-4o', // Using a powerful model for better translation
  temperature: 0.2, // Lower temperature for more deterministic translations
  maxConcurrency: 5, // Limit concurrent requests
});

/**
 * Custom completion function to simplify calls to the OpenAI API
 */
export async function complete(prompt: string, maxTokens: number = 2000): Promise<string> {
  try {
    const result = await openai.invoke(prompt);
    return result.content.toString();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate text with OpenAI. Please try again.');
  }
} 