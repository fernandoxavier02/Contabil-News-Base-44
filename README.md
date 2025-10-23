# Contábil News (modo local)

Aplicação React construída com Vite e Tailwind adaptada para funcionar de forma independente, utilizando armazenamento local do navegador em vez das integrações da plataforma Base44. Todas as entidades (notícias, fontes e canais) são persistidas em localStorage, permitindo que você personalize o fluxo sem depender de serviços externos.

## ✨ Características principais

- 🔒 **Modo offline**: Funciona completamente sem conexão com serviços externos
- 💾 **Armazenamento local**: Dados persistidos no localStorage do navegador
- ⚡ **Performance otimizada**: Construído com Vite para desenvolvimento rápido
- 🎨 **Interface moderna**: Estilizado com Tailwind CSS
- 📱 **Responsivo**: Design adaptável para desktop e mobile

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

## 🚀 Como começar

1. Clone o repositório
2. Execute `npm install` para instalar as dependências
3. Execute `npm run dev` para iniciar o servidor de desenvolvimento
4. Acesse `http://localhost:5173` no seu navegador
5. Configure suas fontes e canais na interface

## 📁 Estrutura do projeto

```
src/
├── components/     # Componentes React reutilizáveis
├── pages/         # Páginas principais da aplicação
├── api/           # Integrações de API e banco local
├── lib/           # Utilitários e configurações
└── assets/        # Recursos estáticos
```
