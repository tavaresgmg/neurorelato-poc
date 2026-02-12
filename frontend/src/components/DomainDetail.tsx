import { Badge, Box, Collapse, Group, Paper, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import type { DomainResult, Finding, Gap } from '../api/types';
import { CLINICAL_COLORS } from '../theme';
import { EvidenceInline } from './EvidenceInline';
import { GapInsight } from './GapInsight';

type Props = {
  domain: DomainResult;
  gap?: Gap;
  sourceText?: string | null;
  onInsertQuestion?: (question: string) => void;
};

function confidenceColor(score: number): string {
  if (score >= 0.85) return CLINICAL_COLORS.covered;
  if (score >= 0.65) return CLINICAL_COLORS.attention;
  return CLINICAL_COLORS.gap;
}

function FindingRow({ finding, sourceText }: { finding: Finding; sourceText?: string | null }) {
  const [opened, { toggle }] = useDisclosure(false);
  const pct = Math.round(finding.score * 100);

  return (
    <Box>
      <Tooltip label={opened ? 'Clique para recolher' : 'Clique para ver trechos do relato'} position="left" withArrow openDelay={500}>
        <UnstyledButton onClick={toggle} w="100%" py={6}>
          <Group justify="space-between" align="center" gap="xs">
            <Group gap="xs" style={{ flex: 1 }}>
              {opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              <Text size="sm" fw={500}>
                {finding.symptom}
              </Text>
              {finding.negated && (
                <Tooltip label="Mencionado como ausente no relato" withArrow openDelay={300}>
                  <Badge color="red" variant="filled" size="xs" style={{ cursor: 'help' }}>
                    Ausente
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Tooltip label="Grau de confiança na identificação" position="top" withArrow openDelay={500}>
              <Group gap="xs" wrap="nowrap">
                <div className="pn-confidence-bar" style={{ width: 100 }}>
                  <div
                    className="pn-confidence-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: confidenceColor(finding.score),
                    }}
                  />
                </div>
                <Text size="xs" fw={600} style={{ minWidth: 32 }}>
                  {pct}%
                </Text>
              </Group>
            </Tooltip>
          </Group>
        </UnstyledButton>
      </Tooltip>
      <Collapse in={opened}>
        <Box pl={22} pb="sm">
          <EvidenceInline evidence={finding.evidence} sourceText={sourceText} />
        </Box>
      </Collapse>
    </Box>
  );
}

export function DomainDetail({ domain, gap, sourceText, onInsertQuestion }: Props) {
  const sorted = [...domain.findings].sort((a, b) => b.score - a.score);

  return (
    <Paper radius="md" p="md">
      <Group justify="space-between" align="center" mb="sm">
        <Text fw={600} size="md">{domain.domain_name}</Text>
        <Badge variant="light" color={sorted.length > 0 ? 'green' : 'gray'}>
          {sorted.length} achados
        </Badge>
      </Group>

      {sorted.length > 0 && (
        <Stack gap={0}>
          {sorted.map((f, idx) => (
            <FindingRow key={`${f.symptom}-${idx}`} finding={f} sourceText={sourceText} />
          ))}
        </Stack>
      )}

      {gap && <GapInsight gap={gap} onInsertQuestion={onInsertQuestion} />}
    </Paper>
  );
}
