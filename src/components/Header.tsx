'use client';

import React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Korean E-Book Translator</h1>
              <p className="text-sm text-gray-500">Translate Korean documents to readable English e-books</p>
            </div>
          </div>
          <div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 