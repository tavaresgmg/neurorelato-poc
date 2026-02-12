import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithProviders } from './test-utils';
import { VoiceInput } from '../components/VoiceInput';

test('VoiceInput: desabilitado quando não suportado', () => {
  renderWithProviders(
    <VoiceInput
      speech={{
        supported: false,
        listening: false,
        transcript: '',
        error: null,
        start: () => undefined,
        stop: () => undefined,
      }}
      onUseTranscript={() => undefined}
    />,
  );

  expect(screen.getByLabelText(/Iniciar áudio/i)).toBeDisabled();
});

test('VoiceInput: mostra botão Ditar quando idle', () => {
  renderWithProviders(
    <VoiceInput
      speech={{
        supported: true,
        listening: false,
        transcript: '',
        error: null,
        start: () => undefined,
        stop: () => undefined,
      }}
      onUseTranscript={() => undefined}
    />,
  );

  const btn = screen.getByLabelText(/Iniciar áudio/i);
  expect(btn).toBeEnabled();
  expect(btn).toHaveTextContent('Ditar');
});

test('VoiceInput: mostra Parar com aria-label correto quando listening', () => {
  renderWithProviders(
    <VoiceInput
      speech={{
        supported: true,
        listening: true,
        transcript: '',
        error: null,
        start: () => undefined,
        stop: vi.fn(),
      }}
      onUseTranscript={() => undefined}
    />,
  );

  const btn = screen.getByLabelText(/Parar áudio/i);
  expect(btn).toHaveTextContent('Parar');
});

test('VoiceInput: mostra erro quando existe', () => {
  renderWithProviders(
    <VoiceInput
      speech={{
        supported: true,
        listening: false,
        transcript: '',
        error: 'Microfone negado',
        start: () => undefined,
        stop: () => undefined,
      }}
      onUseTranscript={() => undefined}
    />,
  );

  expect(screen.getByText(/Microfone negado/i)).toBeInTheDocument();
});

test('VoiceInput: mostra transcrição e botão Usar transcrição', () => {
  const onUse = vi.fn();
  renderWithProviders(
    <VoiceInput
      speech={{
        supported: true,
        listening: false,
        transcript: 'fala reconhecida',
        error: null,
        start: () => undefined,
        stop: () => undefined,
      }}
      onUseTranscript={onUse}
    />,
  );

  expect(screen.getByText(/fala reconhecida/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Inserir ditado/i }));
  expect(onUse).toHaveBeenCalledTimes(1);
});
