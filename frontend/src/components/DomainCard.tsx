import { Badge, Box, Group, Paper, Progress, Stack, Text, Tooltip } from '@mantine/core';
import { IconBolt, IconRepeat, IconSparkles, IconUsers } from '@tabler/icons-react';

import type { DomainResult, Finding } from '../api/types';
import { scoreLabel } from '../lib/scoreLabel';

type DomainMeta = {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
};

const DOMAIN_MAP: Record<string, DomainMeta> = {
  DOM_01: {
    icon: <IconUsers size={16} />,
    label: 'Critério A',
    tooltip: 'DSM-5 — Déficits persistentes na comunicação social e na interação social',
  },
  DOM_02: {
    icon: <IconRepeat size={16} />,
    label: 'Critério B',
    tooltip: 'DSM-5 — Padrões restritos e repetitivos de comportamento, interesses ou atividades',
  },
  DOM_03: {
    icon: <IconBolt size={16} />,
    label: 'TDAH',
    tooltip: 'DSM-5 — Transtorno de Déficit de Atenção/Hiperatividade (Desatenção e Hiperatividade)',
  },
};

const DEFAULT_META: DomainMeta = {
  icon: <IconSparkles size={16} />,
  label: '',
  tooltip: '',
};

function getDomainMeta(domainId: string): DomainMeta {
  return DOMAIN_MAP[domainId] ?? DEFAULT_META;
}

type Props = {
  domain: DomainResult;
  onOpenEvidence: (f: Finding) => void;
};

export function DomainCard({ domain, onOpenEvidence }: Props) {
  const sorted = [...domain.findings].sort((a, b) => b.score - a.score);
  const meta = getDomainMeta(domain.domain_id);
  const badgeLabel = meta.label || domain.domain_id;

  return (
    <Paper radius="md" p="md">
      <Group justify="space-between" align="flex-start">
        <Group gap="sm">
          <Tooltip label={meta.tooltip} disabled={!meta.tooltip} multiline maw={320}>
            <Badge variant="light" color="gray" leftSection={meta.icon}>
              {badgeLabel}
            </Badge>
          </Tooltip>
          <Box>
            <Text fw={700}>{domain.domain_name}</Text>
            <Text size="xs" c="dimmed">
              {domain.findings.length === 0
                ? 'Sem achados mapeados para este domínio.'
                : `${domain.findings.length} achados com evidência.`}
            </Text>
          </Box>
        </Group>
        <Badge variant="light">{domain.findings.length} achados</Badge>
      </Group>

      {sorted.length === 0 ? null : (
        <Stack gap="xs" mt="sm">
          {sorted.map((f, idx) => {
            const s = scoreLabel(f.score);
            const methodLabel = f.method === 'embeddings' ? 'Embeddings' : 'Heurística';
            return (
              <Tooltip key={`${f.symptom}-${idx}`} label="Clique para ver evidências" position="top-start" openDelay={400}>
                <Paper
                  radius="sm"
                  p="sm"
                  onClick={() => onOpenEvidence(f)}
                  style={{
                    cursor: 'pointer',
                    transition: 'box-shadow 150ms ease',
                    borderLeft: f.negated ? '3px solid var(--mantine-color-red-5)' : undefined,
                  }}
                  className="pn-finding-card"
                >
                  <Group justify="space-between" align="flex-start" gap="xs">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" justify="space-between" align="center">
                        <Text fw={700} size="sm">
                          {f.symptom}
                        </Text>
                        <Group gap={6}>
                          {f.negated ? (
                            <Badge color="red" variant="filled" size="sm">
                              Negado
                            </Badge>
                          ) : null}
                          <Badge color="gray" variant="light">
                            {methodLabel}
                          </Badge>
                          <Badge color={s.color} variant="light">
                            {s.label}
                          </Badge>
                        </Group>
                      </Group>

                      {f.evidence?.[0] ? (
                        <Text size="sm" c="dimmed" mt={4}>
                          &ldquo;{f.evidence[0].quote}&rdquo;
                        </Text>
                      ) : null}

                      <Group mt="xs" justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                          Confiança: {(f.score * 100).toFixed(0)}%
                        </Text>
                        <Progress value={Math.max(0, Math.min(100, f.score * 100))} w={180} />
                      </Group>
                    </Box>
                  </Group>
                </Paper>
              </Tooltip>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
