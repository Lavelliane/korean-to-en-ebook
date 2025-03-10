'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon, PhotoIcon, ClipboardIcon, XMarkIcon } from '@heroicons/react/24/outline';

type FileUploadProps = {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes: string[];
  maxFiles?: number;
};

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelected, 
  acceptedFileTypes,
  maxFiles = 10
}) => {
  const [isPasteEnabled, setIsPasteEnabled] = useState<boolean>(true);
  const [fileList, setFileList] = useState<{file: File, isPasted: boolean}[]>([]);
  // Use a ref to track if we need to call onFilesSelected after state updates
  const fileListRef = useRef<{file: File, isPasted: boolean}[]>([]);

  // UseEffect to call onFilesSelected when fileList changes
  useEffect(() => {
    // Skip initial render
    if (fileListRef.current !== fileList) {
      fileListRef.current = fileList;
      onFilesSelected(fileList.map(item => item.file));
    }
  }, [fileList, onFilesSelected]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        isPasted: false
      }));
      
      setFileList(prev => [...prev, ...newFiles]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      return { ...acc, [type]: [] };
    }, {}),
    maxFiles,
  });

  const removeFile = (index: number) => {
    setFileList(prev => {
      const newFileList = [...prev];
      newFileList.splice(index, 1);
      return newFileList;
    });
  };

  // Handle clipboard paste events
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Check if the pasted content is an image
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Create a new file with a more descriptive name
            const renamedFile = new File(
              [file], 
              `pasted-image-${new Date().toISOString().replace(/:/g, '-')}.${file.type.split('/')[1] || 'png'}`,
              { type: file.type }
            );
            imageFiles.push(renamedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        const newFiles = imageFiles.map(file => ({
          file,
          isPasted: true
        }));
        
        setFileList(prev => [...prev, ...newFiles]);
      }
    };

    // Add the event listener
    if (isPasteEnabled) {
      window.addEventListener('paste', handlePaste);
    }

    // Clean up the event listener
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isPasteEnabled]); // No need for onFilesSelected in dependencies

  // Create image URL for preview - ensure we memoize to avoid leaks
  const getImageUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <ArrowUpTrayIcon className="w-10 h-10 text-gray-400" />
            <ClipboardIcon className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop the files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to select files or paste an image from clipboard
          </p>
          <p className="text-xs text-gray-400 mt-4">
            {acceptedFileTypes.includes('application/pdf') && acceptedFileTypes.includes('image/*') 
              ? 'PDF and image files are supported'
              : acceptedFileTypes.includes('application/pdf')
                ? 'Only PDF files are supported'
                : 'Only image files are supported'
            }
          </p>
        </div>
      </div>

      {fileList.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected files:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fileList.map((item, index) => (
              <div key={index} className="relative bg-gray-50 border border-gray-200 rounded-md p-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-red-500" />
                </button>
                
                {item.file.type.includes('pdf') ? (
                  <div className="flex flex-col items-center">
                    <DocumentTextIcon className="h-12 w-12 text-red-500 mb-2" />
                    <span className="text-xs text-center text-gray-600 truncate w-full">{item.file.name}</span>
                    <span className="text-xs text-gray-400">({Math.round(item.file.size / 1024)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative h-24 w-full mb-2 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      <img 
                        src={getImageUrl(item.file)} 
                        alt={item.file.name} 
                        className="max-h-full max-w-full object-contain"
                        onLoad={(e) => {
                          // Clean up object URL after image loads to prevent memory leaks
                          URL.revokeObjectURL((e.target as HTMLImageElement).src);
                        }}
                      />
                    </div>
                    <span className="text-xs text-center text-gray-600 truncate w-full">
                      {item.file.name}
                    </span>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-400 mr-1">({Math.round(item.file.size / 1024)} KB)</span>
                      {item.isPasted && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-sm">Pasted</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 