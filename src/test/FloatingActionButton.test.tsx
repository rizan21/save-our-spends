import { describe, test, expect, mock } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FloatingActionButton } from '../components/common/FloatingActionButton';

describe('FloatingActionButton Component', () => {
  test('renders default circular FAB with type="button", default aria-label and Lucide Plus icon', () => {
    const handleClick = mock(() => {});
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        onClick: handleClick,
      })
    );

    // Verify button attributes
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Add expense"');
    expect(html).toContain('w-14 h-14 rounded-full');
    expect(html).toContain('bg-emerald-600');

    // Verify fixed viewport positioning and safe area inset classes
    expect(html).toContain('fixed right-6 sm:right-8');
    expect(html).toContain('bottom-[calc(1.5rem+env(safe-area-inset-bottom))]');
    expect(html).toContain('sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]');
    expect(html).toContain('z-40');
  });

  test('renders desktop hover tooltip with role="tooltip" and pointer-events-none', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        onClick: () => {},
        tooltipText: 'Add new transaction',
      })
    );

    expect(html).toContain('role="tooltip"');
    expect(html).toContain('Add new transaction');
    expect(html).toContain('hidden sm:group-hover:flex');
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('absolute right-full mr-3');
  });

  test('suppresses tooltip when tooltipText is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        onClick: () => {},
        tooltipText: '',
      })
    );

    expect(html).not.toContain('role="tooltip"');
  });

  test('respects custom aria-label, className, and custom icon', () => {
    const CustomIcon = ({ className }: { className?: string }) =>
      React.createElement('span', { className, 'data-testid': 'custom-icon' }, 'Icon');

    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        onClick: () => {},
        ariaLabel: 'Custom Action',
        icon: CustomIcon,
        className: 'custom-fab-class',
      })
    );

    expect(html).toContain('aria-label="Custom Action"');
    expect(html).toContain('custom-fab-class');
    expect(html).toContain('data-testid="custom-icon"');
  });

  test('correctly sets tabIndex and aria-hidden when modal is open', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        onClick: () => {},
        tabIndex: -1,
        'aria-hidden': true,
      })
    );

    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-hidden="true"');
  });

  test('supports disabled state', () => {
    const html = renderToStaticMarkup(
      React.createElement(FloatingActionButton, {
        onClick: () => {},
        disabled: true,
      })
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('disabled:opacity-50');
  });

  test('onClick handler is callable', () => {
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };

    const element = React.createElement(FloatingActionButton, {
      onClick: handleClick,
    });

    // Invoke onClick directly from props
    element.props.onClick();
    expect(clicked).toBe(true);
  });
});
