# Korean E-Book Translator

A Next.js application that helps non-Korean speakers read Korean educational materials by translating PDFs and images into English e-books.

## Features

- Upload Korean PDF documents and images
- Extract text from PDFs (including scanned image-based PDFs)
- OCR for Korean text in images
- Translation from Korean to English using OpenAI GPT models
- Export translated content as a readable e-book (PDF)
- Clean, modern UI with responsive design

## Technologies Used

- **Next.js** with TypeScript and the App Router
- **Langchain** for AI integration
- **OpenAI GPT-4o** for high-quality translations
- **Tesseract.js** for OCR (Optical Character Recognition)
- **pdf-parse** and **pdf-lib** for PDF handling
- **TailwindCSS** for styling
- **Headless UI** and **Heroicons** for UI components
- **Sharp** for image processing
- **jsPDF** for e-book generation

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/korean-ebook-translator.git
cd korean-ebook-translator
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Upload Korean PDFs or images using the file upload interface
2. Click "Process Files" to start the extraction and translation
3. Wait for the processing to complete
4. Review the translation in the preview
5. Download the translated e-book

## Special Handling

- **Scanned PDFs**: The application can detect and process scanned image-based PDFs by running OCR on extracted images
- **Korean Language Detection**: Automatically detects Korean text and optimizes translation
- **Academic Content**: Translation is optimized for academic terminology and formatting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the translation capabilities
- Tesseract.js for OCR functionality
- The Next.js team for the excellent framework
