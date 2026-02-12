import { Alert, Box, Button, Group, Stack, Text } from '@mantine/core';
import {
  IconAlertCircle,
  IconMicrophone,
  IconPlayerStop,
  IconTransfer,
} from '@tabler/icons-react';

import type { SpeechRecognitionState } from '../hooks/useSpeechRecognition';

type Props = {
  speech: SpeechRecognitionState;
  onUseTranscript: () => void;
};

function WaveBars() {
  return (
    <div className="pn-wave-bars" aria-hidden>
      <div className="pn-wave-bar" />
      <div className="pn-wave-bar" />
      <div className="pn-wave-bar" />
      <div className="pn-wave-bar" />
      <div className="pn-wave-bar" />
    </div>
  );
}

export function VoiceInput({ speech, onUseTranscript }: Props) {
  const unsupported = !speech.supported && !speech.listening;

  return (
    <Stack gap="xs">
      {speech.listening ? (
        <Box className="pn-recording-card">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <div className="pn-recording-dot" />
              <WaveBars />
              <Text size="sm" fw={500} c="red.7">
                Ouvindo…
              </Text>
            </Group>
            <Button
              variant="light"
              color="red"
              size="xs"
              leftSection={<IconPlayerStop size={14} />}
              aria-label="Parar áudio"
              onClick={speech.stop}
            >
              Parar
            </Button>
          </Group>
        </Box>
      ) : unsupported ? (
        <Button
          variant="light"
          color="gray"
          leftSection={<IconMicrophone size={16} />}
          aria-label="Iniciar áudio"
          disabled
        >
          Ditar
        </Button>
      ) : (
        <Button
          variant="light"
          color="indigo"
          leftSection={<IconMicrophone size={16} />}
          aria-label="Iniciar áudio"
          onClick={speech.start}
        >
          Ditar
        </Button>
      )}

      {speech.error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          py="xs"
          px="sm"
        >
          Áudio: {speech.error}
        </Alert>
      )}

      {speech.transcript && (
        <Box className="pn-transcript-card">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text size="sm" c="dimmed" style={{ flex: 1 }} lineClamp={4}>
              {speech.transcript}
            </Text>
            <Button
              variant="light"
              color="indigo"
              size="xs"
              leftSection={<IconTransfer size={14} />}
              onClick={onUseTranscript}
              style={{ flexShrink: 0 }}
            >
              Inserir ditado
            </Button>
          </Group>
        </Box>
      )}
    </Stack>
  );
}
