/**
 * Formats a model class id (`re-treaty_1-bully`) into a structured display name.
 *
 * The id format is `<system>_<order>-<short-name>` (e.g. `re-treaty_1-bully`),
 * or sometimes `<system>_<order><short-name>` without the dash (e.g. `mg3-blue_1-sv`).
 * Older entries skip the order entirely (`slim-shaper_zs1`).
 */
export interface FormattedClassName {
  system: string;
  /** The system label with hyphens replaced by spaces ("Re-Treaty"). */
  orderAndName: string;
  /** Just the ordinal as "1°", or null if not encoded. */
  order: string | null;
}

export function formatClassName(classId: string): FormattedClassName | null {
  const parts = classId.split('_');
  if (parts.length < 2) return null;

  const system = parts[0].replace(/-/g, ' ');
  const fileRaw = parts.slice(1).join('_');

  let order: string | null = null;
  let fileName = fileRaw.replace(/-/g, ' ');

  if (fileRaw.includes('-')) {
    const dashParts = fileRaw.split('-');
    order = `${dashParts[0]}°`;
    fileName = dashParts.slice(1).join(' ').replace(/-/g, ' ');
  }

  return {
    system,
    orderAndName: order ? `${order} ${fileName}` : fileName,
    order,
  };
}