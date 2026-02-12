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

  // ----- Status Badge Component (Original UI) -----
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

  const handleFilesUpload = async (files: FileList) => {
    const fileArray = Array.from(files).filter(file => 
      file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (fileArray.length === 0) {
      alert("Please select PDF files only.");
      return;
    }
    
    for (const file of fileArray) {
      const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      
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
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          // FIX: Increased timeout to 90 seconds to prevent TimeoutError during PDF parsing
          signal: AbortSignal.timeout(90000), 
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Upload failed: ${res.status}`);
        }

        const data = await res.json();

        // Update status to processing while chunking locally
        setDocuments(prev =>
          prev.map(doc => doc.id === tempId ? { ...doc, status: "processing" } : doc)
        );

        // Chunk the text for RAG (1000 chars per chunk, 200 char overlap)
        const chunks = data.text ? chunkText(data.text, 1000, 200) : [];

        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  id: data.id || tempId,
                  pages: data.pages || 0,
                  status: "ready",
                  chunks,
                }
              : doc
          )
        );

      } catch (err: any) {
        let errorMessage = err.message || "Unknown error occurred";
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          errorMessage = "Upload timed out. The PDF is taking too long to process.";
        }
        
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId 
              ? { ...doc, status: "error", error: errorMessage } 
              : doc
          )
        );
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }
    }
  };

  const handleDelete = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (confirm(`Are you sure you want to delete "${document?.name}"?`)) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

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
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Drag and drop your PDFs here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
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
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
             <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
             <p className="font-semibold text-foreground">No documents yet</p>
             <p className="text-sm text-muted-foreground mt-1">Upload a PDF to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className={`p-4 rounded-lg border transition-colors ${
                doc.status === 'error' ? 'border-red-200 bg-red-50' : 'border-border bg-card'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <FileText className={`w-10 h-10 flex-shrink-0 ${doc.status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.name}</p>
                      <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                        <span>{doc.pages > 0 ? `${doc.pages} pages` : "Processing..."}</span>
                        {doc.chunks && <span>{doc.chunks.length} chunks</span>}
                      </div>
                      {doc.error && <p className="text-sm text-red-600 mt-2">{doc.error}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={doc.status} error={doc.error} />
                    <button 
                      onClick={() => handleDelete(doc.id)} 
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      disabled={uploadingFiles.has(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
                {doc.status === 'uploading' && (
                  <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse w-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}