import { Box, Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconCircleFilled, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

import type { DomainResult, NormalizeResponse } from '../api/types';
import { buildRadarData, type RadarDataPoint } from '../lib/radarData';
import { CLINICAL_COLORS } from '../theme';
import { DomainDetail } from './DomainDetail';
import { SummaryBanner } from './SummaryBanner';

type Props = {
  result: NormalizeResponse;
  onInsertQuestion?: (question: string) => void;
};

function coverageColor(point: RadarDataPoint): string {
  if (point.isGap) return CLINICAL_COLORS.gap;
  if (point.coverage >= 75) return CLINICAL_COLORS.covered;
  return CLINICAL_COLORS.attention;
}

function isGapOnly(point: RadarDataPoint): boolean {
  return point.isGap && point.findingsCount === 0;
}

function DomainPill({
  point,
  isActive,
  onClick,
}: {
  point: RadarDataPoint;
  isActive: boolean;
  onClick: () => void;
}) {
  const className = [
    'pn-domain-pill',
    isActive && 'pn-domain-pill--active',
    isGapOnly(point) && 'pn-domain-pill--gap',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <UnstyledButton
      className={className}
      onClick={onClick}
      px="sm"
      py={6}
      style={{ borderRadius: 'var(--mantine-radius-xl)' }}
    >
      <Group gap={6} wrap="nowrap">
        {isGapOnly(point) ? (
          <IconSearch size={12} style={{ color: CLINICAL_COLORS.gap }} />
        ) : (
          <IconCircleFilled size={8} style={{ color: coverageColor(point) }} />
        )}
        <Text size="sm" fw={500}>
          {point.domain}
        </Text>
        {point.findingsCount > 0 && (
          <Text size="xs" c="dimmed">
            {point.findingsCount}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );
}

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

export function ClinicalDashboard({ result, onInsertQuestion }: Props) {
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const radarData = buildRadarData(result.domains, result.gaps);

  const totalFindings = result.domains.reduce((acc, d) => acc + d.findings.length, 0);
  const gapMap = new Map(result.gaps.map((g) => [g.domain_id, g]));
  const domainMap = new Map(result.domains.map((d) => [d.domain_id, d]));

  function toggleDomain(id: string): void {
    setActiveDomainId((prev) => (prev === id ? null : id));
  }

  const activeDomainResult = resolveActiveDomain(activeDomainId, domainMap, gapMap);
  const activeGap = activeDomainId ? gapMap.get(activeDomainId) : undefined;

  return (
    <Stack gap="md">
      <SummaryBanner text={result.summary?.text ?? null} />

      <Group align="flex-start" gap="lg" wrap="nowrap">
        {radarData.length > 2 && (
          <Box style={{ width: 220, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#DEE2E6" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fontSize: 11, fill: '#868E96' }}
                />
                <Radar
                  dataKey="coverage"
                  stroke="#4C6EF5"
                  fill="#4C6EF5"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Box style={{ flex: 1 }}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">
            Domínios
          </Text>
          <Group gap="xs">
            {radarData.map((point) => (
              <DomainPill
                key={point.domainId}
                point={point}
                isActive={activeDomainId === point.domainId}
                onClick={() => toggleDomain(point.domainId)}
              />
            ))}
          </Group>
        </Box>
      </Group>

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
