import { ActionIcon, Badge, CopyButton, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowBack, IconCheck, IconCopy } from '@tabler/icons-react';

import type { Gap } from '../api/types';
import { gapSeverityColor, sortGapsBySeverity } from '../lib/gapSeverity';

type Props = {
  gaps: Gap[];
  onInsertQuestion?: (question: string) => void;
};

export function GapsPanel({ gaps, onInsertQuestion }: Props) {
  const sorted = sortGapsBySeverity(gaps);

  return (
    <Paper withBorder radius="md" p="md">
      <Text fw={700}>Lacunas</Text>
      <Text size="sm" c="dimmed">
        Domínios pouco explorados na narrativa, com perguntas sugeridas.
      </Text>
      <Stack gap="sm" mt="sm">
        {sorted.map((g) => (
          <Paper key={g.domain_id} withBorder radius="sm" p="sm">
            <Group justify="space-between">
              <Text fw={700} size="sm">
                {g.domain_name}
              </Text>
              <Badge variant="light" color={gapSeverityColor(g.gap_level)}>
                {g.gap_level}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              {g.rationale}
            </Text>
            {g.suggested_questions.length ? (
              <Stack gap={4} mt="sm">
                {g.suggested_questions.map((q) => (
                  <Group key={q} gap="xs" wrap="nowrap" align="flex-start">
                    <Text size="sm" style={{ flex: 1 }}>
                      &bull; {q}
                    </Text>
                    <Group gap={2} wrap="nowrap">
                      {onInsertQuestion ? (
                        <Tooltip label="Usar na entrada">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="indigo"
                            onClick={() => onInsertQuestion(q)}
                            aria-label="Inserir pergunta"
                          >
                            <IconArrowBack size={12} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                      <CopyButton value={q} timeout={1500}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copiado' : 'Copiar pergunta'}>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color={copied ? 'indigo' : 'gray'}
                              onClick={copy}
                              aria-label="Copiar pergunta"
                            >
                              {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                  </Group>
                ))}
              </Stack>
            ) : null}
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
