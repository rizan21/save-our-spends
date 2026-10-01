import React from 'react';
import type { GroupTab } from '../../hooks/useSwipeableTabs';

export interface GroupTabsContainerProps {
  activeTab: GroupTab;
  slideDirection: 'left' | 'right' | null;
  dragOffset: number;
  isDragging: boolean;
  touchHandlers?: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };
  children: React.ReactNode;
  className?: string;
}

export function GroupTabsContainer({
  activeTab,
  slideDirection,
  dragOffset,
  isDragging,
  touchHandlers,
  children,
  className = '',
}: GroupTabsContainerProps) {
  const getAnimationClass = () => {
    if (isDragging) return '';
    if (slideDirection === 'left') return 'animate-slide-left';
    if (slideDirection === 'right') return 'animate-slide-right';
    return '';
  };

  const containerStyle: React.CSSProperties = isDragging && dragOffset !== 0
    ? {
        transform: `translate3d(${dragOffset}px, 0, 0)`,
        transition: 'none',
        willChange: 'transform',
      }
    : {};

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
      tabIndex={0}
      className={`touch-pan-y overflow-x-clip focus:outline-hidden min-h-[50vh] flex-1 ${getAnimationClass()} ${className}`}
      style={containerStyle}
      {...(touchHandlers || {})}
    >
      {children}
    </div>
  );
}
