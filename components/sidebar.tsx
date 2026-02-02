'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, MessageSquare, Settings, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Documents',
      icon: FileText,
      active: pathname === '/',
    },
    {
      href: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      active: pathname === '/chat',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      {/* Logo / Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Library className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">KnowledgeStream</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                item.active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        <p>© 2026 KnowledgeStream</p>
      </div>
    </aside>
  );
}
