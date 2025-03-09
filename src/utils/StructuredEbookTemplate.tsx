import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from '@react-pdf/renderer';

// Define styles for the document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
    backgroundColor: 'white',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '90%',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 24,
    textAlign: 'center',
  },
  author: {
    fontSize: 14,
    marginTop: 24,
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  subsectionHeading: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  figureContainer: {
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    alignItems: 'center',
  },
  figureImage: {
    maxWidth: '80%',
    marginVertical: 8,
    objectFit: 'contain',
  },
  figureCaption: {
    fontSize: 10,
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
    marginTop: 5,
  },
  term: {
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  termName: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  termDefinition: {
    fontFamily: 'Helvetica',
  },
  list: {
    marginVertical: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  listItemBullet: {
    width: 15,
    textAlign: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});

interface DocumentStructure {
  title: string;
  subtitle?: string;
  content: ContentItem[];
}

type ContentItem = 
  | Section
  | Paragraph
  | Figure
  | Term
  | List
  | Subsection;

interface Section {
  type: 'section';
  heading: string;
  content: ContentItem[];
}

interface Subsection {
  type: 'subsection';
  heading: string;
  content: ContentItem[];
}

interface Paragraph {
  type: 'paragraph';
  text: string;
}

interface Figure {
  type: 'figure';
  caption: string;
  image?: string; // Base64 encoded image data
}

interface Term {
  type: 'term';
  term: string;
  definition: string;
}

interface List {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

interface StructuredEbookTemplateProps {
  structure: DocumentStructure;
  author?: string;
}

// Main component for the structured e-book template
const StructuredEbookTemplate: React.FC<StructuredEbookTemplateProps> = ({ structure, author }) => {
  // Safely render content
  const safeRenderContent = (items?: ContentItem[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <Text>No content available</Text>;
    }

    return items.map((item, index) => {
      try {
        if (!item || typeof item !== 'object' || !('type' in item)) {
          return <Text key={index}>Invalid content item</Text>;
        }

        switch (item.type) {
          case 'section':
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.sectionHeading}>{item.heading || 'Untitled Section'}</Text>
                {safeRenderContent(item.content)}
              </View>
            );
          
          case 'subsection':
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.subsectionHeading}>{item.heading || 'Untitled Subsection'}</Text>
                {safeRenderContent(item.content)}
              </View>
            );
          
          case 'paragraph':
            return (
              <Text key={index} style={styles.paragraph}>
                {item.text || 'No text content'}
              </Text>
            );
          
          case 'figure':
            return (
              <View key={index} style={styles.figureContainer}>
                {item.image && (
                  <Image
                    src={item.image}
                    style={styles.figureImage}
                  />
                )}
                <Text style={styles.figureCaption}>{item.caption || 'Figure'}</Text>
              </View>
            );
          
          case 'term':
            return (
              <View key={index} style={styles.term}>
                <Text style={styles.termName}>{item.term || 'Term'}</Text>
                <Text style={styles.termDefinition}>{item.definition || 'No definition'}</Text>
              </View>
            );
          
          case 'list':
            return (
              <View key={index} style={styles.list}>
                {Array.isArray(item.items) ? item.items.map((listItem, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.listItemBullet}>
                      {item.ordered ? `${idx + 1}.` : '•'}
                    </Text>
                    <Text style={styles.listItemContent}>{listItem}</Text>
                  </View>
                )) : <Text>No list items</Text>}
              </View>
            );
          
          default:
            return <Text key={index}>Unknown content type</Text>;
        }
      } catch (error) {
        console.error('Error rendering content item:', error);
        return <Text key={index}>Error rendering content</Text>;
      }
    });
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.title}>{structure?.title || 'Document'}</Text>
          {structure?.subtitle && (
            <Text style={styles.subtitle}>{structure.subtitle}</Text>
          )}
          {author && <Text style={styles.author}>By {author}</Text>}
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={styles.page}>
        {structure && structure.content ? 
          safeRenderContent(structure.content) : 
          <Text>No content available</Text>
        }
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

// Function to render to buffer
export const renderToBuffer = async (structure: DocumentStructure, author?: string): Promise<Buffer> => {
  try {
    console.log('Starting PDF generation with structure:', 
      JSON.stringify({
        title: structure?.title || 'No title',
        hasSubtitle: !!structure?.subtitle,
        contentCount: structure?.content?.length || 0
      })
    );
    
    // Validate structure
    if (!structure) {
      throw new Error('Document structure is undefined');
    }
    
    if (!structure.title) {
      structure.title = 'Untitled Document';
    }
    
    if (!structure.content || !Array.isArray(structure.content)) {
      structure.content = [{
        type: 'paragraph',
        text: 'No content available'
      }];
    }
    
    // Create PDF document
    const pdfDoc = <StructuredEbookTemplate structure={structure} author={author} />;
    console.log('PDF document component created successfully');
    
    try {
      // Render to buffer
      const buffer = await pdf(pdfDoc).toBuffer();
      
      if (!buffer || buffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }
      
      console.log('PDF buffer created successfully:', buffer.length, 'bytes');
      return buffer;
    } catch (renderError) {
      console.error('Error during PDF rendering:', renderError);
      throw new Error(`PDF rendering failed: ${renderError instanceof Error ? renderError.message : 'Unknown render error'}`);
    }
  } catch (error) {
    console.error('Error in renderToBuffer:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 