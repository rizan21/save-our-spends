import { useState, useRef, useCallback, useEffect } from 'react';

export const GROUP_TABS = ['overview', 'expenses', 'balances', 'members'] as const;
export type GroupTab = (typeof GROUP_TABS)[number];

export function getNextTab(current: GroupTab): GroupTab | null {
  const index = GROUP_TABS.indexOf(current);
  if (index >= 0 && index < GROUP_TABS.length - 1) {
    return GROUP_TABS[index + 1];
  }
  return null;
}

export function getPrevTab(current: GroupTab): GroupTab | null {
  const index = GROUP_TABS.indexOf(current);
  if (index > 0) {
    return GROUP_TABS[index - 1];
  }
  return null;
}

export function getSlideDirection(from: GroupTab, to: GroupTab): 'left' | 'right' | null {
  const fromIndex = GROUP_TABS.indexOf(from);
  const toIndex = GROUP_TABS.indexOf(to);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return null;
  return toIndex > fromIndex ? 'left' : 'right';
}

export interface UseSwipeableTabsOptions {
  initialTab?: GroupTab;
  currentTab?: GroupTab;
  onTabChange?: (tab: GroupTab) => void;
  threshold?: number;
  velocityThreshold?: number;
}

export function useSwipeableTabs({
  initialTab = 'overview',
  currentTab,
  onTabChange,
  threshold = 45,
  velocityThreshold = 0.3,
}: UseSwipeableTabsOptions = {}) {
  const [internalTab, setInternalTab] = useState<GroupTab>(initialTab);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const activeTab = currentTab !== undefined ? currentTab : internalTab;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);
  const currentOffsetRef = useRef<number>(0);

  const setTab = useCallback(
    (newTab: GroupTab, explicitDirection?: 'left' | 'right') => {
      if (newTab === activeTab) return;
      const direction = explicitDirection ?? getSlideDirection(activeTab, newTab);
      setSlideDirection(direction);
      if (onTabChange) {
        onTabChange(newTab);
      } else {
        setInternalTab(newTab);
      }
    },
    [activeTab, onTabChange]
  );

  const goToNextTab = useCallback(() => {
    const next = getNextTab(activeTab);
    if (next) {
      setTab(next, 'left');
      return true;
    }
    return false;
  }, [activeTab, setTab]);

  const goToPrevTab = useCallback(() => {
    const prev = getPrevTab(activeTab);
    if (prev) {
      setTab(prev, 'right');
      return true;
    }
    return false;
  }, [activeTab, setTab]);

  // Reset slide direction animation after it finishes
  useEffect(() => {
    if (!slideDirection) return;
    const timer = setTimeout(() => {
      setSlideDirection(null);
    }, 280);
    return () => clearTimeout(timer);
  }, [slideDirection, activeTab]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;

    // Do not intercept if touch began inside an explicitly exempt element (e.g. horizontally scrollable elements)
    const target = e.target as HTMLElement | null;
    if (target?.closest('.no-swipe, [data-no-swipe="true"]')) {
      return;
    }

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwipingRef.current = false;
    isCancelledRef.current = false;
    currentOffsetRef.current = 0;
    setDragOffset(0);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || isCancelledRef.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Lock gesture once movement exceeds minimal jitter threshold (10px)
      if (!isSwipingRef.current) {
        if (absDy > 10 && absDy >= absDx) {
          // Vertical scrolling takes priority; disarm swipe for this touch session
          isCancelledRef.current = true;
          return;
        }
        if (absDx > 10 && absDx > absDy) {
          // Horizontal swipe recognized
          isSwipingRef.current = true;
          setIsDragging(true);
        }
      }

      if (isSwipingRef.current) {
        const atStart = activeTab === GROUP_TABS[0] && dx > 0;
        const atEnd = activeTab === GROUP_TABS[GROUP_TABS.length - 1] && dx < 0;

        // Apply rubber-band resistance at boundaries
        const effectiveOffset = atStart || atEnd ? dx * 0.25 : dx;
        currentOffsetRef.current = effectiveOffset;
        setDragOffset(effectiveOffset);
      }
    },
    [activeTab]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const wasSwiping = isSwipingRef.current;
      const start = touchStartRef.current;
      const dt = Math.max(1, Date.now() - start.time);
      const touch = e.changedTouches[0];
      const dx = touch ? touch.clientX - start.x : currentOffsetRef.current;
      const velocity = Math.abs(dx) / dt;

      touchStartRef.current = null;
      isSwipingRef.current = false;
      isCancelledRef.current = false;
      currentOffsetRef.current = 0;
      setIsDragging(false);
      setDragOffset(0);

      if (wasSwiping) {
        const isFlick = velocity > velocityThreshold;
        const isPastThreshold = Math.abs(dx) >= threshold;

        if (dx < 0 && (isPastThreshold || isFlick)) {
          // Swipe Left -> Next Tab
          goToNextTab();
        } else if (dx > 0 && (isPastThreshold || isFlick)) {
          // Swipe Right -> Prev Tab
          goToPrevTab();
        }
      }
    },
    [threshold, velocityThreshold, goToNextTab, goToPrevTab]
  );

  const onTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    isSwipingRef.current = false;
    isCancelledRef.current = false;
    currentOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  return {
    activeTab,
    slideDirection,
    dragOffset,
    isDragging,
    setTab,
    goToNextTab,
    goToPrevTab,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  };
}
