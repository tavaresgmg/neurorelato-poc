import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Box,
  CopyButton,
  Divider,
  Group,
  Loader,
  Paper,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconClipboard,
  IconFileText,
} from '@tabler/icons-react';
import { forwardRef } from 'react';

import type { Finding, NormalizeResponse } from '../api/types';
import { DomainCard } from './DomainCard';
import { EmptyState } from './EmptyState';
import { GapsPanel } from './GapsPanel';

type Props = {
  result: NormalizeResponse | null;
  loading: boolean;
  onOpenEvidence: (f: Finding) => void;
  onInsertQuestion?: (question: string) => void;
};

function buildExportText(result: NormalizeResponse): string {
  const lines: string[] = [];
  lines.push(`Resumo: ${result.summary?.text ?? '(sem resumo)'}`);
  lines.push('');
  for (const d of result.domains) {
    lines.push(`## ${d.domain_name} (${d.findings.length} achados)`);
    for (const f of d.findings) {
      const neg = f.negated ? ' [NEGADO]' : '';
      lines.push(`  - ${f.symptom}${neg} (${(f.score * 100).toFixed(0)}%)`);
    }
  }
  if (result.gaps.length) {
    lines.push('');
    lines.push('## Lacunas');
    for (const g of result.gaps) {
      lines.push(`  - ${g.domain_name}: ${g.gap_level}`);
    }
  }
  return lines.join('\n');
}

export const OutputPanel = forwardRef<HTMLDivElement, Props>(function OutputPanel(
  { result, loading, onOpenEvidence, onInsertQuestion },
  ref,
) {
  const totalFindings = result
    ? result.domains.reduce((acc, d) => acc + d.findings.length, 0)
    : 0;

  return (
    <Paper p="lg" radius="lg" ref={ref}>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={700}>Saída</Text>
            <Text size="sm" c="dimmed">
              Achados por domínio, lacunas e rastreabilidade.
            </Text>
          </Box>
          <Group gap="xs">
            {result ? (
              <>
                <Badge variant="light">{totalFindings} achados</Badge>
                <CopyButton value={result.request_id} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copiado!' : `Copiar Request ID: ${result.request_id}`}>
                      <ActionIcon variant="subtle" color={copied ? 'indigo' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconClipboard size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                <CopyButton value={buildExportText(result)} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copiado!' : 'Copiar tudo'}>
                      <ActionIcon variant="subtle" color={copied ? 'indigo' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconClipboard size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </>
            ) : null}
          </Group>
        </Group>
        <Divider />

        {loading && !result ? (
          <Stack gap="md" align="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed" fw={500}>
              Analisando narrativa clínica…
            </Text>
            <Stack gap="xs" w="100%">
              <Skeleton height={80} radius="md" />
              <Skeleton height={120} radius="md" />
            </Stack>
          </Stack>
        ) : !result ? (
          <EmptyState
            icon={<IconFileText size={24} />}
            title="Nenhum resultado"
            description="Processa um texto para visualizar domínios, evidências e lacunas."
          />
        ) : (
          <Stack gap="md">
            {result.warnings.length ? (
              <Stack gap="xs">
                <Text fw={700}>Avisos</Text>
                {result.warnings.map((w) => (
                  <Alert
                    key={w.code}
                    icon={<IconAlertTriangle size={16} />}
                    color="yellow"
                    variant="light"
                    title={w.code}
                  >
                    {w.message}
                  </Alert>
                ))}
              </Stack>
            ) : null}

            {result.summary?.text ? (
              <Paper radius="md" p="md">
                <Text fw={700}>Resumo técnico</Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mt="xs">
                  {result.summary.text}
                </Text>
              </Paper>
            ) : null}

            {result.domains.map((d) => (
              <DomainCard key={d.domain_id} domain={d} onOpenEvidence={onOpenEvidence} />
            ))}

            {result.gaps.length ? (
              <GapsPanel gaps={result.gaps} onInsertQuestion={onInsertQuestion} />
            ) : null}

            {result.input?.redacted_text ? (
              <Accordion variant="contained" radius="md">
                <Accordion.Item value="redacted">
                  <Accordion.Control>
                    <Text fw={700} size="sm">
                      Texto processado (anonimizado)
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" c="dimmed" mb="xs">
                      Os offsets de evidência (start/end) referenciam este texto.
                    </Text>
                    <Paper radius="sm" p="sm">
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {result.input.redacted_text}
                      </Text>
                    </Paper>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
});
