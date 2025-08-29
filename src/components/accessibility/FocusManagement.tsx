"use client"

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Focus management utilities for accessibility
 * Features:
 * - Focus trapping for modals
 * - Focus restoration after navigation
 * - Programmatic focus management
 * - Screen reader announcements
 */

// Focus trap hook
export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const closeButton = container.querySelector('[data-close-modal]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
}

// Focus restoration hook
export function useFocusRestore() {
  const previouslyFocusedElementRef = React.useRef<HTMLElement | null>(null);

  const saveFocus = React.useCallback(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = React.useCallback(() => {
    if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, []);

  return { saveFocus, restoreFocus };
}

// Screen reader announcements
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  }, []);

  return {
    announce,
    announcementElement: (
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>
    )
  };
}

// Route focus management
export function useRouteFocusManagement() {
  const router = useRouter();
  
  React.useEffect(() => {
    const handleRouteChange = () => {
      // Focus on the main heading after route change
      setTimeout(() => {
        const mainHeading = document.querySelector('h1') as HTMLElement;
        if (mainHeading) {
          mainHeading.focus();
          mainHeading.scrollIntoView();
        } else {
          // Fallback to main content
          const mainContent = document.querySelector('[role="main"]') as HTMLElement;
          if (mainContent) {
            mainContent.focus();
          }
        }
      }, 100);
    };

    // Listen for navigation events
    const originalPush = router.push;
    router.push = (...args) => {
      const result = originalPush.apply(router, args);
      handleRouteChange();
      return result;
    };

    return () => {
      router.push = originalPush;
    };
  }, [router]);
}

// Keyboard navigation helpers
export function useKeyboardNavigation() {
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent, actions: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }) => {
    switch (e.key) {
      case 'Enter':
        if (actions.onEnter) {
          e.preventDefault();
          actions.onEnter();
        }
        break;
      case ' ':
        if (actions.onSpace) {
          e.preventDefault();
          actions.onSpace();
        }
        break;
      case 'Escape':
        if (actions.onEscape) {
          e.preventDefault();
          actions.onEscape();
        }
        break;
      case 'ArrowUp':
        if (actions.onArrowUp) {
          e.preventDefault();
          actions.onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (actions.onArrowDown) {
          e.preventDefault();
          actions.onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (actions.onArrowLeft) {
          e.preventDefault();
          actions.onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (actions.onArrowRight) {
          e.preventDefault();
          actions.onArrowRight();
        }
        break;
    }
  }, []);

  return { handleKeyDown };
}

// High contrast detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isReducedMotion;
}