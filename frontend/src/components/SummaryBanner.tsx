import { ActionIcon, CopyButton, Group, Spoiler, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

type Props = {
  text: string | null;
};

export function SummaryBanner({ text }: Props) {
  if (!text) return null;

  return (
    <div className="pn-summary-banner">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1 }}>
          <Spoiler maxHeight={80} showLabel="Ver resumo completo" hideLabel="Recolher">
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {text}
            </Text>
          </Spoiler>
        </div>
        <CopyButton value={text} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copiado!' : 'Copiar resumo'}>
              <ActionIcon
                variant="subtle"
                color={copied ? 'indigo' : 'gray'}
                onClick={copy}
                aria-label="Copiar resumo"
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </div>
  );
}
