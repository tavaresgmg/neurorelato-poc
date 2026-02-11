import { Anchor, Box, List, Paper, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink, IconShieldLock, IconSparkles } from '@tabler/icons-react';

export function AboutPanel() {
  return (
    <Stack gap="md">
      <Box>
        <Title order={3}>
          NeuroRelato <Text span c="dimmed">(PoC)</Text>
        </Title>
        <Text c="dimmed" mt={6}>
          Transformar narrativa clinica livre em dados estruturados (achados por dominio) com
          rastreabilidade (XAI) e lacunas informacionais. Nao diagnostica.
        </Text>
      </Box>

      <Paper p="md">
        <Title order={4}>O que esta PoC implementa</Title>
        <List mt="xs" spacing="xs">
          <List.Item>Normalizacao semantica: texto -&gt; dominios/achados com score e metodo.</List.Item>
          <List.Item>XAI: evidencias com quote + offsets (para auditoria).</List.Item>
          <List.Item>Gap analysis: dominios pouco explorados + perguntas sugeridas.</List.Item>
          <List.Item>Historico: persistencia em Postgres + reabertura de runs.</List.Item>
          <List.Item>Audio: ditado via Web Speech API (quando suportado pelo navegador).</List.Item>
          <List.Item>Embeddings locais (opcional) com fallback para heuristicas.</List.Item>
        </List>
      </Paper>

      <Paper p="md">
        <Title order={4}>
          <IconShieldLock size={16} style={{ opacity: 0.7, verticalAlign: -3, marginRight: 6 }} />
          Privacidade (LGPD)
        </Title>
        <Text mt="xs" c="dimmed">
          Para reduzir risco, a UI mantem anonimização sempre ativa. Em demo/containers, o backend pode
          forcar essa politica via variavel de ambiente.
        </Text>
      </Paper>

      <Paper p="md">
        <Title order={4}>
          <IconSparkles size={16} style={{ opacity: 0.7, verticalAlign: -3, marginRight: 6 }} />
          API (Swagger)
        </Title>
        <Text c="dimmed" mt="xs">
          Em dev local: <Anchor href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
            http://localhost:8000/docs <IconExternalLink size={14} style={{ verticalAlign: -2 }} />
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
