# Frontend (React + Vite + Mantine)

UI da PoC: entrada de narrativa, processamento, visualizacao por dominio (achados + evidencias) e lacunas, historico e ditado por audio (Web Speech API).

## Rodar (Docker Compose)

Na raiz do repo:

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`

## Rodar (local)

```bash
cd frontend
npm ci
npm run dev
```

## Testes e qualidade

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:coverage
```

## Notas

- O proxy do Vite aponta `/api/*` para o backend (evita CORS em dev).
- O audio depende de suporte do navegador (SpeechRecognition).
