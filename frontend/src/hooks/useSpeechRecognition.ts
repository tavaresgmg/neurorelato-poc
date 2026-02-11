import { useEffect, useMemo, useRef, useState } from 'react';

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type SpeechRecognitionLike = BrowserSpeechRecognition;

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [supported] = useState(() => Boolean(getCtor()));
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const start = useMemo(
    () =>
      () => {
        setError(null);
        if (!supported) {
          setError('Reconhecimento de voz não suportado neste navegador.');
          return;
        }

        const Ctor = getCtor();
        if (!Ctor) {
          setError('Reconhecimento de voz não suportado neste navegador.');
          return;
        }

        const r = new Ctor() as unknown as SpeechRecognitionLike;
        r.lang = 'pt-BR';
        r.continuous = true;
        r.interimResults = true;

        r.onresult = (ev) => {
          let text = '';
          for (let i = 0; i < ev.results.length; i++) {
            const result = ev.results[i];
            text += result[0]?.transcript ?? '';
          }
          setTranscript(text.trim());
        };

        r.onerror = (ev) => {
          setError(ev.error || 'Erro desconhecido no reconhecimento de voz.');
        };

        r.onend = () => {
          setListening(false);
        };

        recognitionRef.current = r;
        setListening(true);
        r.start();
      },
    [supported]
  );

  const stop = useMemo(
    () =>
      () => {
        recognitionRef.current?.stop();
      },
    []
  );

  const reset = useMemo(
    () =>
      () => {
        setTranscript('');
        setError(null);
      },
    []
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}

export type SpeechRecognitionState = ReturnType<typeof useSpeechRecognition>;
