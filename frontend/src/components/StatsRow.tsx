import { Group, Paper, RingProgress, SimpleGrid, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconNotes, IconSearch } from '@tabler/icons-react';

type Props = {
  totalFindings: number;
  totalGaps: number;
  overallCoverage: number; // 0-100
};

export function StatsRow({ totalFindings, totalGaps, overallCoverage }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 3 }}>
      <Tooltip label="Sintomas e comportamentos identificados no texto" position="bottom" withArrow>
        <Paper p="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color="green" variant="light" size="lg" radius="xl">
              <IconNotes size={20} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fz={28} fw={700} lh={1.2}>
                {totalFindings}
              </Text>
              <Text size="sm" c="dimmed">
                achados
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Tooltip>

      <Tooltip label="Domínios clínicos com avaliação insuficiente" position="bottom" withArrow>
        <Paper p="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
              <IconSearch size={20} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fz={28} fw={700} lh={1.2}>
                {totalGaps}
              </Text>
              <Text size="sm" c="dimmed">
                lacunas
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Tooltip>

      <Tooltip label="Média de cobertura dos domínios avaliados" position="bottom" withArrow>
        <Paper p="md">
          <Group gap="sm" wrap="nowrap">
            <RingProgress
              size={56}
              thickness={5}
              roundCaps
              sections={[{ value: overallCoverage, color: 'indigo' }]}
            />
            <Stack gap={0}>
              <Text fz={28} fw={700} lh={1.2}>
                {overallCoverage}%
              </Text>
              <Text size="sm" c="dimmed">
                cobertura
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Tooltip>
    </SimpleGrid>
  );
}
