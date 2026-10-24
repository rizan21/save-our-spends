import { describe, test, expect } from 'bun:test';
import {
  GROUP_TABS,
  type GroupTab,
  getNextTab,
  getPrevTab,
  getSlideDirection,
} from '../hooks/useSwipeableTabs';

describe('Swipeable Tabs - Tab Traversal & Gesture Logic', () => {
  test('GROUP_TABS matches the exact required tab order: overview, expenses, balances, settings', () => {
    expect(GROUP_TABS).toEqual(['overview', 'expenses', 'balances', 'settings']);
    expect(GROUP_TABS.length).toBe(4);
  });

  test('getNextTab traverses correctly and stops cleanly at boundary', () => {
    expect(getNextTab('overview')).toBe('expenses');
    expect(getNextTab('expenses')).toBe('balances');
    expect(getNextTab('balances')).toBe('settings');
    expect(getNextTab('settings')).toBeNull();
  });

  test('getPrevTab traverses backwards correctly and stops cleanly at boundary', () => {
    expect(getPrevTab('settings')).toBe('balances');
    expect(getPrevTab('balances')).toBe('expenses');
    expect(getPrevTab('expenses')).toBe('overview');
    expect(getPrevTab('overview')).toBeNull();
  });

  test('getSlideDirection computes correct directional animation cues', () => {
    // Advancing forward (sliding leftward)
    expect(getSlideDirection('overview', 'expenses')).toBe('left');
    expect(getSlideDirection('overview', 'balances')).toBe('left');
    expect(getSlideDirection('overview', 'settings')).toBe('left');
    expect(getSlideDirection('expenses', 'balances')).toBe('left');
    expect(getSlideDirection('balances', 'settings')).toBe('left');

    // Retreating backward (sliding rightward)
    expect(getSlideDirection('settings', 'balances')).toBe('right');
    expect(getSlideDirection('settings', 'expenses')).toBe('right');
    expect(getSlideDirection('settings', 'overview')).toBe('right');
    expect(getSlideDirection('balances', 'expenses')).toBe('right');
    expect(getSlideDirection('expenses', 'overview')).toBe('right');

    // Same tab returns null (no slide)
    expect(getSlideDirection('overview', 'overview')).toBeNull();
    expect(getSlideDirection('expenses', 'expenses')).toBeNull();
  });

  test('Simulated touch gesture decision engine: preserves vertical scroll when vertical displacement dominates', () => {
    // Decision function matching the hook algorithm
    const evaluateGesture = (
      dx: number,
      dy: number,
      dt: number,
      currentTab: GroupTab,
      threshold = 45,
      velocityThreshold = 0.3
    ): { action: 'next' | 'prev' | 'none'; isVerticalScroll: boolean } => {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Vertical dominance check
      if (absDy > 10 && absDy >= absDx) {
        return { action: 'none', isVerticalScroll: true };
      }

      const velocity = absDx / Math.max(1, dt);
      const isPastThreshold = absDx >= threshold;
      const isFlick = velocity > velocityThreshold;

      if (dx < 0 && (isPastThreshold || isFlick)) {
        return { action: getNextTab(currentTab) ? 'next' : 'none', isVerticalScroll: false };
      } else if (dx > 0 && (isPastThreshold || isFlick)) {
        return { action: getPrevTab(currentTab) ? 'prev' : 'none', isVerticalScroll: false };
      }

      return { action: 'none', isVerticalScroll: false };
    };

    // User scrolling down a list: dy = 120px, dx = 15px
    const scrollDown = evaluateGesture(15, 120, 200, 'expenses');
    expect(scrollDown.isVerticalScroll).toBe(true);
    expect(scrollDown.action).toBe('none');

    // User scrolling up: dy = -80px, dx = -10px
    const scrollUp = evaluateGesture(-10, -80, 150, 'balances');
    expect(scrollUp.isVerticalScroll).toBe(true);
    expect(scrollUp.action).toBe('none');

    // User swiping left on Overview: dx = -60px, dy = 8px
    const swipeLeft = evaluateGesture(-60, 8, 120, 'overview');
    expect(swipeLeft.isVerticalScroll).toBe(false);
    expect(swipeLeft.action).toBe('next');

    // User swiping right on Balances: dx = 70px, dy = 5px
    const swipeRight = evaluateGesture(70, 5, 140, 'balances');
    expect(swipeRight.isVerticalScroll).toBe(false);
    expect(swipeRight.action).toBe('prev');

    // Sub-threshold movement: dx = 20px, dy = 2px, slow (dt = 300ms) -> no switch
    const jitter = evaluateGesture(20, 2, 300, 'expenses');
    expect(jitter.action).toBe('none');

    // Quick flick: dx = -35px, dt = 70ms (velocity = 0.5 > 0.3) -> flick switches tab
    const flick = evaluateGesture(-35, 4, 70, 'overview');
    expect(flick.action).toBe('next');

    // Edge boundary: swiping right on overview cannot go previous
    const atFirstTab = evaluateGesture(65, 0, 100, 'overview');
    expect(atFirstTab.action).toBe('none');

    // Edge boundary: swiping left on settings cannot go next
    const atLastTab = evaluateGesture(-65, 0, 100, 'settings');
    expect(atLastTab.action).toBe('none');
  });

  test('Boundary rubber-band calculation applies resistance at tab edges', () => {
    const calculateDragOffset = (currentTab: GroupTab, dx: number) => {
      const atStart = currentTab === GROUP_TABS[0] && dx > 0;
      const atEnd = currentTab === GROUP_TABS[GROUP_TABS.length - 1] && dx < 0;
      return atStart || atEnd ? dx * 0.25 : dx;
    };

    // Free dragging when valid adjacent tab exists
    expect(calculateDragOffset('overview', -40)).toBe(-40);
    expect(calculateDragOffset('expenses', 40)).toBe(40);
    expect(calculateDragOffset('expenses', -40)).toBe(-40);
    expect(calculateDragOffset('balances', 40)).toBe(40);

    // Rubber-band damping at extremities
    expect(calculateDragOffset('overview', 40)).toBe(10); // 40 * 0.25
    expect(calculateDragOffset('settings', -40)).toBe(-10); // -40 * 0.25
  });
});
