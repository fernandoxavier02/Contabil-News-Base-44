# Plano de integração com dados reais

Este projeto foi preparado para iniciar sem dados de demonstração. As etapas abaixo orientam como ligar as telas a uma API própria.

## 1. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz e informe:

```
VITE_API_BASE_URL=https://sua-api.com
VITE_API_TOKEN=opcional-token-jwt-ou-chave
```

O token é opcional; use-o apenas se o backend exigir autenticação.

## 2. Mapear os endpoints existentes

Atualize `src/api/remoteApi.js` para refletir as rotas reais. Cada entrada no objeto `ENDPOINTS` representa uma operação usada pela interface:

| Chave              | Uso na interface                                        |
| ------------------ | ------------------------------------------------------- |
| `fetchRealNews`    | Busca notícias reais para uma fonte                     |
| `verifyNewsDates`  | Valida datas das notícias armazenadas                   |
| `clearAllNews`     | Limpa o acervo de notícias                              |
| `resetSources`     | Sincroniza fontes cadastradas                           |
| `sendToTelegram`   | Dispara mensagem de teste para um canal do Telegram     |
| `sendToWhatsApp`   | Dispara mensagem de teste para um destino do WhatsApp   |
| `sendToTeams`      | Dispara mensagem de teste para um canal do Microsoft Teams |
| `sendToEmail`      | Envia email de teste                                    |
| `generateNews`     | Gera conteúdo (ex.: via IA) para preenchimento automático |

Substitua os valores padrão (rotas `/integrations/...`) pelos caminhos disponíveis no seu backend.

## 3. Formatos esperados

- **fetchRealNews** deve retornar um objeto com `created_news` (lista) para que o front sincronize as notícias recebidas.
- **resetSources** deve retornar `{ sources: [...] }`.
- Os endpoints de envio (`sendTo...`) podem retornar qualquer payload; a interface exibe os campos `success`, `message` e `aiAnalysis` caso existam.

Adapte a camada `remoteApi` se o seu formato for diferente.

## 4. Checklist de integração

### 4.1 Configuração inicial
- [x] Criar `.env.local` com `VITE_API_BASE_URL`.
- [ ] Incluir `VITE_API_TOKEN` caso a API exija autenticação.
- [ ] Definir variáveis `VITE_API_ROUTE_*` para cada endpoint quando necessário.
- [ ] Revisar e ajustar as rotas padrão em `src/api/remoteApi.js`.
- [ ] Confirmar formatos de request/response com o time de backend.

### 4.2 Sincronização de dados
- [ ] Implementar endpoint `fetchRealNews` retornando `created_news`.
- [ ] Ajustar `resetSources` para devolver `sources` atualizadas.
- [ ] Definir política de limpeza do cache local (ou optar por remover `localStorage`).
- [ ] Revisar normalização de datas (`publication_date`, `created_at`, etc.).

### 4.3 Cadastro e edição
- [ ] Validar campos obrigatórios nas telas de fontes/canais.
- [ ] Tratar mensagens de erro vindas da API (feedback visual).
- [ ] Garantir que `create/update/delete` sincronizam corretamente com o backend.
- [ ] Registrar logs compreensíveis ou métricas para falhas.

### 4.4 Atualização de notícias
- [ ] Confirmar disponibilidade de `fetchRealNews` para fontes RSS.
- [ ] Confirmar disponibilidade de `generateNews` (IA ou outro mecanismo) para fontes LLM.
- [ ] Evitar duplicatas usando identificadores fornecidos pelo backend.
- [ ] Revisar mensagens exibidas durante o processo (loading, sucesso, falha).

### 4.5 Envio para canais
- [ ] Mapear payload esperado pelos endpoints `sendToTelegram/WhatsApp/Teams/Email`.
- [ ] Exibir mensagens de erro detalhadas quando `success=false`.
- [ ] Respeitar limites de requisição (aplicar throttling se necessário).
- [ ] Garantir consistência de filtros (importância, categoria) antes do envio.

### 4.6 Diagnóstico IA
- [ ] Definir se `agentSDK` continuará local ou será ligado a um backend real.
- [ ] Caso real, mapear endpoints para listar/obter/conversar.
- [ ] Tratar streaming de respostas se o serviço suportar.
- [ ] Atualizar o frontend para lidar com estados de erro/desconexão.

### 4.7 UX e estados vazios
- [ ] Garantir mensagens claras quando não houver dados (fontes, notícias, canais).
- [ ] Adicionar indicadores de carregamento e erro onde faltam.
- [ ] Revisar textos para remover caracteres corrompidos.
- [ ] Opcional: incluir links rápidos para este guia dentro da interface.

### 4.8 Performance e build
- [ ] Avaliar code-splitting (lazy loading) para reduzir o bundle principal.
- [ ] Remover bibliotecas/utilitários não utilizados após integração plena.
- [ ] Manter `npm run build` no pipeline de CI.

### 4.9 Qualidade e testes
- [ ] Configurar ESLint/Prettier alinhados com o time.
- [ ] Adicionar testes de integração (ex.: Cypress) para fluxos críticos.
- [ ] Documentar cenários de erro esperados da API.
- [ ] Incluir verificação automática (lint + testes) antes de deploy.

### 4.10 Deploy e automação
- [ ] Definir estratégia de deploy com as variáveis de ambiente necessárias.
- [ ] Opcional: criar Dockerfile ou scripts de orquestração.
- [ ] Garantir que o ambiente de produção tenha endpoints acessíveis.
- [ ] Monitorar logs e métricas pós-deploy para ajustes finos.

## 5. Persistência local

Os dados obtidos seguem gravados em `localStorage` por meio de `src/api/localDatabase.js`. Caso prefira remover completamente o armazenamento local:

1. Substitua as chamadas para `localDb` por chamadas diretas à sua API.
2. Remova `src/lib/localStore.js` e a lógica de sincronização.

## 6. Testar o fluxo

1. Defina as variáveis de ambiente.
2. Execute `npm run dev`.
3. Acesse o front-end, cadastre fontes e acione os botões de busca/envio para validar o tráfego com o backend real.

Mantenha este documento atualizado conforme a evolução dos endpoints do seu projeto.
| Variável de ambiente                       | Descrição                                        | Valor padrão |
| ------------------------------------------ | ------------------------------------------------ | ------------ |
| `VITE_API_BASE_URL`                        | URL base do backend                              | —            |
| `VITE_API_TOKEN`                           | Token/JWT opcional                               | —            |
| `VITE_API_ROUTE_FETCH_REAL_NEWS`           | Rota para buscar notícias reais                  | `/integrations/news/fetch` |
| `VITE_API_ROUTE_VERIFY_NEWS_DATES`         | Rota para verificação de datas                   | `/integrations/news/verify-dates` |
| `VITE_API_ROUTE_CLEAR_NEWS`                | Rota para limpar base de notícias                | `/news/clear` |
| `VITE_API_ROUTE_RESET_SOURCES`             | Rota para sincronizar fontes                     | `/sources/reset` |
| `VITE_API_ROUTE_SEND_TELEGRAM`             | Rota de envio de teste para Telegram             | `/integrations/telegram/send-test` |
| `VITE_API_ROUTE_SEND_WHATSAPP`             | Rota de envio de teste para WhatsApp             | `/integrations/whatsapp/send-test` |
| `VITE_API_ROUTE_SEND_TEAMS`                | Rota de envio de teste para Teams                | `/integrations/teams/send-test` |
| `VITE_API_ROUTE_SEND_EMAIL`                | Rota de envio de teste para Email                | `/integrations/email/send-test` |
| `VITE_API_ROUTE_GENERATE_NEWS`             | Rota para geração de conteúdo (IA)               | `/integrations/news/generate` |
