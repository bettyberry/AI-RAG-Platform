"use client";

import React, { useState } from "react";
import { Upload, Trash2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chunkText } from "@/lib/pdf"; // This should point to your utility file

interface Document {
  id: string;
  name: string;
  pages: number;
  status: "uploading" | "processing" | "ready";
  uploadedAt: Date;
  chunks?: string[];
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // ----- Status Badge Component -----
  const StatusBadge = ({ status }: { status: Document["status"] }) => {
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

  // ----- Chunk Helper -----
  const chunkText = (text: string, chunkSize = 1000, overlap = 200): string[] => {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
      start += chunkSize - overlap;
    }
    return chunks;
  };

  // ----- Upload Handler -----
  const handleFilesUpload = async (files: FileList) => {
    const fileArray = Array.from(files).filter(file => file.type === "application/pdf");
    
    for (const file of fileArray) {
      const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
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
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        const data = await res.json();

        // Chunk the text for RAG
        const chunks = chunkText(data.text || "", 1000, 200);

        // Update document with backend data
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  id: data.id,
                  pages: data.pages,
                  status: data.status || "ready",
                  chunks,
                }
              : doc
          )
        );

        console.log(`Uploaded "${file.name}" → ${data.pages} pages, ${chunks.length} chunks`);

      } catch (err) {
        console.error("Upload failed", err);
        
        // Update to show error state
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId 
              ? { 
                  ...doc, 
                  status: "ready", 
                  pages: 0,
                  name: `${doc.name} (Failed)` 
                } 
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

  // ----- Delete Handler -----
  const handleDelete = (id: string) => {
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
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
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
                <span>Select Files</span>
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
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.pages > 0 ? `${doc.pages} pages` : "Processing..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
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
                Your documents are securely stored and indexed
              </p>
              <p className="text-sm text-blue-700 mt-1">
                You can now ask the AI questions about the content. The AI will only answer based on information
                found in your uploaded documents.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}