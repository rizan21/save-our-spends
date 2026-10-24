import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Modal } from '../components/common/Modal';
import { ModalHistoryManager } from '../core/modalHistory';

describe('Modal Component - Accessibility, Dialog Attributes & History', () => {
  let originalWindow: typeof globalThis.window;
  let popstateListeners: ((e: any) => void)[] = [];
  let historyManager: ModalHistoryManager;

  beforeEach(() => {
    popstateListeners = [];
    originalWindow = globalThis.window;
    (globalThis as any).window = {
      location: { href: 'http://localhost/' },
      history: {
        state: null,
        pushState: () => {},
        back: () => {},
      },
      addEventListener: (type: string, listener: any) => {
        if (type === 'popstate') popstateListeners.push(listener);
      },
      removeEventListener: (type: string, listener: any) => {
        if (type === 'popstate') popstateListeners = popstateListeners.filter((l) => l !== listener);
      },
    };
    historyManager = new ModalHistoryManager();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  test('renders null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Modal,
        { isOpen: false, onClose: () => {} },
        React.createElement('span', null, 'Hidden Content')
      )
    );
    expect(html).toBe('');
  });

  test('renders accessible dialog with role="dialog", aria-modal="true", title and description', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Modal,
        {
          isOpen: true,
          onClose: () => {},
          title: 'Invite Friends',
          description: 'Share your group spreadsheet',
          maxWidth: 'lg',
        },
        React.createElement('div', { id: 'modal-body' }, 'Form Content')
      )
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Invite Friends');
    expect(html).toContain('Share your group spreadsheet');
    expect(html).toContain('Form Content');
    expect(html).toContain('max-w-lg');
    expect(html).toContain('aria-label="Close modal"');
  });

  test('suppresses close button when showCloseButton is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Modal,
        {
          isOpen: true,
          onClose: () => {},
          title: 'Important Alert',
          showCloseButton: false,
        },
        React.createElement('p', null, 'Content')
      )
    );

    expect(html).not.toContain('aria-label="Close modal"');
  });

  test('renders backdrop, card, and different maxWidth options (sm, md, xl)', () => {
    for (const size of ['sm', 'md', 'xl'] as const) {
      const html = renderToStaticMarkup(
        React.createElement(
          Modal,
          {
            isOpen: true,
            onClose: () => {},
            title: `Size ${size}`,
            maxWidth: size,
          },
          React.createElement('div', null, 'Body')
        )
      );
      expect(html).toContain(`max-w-${size}`);
      expect(html).toContain('backdrop-blur-xs');
    }
  });

  test('modal history popstate triggers top modal onClose', () => {
    let modalClosed = false;
    const unregister = historyManager.pushModal('test-modal-1', () => {
      modalClosed = true;
    });

    expect(historyManager.getActiveCount()).toBe(1);

    // Simulate browser back button (dispatch popstate event)
    for (const listener of popstateListeners) {
      listener({ state: null });
    }

    expect(modalClosed).toBe(true);
    expect(historyManager.getActiveCount()).toBe(0);

    unregister();
  });
});
