'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface FooterProps {
  isSidebarCollapsed: boolean;
}

export default function Footer({ isSidebarCollapsed }: FooterProps) {
  return (
    <footer
      className={cn(
        'fixed bottom-0 right-0 z-20 h-10 border-t bg-white/90 backdrop-blur transition-all duration-300 dark:border-slate-700 dark:bg-slate-950/90',
        'left-0',
        'lg:left-64',
        isSidebarCollapsed && 'lg:left-16'
      )}
    >
      <div className="flex h-full items-center justify-between gap-3 px-3 text-[11px] text-slate-500 dark:text-slate-400 sm:px-4 sm:text-xs">
        <div className="min-w-0 flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:inline">Developed by Tech-Lifter</span>
          <span className="sm:hidden">Tech-Lifter</span>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <span>Built with</span>
          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          <span>for smarter hospital care</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#" className="transition-colors hover:text-primary dark:hover:text-emerald-300">
            Privacy
          </a>
          <span className="hidden sm:inline dark:text-slate-600">|</span>
          <a
            href="#"
            className="hidden sm:flex items-center gap-1 transition-colors hover:text-primary dark:hover:text-emerald-300"
          >
            Terms
          </a>
          <span className="hidden md:inline dark:text-slate-600">|</span>
          <a
            href="#"
            className="hidden md:flex items-center gap-1 transition-colors hover:text-primary dark:hover:text-emerald-300"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
