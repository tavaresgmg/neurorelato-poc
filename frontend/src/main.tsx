import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import { theme } from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
