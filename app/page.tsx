'use client';

import { Sidebar } from '@/components/sidebar';
import { DocumentsPage } from '@/components/documents';

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <DocumentsPage />
    </div>
  );
}
