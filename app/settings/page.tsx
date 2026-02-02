'use client';

import { Sidebar } from '@/components/sidebar';
import { SettingsPage } from '@/components/settings';

export default function Settings() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <SettingsPage />
    </div>
  );
}
