"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Edit, Archive, Star, Trash2 } from 'lucide-react';

export interface SwipeAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  onAction: () => void;
}

export interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  disabled?: boolean;
  threshold?: number;
  className?: string;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const colorClasses = {
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  gray: 'bg-gray-500 text-white'
};

/**
 * Mobile swipe actions component for goal and task management
 * Features:
 * - Touch-based swipe gestures
 * - Configurable left and right actions
 * - Visual feedback with haptic vibration
 * - Automatic reset after action
 * - Accessibility support with keyboard alternatives
 */
export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  disabled = false,
  threshold = 80,
  className,
  onSwipeStart,
  onSwipeEnd
}: SwipeActionsProps) {
  const [translateX, setTranslateX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [currentX, setCurrentX] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const maxLeftSwipe = leftActions.length * 80;
  const maxRightSwipe = rightActions.length * 80;

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    onSwipeStart?.();

    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    
    const deltaX = touch.clientX - startX;
    let newTranslateX = deltaX;

    // Limit swipe distance
    if (deltaX > 0) {
      newTranslateX = Math.min(deltaX, maxLeftSwipe);
    } else {
      newTranslateX = Math.max(deltaX, -maxRightSwipe);
    }

    setTranslateX(newTranslateX);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;

    const deltaX = currentX - startX;
    const absDeltaX = Math.abs(deltaX);

    // Check if swipe threshold was met
    if (absDeltaX >= threshold) {
      if (deltaX > 0 && leftActions.length > 0) {
        // Determine which left action was triggered
        const actionIndex = Math.min(
          Math.floor(Math.abs(deltaX) / 80),
          leftActions.length - 1
        );
        leftActions[actionIndex]?.onAction();
        
        // Haptic feedback for action
        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10]);
        }
      } else if (deltaX < 0 && rightActions.length > 0) {
        // Determine which right action was triggered
        const actionIndex = Math.min(
          Math.floor(Math.abs(deltaX) / 80),
          rightActions.length - 1
        );
        rightActions[actionIndex]?.onAction();
        
        // Haptic feedback for action
        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10]);
        }
      }
    }

    // Reset position
    setTranslateX(0);
    setIsDragging(false);
    onSwipeEnd?.();
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsDragging(true);
    onSwipeStart?.();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;

    setCurrentX(e.clientX);
    const deltaX = e.clientX - startX;
    let newTranslateX = deltaX;

    if (deltaX > 0) {
      newTranslateX = Math.min(deltaX, maxLeftSwipe);
    } else {
      newTranslateX = Math.max(deltaX, -maxRightSwipe);
    }

    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled) return;
    handleTouchEnd();
  };

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowLeft' && leftActions.length > 0) {
      e.preventDefault();
      leftActions[0].onAction();
    } else if (e.key === 'ArrowRight' && rightActions.length > 0) {
      e.preventDefault();
      rightActions[0].onAction();
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 flex"
          style={{
            transform: `translateX(${Math.min(translateX - maxLeftSwipe, 0)}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
        >
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className={cn(
                  "w-20 flex flex-col items-center justify-center space-y-1",
                  "text-xs font-medium transition-opacity",
                  colorClasses[action.color],
                  translateX <= (index + 1) * 80 ? 'opacity-100' : 'opacity-60'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onAction();
                }}
                aria-label={action.label}
              >
                <Icon className="w-5 h-5" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 flex"
          style={{
            transform: `translateX(${Math.max(translateX + maxRightSwipe, 0)}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
        >
          {rightActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className={cn(
                  "w-20 flex flex-col items-center justify-center space-y-1",
                  "text-xs font-medium transition-opacity",
                  colorClasses[action.color],
                  Math.abs(translateX) >= (index + 1) * 80 ? 'opacity-100' : 'opacity-60'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onAction();
                }}
                aria-label={action.label}
              >
                <Icon className="w-5 h-5" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div
        ref={containerRef}
        className={cn(
          "relative bg-background transition-transform duration-200 ease-out",
          isDragging && "duration-0",
          disabled && "pointer-events-auto"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="listitem"
        aria-label="Swipe left or right for actions, or use arrow keys"
      >
        {children}
      </div>

      {/* Swipe Indicators */}
      {isDragging && (
        <>
          {/* Left indicator */}
          {translateX > 20 && leftActions.length > 0 && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className={cn(
                "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
                translateX >= threshold ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {React.createElement(leftActions[0].icon, { className: 'w-3 h-3' })}
                <span>{leftActions[0].label}</span>
              </div>
            </div>
          )}

          {/* Right indicator */}
          {translateX < -20 && rightActions.length > 0 && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className={cn(
                "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
                Math.abs(translateX) >= threshold ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {React.createElement(rightActions[0].icon, { className: 'w-3 h-3' })}
                <span>{rightActions[0].label}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Predefined common actions
export const commonSwipeActions = {
  complete: {
    id: 'complete',
    icon: Check,
    label: 'Complete',
    color: 'green' as const,
    onAction: () => console.log('Complete action')
  },
  edit: {
    id: 'edit',
    icon: Edit,
    label: 'Edit',
    color: 'blue' as const,
    onAction: () => console.log('Edit action')
  },
  archive: {
    id: 'archive',
    icon: Archive,
    label: 'Archive',
    color: 'gray' as const,
    onAction: () => console.log('Archive action')
  },
  favorite: {
    id: 'favorite',
    icon: Star,
    label: 'Favorite',
    color: 'yellow' as const,
    onAction: () => console.log('Favorite action')
  },
  delete: {
    id: 'delete',
    icon: Trash2,
    label: 'Delete',
    color: 'red' as const,
    onAction: () => console.log('Delete action')
  }
};

export default SwipeActions;