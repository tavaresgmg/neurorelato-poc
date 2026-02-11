export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 0.85) return { label: 'Alto', color: 'cyan' };
  if (score >= 0.65) return { label: 'Médio', color: 'yellow' };
  return { label: 'Baixo', color: 'orange' };
}

