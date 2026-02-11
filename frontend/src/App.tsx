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
import { useDisclosure } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrain, IconInfoCircle, IconMoon, IconSun } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getHistory, getRun, normalize } from './api/client';
import type { Finding, HistoryItem, NormalizeResponse } from './api/types';
import { AboutPanel } from './components/AboutPanel';
import { EvidenceModal, type EvidenceModalState } from './components/EvidenceModal';
import { HistoryPanel } from './components/HistoryPanel';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

export default function App() {
  const [navOpened, { toggle: toggleNav }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const [text, setText] = useState('');
  const [enableEmbeddings, setEnableEmbeddings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [openingRunId, setOpeningRunId] = useState<string | null>(null);

  const [result, setResult] = useState<NormalizeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const [evidenceModal, setEvidenceModal] = useState<EvidenceModalState | null>(null);
  const [easterOpened, { open: openEaster, close: closeEaster }] = useDisclosure(false);
  const [aboutOpened, { open: openAbout, close: closeAbout }] = useDisclosure(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition();
  const canProcess = useMemo(() => text.trim().length > 0 && !loading, [text, loading]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const items = await getHistory(20);
      setHistory(items);
    } catch {
      // UX extra: não deve bloquear o fluxo principal.
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function onProcess() {
    setLoading(true);
    try {
      const data = await normalize({
        text,
        options: { enable_embeddings: enableEmbeddings },
      });
      setResult(data);
      setActiveRunId(data.request_id);
      // UX/LGPD: após sucesso, limpa a entrada para evitar deixar narrativa visível.
      setText('');
      speech.stop();
      speech.reset();
      void loadHistory();
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      notifications.show({
        title: 'Falha ao processar',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  async function onOpenRun(id: string) {
    setLoadingRun(true);
    setOpeningRunId(id);
    try {
      const data = await getRun(id);
      setResult(data);
      setActiveRunId(data.request_id);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      notifications.show({
        title: 'Falha ao carregar',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        color: 'red',
      });
    } finally {
      setLoadingRun(false);
      setOpeningRunId(null);
    }
  }

  function onUseTranscript() {
    if (!speech.transcript) return;
    setText((t) => (t ? `${t}\n\n${speech.transcript}` : speech.transcript));
  }

  function onInsertQuestion(question: string) {
    setText((t) => (t ? `${t}\n\n${question}` : question));
  }

  function openEvidence(f: Finding) {
    setEvidenceModal({
      title: f.symptom,
      evidence: f.evidence || [],
      meta: { score: f.score, method: f.method, negated: f.negated },
      sourceText: result?.input?.redacted_text ?? null,
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
            history={history}
            loadingHistory={loadingHistory}
            loadingRun={loadingRun}
            openingRunId={openingRunId}
            activeRunId={activeRunId}
            onRefresh={() => void loadHistory()}
            onOpenRun={(id) => void onOpenRun(id)}
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
              text={text}
              onChangeText={setText}
              enableEmbeddings={enableEmbeddings}
              onChangeEnableEmbeddings={setEnableEmbeddings}
              canProcess={canProcess}
              loading={loading}
              onProcess={onProcess}
              onClear={() => setText('')}
              speech={speech}
              onUseTranscript={onUseTranscript}
            />

            <OutputPanel
              ref={outputRef}
              result={result}
              loading={loading}
              onOpenEvidence={openEvidence}
              onInsertQuestion={onInsertQuestion}
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
