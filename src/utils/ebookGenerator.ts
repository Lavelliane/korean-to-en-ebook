'use client';

import { jsPDF } from 'jspdf';

/**
 * Generates an ebook (PDF) from the provided translated text
 * @param translatedText The translated text content
 * @param title Optional title for the ebook
 * @returns The generated PDF as a Blob
 */
export function generateEbook(translatedText: string, title: string = 'Translated Document'): Blob {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Add title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title, 20, 20);
  
  // Add generated timestamp
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  const date = new Date().toLocaleString();
  pdf.text(`Generated on: ${date}`, 20, 30);
  
  // Add content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  // Split content into multiple pages
  const textLines = pdf.splitTextToSize(translatedText, 170); // 170mm is the printable width
  let y = 40; // Starting y position after title and timestamp
  const pageHeight = 280; // Usable height of an A4 page in mm
  const lineHeight = 7; // Height of each text line in mm

  for (let i = 0; i < textLines.length; i++) {
    // Check if we need to create a new page
    if (y > pageHeight - lineHeight) {
      pdf.addPage();
      y = 20; // Reset y position for new page
    }
    
    pdf.text(textLines[i], 20, y);
    y += lineHeight;
  }
  
  return pdf.output('blob');
} 