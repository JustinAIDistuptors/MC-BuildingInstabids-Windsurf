'use client';

import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Control } from 'react-hook-form';

type MediaUploadProps = {
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  control: Control<any>;
  register?: any;
  errors?: any;
};

export default function MediaUpload({ mediaFiles, setMediaFiles }: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles([...mediaFiles, ...newFiles]);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setMediaFiles([...mediaFiles, ...newFiles]);
    }
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  // Handle button click to open file dialog
  const handleSelectFilesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('file-upload')?.click();
  };

  return (
    <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
      <div>
        <h2 className="text-xl font-semibold mb-4">Upload Project Photos</h2>
        <p className="text-gray-600 mb-6">
          Add photos to help contractors understand your project better.
        </p>
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">Drag & drop your photos here</h3>
            <p className="text-sm text-gray-500 mt-1">or click to browse your files</p>
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={handleSelectFilesClick}
              className="mt-2"
              type="button"
            >
              Select Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, GIF (Max 10MB per file)
          </p>
        </div>
      </Card>

      {/* Pro Tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
        <div className="text-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-amber-800">Pro Tip</p>
          <p className="text-sm text-amber-700">
            Including multiple photos from different angles will help contractors provide more accurate bids. 
            Consider adding before photos, areas of concern, and inspiration images.
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {mediaFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Uploaded Photos ({mediaFiles.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
