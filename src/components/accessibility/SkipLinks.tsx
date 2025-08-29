"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkipLinksProps {
  className?: string;
}

/**
 * Skip navigation links for accessibility
 * Features:
 * - Skip to main content
 * - Skip to navigation
 * - Skip to search
 * - Only visible when focused
 * - High contrast styling
 */
export function SkipLinks({ className }: SkipLinksProps) {
  return (
    <div className={cn("sr-only focus-within:not-sr-only", className)}>
      <div className="fixed top-2 left-2 z-[9999] flex flex-col space-y-2">
        <a
          href="#main-content"
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-md",
            "bg-primary text-primary-foreground font-medium text-sm",
            "border-2 border-primary-foreground/20",
            "transition-transform duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-foreground",
            "hover:bg-primary/90 hover:scale-105",
            "shadow-lg backdrop-blur-sm"
          )}
        >
          Skip to main content
        </a>
        
        <a
          href="#main-navigation"
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-md",
            "bg-primary text-primary-foreground font-medium text-sm",
            "border-2 border-primary-foreground/20",
            "transition-transform duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-foreground",
            "hover:bg-primary/90 hover:scale-105",
            "shadow-lg backdrop-blur-sm"
          )}
        >
          Skip to navigation
        </a>
        
        <a
          href="#search"
          className={cn(
            "inline-flex items-center px-4 py-2 rounded-md",
            "bg-primary text-primary-foreground font-medium text-sm",
            "border-2 border-primary-foreground/20",
            "transition-transform duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-foreground",
            "hover:bg-primary/90 hover:scale-105",
            "shadow-lg backdrop-blur-sm"
          )}
        >
          Skip to search
        </a>
      </div>
    </div>
  );
}

export default SkipLinks;