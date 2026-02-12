import { ActionIcon, Badge, CopyButton, Group, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy, IconNotes, IconSearch } from '@tabler/icons-react';

type Props = {
  text: string | null;
  totalFindings: number;
  totalGaps: number;
};

export function SummaryBanner({ text, totalFindings, totalGaps }: Props) {
  if (!text) return null;

  return (
    <div className="pn-summary-banner">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1 }}>
          <Text
            size="md"
            style={{ whiteSpace: 'pre-wrap', fontFamily: '"Fraunces", serif', lineHeight: 1.6 }}
          >
            {text}
          </Text>
          <Group gap="sm" mt="sm">
            <Badge variant="light" color="green" leftSection={<IconNotes size={12} />}>
              {totalFindings} achados
            </Badge>
            {totalGaps > 0 && (
              <Badge variant="light" color="orange" leftSection={<IconSearch size={12} />}>
                {totalGaps} lacunas
              </Badge>
            )}
          </Group>
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
