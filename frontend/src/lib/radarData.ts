import type { DomainResult, Gap } from '../api/types';

export type RadarDataPoint = {
  domain: string;
  domainId: string;
  coverage: number;
  isGap: boolean;
  gapLevel: 'none' | 'low' | 'medium' | 'high';
  findingsCount: number;
};

export function buildRadarData(
  domains: DomainResult[],
  gaps: Gap[],
): RadarDataPoint[] {
  const gapMap = new Map(gaps.map((g) => [g.domain_id, g]));
  const domainMap = new Map(domains.map((d) => [d.domain_id, d]));
  const allIds = new Set([...domainMap.keys(), ...gapMap.keys()]);

  return Array.from(allIds).map((id) => {
    const domain = domainMap.get(id);
    const gap = gapMap.get(id);
    const name = domain?.domain_name ?? gap?.domain_name ?? id;
    const findings = domain?.findings ?? [];

    let coverage = 0;
    if (findings.length > 0) {
      const avg = findings.reduce((sum, f) => sum + f.score, 0) / findings.length;
      coverage = Math.round(avg * 100);
    }

    const isGap = gap ? gap.gap_level !== 'none' : findings.length === 0;

    const gapLevel = gap?.gap_level ?? 'none';

    return { domain: name, domainId: id, coverage, isGap, gapLevel, findingsCount: findings.length };
  });
}
