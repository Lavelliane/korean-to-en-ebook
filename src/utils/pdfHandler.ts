import * as pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import { extractTextFromImage, processMultipleImages } from './imageHandler';
import * as pdfImgConvert from 'pdf-img-convert';

/**
 * Extracts text from a PDF file
 * @param file PDF file to extract text from
 * @returns The extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    
    // Check if the PDF has actual text content or just images (scanned document)
    const isScannedPDF = isLikelyScannedDocument(data.text);
    
    if (isScannedPDF) {
      console.log('Detected a scanned PDF document. Using OCR to extract text...');
      // Extract images from PDF and process them with OCR
      return await extractTextFromScannedPDF(buffer);
    }
    
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please try again.');
  }
}

/**
 * Determines if a PDF is likely a scanned document with no searchable text
 * @param text The text extracted from the PDF
 * @returns True if the PDF is likely a scanned document
 */
function isLikelyScannedDocument(text: string): boolean {
  // Check if the text is empty or contains very little content
  if (!text || text.trim().length < 50) {
    return true;
  }
  
  // Check for PDFs that have some metadata but no real content
  // Count actual words (not just whitespace or special characters)
  const wordMatch = text.match(/\b\w+\b/g);
  const wordCount = wordMatch ? wordMatch.length : 0;
  
  // If there are very few actual words relative to the length, it's likely a scanned doc
  if (wordCount < 15 && text.length > 100) {
    return true;
  }
  
  return false;
}

/**
 * Extracts images from a scanned PDF and processes them using OCR
 * @param pdfBuffer The PDF file as a buffer
 * @returns The text extracted from the PDF images
 */
async function extractTextFromScannedPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Convert PDF pages to images
    const outputImages = await pdfImgConvert.convert(pdfBuffer, {
      width: 1500, // Higher resolution for better OCR results
      height: 2000,
      quality: 100,
      density: 300, // Higher DPI for better quality
      format: 'png',
    });
    
    // Create an array to store text from each page
    const pageTexts: string[] = [];
    
    // Process each page image with OCR
    for (let i = 0; i < outputImages.length; i++) {
      try {
        // Convert image data to a file for processing
        const imageBuffer = outputImages[i];
        const blob = new Blob([Buffer.from(imageBuffer)], { type: 'image/png' });
        const file = new File([blob], `page_${i + 1}.png`, { type: 'image/png' });
        
        // Use OCR to extract text from this page
        const pageText = await extractTextFromImage(file);
        pageTexts.push(pageText);
        
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        pageTexts.push(`[Error extracting text from page ${i + 1}]`);
      }
    }
    
    return pageTexts.join('\n\n=== Page Break ===\n\n');
  } catch (error) {
    console.error('Error extracting images from scanned PDF:', error);
    throw new Error('Failed to process scanned PDF. Please try again.');
  }
} 