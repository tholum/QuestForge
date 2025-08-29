"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw, ArrowDown } from 'lucide-react';

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

/**
 * Pull-to-refresh component for mobile interfaces
 * Features:
 * - Native-like pull-to-refresh behavior
 * - Visual feedback with animated icon
 * - Haptic feedback on trigger
 * - Configurable refresh threshold
 * - Loading state management
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [canPull, setCanPull] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Check if we can pull (at top of scroll)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      setCanPull(container.scrollTop === 0);
    };

    container.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !canPull) return;

    const touch = e.touches[0];
    setStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !canPull) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;

    // Only allow pulling down
    if (deltaY > 0) {
      e.preventDefault();
      
      if (!isPulling) {
        setIsPulling(true);
        // Light haptic feedback when starting to pull
        if (navigator.vibrate) {
          navigator.vibrate(5);
        }
      }

      // Add resistance - the further you pull, the more resistance
      const resistance = Math.max(0.3, 1 - (deltaY / (threshold * 3)));
      const adjustedDistance = deltaY * resistance;
      
      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));

      // Trigger haptic feedback when threshold is reached
      if (deltaY >= threshold && !isRefreshing) {
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;

    const shouldRefresh = pullDistance >= threshold;

    if (shouldRefresh) {
      setIsRefreshing(true);
      
      // Strong haptic feedback on refresh trigger
      if (navigator.vibrate) {
        navigator.vibrate([10, 50, 10]);
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Reset state
    setIsPulling(false);
    setPullDistance(0);
  };

  // Calculate refresh indicator state
  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const isTriggered = pullDistance >= threshold;
  const showIndicator = isPulling || isRefreshing;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Refresh Indicator */}
      {showIndicator && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 z-10",
            "flex items-center justify-center",
            "bg-background/95 backdrop-blur-sm border-b",
            "transition-all duration-200 ease-out"
          )}
          style={{
            height: isRefreshing ? '60px' : `${Math.max(pullDistance, 0)}px`,
            transform: isRefreshing ? 'translateY(0)' : `translateY(-${Math.max(60 - pullDistance, 0)}px)`
          }}
        >
          <div className="flex flex-col items-center space-y-2 py-3">
            {/* Icon */}
            <div className={cn(
              "transition-all duration-200",
              isRefreshing && "animate-spin"
            )}>
              {isRefreshing ? (
                <RefreshCw className="w-5 h-5 text-primary" />
              ) : (
                <ArrowDown 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isTriggered ? "text-primary rotate-180" : "text-muted-foreground",
                  )} 
                  style={{
                    transform: `rotate(${Math.min(refreshProgress * 180, 180)}deg)`
                  }}
                />
              )}
            </div>

            {/* Text */}
            <p className="text-xs text-muted-foreground text-center">
              {isRefreshing 
                ? "Refreshing..." 
                : isTriggered 
                ? "Release to refresh"
                : "Pull to refresh"
              }
            </p>

            {/* Progress indicator */}
            {!isRefreshing && (
              <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-primary transition-all duration-100",
                    isTriggered && "bg-green-500"
                  )}
                  style={{
                    width: `${refreshProgress * 100}%`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={containerRef}
        className={cn(
          "h-full overflow-auto transition-transform duration-200 ease-out",
          isPulling && "overscroll-none"
        )}
        style={{
          transform: showIndicator 
            ? `translateY(${isRefreshing ? 60 : pullDistance}px)` 
            : 'translateY(0)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;