import { describe, expect, it } from 'vitest';
import { buildRadarData } from '../lib/radarData';
import type { DomainResult, Gap } from '../api/types';

const makeDomain = (id: string, name: string, scores: number[]): DomainResult => ({
  domain_id: id,
  domain_name: name,
  findings: scores.map((s, i) => ({
    symptom: `finding-${i}`,
    score: s,
    negated: false,
    method: 'heuristic' as const,
    evidence: [],
  })),
});

const makeGap = (id: string, name: string, level: Gap['gap_level']): Gap => ({
  domain_id: id,
  domain_name: name,
  gap_level: level,
  rationale: 'test',
  suggested_questions: ['Pergunta?'],
});

describe('buildRadarData', () => {
  it('returns coverage based on average score for domains with findings', () => {
    const domains = [makeDomain('D1', 'Cognição', [0.9, 0.8])];
    const result = buildRadarData(domains, []);
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('Cognição');
    expect(result[0].coverage).toBe(85);
    expect(result[0].isGap).toBe(false);
  });

  it('returns 0 coverage for gap-only domains', () => {
    const gaps = [makeGap('D2', 'Linguagem', 'high')];
    const result = buildRadarData([], gaps);
    expect(result).toHaveLength(1);
    expect(result[0].coverage).toBe(0);
    expect(result[0].isGap).toBe(true);
  });

  it('merges domains and gaps correctly', () => {
    const domains = [makeDomain('D1', 'Cognição', [0.9])];
    const gaps = [makeGap('D1', 'Cognição', 'low'), makeGap('D2', 'Motor', 'high')];
    const result = buildRadarData(domains, gaps);
    expect(result).toHaveLength(2);
    const cognition = result.find((r) => r.domainId === 'D1')!;
    expect(cognition.coverage).toBe(90);
    expect(cognition.isGap).toBe(true);
    const motor = result.find((r) => r.domainId === 'D2')!;
    expect(motor.coverage).toBe(0);
    expect(motor.isGap).toBe(true);
  });

  it('returns empty array when no data', () => {
    expect(buildRadarData([], [])).toEqual([]);
  });

  it('marks domain without findings as gap even if not in gaps array', () => {
    const domains = [makeDomain('D1', 'Cognição', [])];
    const result = buildRadarData(domains, []);
    expect(result[0].isGap).toBe(true);
    expect(result[0].coverage).toBe(0);
  });
});
