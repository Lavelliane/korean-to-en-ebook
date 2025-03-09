'use client';

// No static imports of browser-only libraries
// We'll use dynamic imports instead

/**
 * Client-side PDF text extraction using PDF.js (which is browser-compatible)
 * @param file PDF file to extract text from
 * @returns The extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Dynamically import PDF.js only on the client side
    const pdfjs = await import('pdfjs-dist');
    
    // Set the worker source using a CDN
    const workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    
    let extractedText = '';
    // Loop through each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const textItems = content.items.map((item: any) => item.str);
      extractedText += textItems.join(' ') + '\n\n';
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please try again.');
  }
}

/**
 * Process an image using OpenAI's vision capabilities
 * @param imageFile Image file to process
 * @returns The extracted text content
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    // Convert file to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Send the image to the server for processing
    const formData = new FormData();
    formData.append('image', base64Image);
    
    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process image');
    }
    
    const data = await response.json();
    
    // Check if we have extracted text
    if (!data.extractedText) {
      throw new Error('No text extracted from image');
    }
    
    return data.extractedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Process multiple images and extract text
 * @param imageFiles Array of image files
 * @returns Combined extracted text
 */
export async function processMultipleImages(imageFiles: File[]): Promise<string> {
  if (imageFiles.length === 0) return '';
  
  // Use Promise.allSettled to handle partial failures
  const results = await Promise.allSettled(
    imageFiles.map(async (file, index) => {
      try {
        console.log(`Processing image ${index + 1}/${imageFiles.length}: ${file.name}`);
        return await extractTextFromImage(file);
      } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error);
        return Promise.reject({
          index: index + 1,
          fileName: file.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    })
  );
  
  // Collect the successful texts and errors
  const extractedTexts: string[] = [];
  const errors: any[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      extractedTexts.push(`--- Image ${index + 1} ---\n\n${result.value}\n\n`);
    } else {
      errors.push({
        index: index + 1,
        fileName: imageFiles[index].name,
        error: result.reason.error || 'Unknown error'
      });
    }
  });
  
  // If all images failed, throw an error with the details
  if (extractedTexts.length === 0 && errors.length > 0) {
    const errorMessage = errors.map(err => 
      `Image ${err.index}: ${err.error}`
    ).join('\n');
    
    throw new Error(`Failed to process all images:\n${errorMessage}`);
  }
  
  // If some images succeeded but others failed, log warnings
  if (errors.length > 0) {
    console.warn(`Warning: ${errors.length} out of ${imageFiles.length} images failed to process.`);
    console.warn('Failed images:', errors);
  }
  
  // Return the successfully extracted text
  return extractedTexts.join('\n');
}

/**
 * Helper function to convert a file to base64
 * @param file The file to convert
 * @returns Promise resolving to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
} 