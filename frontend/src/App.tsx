import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Container,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBrain, IconInfoCircle, IconMoon, IconSun } from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';

import type { Finding } from './api/types';
import { AboutPanel } from './components/AboutPanel';
import { EvidenceModal, type EvidenceModalState } from './components/EvidenceModal';
import { HistoryPanel } from './components/HistoryPanel';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { useConsultationController } from './hooks/useConsultationController';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

export default function App() {
  const [navOpened, { toggle: toggleNav }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const [evidenceModal, setEvidenceModal] = useState<EvidenceModalState | null>(null);
  const [easterOpened, { open: openEaster, close: closeEaster }] = useDisclosure(false);
  const [aboutOpened, { open: openAbout, close: closeAbout }] = useDisclosure(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition();

  const handleResultReady = useCallback(() => {
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const controller = useConsultationController({
    speech,
    onResultReady: handleResultReady,
  });

  function openEvidence(f: Finding) {
    setEvidenceModal({
      title: f.symptom,
      evidence: f.evidence || [],
      meta: { score: f.score, method: f.method, negated: f.negated },
      sourceText: controller.result?.input?.redacted_text ?? null,
    });
  }

  const isDark = colorScheme === 'dark';

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
    >
      <AppShell.Header
        style={{
          background: isDark ? 'rgba(30, 30, 40, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={navOpened} onClick={toggleNav} size="sm" hiddenFrom="sm" />
            <UnstyledButton
              onClick={openEaster}
              aria-label="Abrir easter egg"
              style={{ borderRadius: 10, padding: 6, marginLeft: -6 }}
            >
              <Group gap="sm">
                <ThemeIcon
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
                  size="lg"
                  radius="md"
                >
                  <IconBrain size={20} />
                </ThemeIcon>
                <Box>
                  <Group gap={6} align="center">
                    <Text fw={800} fz={14} tt="uppercase" c="dimmed" style={{ letterSpacing: 1.2 }}>
                      NeuroRelato
                    </Text>
                  </Group>
                  <Text fz={12} c="dimmed" visibleFrom="sm">
                    Normalização Semântica
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Group>
          <Group gap="xs">
            <Tooltip label="Sobre esta PoC">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={openAbout}
                aria-label="Sobre"
              >
                <IconInfoCircle size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={isDark ? 'Modo claro' : 'Modo escuro'}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={toggleColorScheme}
                aria-label="Alternar tema"
              >
                {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          background: isDark ? 'rgba(30, 30, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <AppShell.Section grow style={{ overflow: 'auto' }}>
          <HistoryPanel
            history={controller.history}
            loadingHistory={controller.loadingHistory}
            loadingRun={controller.loadingRun}
            openingRunId={controller.openingRunId}
            activeRunId={controller.activeRunId}
            onRefresh={() => void controller.loadHistory()}
            onOpenRun={(id) => void controller.onOpenRun(id)}
          />
        </AppShell.Section>

        <Divider my="sm" />

        <AppShell.Section>
          <Text size="xs" c="dimmed" ta="center">
            NeuroRelato · v0.1
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">
          <Stack gap="md">
            <InputPanel
              text={controller.text}
              onChangeText={controller.setText}
              canProcess={controller.canProcess}
              loading={controller.loading}
              onProcess={controller.onProcess}
              onClear={controller.onClearText}
              speech={speech}
              onUseTranscript={controller.onUseTranscript}
            />

            <OutputPanel
              ref={outputRef}
              result={controller.result}
              loading={controller.loading}
              onInsertQuestion={controller.onInsertQuestion}
            />
          </Stack>

          <EvidenceModal value={evidenceModal} onClose={() => setEvidenceModal(null)} />

          <Modal
            opened={easterOpened}
            onClose={closeEaster}
            title="NeuroRelato"
            centered
            size="lg"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            styles={{
              content: {
                background: isDark ? 'rgba(26, 27, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                border: `1px solid ${isDark ? 'rgba(148, 163, 228, 0.18)' : 'rgba(30, 37, 68, 0.14)'}`,
              },
              header: {
                background: isDark ? 'rgba(26, 27, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              },
            }}
          >
            <EasterEggBody />
          </Modal>

          <Modal
            opened={aboutOpened}
            onClose={closeAbout}
            title="Sobre"
            centered
            size="lg"
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            styles={{
              content: {
                background: isDark ? 'rgba(26, 27, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                border: `1px solid ${isDark ? 'rgba(148, 163, 228, 0.18)' : 'rgba(30, 37, 68, 0.14)'}`,
              },
              header: {
                background: isDark ? 'rgba(26, 27, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              },
            }}
          >
            <AboutPanel />
          </Modal>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function EasterEggBody() {
  return (
    <Stack gap="sm">
      <Text>
        "O mundo precisa de todos os tipos de mente."
      </Text>
      <Text size="sm" c="dimmed">
        Temple Grandin
      </Text>
    </Stack>
  );
}
