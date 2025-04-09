'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType } from '@/schemas/bidding.schema';
import { useState, useCallback } from 'react';

// UI Components
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const FILE_TYPES = ["JPG", "PNG", "PDF", "DOCX", "XLS", "XLSX"];
const MAX_FILE_SIZE = 10; // 10MB

type MediaUploadProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function MediaUpload({ mediaFiles, setMediaFiles }: MediaUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { control, formState: { errors } } = useFormContext<BidCardSchemaType>();
  
  // Create file previews for display
  const [filePreviews, setFilePreviews] = useState<Array<{
    file: File;
    preview: string;
    type: string;
    description: string;
  }>>([]);
  
  // Handle file change from uploader
  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    
    // Convert FileList to array
    const fileArray = Array.from(files);
    
    // Check file size
    const oversizedFile = fileArray.find(file => file.size > MAX_FILE_SIZE * 1024 * 1024);
    if (oversizedFile) {
      setUploadError(`File ${oversizedFile.name} exceeds the ${MAX_FILE_SIZE}MB limit`);
      toast({
        title: "File too large",
        description: `File ${oversizedFile.name} exceeds the ${MAX_FILE_SIZE}MB limit`,
        variant: "destructive",
      });
      return;
    }
    
    setUploadError(null);
    
    // Create preview URLs for each file
    const newFilePreviews = fileArray.map(file => {
      const fileType = file.type.split('/')[0];
      let preview = '';
      
      // Create preview URLs for images
      if (fileType === 'image') {
        preview = URL.createObjectURL(file);
      }
      
      return {
        file,
        preview,
        type: fileType || 'unknown',
        description: '',
      };
    });
    
    // Update state with proper typing
    setFilePreviews((prevFiles) => [...prevFiles, ...newFilePreviews]);
    // Using the correct setter pattern
    setMediaFiles([...mediaFiles, ...fileArray]);
  };
  
  // Handle removing a file
  const handleRemoveFile = (index: number) => {
    // Create new arrays without the removed file
    const newFilePreviews = [...filePreviews];
    if (index >= 0 && index < newFilePreviews.length) {
      newFilePreviews.splice(index, 1);
      setFilePreviews(newFilePreviews);
      
      const newMediaFiles = [...mediaFiles];
      newMediaFiles.splice(index, 1);
      setMediaFiles(newMediaFiles);
    }
  };
  
  // Update file description
  const handleUpdateDescription = (index: number, description: string) => {
    if (index >= 0 && index < filePreviews.length) {
      const newFilePreviews = [...filePreviews];
      newFilePreviews[index].description = description;
      setFilePreviews(newFilePreviews);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = useCallback((type: string) => {
    switch (type) {
      case 'image':
        return <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-md">📷</div>;
      case 'application':
        return <div className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-md">📄</div>;
      default:
        return <div className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-md">📁</div>;
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Media</h2>
        <p className="text-gray-600 mb-6">
          Add photos, documents, or measurements to help contractors understand your project.
        </p>
      </div>

      {/* Drag & Drop Uploader */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />
        
        <label 
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-md">📁</div>
          <p className="text-lg font-medium mb-2">Drag and drop files here</p>
          <p className="text-gray-500 mb-4">or click to browse your files</p>
          <Button variant="outline" type="button">
            Select Files
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            Supported file types: JPG, PNG, PDF, DOC, XLS (up to {MAX_FILE_SIZE}MB)
          </p>
        </label>
      </div>
      
      {uploadError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {uploadError}
        </div>
      )}
      
      {/* File Preview List */}
      {filePreviews.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">Uploaded Files</h3>
          
          <div className="space-y-4">
            {filePreviews.map((item, index) => (
              <div 
                key={`${item.file.name}-${index}`} 
                className="flex items-start p-4 border rounded-lg"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-100 rounded-md mr-4">
                  {item.preview ? (
                    <img 
                      src={item.preview} 
                      alt={item.file.name} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    getFileIcon(item.type)
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <p className="font-medium">{item.file.name}</p>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {/* Description Input */}
                  <div className="mt-2">
                    <Textarea
                      placeholder="Add a description for this file (optional)"
                      value={item.description}
                      onChange={(e) => handleUpdateDescription(index, e.target.value)}
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Media Tips */}
      <div className="bg-blue-50 p-4 rounded-md mt-4">
        <h4 className="text-sm font-medium text-blue-700 mb-2">Tips for project media:</h4>
        <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
          <li>Add close-up photos of areas needing work</li>
          <li>Include wide shots to show the overall space</li>
          <li>Upload plans or sketches if you have them</li>
          <li>Add measurements or diagrams for clarity</li>
          <li>Consider adding before photos for renovation projects</li>
        </ul>
      </div>
    </div>
  );
}
