'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';

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
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      return { ...acc, [type]: [] };
    }, {}),
    maxFiles,
  });

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
          <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop the files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to select files
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

      {acceptedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected files:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {acceptedFiles.map((file, index) => (
              <li key={index} className="flex items-center space-x-2">
                {file.type.includes('pdf') ? (
                  <DocumentTextIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <PhotoIcon className="h-5 w-5 text-blue-500" />
                )}
                <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 