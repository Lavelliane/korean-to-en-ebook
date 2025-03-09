import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';

// Create styles using standard PDF fonts
const styles = StyleSheet.create({
  page: {
    padding: 60,
    backgroundColor: '#FFFFF8', // Slight cream color for a book-like feel
    color: '#333',
  },
  coverPage: {
    padding: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#F8F8FF', // Light background for cover
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Times-Roman',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2C3E50', // Dark blue for title
  },
  coverAuthor: {
    fontSize: 18,
    fontFamily: 'Times-Italic',
    marginTop: 20,
    textAlign: 'center',
    color: '#566573', // Slate gray
  },
  coverDivider: {
    width: 100,
    height: 2,
    backgroundColor: '#E74C3C', // Accent color for divider
    marginVertical: 30,
  },
  section: {
    marginBottom: 10,
    fontFamily: 'Times-Roman',
  },
  header: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginTop: 30,
    marginBottom: 20,
    color: '#2C3E50', // Dark blue for headers
    borderBottom: '1pt solid #E74C3C',
    paddingBottom: 8,
  },
  subheader: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginTop: 22,
    marginBottom: 12,
    color: '#34495E', // Slightly lighter blue for subheaders
  },
  paragraph: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    marginBottom: 12,
    lineHeight: 1.8,
    textAlign: 'justify',
    textIndent: 24,
  },
  firstParagraph: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    marginBottom: 12,
    lineHeight: 1.8,
    textAlign: 'justify',
    textIndent: 0, // No indent for first paragraph after a heading
  },
  emphasis: {
    fontFamily: 'Times-Italic',
    color: '#2E86C1', // Blue for italics
  },
  strong: {
    fontFamily: 'Times-Bold',
    color: '#17202A', // Darker for bold text
  },
  underline: {
    textDecoration: 'underline',
    textDecorationColor: '#E74C3C', // Red for underlines
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    color: '#7F8C8D', // Light gray for page numbers
  },
  chapterTitle: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    marginTop: 60,
    marginBottom: 40,
    textAlign: 'center',
    color: '#E74C3C', // Accent color for chapter titles
  },
  term: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#34495E', // Slate blue for terms
  },
  definition: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    marginLeft: 20,
    marginBottom: 14,
    lineHeight: 1.6,
  },
  quote: {
    fontSize: 12,
    fontFamily: 'Times-Italic',
    marginVertical: 15,
    paddingLeft: 20,
    borderLeft: '2pt solid #E74C3C',
    color: '#566573', // Slate gray for quotes
  },
  figure: {
    fontSize: 12,
    fontFamily: 'Times-Italic',
    marginVertical: 15,
    textAlign: 'center',
    color: '#566573', // Slate gray for figure captions
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    color: '#7F8C8D', // Light gray for footer
  },
  toc: {
    fontSize: 16,
    fontFamily: 'Times-Roman',
    marginBottom: 10,
  },
  tocItem: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    marginBottom: 5,
    marginLeft: 20,
  },
  tocPage: {
    fontFamily: 'Helvetica',
    color: '#7F8C8D',
  },
});

// Helper function to process content with better heading detection
const processFormattedText = (text: string) => {
  const elements: React.ReactNode[] = [];
  
  // Replace tab characters with spaces for consistent spacing
  const processedText = text.replace(/\t/g, '    ');
  
  // Split the text into lines first, to better identify headings
  const lines = processedText.split('\n');
  
  // Identify potential section titles based on length and formatting
  // Group lines into paragraphs or sections
  let paragraphs: string[] = [];
  let currentParagraph = '';
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (trimmedLine === '') {
      if (currentParagraph !== '') {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      return;
    }
    
    // Detect potential headings (capitalized, short lines at the beginning of a section)
    const isHeadingCandidate = 
      (trimmedLine.length < 70) && 
      (
        // Check for main heading patterns
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(trimmedLine) || // "Basic Network Terminology"
        /^[A-Z][a-z]+$/.test(trimmedLine) ||                  // "Network"
        /^[A-Z]/.test(trimmedLine) && index > 0 && lines[index-1].trim() === '' && // Capital at start after empty line
        (index === lines.length - 1 || lines[index+1].trim() === '')  // Followed by empty line
      );
    
    // Check if it looks like a figure caption
    const isFigureCaption = /^Figure\s+\d+/.test(trimmedLine);
    
    // Check if it's a term definition (short indented line followed by longer explanation)
    const isTermDefinition = 
      trimmedLine.length < 50 && 
      !trimmedLine.endsWith('.') && 
      index < lines.length - 1 && 
      lines[index+1].trim().length > trimmedLine.length;
    
    if (isHeadingCandidate) {
      // Add the previous paragraph if it exists
      if (currentParagraph !== '') {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      
      // Add the heading as its own element with a special marker
      paragraphs.push(`##HEADING## ${trimmedLine}`);
    } 
    else if (isFigureCaption) {
      // Add the previous paragraph if it exists
      if (currentParagraph !== '') {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      
      // Add the figure caption as its own element with a special marker
      paragraphs.push(`##FIGURE## ${trimmedLine}`);
    }
    else if (isTermDefinition) {
      // Add the previous paragraph if it exists
      if (currentParagraph !== '') {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      
      // Add the term as its own element with a special marker
      paragraphs.push(`##TERM## ${trimmedLine}`);
    }
    else {
      // For regular content, append to the current paragraph
      if (currentParagraph === '') {
        currentParagraph = trimmedLine;
      } else {
        // Check if this might be continuation of the same paragraph
        currentParagraph += ' ' + trimmedLine;
      }
    }
  });
  
  // Add the last paragraph if it exists
  if (currentParagraph !== '') {
    paragraphs.push(currentParagraph);
  }
  
  // Process each paragraph now
  paragraphs.forEach((paragraph, idx) => {
    if (paragraph.startsWith('##HEADING##')) {
      // Process as heading
      const headingText = paragraph.replace('##HEADING##', '').trim();
      elements.push(
        <Text key={`heading-${idx}`} style={styles.header}>{headingText}</Text>
      );
    } 
    else if (paragraph.startsWith('##FIGURE##')) {
      // Process as figure caption
      const figureText = paragraph.replace('##FIGURE##', '').trim();
      elements.push(
        <Text key={`figure-${idx}`} style={styles.figure}>{figureText}</Text>
      );
    }
    else if (paragraph.startsWith('##TERM##')) {
      // Process as term definition
      const termText = paragraph.replace('##TERM##', '').trim();
      elements.push(
        <Text key={`term-${idx}`} style={styles.term}>{termText}</Text>
      );
    }
    else if (/^Chapter\s+\d+/i.test(paragraph)) {
      // Process as chapter title
      elements.push(
        <Text key={`chapter-${idx}`} style={styles.chapterTitle}>{paragraph}</Text>
      );
    }
    else {
      // Check if this paragraph follows a heading or term
      const isFirstParagraph = elements.length > 0 && 
        (elements[elements.length - 1].props.style === styles.header || 
         elements[elements.length - 1].props.style === styles.term ||
         elements[elements.length - 1].props.style === styles.chapterTitle);
      
      // Process as regular paragraph
      elements.push(
        <Text 
          key={`para-${idx}`} 
          style={isFirstParagraph ? styles.firstParagraph : styles.paragraph}
        >
          {processInlineFormatting(paragraph)}
        </Text>
      );
    }
  });
  
  return elements;
};

// Helper function to process inline formatting
const processInlineFormatting = (text: string) => {
  // Simple approach: manually detect any obvious formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, (_, content) => `[BOLD]${content}[/BOLD]`)
    .replace(/\*(.*?)\*/g, (_, content) => `[ITALIC]${content}[/ITALIC]`)
    .replace(/__(.*?)__/g, (_, content) => `[UNDERLINE]${content}[/UNDERLINE]`)
    .split(/(\[BOLD\].*?\[\/BOLD\]|\[ITALIC\].*?\[\/ITALIC\]|\[UNDERLINE\].*?\[\/UNDERLINE\])/)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('[BOLD]')) {
        return <Text key={index} style={styles.strong}>{part.replace(/\[BOLD\](.*?)\[\/BOLD\]/, '$1')}</Text>;
      } else if (part.startsWith('[ITALIC]')) {
        return <Text key={index} style={styles.emphasis}>{part.replace(/\[ITALIC\](.*?)\[\/ITALIC\]/, '$1')}</Text>;
      } else if (part.startsWith('[UNDERLINE]')) {
        return <Text key={index} style={styles.underline}>{part.replace(/\[UNDERLINE\](.*?)\[\/UNDERLINE\]/, '$1')}</Text>;
      }
      return part;
    });
};

// Interface for our e-book props
interface EbookTemplateProps {
  content: string;
  title: string;
  author?: string;
}

// The actual template component
const EbookTemplate: React.FC<EbookTemplateProps> = ({ content, title, author }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.coverDivider} />
        {author && <Text style={styles.coverAuthor}>by {author}</Text>}
      </View>
    </Page>

    {/* Main Content */}
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.section}>
        {processFormattedText(content)}
      </View>
      <Text 
        style={styles.pageNumber} 
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} 
        fixed 
      />
    </Page>
  </Document>
);

export default EbookTemplate; 