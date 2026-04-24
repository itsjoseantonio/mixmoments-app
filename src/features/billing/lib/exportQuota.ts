const QUOTA_KEY = 'mm_export_count';

export function getExportCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(QUOTA_KEY) ?? '0', 10);
}

export function incrementExportCount(): void {
  localStorage.setItem(QUOTA_KEY, String(getExportCount() + 1));
}
