import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  headings: {
    fontFamily: '"Fraunces", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    fontWeight: '650',
  },
  primaryColor: 'indigo',
  defaultRadius: 'md',
  colors: {
    gray: [
      '#f8f9fc',
      '#f1f3f9',
      '#e4e7f0',
      '#d4d8e5',
      '#bec4d6',
      '#a3abc2',
      '#8590ab',
      '#687393',
      '#4c5678',
      '#2e3654',
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        withBorder: true,
        radius: 'md',
      },
      styles: {
        root: {
          background: 'var(--pn-card)',
          borderColor: 'var(--pn-border)',
        },
      },
    },
  },
});
