import { fireEvent, screen, waitFor } from '@testing-library/react';
import { act, useState } from 'react';

import { renderWithProviders } from './test-utils';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

test('quando nao suportado, start define erro', () => {
  // @ts-expect-error test
  delete (window as any).SpeechRecognition;
  // @ts-expect-error test
  delete (window as any).webkitSpeechRecognition;

  function Comp() {
    const s = useSpeechRecognition();
    return (
      <div>
        <button onClick={s.start}>start</button>
        <div>{s.error}</div>
      </div>
    );
  }

  renderWithProviders(<Comp />);
  fireEvent.click(screen.getByText('start'));
  expect(screen.getByText(/não suportado/i)).toBeInTheDocument();
});

test('suportado: start/resultado/stop/end', async () => {
  let instance: any = null;

  class MockSR {
    lang = '';
    continuous = false;
    interimResults = false;
    onresult: ((ev: any) => void) | null = null;
    onerror: ((ev: any) => void) | null = null;
    onend: (() => void) | null = null;

    start() {
      // noop
    }

    stop() {
      // noop
    }

    constructor() {
      instance = this;
    }
  }

  // @ts-expect-error test
  (window as any).webkitSpeechRecognition = MockSR;

  function Comp() {
    const s = useSpeechRecognition();
    const [local, setLocal] = useState('');

    return (
      <div>
        <button onClick={s.start}>start</button>
        <button onClick={s.stop}>stop</button>
        <button onClick={() => setLocal(s.transcript)}>use</button>
        <div data-testid="listening">{String(s.listening)}</div>
        <div data-testid="transcript">{s.transcript}</div>
        <div data-testid="local">{local}</div>
        <div data-testid="error">{s.error}</div>
      </div>
    );
  }

  renderWithProviders(<Comp />);

  fireEvent.click(screen.getByText('start'));
  expect(instance).not.toBeNull();

  await act(async () => {
    instance.onresult?.({
      results: [[{ transcript: 'olá ' }], [{ transcript: 'mundo' }]],
    });
  });

  await waitFor(() => {
    expect(screen.getByTestId('transcript')).toHaveTextContent('olá mundo');
  });

  fireEvent.click(screen.getByText('use'));
  expect(screen.getByTestId('local')).toHaveTextContent('olá mundo');

  fireEvent.click(screen.getByText('stop'));
  await act(async () => {
    instance.onend?.();
  });
});
