import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  headings: {
    fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    fontWeight: '600',
  },
  primaryColor: 'indigo',
  defaultRadius: 'md',
  colors: {
    gray: [
      '#F8F9FA',
      '#F1F3F5',
      '#E9ECEF',
      '#DEE2E6',
      '#CED4DA',
      '#ADB5BD',
      '#868E96',
      '#495057',
      '#343A40',
      '#212529',
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

/** Clinical status colors for use in components */
export const CLINICAL_COLORS = {
  covered: '#2B8A3E',
  attention: '#E67700',
  gap: '#868E96',
  negated: '#C92A2A',
  evidenceBg: '#FFF9DB',
} as const;
