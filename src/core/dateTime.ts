export interface FormattedDateTime {
  date: string; // e.g. "22 Sep, 2026"
  time: string; // e.g. "21:30"
  full: string; // e.g. "22 Sep, 2026 • 21:30"
}

function formatUtcDate(dt: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(dt);
  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;
  return `${day} ${month}, ${year}`;
}

export function formatTransactionDateTime(
  dateStr: string,
  createdAtStr?: string
): FormattedDateTime {
  let formattedDate = dateStr || '';

  if (dateStr && /^\d{5}(\.\d+)?$/.test(dateStr.trim())) {
    const serial = parseFloat(dateStr.trim());
    formattedDate = formatUtcDate(new Date((serial - 25569) * 86400 * 1000));
  } else if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    formattedDate = formatUtcDate(new Date(dateStr.slice(0, 10) + 'T00:00:00Z'));
  } else if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) formattedDate = formatUtcDate(d);
  }

  let formattedTime = '12:00:00';
  const timeSource = createdAtStr || (dateStr && dateStr.includes('T') ? dateStr : null);
  if (timeSource) {
    const dt = new Date(timeSource);
    if (!isNaN(dt.getTime())) {
      formattedTime = dt.toTimeString().slice(0, 8);
    }
  }

  return {
    date: formattedDate,
    time: formattedTime,
    full: `${formattedDate} • ${formattedTime}`,
  };
}

export function combineDateAndTime(dateStr: string, timeStr?: string): string {
  const [hh, mm, ss] = (timeStr || '').trim().split(':').map((s) => (s ? parseInt(s, 10) : NaN));
  const now = new Date();
  const h = isNaN(hh) ? now.getHours() : hh;
  const m = isNaN(mm) ? now.getMinutes() : mm;
  const s = isNaN(ss) ? now.getSeconds() : ss;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, mon, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    const dt = new Date(y, mon - 1, d, h, m, s, 0);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }

  now.setHours(h, m, s, 0);
  return now.toISOString();
}

export function extractTimeFromTimestamp(createdAtStr?: string): string {
  if (createdAtStr) {
    const dt = new Date(createdAtStr);
    if (!isNaN(dt.getTime())) return dt.toTimeString().slice(0, 8);
  }
  return new Date().toTimeString().slice(0, 8);
}
