import { Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function EmptyState({ icon, title, description }: Props) {
  return (
    <Stack align="center" justify="center" gap="sm" py="xl" style={{ flex: 1 }}>
      <ThemeIcon size={48} radius="xl" variant="light" color="gray">
        {icon}
      </ThemeIcon>
      <Text fw={600} size="lg">
        {title}
      </Text>
      <Text c="dimmed" ta="center" maw={360}>
        {description}
      </Text>
    </Stack>
  );
}
