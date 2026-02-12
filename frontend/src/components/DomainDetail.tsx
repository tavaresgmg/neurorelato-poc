import { Badge, Box, Collapse, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
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
      <UnstyledButton onClick={toggle} w="100%" py={6}>
        <Group justify="space-between" align="center" gap="xs">
          <Group gap="xs" style={{ flex: 1 }}>
            {opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            <Text size="sm" fw={500}>
              {finding.symptom}
            </Text>
            {finding.negated && (
              <Badge color="red" variant="filled" size="xs">
                Negado
              </Badge>
            )}
          </Group>
          <Group gap="xs" wrap="nowrap">
            <div className="pn-confidence-bar" style={{ width: 60 }}>
              <div
                className="pn-confidence-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: confidenceColor(finding.score),
                }}
              />
            </div>
          </Group>
        </Group>
      </UnstyledButton>
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
