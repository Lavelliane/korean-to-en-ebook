'use client';

import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

type TranslationPreviewProps = {
  originalText: string;
  translatedText: string;
  onDownload: () => void;
  isDownloadReady: boolean;
};

const TranslationPreview: React.FC<TranslationPreviewProps> = ({
  originalText,
  translatedText,
  onDownload,
  isDownloadReady,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-medium text-gray-800">Translation Preview</h3>
        <p className="text-sm text-gray-500">Review your translation before downloading</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Text (Korean)</h4>
          <div className="bg-gray-50 p-3 rounded border max-h-[500px] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono text-gray-600">{originalText || 'No content to display'}</pre>
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Translated Text (English)</h4>
          <div className="bg-gray-50 p-3 rounded border max-h-[500px] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono text-gray-600">{translatedText || 'No translation available yet'}</pre>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 border-t flex justify-end">
        <button
          onClick={onDownload}
          disabled={!isDownloadReady}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            isDownloadReady
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Download E-book</span>
        </button>
      </div>
    </div>
  );
};

export default TranslationPreview; 