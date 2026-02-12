import { Group, Paper, RingProgress, Stack, Text, Tooltip } from '@mantine/core';

import type { RadarDataPoint } from '../lib/radarData';
import { CLINICAL_COLORS } from '../theme';

type Props = {
  point: RadarDataPoint;
  isActive: boolean;
  onClick: () => void;
};

function coverageColor(point: RadarDataPoint): string {
  if (point.isGap && point.findingsCount === 0) return CLINICAL_COLORS.gap;
  if (point.coverage >= 75) return CLINICAL_COLORS.covered;
  return CLINICAL_COLORS.attention;
}

export function DomainCard({ point, isActive, onClick }: Props) {
  const isGapOnly = point.isGap && point.findingsCount === 0;

  const className = [
    'pn-domain-card',
    isActive && 'pn-domain-card--active',
    isGapOnly && 'pn-domain-card--gap',
  ]
    .filter(Boolean)
    .join(' ');

  const cardTooltip = isGapOnly
    ? 'Clique para ver sugestões de investigação'
    : 'Clique para ver achados e evidências';

  return (
    <Tooltip label={cardTooltip} position="top" withArrow openDelay={400}>
      <Paper className={className} onClick={onClick} style={{ cursor: 'pointer' }}>
        <Group wrap="nowrap">
          <Tooltip label="Cobertura do domínio" position="left" withArrow openDelay={600}>
            <RingProgress
              size={52}
              thickness={4}
              roundCaps
              sections={[{ value: point.coverage, color: coverageColor(point) }]}
              label={
                <Text fz={12} fw={700} ta="center">
                  {point.coverage}%
                </Text>
              }
            />
          </Tooltip>

          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={600} size="sm" lineClamp={1}>
              {point.domain}
            </Text>

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {point.findingsCount} achados
              </Text>
              {point.isGap && (
                <Tooltip label="Domínio com investigação insuficiente" withArrow openDelay={300}>
                  <Text size="xs" c="orange" style={{ cursor: 'help' }}>
                    lacuna
                  </Text>
                </Tooltip>
              )}
            </Group>
          </Stack>
        </Group>
      </Paper>
    </Tooltip>
  );
}
