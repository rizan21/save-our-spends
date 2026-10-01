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
  enabled?: boolean;
}

export function useSwipeableTabs({
  initialTab = 'overview',
  currentTab,
  onTabChange,
  threshold = 45,
  velocityThreshold = 0.3,
  enabled = true,
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

  // Common gesture processing logic for both window-level and element-level touch
  const handleTouchStartCommon = useCallback((clientX: number, clientY: number, target: HTMLElement | null) => {
    // Do not intercept if touch began inside an exempt element (modals, inputs, tablist)
    if (
      target?.closest(
        '[role="dialog"], [aria-modal="true"], .modal, input, textarea, select, [contenteditable="true"], [role="tablist"], .no-swipe, [data-no-swipe="true"]'
      )
    ) {
      return false;
    }

    touchStartRef.current = {
      x: clientX,
      y: clientY,
      time: Date.now(),
    };
    isSwipingRef.current = false;
    isCancelledRef.current = false;
    currentOffsetRef.current = 0;
    setDragOffset(0);
    return true;
  }, []);

  const handleTouchMoveCommon = useCallback(
    (clientX: number, clientY: number, cancelable: boolean, preventDefault?: () => void) => {
      if (!touchStartRef.current || isCancelledRef.current) return;

      const dx = clientX - touchStartRef.current.x;
      const dy = clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Lock gesture once movement exceeds minimal jitter threshold (10px)
      if (!isSwipingRef.current) {
        if (absDy > 10 && absDy >= absDx) {
          // Vertical scrolling takes priority; cancel swipe for this session
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
        if (cancelable && preventDefault) {
          preventDefault();
        }

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

  const handleTouchEndCommon = useCallback(
    (clientX?: number) => {
      if (!touchStartRef.current) return;

      const wasSwiping = isSwipingRef.current;
      const start = touchStartRef.current;
      const dt = Math.max(1, Date.now() - start.time);
      const dx = clientX !== undefined ? clientX - start.x : currentOffsetRef.current;
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

  const handleTouchCancelCommon = useCallback(() => {
    touchStartRef.current = null;
    isSwipingRef.current = false;
    isCancelledRef.current = false;
    currentOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  // Global window touch listeners: enables swiping from anywhere on the screen
  // (e.g. outside cards, page margins/padding, header, empty space below lists)
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    const onWinTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      handleTouchStartCommon(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement | null);
    };

    const onWinTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      handleTouchMoveCommon(
        e.touches[0].clientX,
        e.touches[0].clientY,
        e.cancelable,
        () => e.preventDefault()
      );
    };

    const onWinTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleTouchEndCommon(touch ? touch.clientX : undefined);
    };

    const onWinTouchCancel = () => {
      handleTouchCancelCommon();
    };

    window.addEventListener('touchstart', onWinTouchStart, { passive: true });
    window.addEventListener('touchmove', onWinTouchMove, { passive: false });
    window.addEventListener('touchend', onWinTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onWinTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onWinTouchStart);
      window.removeEventListener('touchmove', onWinTouchMove);
      window.removeEventListener('touchend', onWinTouchEnd);
      window.removeEventListener('touchcancel', onWinTouchCancel);
    };
  }, [
    enabled,
    handleTouchStartCommon,
    handleTouchMoveCommon,
    handleTouchEndCommon,
    handleTouchCancelCommon,
  ]);

  // Synthetic React touch handlers for optional component attachment
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      handleTouchStartCommon(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement | null);
    },
    [handleTouchStartCommon]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      handleTouchMoveCommon(e.touches[0].clientX, e.touches[0].clientY, false);
    },
    [handleTouchMoveCommon]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      handleTouchEndCommon(touch ? touch.clientX : undefined);
    },
    [handleTouchEndCommon]
  );

  const onTouchCancel = useCallback(() => {
    handleTouchCancelCommon();
  }, [handleTouchCancelCommon]);

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
