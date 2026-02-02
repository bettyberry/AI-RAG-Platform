'use client';

import { Sidebar } from '@/components/sidebar';
import { ChatPage } from '@/components/chat';

export default function Chat() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <ChatPage />
    </div>
  );
}
