"use client";

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, Download, Loader2, AlertCircle, Shield, Award, Clock, Zap, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UploadFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

interface UploadSection {
  id: string;
  title: string;
  acceptedTypes: string[];
  maxSize: number;
  file?: UploadFile;
  isDragOver?: boolean;
}

export default function DocumentProcessingInterface() {
  const { toast } = useToast();
  const [buttonState, setButtonState] = useState<'initial' | 'processing' | 'complete'>('initial');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const [uploadSections, setUploadSections] = useState<UploadSection[]>([
    {
      id: 'checklist',
      title: 'Upload Checklist',
      acceptedTypes: ['.pdf', '.jpeg', '.png'],
      maxSize: 10 * 1024 * 1024, // 10MB
      isDragOver: false,
    },
    {
      id: 'comparable1',
      title: 'Upload Comparable 1',
      acceptedTypes: ['.pdf'],
      maxSize: 5 * 1024 * 1024, // 5MB
      isDragOver: false,
    },
    {
      id: 'comparable2',
      title: 'Upload Comparable 2',
      acceptedTypes: ['.pdf'],
      maxSize: 5 * 1024 * 1024, // 5MB
      isDragOver: false,
    },
    {
      id: 'comparable3',
      title: 'Upload Comparable 3',
      acceptedTypes: ['.pdf'],
      maxSize: 5 * 1024 * 1024, // 5MB
      isDragOver: false,
    },
  ]);

  const validateFile = useCallback((file: File, acceptedTypes: string[], maxSize: number) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(fileExtension)) {
      return `Invalid file type. Please upload ${acceptedTypes.join(', ')} files only.`;
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }
    
    return null;
  }, []);

  const simulateFileUpload = useCallback((file: File, sectionId: string) => {
    const interval = setInterval(() => {
      setUploadSections(prev => 
        prev.map(section => {
          if (section.id === sectionId && section.file) {
            const newProgress = Math.min(section.file.progress + 10, 100);
            const isComplete = newProgress === 100;
            
            return {
              ...section,
              file: {
                ...section.file,
                progress: newProgress,
                status: isComplete ? 'complete' : 'uploading'
              }
            };
          }
          return section;
        })
      );
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      toast({
        title: "Upload Complete",
        description: `${file.name} has been uploaded successfully.`,
      });
    }, 2000);
  }, [toast]);

  const handleFileUpload = useCallback((file: File, sectionId: string) => {
    const section = uploadSections.find(s => s.id === sectionId);
    if (!section) return;

    const validationError = validateFile(file, section.acceptedTypes, section.maxSize);
    
    if (validationError) {
      // Set error state for the specific section
      setUploadSections(prev => 
        prev.map(s => 
          s.id === sectionId 
            ? { 
                ...s, 
                file: { 
                  file, 
                  progress: 0, 
                  status: 'error' as const,
                  error: validationError
                } 
              }
            : s
        )
      );
      return;
    }

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setUploadSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              file: { 
                file, 
                preview, 
                progress: 0, 
                status: 'uploading' as const 
              } 
            }
          : s
      )
    );

    simulateFileUpload(file, sectionId);
  }, [uploadSections, validateFile, simulateFileUpload, toast]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    e.preventDefault();
    setUploadSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, isDragOver: true }
          : section
      )
    );
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    e.preventDefault();
    // Only set isDragOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setUploadSections(prev => 
        prev.map(section => 
          section.id === sectionId 
            ? { ...section, isDragOver: false }
            : section
        )
      );
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, sectionId: string) => {
    e.preventDefault();
    setUploadSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, isDragOver: false }
          : section
      )
    );
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], sectionId);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], sectionId);
    }
  }, [handleFileUpload]);

  const triggerFileInput = useCallback((sectionId: string) => {
    const input = document.getElementById(`file-input-${sectionId}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }, []);

  const handleProcessReport = useCallback(() => {
    const uploadedFiles = uploadSections.filter(section => section.file?.status === 'complete');
    
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files Uploaded",
        description: "Please upload at least one document before processing.",
        variant: "destructive",
      });
      return;
    }

    setButtonState('processing');
    setProcessingProgress(0);
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setButtonState('complete');
          toast({
            title: "Report Generated",
            description: "Your document processing report is ready for download.",
          });
          return 100;
        }
        return newProgress;
      });
    }, 100);
  }, [uploadSections, toast]);

  const handleDownloadReport = useCallback(() => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'raymond-joyal-report.pdf';
    link.click();
    
    toast({
      title: "Download Started",
      description: "Your report is being downloaded.",
    });
  }, [toast]);

  const handleNewReport = useCallback(() => {
    setUploadSections([
      {
        id: 'checklist',
        title: 'Upload Checklist',
        acceptedTypes: ['.pdf', '.jpeg', '.png'],
        maxSize: 10 * 1024 * 1024, // 10MB
        isDragOver: false,
      },
      {
        id: 'comparable1',
        title: 'Upload Comparable 1',
        acceptedTypes: ['.pdf'],
        maxSize: 5 * 1024 * 1024, // 5MB
        isDragOver: false,
      },
      {
        id: 'comparable2',
        title: 'Upload Comparable 2',
        acceptedTypes: ['.pdf'],
        maxSize: 5 * 1024 * 1024, // 5MB
        isDragOver: false,
      },
      {
        id: 'comparable3',
        title: 'Upload Comparable 3',
        acceptedTypes: ['.pdf'],
        maxSize: 5 * 1024 * 1024, // 5MB
        isDragOver: false,
      },
    ]);
    setButtonState('initial');
    setProcessingProgress(0);
    
    toast({
      title: "New Report Started",
      description: "Ready to upload new documents.",
    });
  }, [toast]);

  const removeFile = useCallback((sectionId: string) => {
    setUploadSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, file: undefined, isDragOver: false }
          : section
      )
    );
  }, []);

  const getButtonContent = () => {
    switch (buttonState) {
      case 'processing':
        return (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        );
      case 'complete':
        return (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download Report
          </>
        );
      default:
        return 'Add To Report';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header with Logo */}
      <div className="bg-white relative overflow-hidden border-b border-gray-100 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-12">
              <img 
                src="/RAYMONDJOYAL_FINAL_CMYK_out (1).png" 
                alt="Raymond Joyal Logo" 
                className="mx-auto h-28 object-contain"
              />
            </div>
            
            {/* Enhanced Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#1e315e] mb-8 tracking-tight">
              AI Report Processing
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-16 leading-relaxed">
              Upload your documents to add them inside your report.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
              <div className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-full">
                <Zap className="w-6 h-6 text-[#87addb]" />
                <span className="text-sm font-semibold">AI-powered</span>
              </div>
              <div className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-full">
                <Timer className="w-6 h-6 text-[#87addb]" />
                <span className="text-sm font-semibold">1 to 3 minutes</span>
              </div>
              <div className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-full">
                <Shield className="w-6 h-6 text-[#87addb]" />
                <span className="text-sm font-semibold">Secure Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Process Steps */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-[#1e315e] mb-4">Simple 3-Step Process</h2>
            <p className="text-lg text-gray-600">Upload, process, and download your comprehensive report</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#87addb] to-[#1e315e] rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#1e315e] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <h3 className="text-xl font-bold text-[#1e315e] mb-3">Upload Documents</h3>
              <p className="text-gray-600 leading-relaxed">Drag and drop your checklist and comparable documents</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#87addb] to-[#1e315e] rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#1e315e] text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <h3 className="text-xl font-bold text-[#1e315e] mb-3">AI Processing</h3>
              <p className="text-gray-600 leading-relaxed">Advanced AI analyzes and processes your documents</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#87addb] to-[#1e315e] rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <Download className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#1e315e] text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <h3 className="text-xl font-bold text-[#1e315e] mb-3">Download Report</h3>
              <p className="text-gray-600 leading-relaxed">Receive your comprehensive evaluation report</p>
            </div>
          </div>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {uploadSections.map((section, index) => (
            <Card key={section.id} className="relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 shadow-lg bg-white group">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-[#87addb] to-[#1e315e] px-3 py-2 rounded-full shadow-md">
                      Step {index + 1}
                    </span>
                    {section.file?.status === 'complete' && (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-[#1e315e] text-xl mb-2">
                    {section.title}
                  </h3>
                </div>
                
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    section.file?.status === 'complete' 
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-inner' 
                      : 'border-gray-300 hover:border-[#87addb] hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 group-hover:border-[#1e315e]'
                  }`}
                  onDrop={(e) => handleDrop(e, section.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, section.id)}
                  onDragLeave={(e) => handleDragLeave(e, section.id)}
                >
                  <input
                    id={`file-input-${section.id}`}
                    type="file"
                    accept={section.acceptedTypes.join(',')}
                    onChange={(e) => handleFileSelect(e, section.id)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={section.file?.status === 'uploading'}
                  />
                  
                  {section.file ? (
                    <div className="space-y-4">
                      {/* File Preview */}
                      <div className="flex items-center justify-center">
                        {section.file.preview ? (
                          <img 
                            src={section.file.preview} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded-xl shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-[#87addb] to-[#1e315e] rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="w-10 h-10 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900 truncate mb-1">
                          {section.file.file.name}
                        </p>
                        <p className="text-gray-500 font-medium">
                          {(section.file.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      
                      {/* Progress */}
                      {section.file.status === 'uploading' && (
                        <div className="space-y-3">
                          <Progress value={section.file.progress} className="h-3" />
                          <p className="text-sm text-gray-600 font-medium">
                            {section.file.progress}% uploaded
                          </p>
                        </div>
                      )}
                      
                      {/* Status Icons */}
                      {section.file.status === 'complete' && (
                        <div className="flex items-center justify-center space-x-2 bg-green-100 py-2 px-4 rounded-full">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700 font-semibold">Complete</span>
                        </div>
                      )}
                      
                      {section.file.status === 'error' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-2 bg-red-100 py-2 px-4 rounded-full">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-700 font-semibold">Upload Error</span>
                          </div>
                          {section.file.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-xs text-red-700 font-medium leading-relaxed">
                                {section.file.error}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Remove Button */}
                      {section.file.status !== 'uploading' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(section.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-semibold flex items-center space-x-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#87addb] to-[#1e315e] rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-3 font-semibold">
                          Drop files here or click to browse
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileInput(section.id)}
                          className="mb-3 border-[#87addb] text-[#87addb] hover:bg-[#87addb] hover:text-white font-semibold"
                        >
                          Browse Files
                        </Button>
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                          Accepts: {section.acceptedTypes.join(', ')}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          Max size: {section.maxSize / (1024 * 1024)}MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Processing Progress */}
        {buttonState === 'processing' && (
          <div className="mb-24">
            <Card className="max-w-lg mx-auto border-0 shadow-2xl bg-white">
              <CardContent className="p-10">
                <div className="space-y-8">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#87addb] to-[#1e315e] rounded-xl flex items-center justify-center shadow-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-xl">Processing Documents...</span>
                  </div>
                  <Progress value={processingProgress} className="h-4" />
                  <p className="text-base text-gray-600 text-center font-medium">
                    {processingProgress}% complete - Analyzing your documents with AI
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          {buttonState === 'complete' ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleDownloadReport}
                className="w-64 h-16 text-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Report
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-64 h-16 text-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 rounded-2xl border-2 border-[#1e315e] text-[#1e315e] hover:bg-[#1e315e] hover:text-white"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    New Report
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start New Report?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all uploaded documents and start a new report? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleNewReport}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Button
              onClick={handleProcessReport}
              disabled={buttonState === 'processing'}
              className="w-64 h-16 text-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 rounded-2xl bg-gradient-to-r from-[#1e315e] to-[#2a4575] hover:from-[#2a4575] hover:to-[#1e315e] text-white"
            >
              {getButtonContent()}
            </Button>
          )}
        </div>
        
        {/* Bottom spacing */}
        <div className="pb-20"></div>
      </div>
      
      <Toaster />
    </div>
  );
}