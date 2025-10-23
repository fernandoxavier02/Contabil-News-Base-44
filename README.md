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

## Dados e integrações simuladas

- O feed inicial traz exemplos de notícias para demonstração.
- Fontes e canais possuem conjuntos padrão que podem ser redefinidos pelo menu da própria aplicação.
- A aba "Diagnóstico IA" utiliza um agente local que gera respostas simuladas.

Sinta-se à vontade para substituir os mocks por suas próprias APIs ou serviços.
