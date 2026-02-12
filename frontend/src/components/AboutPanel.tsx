import { Anchor, Box, List, Paper, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink, IconShieldLock, IconSparkles } from '@tabler/icons-react';

export function AboutPanel() {
  return (
    <Stack gap="md">
      <Box>
        <Title order={3}>
          NeuroRelato <Text span c="dimmed">(Protótipo)</Text>
        </Title>
        <Text c="dimmed" mt={6}>
          Auxilia na organização e análise de relatos clínicos, identificando sinais, áreas
          avaliadas e pontos a investigar. Não substitui o julgamento clínico.
        </Text>
      </Box>

      <Paper p="md">
        <Title order={4}>O que o NeuroRelato faz</Title>
        <List mt="xs" spacing="xs">
          <List.Item>Identifica sinais e comportamentos mencionados no relato, organizados por área clínica.</List.Item>
          <List.Item>Mostra os trechos originais que sustentam cada identificação (rastreabilidade).</List.Item>
          <List.Item>Aponta áreas pouco exploradas e sugere perguntas complementares.</List.Item>
          <List.Item>Mantém histórico das análises para consulta posterior.</List.Item>
          <List.Item>Permite ditado por voz (quando suportado pelo navegador).</List.Item>
        </List>
      </Paper>

      <Paper p="md">
        <Title order={4}>
          <IconShieldLock size={16} style={{ opacity: 0.7, verticalAlign: -3, marginRight: 6 }} />
          Privacidade (LGPD)
        </Title>
        <Text mt="xs" c="dimmed">
          Dados pessoais (nomes, documentos, contatos) são automaticamente removidos antes
          da análise, em conformidade com a LGPD.
        </Text>
      </Paper>

      <Paper p="md">
        <Title order={4}>
          <IconSparkles size={16} style={{ opacity: 0.7, verticalAlign: -3, marginRight: 6 }} />
          Documentação técnica
        </Title>
        <Text c="dimmed" mt="xs">
          API: <Anchor href="https://neurorelatopoc-60b95d8f43fd.herokuapp.com/docs" target="_blank" rel="noreferrer">
            Swagger (Heroku) <IconExternalLink size={14} style={{ verticalAlign: -2 }} />
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
