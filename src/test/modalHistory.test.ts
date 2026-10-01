import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ModalHistoryManager } from '../core/modalHistory';

describe('Modal History and Back Navigation Engine', () => {
  let originalWindow: typeof globalThis.window;
  let historyStack: { state: any; url: string }[] = [];
  let popstateListeners: ((e: any) => void)[] = [];

  beforeEach(() => {
    historyStack = [{ state: null, url: 'http://localhost:5173/#group=test-group-1' }];
    popstateListeners = [];

    // Mock browser window and history for unit testing
    originalWindow = globalThis.window;
    (globalThis as any).window = {
      location: {
        href: 'http://localhost:5173/#group=test-group-1',
        hash: '#group=test-group-1',
      },
      history: {
        get state() {
          return historyStack[historyStack.length - 1]?.state ?? null;
        },
        pushState: (state: any, _unused: string, url: string) => {
          historyStack.push({ state, url });
        },
        back: () => {
          if (historyStack.length > 1) {
            historyStack.pop();
            const event = { state: historyStack[historyStack.length - 1].state };
            // Trigger popstate asynchronously as real browsers do
            setTimeout(() => {
              for (const listener of popstateListeners) {
                listener(event);
              }
            }, 0);
          }
        },
      },
      addEventListener: (type: string, listener: any) => {
        if (type === 'popstate') {
          popstateListeners.push(listener);
        }
      },
      removeEventListener: (type: string, listener: any) => {
        if (type === 'popstate') {
          popstateListeners = popstateListeners.filter((l) => l !== listener);
        }
      },
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  test('opening a modal pushes a history entry and tracks active modal', () => {
    const manager = new ModalHistoryManager();
    let closed = false;

    manager.pushModal('edit-profile-modal', () => {
      closed = true;
    });

    expect(manager.getActiveCount()).toBe(1);
    expect(manager.getPushedCount()).toBe(1);
    expect(historyStack.length).toBe(2);
    expect(historyStack[1].state).toEqual({ spreadSpendsModal: 'edit-profile-modal' });
    expect(closed).toBe(false);

    manager.reset();
  });

  test('clicking browser back (popstate) calls onClose and exits the modal without navigating the page', () => {
    const manager = new ModalHistoryManager();
    let closed = false;

    manager.pushModal('edit-profile-modal', () => {
      closed = true;
    });

    expect(manager.getActiveCount()).toBe(1);

    // Simulate user pressing browser Back button (which pops history and triggers popstate)
    historyStack.pop();
    const event = { state: historyStack[historyStack.length - 1].state };
    for (const listener of popstateListeners) {
      listener(event);
    }

    // Modal was closed!
    expect(closed).toBe(true);
    expect(manager.getActiveCount()).toBe(0);
    expect(manager.getPushedCount()).toBe(0);

    // Underlying URL/hash was NOT altered by modal closure
    expect(globalThis.window.location.hash).toBe('#group=test-group-1');

    manager.reset();
  });

  test('closing modal from UI (popModal) cleanly reverts pushed history via history.back', async () => {
    const manager = new ModalHistoryManager();
    let closed = false;

    const unregister = manager.pushModal('edit-profile-modal', () => {
      closed = true;
    });

    expect(historyStack.length).toBe(2);
    expect(manager.getPushedCount()).toBe(1);

    // User clicks "Cancel" or "Save Changes" inside modal
    unregister();

    expect(manager.getActiveCount()).toBe(0);

    // Wait for macro-task cleanup timer (setTimeout 0)
    await new Promise((r) => setTimeout(r, 20));

    // History entry pushed for modal was cleanly popped
    expect(historyStack.length).toBe(1);
    expect(manager.getPushedCount()).toBe(0);
    // Programmatic back does NOT trigger onClose
    expect(closed).toBe(false);

    manager.reset();
  });

  test('switching between modals in the same tick reuses the history entry without redundant push/pop', async () => {
    const manager = new ModalHistoryManager();
    let modal1Closed = false;
    let modal2Closed = false;

    // Modal 1 opens (e.g. Transaction History)
    const unregister1 = manager.pushModal('history-modal', () => {
      modal1Closed = true;
    });

    expect(historyStack.length).toBe(2);
    expect(manager.getPushedCount()).toBe(1);

    // User clicks "Edit Transaction" -> Modal 1 closes, Modal 2 opens immediately
    unregister1();
    manager.pushModal('edit-expense-modal', () => {
      modal2Closed = true;
    });

    expect(manager.getActiveCount()).toBe(1);
    expect(manager.getPushedCount()).toBe(1);
    // History stack did not grow redundantly or shrink
    expect(historyStack.length).toBe(2);

    // Now clicking browser back closes Modal 2
    historyStack.pop();
    const event = { state: historyStack[historyStack.length - 1].state };
    for (const listener of popstateListeners) {
      listener(event);
    }

    expect(modal2Closed).toBe(true);
    expect(modal1Closed).toBe(false);
    expect(manager.getActiveCount()).toBe(0);

    manager.reset();
  });

  test('nested modals are dismissed one-by-one with consecutive back presses', () => {
    const manager = new ModalHistoryManager();
    let modal1Closed = false;
    let modal2Closed = false;

    // Parent modal opens
    manager.pushModal('parent-modal', () => {
      modal1Closed = true;
    });

    // Nested modal opens on top
    manager.pushModal('child-modal', () => {
      modal2Closed = true;
    });

    expect(manager.getActiveCount()).toBe(2);
    expect(manager.getPushedCount()).toBe(2);
    expect(historyStack.length).toBe(3);

    // 1st Back press: closes child modal
    historyStack.pop();
    for (const listener of popstateListeners) {
      listener({ state: historyStack[historyStack.length - 1].state });
    }
    expect(modal2Closed).toBe(true);
    expect(modal1Closed).toBe(false);
    expect(manager.getActiveCount()).toBe(1);
    expect(manager.getPushedCount()).toBe(1);

    // 2nd Back press: closes parent modal
    historyStack.pop();
    for (const listener of popstateListeners) {
      listener({ state: historyStack[historyStack.length - 1].state });
    }
    expect(modal1Closed).toBe(true);
    expect(manager.getActiveCount()).toBe(0);
    expect(manager.getPushedCount()).toBe(0);

    manager.reset();
  });

  test('gracefully handles non-browser environment where window is undefined', () => {
    (globalThis as any).window = undefined;
    const manager = new ModalHistoryManager();

    expect(() => {
      const unregister = manager.pushModal('test-modal', () => {});
      unregister();
      manager.popModal('test-modal');
      manager.reset();
    }).not.toThrow();

    expect(manager.getActiveCount()).toBe(0);
    expect(manager.getPushedCount()).toBe(0);
  });
});
