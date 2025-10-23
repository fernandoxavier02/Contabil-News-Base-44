# Contábil News (modo local)

Aplicação React construída com Vite e Tailwind adaptada para funcionar de forma independente, utilizando armazenamento local do navegador em vez das integrações da plataforma Base44. Todas as entidades (notícias, fontes e canais) são persistidas em localStorage, permitindo que você personalize o fluxo sem depender de serviços externos.

## Scripts disponíveis

```
npm install    # instala dependências
npm run dev    # inicia o servidor de desenvolvimento
npm run build  # gera build de produção
npm run preview # pré-visualiza a build
npm run lint   # executa ESLint
```

## Dados e integrações

- Nenhum dado mock é carregado por padrão; tudo começa vazio.
- Configure `VITE_API_BASE_URL` (e opcionalmente `VITE_API_TOKEN`) no `.env.local`.
- Se necessário, defina as variáveis `VITE_API_ROUTE_*` para customizar cada endpoint.
- Ajuste `src/api/remoteApi.js` conforme seus serviços.
- Siga os checklists em `docs/data-integration-plan.md` e acompanhe o progresso em `docs/checklist-progress.md`.

A aba "Diagnóstico IA" segue operando com respostas locais até que você direcione as chamadas para o seu backend.
