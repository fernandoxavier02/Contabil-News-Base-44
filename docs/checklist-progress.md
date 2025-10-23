# Checklist de validação por área

Use este arquivo para acompanhar o progresso das verificações descritas em `docs/data-integration-plan.md`.

## 1. Configuração inicial
- [x] `.env.local` com `VITE_API_BASE_URL`.
- [ ] Definir `VITE_API_TOKEN` (se necessário).
- [ ] Definir variáveis `VITE_API_ROUTE_*`.
- [ ] Revisar rotas em `src/api/remoteApi.js`.

## 2. Sincronização de dados
- [ ] Endpoint `fetchRealNews` retorna `created_news`.
- [ ] Endpoint `resetSources` devolve `sources`.
- [ ] Estratégia de limpeza do cache local definida.
- [ ] Normalização de datas validada.

## 3. Cadastro e edição
- [ ] Validação de campos nas telas de fontes/canais.
- [ ] Tratamento de mensagens de erro da API.
- [ ] Persistência `create/update/delete` confirmada.
- [ ] Logs/métricas configurados para falhas.

## 4. Atualização do feed
- [ ] Rotas `fetchRealNews`/`generateNews` ativas.
- [ ] Duplicatas evitadas via identificadores reais.
- [ ] Mensagens de progresso revisadas.
- [ ] Resultados exibidos para o usuário.

## 5. Envio para canais
- [ ] Payloads mapeados para Telegram/WhatsApp/Teams/Email.
- [ ] Mensagens de erro exibidas ao usuário.
- [ ] Limites de requisição observados.
- [ ] Filtros de importância/categoria validados.

## 6. Diagnóstico IA
- [ ] Decisão tomada: agente local x backend real.
- [ ] Endpoints de conversa definidos (se real).
- [ ] Tratamento de streaming/erros implementado.
- [ ] UX revisada para quedas de conexão.

## 7. UX e estados vazios
- [ ] Mensagens claras em listas vazias.
- [ ] Indicadores de carregamento/erro em todas as telas.
- [ ] Textos revisados para caracteres especiais.
- [ ] Links rápidos para documentação adicionados (opcional).

## 8. Performance
- [ ] Estrutura de code-splitting definida.
- [ ] Bibliotecas não utilizadas removidas.
- [ ] Bundle avaliado após integração.

## 9. Qualidade e testes
- [ ] ESLint/Prettier configurados.
- [ ] Testes de integração implementados.
- [ ] Cenários de erro documentados.
- [ ] Pipeline (lint + testes) automatizado.

## 10. Deploy e monitoramento
- [ ] Processo de deploy documentado.
- [ ] Variáveis necessárias incluídas no ambiente.
- [ ] Docker/scripts criados (se aplicável).
- [ ] Monitoramento pós-deploy definido.
