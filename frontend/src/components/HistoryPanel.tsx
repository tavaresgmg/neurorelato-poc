import {
  ActionIcon,
  Center,
  Group,
  Loader,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IconHistory, IconInbox, IconRefresh, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import type { HistoryItem } from '../api/types';
import { formatDate } from '../lib/formatDate';

type Props = {
  history: HistoryItem[];
  loadingHistory: boolean;
  loadingRun: boolean;
  openingRunId: string | null;
  activeRunId: string | null;
  onRefresh: () => void;
  onOpenRun: (id: string) => void;
};

export function HistoryPanel({
  history,
  loadingHistory,
  loadingRun,
  openingRunId,
  activeRunId,
  onRefresh,
  onOpenRun,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter((h) => {
      const date = formatDate(h.created_at).toLowerCase();
      const counts = `${h.findings_count} achados ${h.gaps_count} lacunas`;
      return date.includes(q) || counts.includes(q);
    });
  }, [history, search]);

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Group gap={6}>
          <IconHistory size={14} style={{ opacity: 0.5 }} />
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 0.8 }}>
            Consultas
          </Text>
        </Group>
        <Tooltip label="Atualizar histórico" position="right">
          <ActionIcon
            variant="subtle"
            size="sm"
            color="gray"
            onClick={onRefresh}
            loading={loadingHistory}
            aria-label="Atualizar"
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <TextInput
        size="xs"
        placeholder="Buscar por data ou contagens…"
        leftSection={<IconSearch size={13} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        disabled={history.length === 0}
      />

      {loadingHistory && history.length === 0 ? (
        <Stack gap="xs">
          <Skeleton height={52} radius="sm" />
          <Skeleton height={52} radius="sm" />
          <Skeleton height={52} radius="sm" />
        </Stack>
      ) : filtered.length === 0 && search ? (
        <Text size="sm" c="dimmed" ta="center" py="sm">
          Nenhum resultado para &ldquo;{search}&rdquo;
        </Text>
      ) : history.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap={4}>
            <IconInbox size={28} style={{ opacity: 0.25 }} />
            <Text size="sm" c="dimmed">
              Sem itens ainda.
            </Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap={4}>
          {filtered.map((h) => {
            const isActive = h.request_id === activeRunId;
            const isOpening = loadingRun && h.request_id === openingRunId;

            return (
              <UnstyledButton
                key={h.request_id}
                className={`pn-nav-item${isActive ? ' pn-nav-item--active' : ''}`}
                onClick={() => onOpenRun(h.request_id)}
                disabled={loadingRun && !isOpening}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {formatDate(h.created_at)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {h.findings_count} achados · {h.gaps_count} lacunas
                    </Text>
                  </Stack>
                  {isOpening && <Loader size="xs" />}
                </Group>
              </UnstyledButton>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
