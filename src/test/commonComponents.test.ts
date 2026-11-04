import { describe, test, expect, beforeEach } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Badge } from '../components/common/Badge';
import { DirectSheetsLink } from '../components/export/DirectSheetsLink';
import { googleAuthService } from '../services/googleAuth';
import type { Group } from '../types/group';

describe('Common UI Components - Badge & DirectSheetsLink', () => {
  beforeEach(() => {
    googleAuthService.setDemoMode(false);
  });
  describe('Badge Component', () => {
    test('renders default slate variant', () => {
      const html = renderToStaticMarkup(
        React.createElement(Badge, null, 'Active')
      );
      expect(html).toContain('bg-slate-100');
      expect(html).toContain('text-slate-700');
      expect(html).toContain('Active');
    });

    test('renders emerald variant and custom className', () => {
      const html = renderToStaticMarkup(
        React.createElement(Badge, { variant: 'emerald', className: 'shadow-xs' }, 'Paid')
      );
      expect(html).toContain('bg-emerald-50');
      expect(html).toContain('text-emerald-700');
      expect(html).toContain('shadow-xs');
      expect(html).toContain('Paid');
    });
  });

  describe('DirectSheetsLink Component', () => {
    const baseGroup: Group = {
      id: 'grp-123',
      name: 'Roadtrip',
      currency: 'USD',
      ownerEmail: 'alice@test.com',
      createdAt: '2026-01-01',
      pendingInvites: [],
      members: [],
    };

    test('returns null when group does not have driveFileUrl', () => {
      const html = renderToStaticMarkup(
        React.createElement(DirectSheetsLink, { group: baseGroup })
      );
      expect(html).toBe('');
    });

    test('renders external anchor link with target="_blank" and rel="noreferrer" when driveFileUrl is present', () => {
      const groupWithUrl: Group = {
        ...baseGroup,
        driveFileUrl: 'https://docs.google.com/spreadsheets/d/grp-123/edit',
      };

      const html = renderToStaticMarkup(
        React.createElement(DirectSheetsLink, { group: groupWithUrl })
      );

      expect(html).toContain('href="https://docs.google.com/spreadsheets/d/grp-123/edit"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noreferrer"');
      expect(html).toContain('Open in Google Sheets');
    });

    test('in demo mode does not render external anchor link or open Google Sheets', () => {
      const demoGroup: Group = {
        ...baseGroup,
        id: 'mock-sheet-goa-2026',
        driveFileUrl: 'https://docs.google.com/spreadsheets/d/mock-sheet-goa-2026/edit',
      };

      const html = renderToStaticMarkup(
        React.createElement(DirectSheetsLink, { group: demoGroup, isDemo: true })
      );

      // Must NOT contain external Google Sheets anchor link
      expect(html).not.toContain('<a');
      expect(html).not.toContain('target="_blank"');
      expect(html).toContain('Open in Google Sheets');
      expect(html).toContain('Simulated demo group (not linked to Google Sheets)');
    });
  });
});
