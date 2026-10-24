/* oxlint-disable react/globals */
import { describe, test, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSwipeableTabs } from '../hooks/useSwipeableTabs';

describe('useSwipeableTabs hook execution', () => {
  test('returns initial activeTab, touchHandlers, and navigation helpers', () => {
    let hookResult: any = null;
    function Component() {
      hookResult = useSwipeableTabs({ initialTab: 'expenses' });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    expect(hookResult).toBeDefined();
    expect(hookResult.activeTab).toBe('expenses');
    expect(hookResult.touchHandlers).toBeDefined();
    expect(typeof hookResult.touchHandlers.onTouchStart).toBe('function');
    expect(typeof hookResult.touchHandlers.onTouchMove).toBe('function');
    expect(typeof hookResult.touchHandlers.onTouchEnd).toBe('function');
    expect(typeof hookResult.touchHandlers.onTouchCancel).toBe('function');
    expect(typeof hookResult.goToNextTab).toBe('function');
    expect(typeof hookResult.goToPrevTab).toBe('function');
  });

  test('touchHandlers execute touch gesture flow', () => {
    let hookResult: any = null;
    let switchedTab: string = '';
    function Component() {
      hookResult = useSwipeableTabs({
        initialTab: 'overview',
        onTabChange: (tab) => {
          switchedTab = tab;
        },
      });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    const { touchHandlers } = hookResult;

    // Simulate touch start
    touchHandlers.onTouchStart({
      touches: [{ clientX: 200, clientY: 100 }],
    });

    // Simulate horizontal swipe left (dragging towards left to go to expenses)
    touchHandlers.onTouchMove({
      touches: [{ clientX: 120, clientY: 102 }],
    });

    // Simulate touch end
    touchHandlers.onTouchEnd({
      changedTouches: [{ clientX: 120, clientY: 102 }],
    });
    expect(switchedTab).toBe('expenses');
  });

  test('vertical scroll dominance cancels horizontal swipe', () => {
    let hookResult: any = null;
    let switchedTab: string = '';
    function Component() {
      hookResult = useSwipeableTabs({
        initialTab: 'overview',
        onTabChange: (tab) => {
          switchedTab = tab;
        },
      });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    const { touchHandlers } = hookResult;

    // Start touch
    touchHandlers.onTouchStart({
      touches: [{ clientX: 200, clientY: 100 }],
    });

    // Move vertically much more than horizontally (deltaY: 80, deltaX: 10)
    touchHandlers.onTouchMove({
      touches: [{ clientX: 190, clientY: 180 }],
    });

    touchHandlers.onTouchEnd({
      changedTouches: [{ clientX: 190, clientY: 180 }],
    });
    // Swiped tab should remain empty (cancelled)
    expect(switchedTab).toBe('');
  });

  test('touch cancel resets state', () => {
    let hookResult: any = null;
    function Component() {
      hookResult = useSwipeableTabs({ initialTab: 'overview' });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    const { touchHandlers } = hookResult;
    touchHandlers.onTouchStart({
      touches: [{ clientX: 200, clientY: 100 }],
    });
    touchHandlers.onTouchMove({
      touches: [{ clientX: 180, clientY: 100 }],
    });
    touchHandlers.onTouchCancel();
  });

  test('boundary rubber-banding when dragging at first tab towards right', () => {
    let hookResult: any = null;
    function Component() {
      hookResult = useSwipeableTabs({ initialTab: 'overview' });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    const { touchHandlers } = hookResult;
    touchHandlers.onTouchStart({
      touches: [{ clientX: 200, clientY: 100 }],
    });
    // Drag right at boundary (overview has no prev tab)
    touchHandlers.onTouchMove({
      touches: [{ clientX: 300, clientY: 100 }],
    });
    touchHandlers.onTouchEnd({
      changedTouches: [{ clientX: 300, clientY: 100 }],
    });
  });

  test('exempt elements (inputs, dialogs, tablist) suppress touch gestures', () => {
    let hookResult: any = null;
    let switchedTab = '';
    function Component() {
      hookResult = useSwipeableTabs({
        initialTab: 'overview',
        onTabChange: (t) => {
          switchedTab = t;
        },
      });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    const { touchHandlers } = hookResult;

    // Simulate touch inside a dialog / modal input
    const mockDialogElement = {
      closest: (selector: string) => (selector.includes('[role="dialog"]') ? {} : null),
    };

    touchHandlers.onTouchStart({
      touches: [{ clientX: 200, clientY: 100 }],
      target: mockDialogElement,
    });
    touchHandlers.onTouchMove({
      touches: [{ clientX: 100, clientY: 100 }],
    });
    touchHandlers.onTouchEnd({
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    expect(switchedTab).toBe('');
  });

  test('goToNextTab and goToPrevTab helpers change tab programmatically', () => {
    let hookResult: any = null;
    let targetTab = '';
    function Component() {
      hookResult = useSwipeableTabs({
        initialTab: 'expenses',
        onTabChange: (t) => {
          targetTab = t;
        },
      });
      return React.createElement('div');
    }
    renderToStaticMarkup(React.createElement(Component));

    hookResult.goToNextTab();
    expect(targetTab).toBe('balances');

    hookResult.goToPrevTab();
    expect(targetTab).toBe('overview');
  });
});
