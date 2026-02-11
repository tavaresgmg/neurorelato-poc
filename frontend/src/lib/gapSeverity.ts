const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

const SEVERITY_COLORS: Record<string, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
  none: 'gray',
};

export function sortGapsBySeverity<T extends { gap_level: string }>(gaps: T[]): T[] {
  return [...gaps].sort(
    (a, b) => (SEVERITY_ORDER[a.gap_level] ?? 99) - (SEVERITY_ORDER[b.gap_level] ?? 99),
  );
}

export function gapSeverityColor(level: string): string {
  return SEVERITY_COLORS[level] ?? 'gray';
}
