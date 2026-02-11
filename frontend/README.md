# Frontend (React + Vite + Mantine)

Interface da PoC para entrada da narrativa, visualizacao de achados/evidencias/lacunas e historico.

## Rodar

### Docker Compose

Na raiz do repo:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`

### Local

```bash
cd frontend
npm ci
npm run dev
```

## Testes e Qualidade

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:coverage
```

## Observações

- O proxy do Vite aponta `/api/*` para o backend (evita CORS em dev).
- Audio depende de suporte do navegador (Web Speech API).
