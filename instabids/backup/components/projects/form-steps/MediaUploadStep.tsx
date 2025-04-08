'use client';

import React, { useCallback, useState } from 'react';
import { BidCard } from '@/types/bidding';
import { 
  FormDescription, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X, FileText, ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MediaUploadStepProps {
  data: BidCard;
  errors: Record<string, string>;
  mediaFiles: File[];
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
}

type MediaType = 'photo' | 'document';

/**
 * Step 5: Media Upload
 * 
 * This step allows users to upload photos and documents for their bid card:
 * - Project photos
 * - Reference images
 * - Document attachments
 * - Media organization and descriptions
 */
export default function MediaUploadStep({
  data,
  errors,
  mediaFiles,
  onUpload,
  onRemove
}: MediaUploadStepProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('photo');
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const filesArray = Array.from(event.target.files);
      onUpload(filesArray);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onUpload(filesArray);
    }
  }, [onUpload]);

  // Determine if a file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Get the appropriate media files based on the active tab
  const getFilteredMediaFiles = (): File[] => {
    if (activeTab === 'photo') {
      return mediaFiles.filter(isImageFile);
    }
    return mediaFiles.filter(file => !isImageFile(file));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Media Upload</h2>
        <p className="text-muted-foreground">
          Add photos and documents to help contractors understand your project better.
        </p>
      </div>

      {/* Tab Selection */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'photo' ? 'default' : 'ghost'}
          className="rounded-none rounded-t-lg"
          onClick={() => setActiveTab('photo')}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Photos
        </Button>
        <Button
          variant={activeTab === 'document' ? 'default' : 'ghost'}
          className="rounded-none rounded-t-lg"
          onClick={() => setActiveTab('document')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Documents
        </Button>
      </div>

      {/* Drag and Drop Upload Area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept={activeTab === 'photo' ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"}
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <PlusCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">
            {activeTab === 'photo' ? 'Upload Project Photos' : 'Upload Documents'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {activeTab === 'photo' 
              ? 'Drop your photos here or click to browse. Add photos of the project area, inspiration images, or any visual reference.'
              : 'Drop your documents here or click to browse. Add plans, specifications, or any other relevant documentation.'}
          </p>
          <p className="text-xs text-muted-foreground pt-2">
            {activeTab === 'photo' 
              ? 'Accepts: JPG, PNG, GIF, WebP (Max: 10MB per file)'
              : 'Accepts: PDF, DOC, DOCX, XLS, XLSX, TXT (Max: 20MB per file)'}
          </p>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {getFilteredMediaFiles().length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {activeTab === 'photo' ? 'Uploaded Photos' : 'Uploaded Documents'}
          </h3>
          
          {activeTab === 'photo' ? (
            // Photo grid
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getFilteredMediaFiles().map((file, index) => {
                const fileUrl = URL.createObjectURL(file);
                
                return (
                  <Card key={index} className="group relative overflow-hidden">
                    <div className="aspect-square relative">
                      <Image
                        src={fileUrl}
                        alt={`Project photo ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(mediaFiles.findIndex(f => f === file));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Document list
            <div className="space-y-2">
              {getFilteredMediaFiles().map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium truncate max-w-[200px] md:max-w-md">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(mediaFiles.findIndex(f => f === file))}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <h3 className="font-medium">Tips for Better Bids</h3>
        <ul className="text-sm space-y-1 list-disc pl-5">
          <li>Include photos from multiple angles to give contractors a complete view</li>
          <li>Add close-up shots of any problem areas or specific details</li>
          <li>Upload any existing plans, measurements, or specifications</li>
          <li>Include inspiration photos if you have a specific style in mind</li>
        </ul>
      </div>
    </div>
  );
}
