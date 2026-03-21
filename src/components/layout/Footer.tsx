'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface FooterProps {
  isSidebarCollapsed: boolean;
}

// Static year to avoid hydration issues
const CURRENT_YEAR = 2025;

export default function Footer({ isSidebarCollapsed }: FooterProps) {
  return (
    <footer
      className={cn(
        'fixed bottom-0 right-0 z-20 h-10 border-t bg-white/95 dark:bg-slate-900/95 dark:border-slate-700 backdrop-blur transition-all duration-300',
        // Mobile: full width
        'left-0',
        // Desktop: based on sidebar state (use CSS for responsive instead of JS)
        'lg:left-64',
        isSidebarCollapsed && 'lg:left-16'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 text-xs text-slate-500 dark:text-slate-400">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:inline">
            © {CURRENT_YEAR} Solapur Municipal Corporation.
          </span>
          <span className="sm:hidden">
            © {CURRENT_YEAR} SMC
          </span>
        </div>

        {/* Center Section */}
        <div className="hidden lg:flex items-center gap-1">
          <span>Made with</span>
          <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          <span>for better healthcare</span>
        </div>

        {/* Right Section - Quick Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#"
            className="hover:text-[#1E88E5] dark:hover:text-blue-400 transition-colors"
          >
            Privacy
          </a>
          <span className="hidden sm:inline dark:text-slate-600">|</span>
          <a
            href="#"
            className="hidden sm:flex items-center gap-1 hover:text-[#1E88E5] dark:hover:text-blue-400 transition-colors"
          >
            Terms
          </a>
          <span className="hidden md:inline dark:text-slate-600">|</span>
          <a
            href="#"
            className="hidden md:flex items-center gap-1 hover:text-[#1E88E5] dark:hover:text-blue-400 transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
