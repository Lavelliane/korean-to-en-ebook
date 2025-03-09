import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Preprocesses an image to improve OCR results
 * @param imageFile Image file to preprocess
 * @returns Processed image buffer
 */
async function preprocessImage(imageFile: File): Promise<Buffer> {
  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Preprocess image with sharp to improve OCR results
    return await sharp(buffer)
      .greyscale() // Convert to grayscale
      .normalise() // Normalize the image
      .sharpen() // Sharpen the image
      .toBuffer();
  } catch (error) {
    console.error('Image preprocessing error:', error);
    throw new Error('Failed to preprocess image. Please try again.');
  }
}

/**
 * Extracts text from an image using OCR, optimized for Korean text
 * @param imageFile Image file to extract text from
 * @returns The extracted text content
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    // Preprocess the image first
    const processedImage = await preprocessImage(imageFile);
    
    // Load Korean language data specifically
    await Tesseract.load();
    await Tesseract.loadLanguage('kor');
    
    // Initialize the recognizer with Korean + English languages
    const recognizer = await Tesseract.createWorker('kor+eng');
    
    // Set parameters optimized for Korean text recognition
    await recognizer.setParameters({
      tessedit_char_whitelist: '', // No whitelist, accept all characters
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
      preserve_interword_spaces: '1',
      tessjs_create_hocr: '0',
      tessjs_create_tsv: '0',
    });
    
    // Run OCR on the processed image
    const { data } = await recognizer.recognize(processedImage);
    
    // Clean up the worker
    await recognizer.terminate();
    
    return data.text || '';
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image. Please try again.');
  }
}

/**
 * Process multiple images and extract text from all of them
 * @param imageFiles Array of image files
 * @returns Combined extracted text from all images
 */
export async function processMultipleImages(imageFiles: File[]): Promise<string> {
  try {
    const textPromises = imageFiles.map(file => extractTextFromImage(file));
    const texts = await Promise.all(textPromises);
    return texts.join('\n\n');
  } catch (error) {
    console.error('Multiple image processing error:', error);
    throw new Error('Failed to process one or more images. Please try again.');
  }
} 