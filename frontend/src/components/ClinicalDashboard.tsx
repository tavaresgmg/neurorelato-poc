import { Box, Collapse, SimpleGrid, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

import type { DomainResult, NormalizeResponse } from '../api/types';
import { buildRadarData } from '../lib/radarData';
import { DomainCard } from './DomainCard';
import { DomainDetail } from './DomainDetail';
import { StatsRow } from './StatsRow';
import { SummaryBanner } from './SummaryBanner';

type Props = {
  result: NormalizeResponse;
  onInsertQuestion?: (question: string) => void;
};

function resolveActiveDomain(
  domainId: string | null,
  domainMap: Map<string, DomainResult>,
  gapMap: Map<string, { domain_name: string }>,
): DomainResult | null {
  if (!domainId) return null;

  const domain = domainMap.get(domainId);
  if (domain) return domain;

  const gap = gapMap.get(domainId);
  return {
    domain_id: domainId,
    domain_name: gap?.domain_name ?? domainId,
    findings: [],
  };
}

function CustomRadarTick({ x, y, payload, activeDomainId, radarData }: any) {
  const point = radarData[payload.index];
  const isActive = activeDomainId === point?.domainId;
  const label =
    payload.value.length > 14 ? payload.value.slice(0, 12) + '\u2026' : payload.value;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dy={y < 160 ? -8 : 8}
      fontSize={12}
      fontWeight={isActive ? 700 : 400}
      fill={isActive ? '#4C6EF5' : '#868E96'}
      style={{ cursor: 'pointer' }}
    >
      {label}
    </text>
  );
}

export function ClinicalDashboard({ result, onInsertQuestion }: Props) {
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const radarData = buildRadarData(result.domains, result.gaps);

  const totalFindings = result.domains.reduce((acc, d) => acc + d.findings.length, 0);
  const overallCoverage =
    radarData.length > 0
      ? Math.round(radarData.reduce((sum, p) => sum + p.coverage, 0) / radarData.length)
      : 0;
  const gapMap = new Map(result.gaps.map((g) => [g.domain_id, g]));
  const domainMap = new Map(result.domains.map((d) => [d.domain_id, d]));

  function toggleDomain(id: string): void {
    setActiveDomainId((prev) => (prev === id ? null : id));
  }

  const activeDomainResult = resolveActiveDomain(activeDomainId, domainMap, gapMap);
  const activeGap = activeDomainId ? gapMap.get(activeDomainId) : undefined;

  return (
    <Stack gap="lg">
      {/* 1. KPIs */}
      <StatsRow
        totalFindings={totalFindings}
        totalGaps={result.gaps.filter((g) => g.gap_level !== 'none').length}
        overallCoverage={overallCoverage}
      />

      {/* 2. Summary — truncated */}
      <SummaryBanner text={result.summary?.text ?? null} />

      {/* 3. Radar hero — centered, larger */}
      {radarData.length > 2 && (
        <Box style={{ width: '100%', maxWidth: 480, height: 320, margin: '0 auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="60%">
              <PolarGrid stroke="#DEE2E6" />
              <PolarAngleAxis
                dataKey="domain"
                tick={(props: any) => (
                  <CustomRadarTick
                    {...props}
                    activeDomainId={activeDomainId}
                    radarData={radarData}
                  />
                )}
              />
              <Radar
                dataKey="coverage"
                stroke="#4C6EF5"
                fill="#4C6EF5"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ r: 4, fill: '#4C6EF5' }}
              />
              <RechartsTooltip
                formatter={(value: number) => [`${value}%`, 'Cobertura']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* 4. Grid of domain cards */}
      <Box>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
          Domínios
        </Text>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm">
          {radarData.map((point) => (
            <DomainCard
              key={point.domainId}
              point={point}
              isActive={activeDomainId === point.domainId}
              onClick={() => toggleDomain(point.domainId)}
            />
          ))}
        </SimpleGrid>
      </Box>

      {/* 5. Expanded detail */}
      <Collapse in={!!activeDomainResult}>
        {activeDomainResult && (
          <DomainDetail
            domain={activeDomainResult}
            gap={activeGap}
            sourceText={result.input?.redacted_text}
            onInsertQuestion={onInsertQuestion}
          />
        )}
      </Collapse>
    </Stack>
  );
}
