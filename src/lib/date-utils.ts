import { formatDistanceToNow } from 'date-fns';

/**
 * Format a date to a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - The date to format
 * @param addSuffix - Whether to add "ago" suffix (default: true)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date, addSuffix: boolean = true): string {
  try {
    return formatDistanceToNow(date, { addSuffix });
  } catch (error) {
    // Fallback in case of invalid date
    return 'Unknown time';
  }
}

/**
 * Check if a date is valid
 * @param date - The date to check
 * @returns Whether the date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}