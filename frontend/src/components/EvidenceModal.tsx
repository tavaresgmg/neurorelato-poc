import {
  ActionIcon,
  Badge,
  Box,
  CopyButton,
  Divider,
  Group,
  Mark,
  Modal,
  Progress,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

import type { Evidence, FindingMethod } from '../api/types';
import { scoreLabel } from '../lib/scoreLabel';

export type EvidenceModalState = {
  title: string;
  evidence: Evidence[];
  meta: { score: number; method: FindingMethod; negated: boolean };
  sourceText?: string | null;
};

type Props = {
  value: EvidenceModalState | null;
  onClose: () => void;
};

export function EvidenceModal({ value, onClose }: Props) {
  if (!value) return <Modal opened={false} onClose={onClose} title="Evidência" size="lg" />;

  const s = scoreLabel(value.meta.score);
  const pct = Math.round(value.meta.score * 100);

  return (
    <Modal
      opened
      onClose={onClose}
      title={value.title}
      size="lg"
      overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
      styles={{
        content: { background: 'var(--mantine-color-body)' },
        header: { background: 'var(--mantine-color-body)' },
        title: { fontWeight: 700, fontSize: '1.1rem' },
        body: { paddingTop: 8 },
      }}
    >
      <Stack gap="md">
        {/* --- Metadata --- */}
        <Group gap="xs" wrap="wrap">
          {value.meta.negated ? (
            <Badge color="red" variant="filled" size="sm">
              Negado
            </Badge>
          ) : null}
          <Badge color="gray" variant="light" size="sm">
            {value.meta.method === 'embeddings' ? 'Embeddings' : 'Heurística'}
          </Badge>
          <Badge color={s.color} variant="light" size="sm">
            {s.label}
          </Badge>
        </Group>

        <Group gap="sm" align="center">
          <Text size="sm" fw={600}>
            Confiança: {pct}%
          </Text>
          <Progress value={pct} color={s.color} w={120} size="sm" />
        </Group>

        <Divider />

        {/* --- Evidence list --- */}
        {value.evidence.length ? (
          <Stack gap="md">
            {value.evidence.map((ev, i) => (
              <Stack key={i} gap="sm">
                {/* Quote */}
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4}>
                    Citação extraída
                  </Text>
                  <Group
                    gap="xs"
                    wrap="nowrap"
                    align="flex-start"
                    style={{
                      borderLeft: '3px solid var(--mantine-color-indigo-4)',
                      paddingLeft: 12,
                    }}
                  >
                    <Text size="sm" fw={500} fs="italic" style={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                      &ldquo;{ev.quote}&rdquo;
                    </Text>
                    <CopyButton value={ev.quote} timeout={1500}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copiado' : 'Copiar citação'}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color={copied ? 'indigo' : 'gray'}
                            onClick={copy}
                          >
                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Box>

                {/* Context */}
                {value.sourceText ? (
                  <Box>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4}>
                      Contexto no texto-fonte
                    </Text>
                    <Box className="pn-evidence-context">
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {renderContext(value.sourceText, ev)}
                      </Text>
                    </Box>
                  </Box>
                ) : null}

                {/* Offsets */}
                <Text size="xs" c="dimmed">
                  offsets: {ev.start}..{ev.end}
                </Text>

                {i < value.evidence.length - 1 && <Divider variant="dashed" />}
              </Stack>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Sem evidências registradas.
          </Text>
        )}
      </Stack>
    </Modal>
  );
}

function renderContext(sourceText: string, ev: Evidence) {
  const s = Math.max(0, Math.min(ev.start, sourceText.length));
  const e = Math.max(0, Math.min(ev.end, sourceText.length));
  if (e <= s) return sourceText.slice(Math.max(0, s - 80), Math.min(sourceText.length, s + 80));

  const ctxStart = Math.max(0, s - 80);
  const ctxEnd = Math.min(sourceText.length, e + 80);
  const before = sourceText.slice(ctxStart, s);
  const hit = sourceText.slice(s, e);
  const after = sourceText.slice(e, ctxEnd);

  return (
    <>
      {before}
      <Mark color="yellow" style={{ padding: '1px 2px', fontWeight: 600 }}>
        {hit}
      </Mark>
      {after}
    </>
  );
}
