const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

export interface FormattedDateTime {
  date: string; // e.g. "22 Sep, 26"
  time: string; // e.g. "21:30"
  full: string; // e.g. "22 Sep, 26 • 21:30"
}

/**
 * Formats a transaction date and timestamp to the specified format:
 * Date: (DD MMM, YYYY) -> e.g. "22 Sep, 2026"
 * Time: (HH:MM) -> e.g. "21:30"
 */
export function formatTransactionDateTime(
  dateStr: string,
  createdAtStr?: string
): FormattedDateTime {
  let day = '';
  let month = '';
  let year = '';

  // 1. Format Date (DD MMM, YYYY)
  if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, mStr, dStr] = dateStr.slice(0, 10).split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    const dNum = parseInt(dStr, 10);
    day = String(dNum).padStart(2, '0');
    month = MONTHS[mIdx] || mStr;
    year = y;
  } else if (dateStr && /^\d{5}(\.\d+)?$/.test(dateStr.trim())) {
    // Handle Google Sheets serial date number (days since 1899-12-30)
    const serial = parseFloat(dateStr.trim());
    const dt = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(dt.getTime())) {
      day = String(dt.getUTCDate()).padStart(2, '0');
      month = MONTHS[dt.getUTCMonth()] || '';
      year = String(dt.getUTCFullYear());
    }
  } else if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        day = String(d.getDate()).padStart(2, '0');
        month = MONTHS[d.getMonth()] || '';
        year = String(d.getFullYear());
      }
    } catch {
      // fallback
    }
  }

  const formattedDate = month ? `${day} ${month}, ${year}` : dateStr || '';

  // 2. Format Time (HH:MM) from createdAtStr or dateStr
  let formattedTime = '';
  const timeSource = createdAtStr || (dateStr && dateStr.includes('T') ? dateStr : null);
  if (timeSource) {
    try {
      const dt = new Date(timeSource);
      if (!isNaN(dt.getTime())) {
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        formattedTime = `${hh}:${mm}`;
      }
    } catch {
      formattedTime = '';
    }
  }

  // If time could not be parsed from timestamp, default to "12:00"
  if (!formattedTime) {
    formattedTime = '12:00';
  }

  const full = `${formattedDate} • ${formattedTime}`;

  return {
    date: formattedDate,
    time: formattedTime,
    full,
  };
}

/**
 * Combines a date (YYYY-MM-DD) and a time (HH:MM) into an ISO string.
 * Uses local time components so that local getHours()/getMinutes() will match.
 */
export function combineDateAndTime(dateStr: string, timeStr?: string): string {
  const time = timeStr && /^\d{1,2}:\d{2}$/.test(timeStr.trim()) ? timeStr.trim() : '12:00';
  const [hhStr, mmStr] = time.split(':');
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString();
    }
  }

  const now = new Date();
  now.setHours(hh, mm, 0, 0);
  return now.toISOString();
}

/**
 * Extracts "HH:MM" 24-hour time string from a timestamp or falls back to current time.
 */
export function extractTimeFromTimestamp(createdAtStr?: string): string {
  if (createdAtStr) {
    try {
      const dt = new Date(createdAtStr);
      if (!isNaN(dt.getTime())) {
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    } catch {
      // fallback
    }
  }
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
