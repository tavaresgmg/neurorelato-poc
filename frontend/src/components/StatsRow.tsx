import { Group, Paper, RingProgress, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconNotes, IconSearch } from '@tabler/icons-react';

type Props = {
  totalFindings: number;
  totalGaps: number;
  overallCoverage: number; // 0-100
};

export function StatsRow({ totalFindings, totalGaps, overallCoverage }: Props) {
  return (
    <SimpleGrid cols={{ base: 3 }}>
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
    </SimpleGrid>
  );
}
