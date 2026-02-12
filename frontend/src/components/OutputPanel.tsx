import { Loader, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { forwardRef } from 'react';

import type { NormalizeResponse } from '../api/types';
import { ClinicalDashboard } from './ClinicalDashboard';
import { EmptyState } from './EmptyState';

type Props = {
  result: NormalizeResponse | null;
  loading: boolean;
  onInsertQuestion?: (question: string) => void;
};

export const OutputPanel = forwardRef<HTMLDivElement, Props>(function OutputPanel(
  { result, loading, onInsertQuestion },
  ref,
) {
  return (
    <div ref={ref}>
      {loading && !result ? (
        <Paper p="lg" radius="lg">
          <Stack gap="md" align="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed" fw={500}>
              Analisando narrativa clínica…
            </Text>
            <Stack gap="xs" w="100%">
              <Skeleton height={60} radius="md" />
              <Skeleton height={180} radius="md" />
              <Skeleton height={40} radius="md" />
            </Stack>
          </Stack>
        </Paper>
      ) : !result ? (
        <Paper p="lg" radius="lg">
          <EmptyState
            icon={<IconBrain size={24} />}
            title="Pronto para analisar"
            description="Cole ou dite o relato da consulta e clique em Analisar."
          />
        </Paper>
      ) : (
        <ClinicalDashboard result={result} onInsertQuestion={onInsertQuestion} />
      )}
    </div>
  );
});
