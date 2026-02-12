import { ActionIcon, CopyButton, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowBack, IconCheck, IconCopy, IconSearch } from '@tabler/icons-react';

import type { Gap } from '../api/types';

type Props = {
  gap: Gap;
  onInsertQuestion?: (question: string) => void;
};

export function GapInsight({ gap, onInsertQuestion }: Props) {
  if (gap.gap_level === 'none' && gap.suggested_questions.length === 0) return null;

  return (
    <Stack gap="xs" py="sm" px="md" style={{
      background: 'var(--pn-gap-bg)',
      borderRadius: 'var(--mantine-radius-sm)',
      border: '1px dashed var(--pn-gap-border)',
    }}>
      <Tooltip label="Sugestões para complementar a avaliação desta área" position="top" withArrow openDelay={400}>
        <Group gap="xs" style={{ cursor: 'help' }}>
          <IconSearch size={14} style={{ color: 'var(--pn-gap-icon)' }} />
          <Text size="sm" fw={600} c="orange.8">
            Pontos a explorar
          </Text>
        </Group>
      </Tooltip>
      {gap.rationale && (
        <Text size="sm" c="dimmed">{gap.rationale}</Text>
      )}
      {gap.suggested_questions.length > 0 && (
        <Stack gap={4}>
          {gap.suggested_questions.map((q) => (
            <Group key={q} gap="xs" wrap="nowrap" align="flex-start">
              <Text size="sm" style={{ flex: 1 }}>
                → {q}
              </Text>
              <Group gap={2} wrap="nowrap">
                {onInsertQuestion && (
                  <Tooltip label="Adicionar ao relato">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="orange"
                      onClick={() => onInsertQuestion(q)}
                      aria-label="Inserir pergunta"
                    >
                      <IconArrowBack size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
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
      )}
    </Stack>
  );
}
