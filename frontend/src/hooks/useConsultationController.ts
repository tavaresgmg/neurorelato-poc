import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getHistory, getRun, normalize } from '../api/client';
import type { HistoryItem, NormalizeResponse } from '../api/types';
import type { SpeechRecognitionState } from './useSpeechRecognition';

type Params = {
  speech: SpeechRecognitionState;
  onResultReady?: () => void;
};

export function useConsultationController({ speech, onResultReady }: Params) {
  const [text, setText] = useState('');
  const [enableEmbeddings, setEnableEmbeddings] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [openingRunId, setOpeningRunId] = useState<string | null>(null);

  const [result, setResult] = useState<NormalizeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const canProcess = useMemo(() => text.trim().length > 0 && !loading, [text, loading]);

  const notifyError = useCallback((title: string, err: unknown) => {
    notifications.show({
      title,
      message: err instanceof Error ? err.message : 'Erro desconhecido',
      color: 'red',
    });
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const items = await getHistory(20);
      setHistory(items);
    } catch {
      // UX: histórico não deve bloquear fluxo principal.
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const onProcess = useCallback(async () => {
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
      onResultReady?.();
    } catch (err) {
      notifyError('Falha ao processar', err);
    } finally {
      setLoading(false);
    }
  }, [enableEmbeddings, loadHistory, notifyError, onResultReady, speech, text]);

  const onOpenRun = useCallback(
    async (id: string) => {
      setLoadingRun(true);
      setOpeningRunId(id);
      try {
        const data = await getRun(id);
        setResult(data);
        setActiveRunId(data.request_id);
        onResultReady?.();
      } catch (err) {
        notifyError('Falha ao carregar', err);
      } finally {
        setLoadingRun(false);
        setOpeningRunId(null);
      }
    },
    [notifyError, onResultReady]
  );

  const onUseTranscript = useCallback(() => {
    if (!speech.transcript) return;
    setText((t) => (t ? `${t}\n\n${speech.transcript}` : speech.transcript));
  }, [speech.transcript]);

  const onInsertQuestion = useCallback((question: string) => {
    setText((t) => (t ? `${t}\n\n${question}` : question));
  }, []);

  const onClearText = useCallback(() => {
    setText('');
  }, []);

  return {
    text,
    setText,
    enableEmbeddings,
    setEnableEmbeddings,
    loading,
    loadingHistory,
    loadingRun,
    openingRunId,
    result,
    history,
    activeRunId,
    canProcess,
    loadHistory,
    onProcess,
    onOpenRun,
    onUseTranscript,
    onInsertQuestion,
    onClearText,
  };
}

