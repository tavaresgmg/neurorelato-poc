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

/** Clinical status colors — resolved via CSS custom properties for light/dark adaptation */
export const CLINICAL_COLORS = {
  covered: 'var(--pn-clinical-covered)',
  attention: 'var(--pn-clinical-attention)',
  gap: 'var(--pn-clinical-gap)',
  negated: 'var(--pn-clinical-negated)',
  evidenceBg: 'var(--pn-clinical-evidence-bg)',
} as const;
