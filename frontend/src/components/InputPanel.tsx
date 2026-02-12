import {
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { IconFlask2 } from '@tabler/icons-react';
import type { KeyboardEvent } from 'react';

import type { SpeechRecognitionState } from '../hooks/useSpeechRecognition';
import { SAMPLE_TEXTS } from '../lib/sampleTexts';
import { VoiceInput } from './VoiceInput';

type Props = {
  text: string;
  onChangeText: (v: string) => void;
  canProcess: boolean;
  loading: boolean;
  onProcess: () => void;
  onClear: () => void;
  speech: SpeechRecognitionState;
  onUseTranscript: () => void;
};

const MAX_CHARS = 15_000;

export function InputPanel({
  text,
  onChangeText,
  canProcess,
  loading,
  onProcess,
  onClear,
  speech,
  onUseTranscript,
}: Props) {
  const charCount = text.length;
  const charOver = charCount > MAX_CHARS;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canProcess && !charOver) {
      e.preventDefault();
      onProcess();
    }
  }

  function handleClear() {
    if (!text.trim()) return;
    onClear();
  }

  return (
    <Paper p="lg" radius="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={700}>Relato clínico</Text>
            <Text size="sm" c="dimmed">
              Cole ou dite o relato da consulta. Dados pessoais são removidos automaticamente.
            </Text>
          </Box>
          <Menu shadow="md" width={280} position="bottom-end">
            <Menu.Target>
              <Button variant="light" color="gray" size="xs" leftSection={<IconFlask2 size={14} />} disabled={loading}>
                Exemplo de relato
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Casos exemplo</Menu.Label>
              {SAMPLE_TEXTS.map((s) => (
                <Menu.Item key={s.label} onClick={() => onChangeText(s.text)}>
                  <Text size="sm" fw={600}>{s.label}</Text>
                  <Text size="xs" c="dimmed">{s.description}</Text>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Box>
          <Textarea
            value={text}
            onChange={(e) => onChangeText(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            minRows={8}
            autosize
            placeholder="Cole o relato da consulta aqui..."
            error={charOver ? `Relato muito longo (máx. ${MAX_CHARS.toLocaleString('pt-BR')} caracteres)` : undefined}
          />
          <Group justify="flex-end" mt={4}>
            <Text size="xs" c={charOver ? 'red' : 'dimmed'}>
              {charCount.toLocaleString('pt-BR')} / {MAX_CHARS.toLocaleString('pt-BR')}
            </Text>
          </Group>
        </Box>

        <VoiceInput speech={speech} onUseTranscript={onUseTranscript} />

        <Group justify="flex-end">
          <Tooltip label="⌘ Enter" position="bottom" openDelay={500}>
            <Button onClick={onProcess} loading={loading} disabled={!canProcess || charOver}>
              Analisar
            </Button>
          </Tooltip>
          <Button variant="default" onClick={handleClear} disabled={loading || !text.trim()}>
            Limpar
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
