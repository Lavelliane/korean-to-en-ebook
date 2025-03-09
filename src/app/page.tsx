'use client';

import React, { useState } from 'react';
import { extractTextFromImage, extractTextFromPDF, processMultipleImages } from '@/utils/clientFileProcessor';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('My Document');
  const [authorName, setAuthorName] = useState<string>('');
  const [documentStructure, setDocumentStructure] = useState<any>(null);
  const [isStructuring, setIsStructuring] = useState<boolean>(false);
  const [isGeneratingEbook, setIsGeneratingEbook] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  // 0: Initial, 1: Extracted, 2: Translated, 3: Structured, 4: Generated

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setCurrentStep(0);
      setExtractedText('');
      setTranslatedText('');
      setDocumentStructure(null);
      setError(null);
    }
  };

  const processWorkflow = async () => {
    if (files.length === 0) {
      setError('Please select files to process');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Extract text with GPT-4o
      setCurrentStep(1);
      let extractedContent = '';
      let extractedImages: { imageData: string, fileName: string }[] = [];

      // Process files based on type
      if (files.length === 1) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          // Extract text and images from PDF
          extractedContent = await extractTextFromPDF(file);
          
          // For PDFs, we would need to extract images as well
          // This is a placeholder - you would need to implement PDF image extraction
          // extractedImages = await extractImagesFromPDF(file);
        } else if (file.type.startsWith('image/')) {
          // Extract text from single image
          extractedContent = await extractTextFromImage(file);
          
          // Also save the image data
          const imageData = await fileToBase64(file);
          extractedImages.push({ 
            imageData, 
            fileName: file.name 
          });
        } else {
          throw new Error('Unsupported file type. Please upload PDF or image files.');
        }
      } else {
        // Handle multiple files (images)
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          // Extract text from all images
          extractedContent = await processMultipleImages(imageFiles);
          
          // Also save image data from each file
          for (const file of imageFiles) {
            const imageData = await fileToBase64(file);
            extractedImages.push({
              imageData,
              fileName: file.name
            });
          }
        } else {
          throw new Error('No supported files found. Please upload PDF or image files.');
        }
      }

      setExtractedText(extractedContent);
      
      // Step 2: Translate to English
      setCurrentStep(2);
      const translationFormData = new FormData();
      translationFormData.append('text', extractedContent);
      translationFormData.append('targetLanguage', 'English');

      const translationResponse = await fetch('/api/process', {
        method: 'POST',
        body: translationFormData,
      });

      if (!translationResponse.ok) {
        const errorData = await translationResponse.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      const translationData = await translationResponse.json();
      setTranslatedText(translationData.translated);
      
      // Step 3: Generate ebook structure
      setCurrentStep(3);
      const structureFormData = new FormData();
      structureFormData.append('text', translationData.translated);
      structureFormData.append('title', documentTitle);
      
      // Add image data if available
      if (extractedImages.length > 0) {
        // For simplicity, if there's only one image, use it directly
        if (extractedImages.length === 1) {
          structureFormData.append('imageData', extractedImages[0].imageData);
        }
        
        // Create figure references
        const figureReferences = extractedImages.map((img, index) => ({
          id: `Figure ${index + 1}`,
          caption: `Figure ${index + 1}: ${img.fileName.replace(/\.[^/.]+$/, "")}`,
          imageData: img.imageData
        }));
        
        structureFormData.append('figureReferences', JSON.stringify(figureReferences));
      }

      const structureResponse = await fetch('/api/structure', {
        method: 'POST',
        body: structureFormData,
      });

      if (!structureResponse.ok) {
        const errorData = await structureResponse.json();
        throw new Error(errorData.error || 'Failed to structure content');
      }

      const structureData = await structureResponse.json();
      setDocumentStructure(structureData.structure);
      
      // Step 4: Generate PDF
      setCurrentStep(4);
      await generateEbook(structureData.structure);
      
    } catch (err: any) {
      console.error('Workflow error:', err);
      setError(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateEbook = async (structure = documentStructure) => {
    if (!structure) {
      setError('No document structure available');
      return;
    }

    setIsGeneratingEbook(true);
    setError(null);

    try {
      // Ensure structure has required fields
      const safeStructure = {
        title: structure.title || 'Document',
        content: Array.isArray(structure.content) ? structure.content : []
      };

      const formData = new FormData();
      formData.append('structure', JSON.stringify(safeStructure));
      formData.append('author', authorName || 'Anonymous');

      console.log('Sending request to generate PDF...');
      const response = await fetch('/api/structured-ebook', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        
        if (response.headers.get('Content-Type')?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate e-book');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // Check content type
      const contentType = response.headers.get('Content-Type');
      if (contentType !== 'application/pdf') {
        console.error('Unexpected content type:', contentType);
        throw new Error('Server did not return a PDF file');
      }

      console.log('Response received, creating PDF file...');
      
      // Get filename from headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'document.pdf';

      // Create blob and download
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      console.log(`Received PDF blob: ${blob.size} bytes`);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      console.log('PDF download initiated');
    } catch (err) {
      console.error('Error generating e-book:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the e-book');
    } finally {
      setIsGeneratingEbook(false);
    }
  };

  // Function to convert a file to a base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader did not return a string'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="container mx-auto max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">E-Book Generator</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter document title"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author Name (optional)
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter author name"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload PDF or Images
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            multiple
            accept="application/pdf,image/*"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, JPG, PNG, WEBP
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={processWorkflow}
            disabled={isProcessing || files.length === 0}
            className={`w-full px-4 py-3 rounded-md text-white font-medium ${
              isProcessing || files.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing 
              ? `Processing... (Step ${currentStep}/4)` 
              : 'Process & Generate E-Book'}
          </button>
          <p className="text-xs text-center text-gray-500 mt-2">
            This will extract text, translate to English, structure the content, and generate a professional PDF e-book.
          </p>
        </div>

        {/* Progress indicator */}
        {currentStep > 0 && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>Extract</span>
              <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>Translate</span>
              <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>Structure</span>
              <span className={currentStep >= 4 ? "text-blue-600 font-medium" : ""}>Generate</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {extractedText && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Extracted Text</h2>
            <div className="p-4 bg-gray-100 rounded-md max-h-60 overflow-auto">
              <pre className="whitespace-pre-wrap">{extractedText}</pre>
            </div>
          </div>
        )}

        {translatedText && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Translated Text (English)</h2>
            <div className="p-4 bg-gray-100 rounded-md max-h-60 overflow-auto">
              <pre className="whitespace-pre-wrap">{translatedText}</pre>
            </div>
          </div>
        )}

        {documentStructure && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Document Structure</h2>
            <div className="p-4 bg-gray-100 rounded-md max-h-60 overflow-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(documentStructure, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
