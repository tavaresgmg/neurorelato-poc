import { ActionIcon, Box, CopyButton, Group, Mark, Stack, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

import type { Evidence } from '../api/types';

type Props = {
  evidence: Evidence[];
  sourceText?: string | null;
};

export function EvidenceInline({ evidence, sourceText }: Props) {
  if (evidence.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="xs">
        Sem evidências registradas.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {evidence.map((ev, i) => (
        <div key={i} className="pn-evidence-inline">
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <Text size="sm" fs="italic" style={{ whiteSpace: 'pre-wrap', flex: 1 }}>
              &ldquo;{ev.quote}&rdquo;
            </Text>
            <CopyButton value={ev.quote} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copiado!' : 'Copiar trecho'}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={copied ? 'indigo' : 'gray'}
                    onClick={copy}
                    aria-label="Copiar trecho"
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          {sourceText && (
            <Box mt="xs">
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {renderContext(sourceText, ev)}
              </Text>
            </Box>
          )}
        </div>
      ))}
    </Stack>
  );
}

function renderContext(sourceText: string, ev: Evidence) {
  const s = Math.max(0, Math.min(ev.start, sourceText.length));
  const e = Math.max(0, Math.min(ev.end, sourceText.length));
  if (e <= s) return sourceText.slice(Math.max(0, s - 60), Math.min(sourceText.length, s + 60));

  const ctxStart = Math.max(0, s - 60);
  const ctxEnd = Math.min(sourceText.length, e + 60);
  const before = sourceText.slice(ctxStart, s);
  const hit = sourceText.slice(s, e);
  const after = sourceText.slice(e, ctxEnd);

  return (
    <>
      {ctxStart > 0 && '…'}
      {before}
      <Mark color="yellow" style={{ padding: '1px 2px', fontWeight: 600 }}>
        {hit}
      </Mark>
      {after}
      {ctxEnd < sourceText.length && '…'}
    </>
  );
}
