export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);

  // Relative for today
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHrs < 24 && d.getDate() === now.getDate()) return `Há ${diffHrs}h`;

  // Absolute for older
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}
