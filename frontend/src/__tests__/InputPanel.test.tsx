import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithProviders } from './test-utils';
import { InputPanel } from '../components/InputPanel';

function baseProps() {
  return {
    text: 'texto',
    onChangeText: () => undefined,
    enableAnon: true,
    onChangeEnableAnon: () => undefined,
    enableEmbeddings: false,
    onChangeEnableEmbeddings: () => undefined,
    canProcess: true,
    loading: false,
    onProcess: () => undefined,
    onClear: () => undefined,
    speech: {
      supported: false,
      listening: false,
      transcript: '',
      error: null,
      start: () => undefined,
      stop: () => undefined,
    },
    onUseTranscript: () => undefined,
  };
}

test('InputPanel: audio desabilita quando nao suportado e transcript permite inserir', () => {
  const onUseTranscript = vi.fn();
  renderWithProviders(
    <InputPanel
      text=""
      onChangeText={() => undefined}
      enableAnon={true}
      onChangeEnableAnon={() => undefined}
      enableEmbeddings={false}
      onChangeEnableEmbeddings={() => undefined}
      canProcess={false}
      loading={false}
      onProcess={() => undefined}
      onClear={() => undefined}
      speech={{
        supported: false,
        listening: false,
        transcript: 'fala',
        error: null,
        start: () => undefined,
        stop: () => undefined,
      }}
      onUseTranscript={onUseTranscript}
    />,
  );

  expect(screen.getByLabelText(/Iniciar áudio/i)).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Usar transcrição/i }));
  expect(onUseTranscript).toHaveBeenCalledTimes(1);
});

test('InputPanel: Ctrl/Cmd+Enter dispara processamento quando permitido', () => {
  const onProcess = vi.fn();
  const props = baseProps();
  renderWithProviders(<InputPanel {...props} onProcess={onProcess} />);

  fireEvent.keyDown(screen.getByPlaceholderText(/Cole aqui/i), { key: 'Enter', ctrlKey: true });
  expect(onProcess).toHaveBeenCalledTimes(1);
});

test('InputPanel: Limpar chama onClear apenas quando ha texto', () => {
  const onClear = vi.fn();
  const props = baseProps();
  renderWithProviders(<InputPanel {...props} text="abc" onClear={onClear} />);

  fireEvent.click(screen.getByRole('button', { name: /Limpar/i }));
  expect(onClear).toHaveBeenCalledTimes(1);
});

test('InputPanel: toggle de checkboxes chama callbacks', () => {
  const onChangeEnableEmbeddings = vi.fn();
  const props = baseProps();
  renderWithProviders(
    <InputPanel
      {...props}
      enableEmbeddings={false}
      onChangeEnableEmbeddings={onChangeEnableEmbeddings}
    />,
  );

  fireEvent.click(screen.getByLabelText(/Embeddings/i));

  expect(onChangeEnableEmbeddings).toHaveBeenCalledWith(true);
});

test('InputPanel: texto muito longo mostra erro e desabilita Processar', () => {
  const tooLong = 'a'.repeat(15_001);
  const props = baseProps();
  renderWithProviders(<InputPanel {...props} text={tooLong} />);

  expect(screen.getByText(/Texto muito longo/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Processar/i })).toBeDisabled();
});
