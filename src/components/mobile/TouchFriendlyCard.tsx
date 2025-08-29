"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { SwipeActions, SwipeAction } from './SwipeActions';

export interface TouchFriendlyCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  swipeActions?: {
    left?: SwipeAction[];
    right?: SwipeAction[];
  };
  disabled?: boolean;
  className?: string;
  hapticFeedback?: boolean;
  longPressDelay?: number;
}

/**
 * Touch-optimized card component for mobile interfaces
 * Features:
 * - Large touch targets (min 44px)
 * - Haptic feedback on interactions
 * - Long press support
 * - Swipe actions integration
 * - Visual feedback on touch
 * - ADHD-friendly visual states
 */
export function TouchFriendlyCard({
  children,
  onClick,
  onLongPress,
  swipeActions,
  disabled = false,
  className,
  hapticFeedback = true,
  longPressDelay = 500
}: TouchFriendlyCardProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [longPressTriggered, setLongPressTriggered] = React.useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout>();
  const touchStartTime = React.useRef<number>(0);

  const triggerHaptic = React.useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback) return;
    
    if (navigator.vibrate) {
      const patterns = {
        light: 10,
        medium: [10, 20, 10],
        heavy: [10, 50, 10]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [hapticFeedback]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(true);
    setLongPressTriggered(false);
    touchStartTime.current = Date.now();

    triggerHaptic('light');

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setLongPressTriggered(true);
        triggerHaptic('medium');
        onLongPress();
      }, longPressDelay);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Only trigger click if it wasn't a long press and was quick enough
    const touchDuration = Date.now() - touchStartTime.current;
    if (!longPressTriggered && touchDuration < longPressDelay && onClick) {
      triggerHaptic('light');
      onClick();
    }

    setLongPressTriggered(false);
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    setLongPressTriggered(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
    setLongPressTriggered(false);
    touchStartTime.current = Date.now();

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setLongPressTriggered(true);
        onLongPress();
      }, longPressDelay);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchDuration = Date.now() - touchStartTime.current;
    if (!longPressTriggered && touchDuration < longPressDelay && onClick) {
      onClick();
    }

    setLongPressTriggered(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
    setLongPressTriggered(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const cardContent = (
    <Card
      className={cn(
        "min-h-[44px] transition-all duration-150 ease-out", // Minimum touch target size
        "border-2 border-transparent", // Space for focus outline
        "select-none cursor-pointer", // Prevent text selection, show it's interactive
        !disabled && [
          "hover:bg-muted/50 active:bg-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
          "hover:shadow-md hover:-translate-y-0.5", // Subtle hover animation
        ],
        isPressed && !disabled && [
          "bg-muted scale-[0.98] shadow-sm", // Press feedback
          longPressTriggered && "ring-2 ring-primary/50" // Long press indicator
        ],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-pressed={isPressed}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (disabled) return;
        
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className={cn(
        "p-4", // Generous padding for touch targets
        isPressed && "pt-3 pb-5" // Subtle content shift on press
      )}>
        {children}
      </CardContent>
    </Card>
  );

  // Wrap in SwipeActions if provided
  if (swipeActions && (swipeActions.left?.length || swipeActions.right?.length)) {
    return (
      <SwipeActions
        leftActions={swipeActions.left}
        rightActions={swipeActions.right}
        disabled={disabled}
        className="rounded-lg overflow-hidden"
      >
        {cardContent}
      </SwipeActions>
    );
  }

  return cardContent;
}

export default TouchFriendlyCard;