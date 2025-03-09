'use client';

import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export type ProcessingStage = 'idle' | 'extracting' | 'translating' | 'generating' | 'completed' | 'error';

type ProcessingStatusProps = {
  stage: ProcessingStage;
  progress?: number;
  error?: string;
};

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  stage, 
  progress = 0,
  error = ''
}) => {
  // Status display configuration based on the current stage
  const statusConfig = {
    idle: {
      title: 'Ready',
      description: 'Upload files to start processing',
      icon: <ClockIcon className="w-8 h-8 text-gray-400" />,
      color: 'bg-gray-100',
    },
    extracting: {
      title: 'Extracting Text',
      description: 'Extracting text from your files...',
      icon: <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />,
      color: 'bg-blue-100',
    },
    translating: {
      title: 'Translating',
      description: 'Translating content from Korean to English...',
      icon: <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin" />,
      color: 'bg-indigo-100',
    },
    generating: {
      title: 'Generating E-book',
      description: 'Creating your e-book...',
      icon: <ArrowPathIcon className="w-8 h-8 text-purple-500 animate-spin" />,
      color: 'bg-purple-100',
    },
    completed: {
      title: 'Completed',
      description: 'Your e-book is ready to download',
      icon: <CheckCircleIcon className="w-8 h-8 text-green-500" />,
      color: 'bg-green-100',
    },
    error: {
      title: 'Error',
      description: error || 'Something went wrong. Please try again.',
      icon: <ExclamationCircleIcon className="w-8 h-8 text-red-500" />,
      color: 'bg-red-100',
    },
  };

  const currentStatus = statusConfig[stage];

  return (
    <div className={`p-4 rounded-lg ${currentStatus.color}`}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {currentStatus.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-800">{currentStatus.title}</h4>
          <p className="text-sm text-gray-600">{currentStatus.description}</p>
          
          {/* Show progress bar for active processing stages */}
          {['extracting', 'translating', 'generating'].includes(stage) && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus; 