"use client";

import React, { useState } from "react";
import { Upload, Trash2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chunkText } from "@/lib/pdf";

interface Document {
  id: string;
  name: string;
  pages: number;
  status: "uploading" | "processing" | "ready" | "error";
  uploadedAt: Date;
  chunks?: string[];
  error?: string;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // ----- Status Badge Component -----
  const StatusBadge = ({ status, error }: { status: Document["status"]; error?: string }) => {
    switch (status) {
      case "uploading":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <div className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse" />
            Uploading
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <div className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse" />
            Processing
          </Badge>
        );
      case "ready":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <div className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
            Ready
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="inline-block w-3 h-3 mr-1.5" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  // ----- Drag & Drop Handlers -----
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  };

  // ----- Upload Handler -----
  const handleFilesUpload = async (files: FileList) => {
    console.log("=== FRONTEND UPLOAD START ===");
    console.log("Number of files:", files.length);
    
    const fileArray = Array.from(files).filter(file => {
      const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
      if (!isPDF) {
        console.warn(`Skipping non-PDF file: ${file.name} (type: ${file.type})`);
      }
      return isPDF;
    });
    
    console.log("PDF files after filtering:", fileArray.length);
    
    if (fileArray.length === 0) {
      alert("Please select PDF files only.");
      return;
    }
    
    for (const file of fileArray) {
      const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      console.log(`Processing file: ${file.name} (ID: ${tempId})`);
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Optimistic UI
      const newDoc: Document = {
        id: tempId,
        name: file.name,
        pages: 0,
        status: "uploading",
        uploadedAt: new Date(),
      };
      
      setDocuments(prev => [newDoc, ...prev]);
      setUploadingFiles(prev => new Set(prev.add(tempId)));

      const formData = new FormData();
      formData.append("file", file);

      try {
        console.log("Sending fetch request to /api/upload");
        
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          // Add timeout
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        console.log("Response status:", res.status);
        console.log("Response ok:", res.ok);
        console.log("Response headers:", Object.fromEntries(res.headers.entries()));
        
        const responseText = await res.text();
        console.log("Raw response text (first 500 chars):", responseText.substring(0, 500));
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Parsed response data:", {
            ...data,
            text: data.text ? `[Text length: ${data.text.length} chars]` : 'No text',
          });
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError);
          console.error("Response was:", responseText.substring(0, 200));
          throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
        }

        if (!res.ok) {
          console.error("API error response:", data);
          const errorMessage = data.error || data.message || `Upload failed: ${res.status} ${res.statusText}`;
          throw new Error(errorMessage);
        }

        // Update status to processing while chunking
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  status: "processing",
                }
              : doc
          )
        );

        // Chunk the text for RAG
        const chunks = data.text ? chunkText(data.text, 1000, 200) : [];

        // Update document with backend data
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  id: data.id || tempId,
                  pages: data.pages || 0,
                  status: data.status || "ready",
                  chunks,
                }
              : doc
          )
        );

        console.log(`Uploaded "${file.name}" → ${data.pages} pages, ${chunks.length} chunks`);

      } catch (err: any) {
        console.error("Catch block error:", err);
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        
        // Check for specific error types
        let errorMessage = err.message || "Unknown error occurred";
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          errorMessage = "Upload timed out. Please try again with a smaller file.";
        } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection.";
        }
        
        // Update to show error state
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId 
              ? { 
                  ...doc, 
                  status: "error", 
                  pages: 0,
                  name: `${doc.name}`,
                  error: errorMessage
                } 
              : doc
          )
        );
        
        // Show alert for user
        alert(`Failed to upload "${file.name}": ${errorMessage}`);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }
    }
  };

  // ----- Delete Handler -----
  const handleDelete = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    
    if (uploadingFiles.has(id)) {
      if (confirm("This file is still uploading. Are you sure you want to cancel?")) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } else {
      if (confirm(`Are you sure you want to delete "${document?.name}"?`)) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      }
    }
  };

  // ----- Format file size -----
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Documents</h1>
          <p className="text-muted-foreground">Upload and manage your knowledge base documents</p>
         
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors mb-8 cursor-pointer ${
            isDragActive ? "border-accent bg-accent/5" : "border-border bg-secondary hover:border-accent/50"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Drag and drop your PDFs here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              <p className="text-xs text-muted-foreground mt-2">Only PDF files are supported</p>
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,application/pdf"
              className="hidden"
              id="file-upload"
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesUpload(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Select PDF Files</span>
              </Button>
            </label>
          </div>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No documents yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload a PDF to get started</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-lg border ${
                  doc.status === 'error' 
                    ? 'border-red-200 bg-red-50 hover:bg-red-50/80' 
                    : 'border-border bg-card hover:bg-card/80'
                } transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <FileText className={`w-5 h-5 ${
                        doc.status === 'error' ? 'text-red-500' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{doc.name}</p>
                        {doc.status === 'error' && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                            Failed
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span>{doc.pages > 0 ? `${doc.pages} pages` : "Processing..."}</span>
                        <span>{formatFileSize(0)}</span>
                        <span>{doc.uploadedAt.toLocaleDateString()}</span>
                        {doc.chunks && doc.chunks.length > 0 && (
                          <span>{doc.chunks.length} chunks</span>
                        )}
                      </div>
                      {doc.error && (
                        <p className="text-sm text-red-600 mt-2">{doc.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={doc.status} error={doc.error} />
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        doc.status === 'error' 
                          ? 'hover:bg-red-100' 
                          : 'hover:bg-destructive/10'
                      }`}
                      aria-label="Delete document"
                      disabled={uploadingFiles.has(doc.id)}
                    >
                      <Trash2 className={`w-4 h-4 ${
                        doc.status === 'error' 
                          ? 'text-red-500 hover:text-red-700' 
                          : 'text-muted-foreground hover:text-destructive'
                      }`} />
                    </button>
                  </div>
                </div>
                {doc.status === 'uploading' && (
                  <div className="mt-3">
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 animate-pulse w-1/2"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {documents.length > 0 && (
          <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {documents.some(d => d.status === 'error') 
                  ? "Some documents failed to upload" 
                  : "Your documents are securely stored and indexed"
                }
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {documents.some(d => d.status === 'error')
                  ? "Check the error messages above and try uploading again. Make sure your PDF files are not corrupted."
                  : "You can now ask the AI questions about the content. The AI will only answer based on information found in your uploaded documents."
                }
              </p>
              {documents.some(d => d.status === 'error') && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => console.log("Documents state:", documents)}
                    className="text-xs"
                  >
                    View Debug Info in Console
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

       
      </div>
    </div>
  );
}