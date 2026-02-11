import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import { theme } from '../theme';

function Wrapper({ children }: PropsWithChildren) {
  return (
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <Notifications />
      {children}
    </MantineProvider>
  );
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Wrapper });
}
