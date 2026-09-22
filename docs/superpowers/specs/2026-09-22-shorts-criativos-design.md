# Busca de Shorts para criativos de anúncio: design

Data: 2026-09-22

## Objetivo

Encontrar Shorts do YouTube que estão performando bem, para servir de inspiração a
criativos de anúncios no Facebook, e entender a interação do público pelos comentários.

Casos de uso:
- ver os Shorts que mais escalaram em um país;
- buscar Shorts por palavra-chave (tema ou nicho);
- ver os Shorts mais recentes;
- analisar os comentários de um Short, ou de vários juntos, para extrair insumos de copy.

Fora do escopo desta versão:
- IA "assistindo" ao vídeo (gancho visual, roteiro, CTA);
- comparação de vários países na mesma busca;
- ligação com a Biblioteca de Anúncios do Facebook;
- salvar Shorts ou análises entre sessões.

## Restrições da YouTube Data API

- `search.list` exige `q` na prática. Sem `q` retorna `totalResults: 0`, conforme
  testado no APIs Explorer oficial em 2026-09-22.
- `search.list` custa 1 das 100 chamadas diárias do projeto. As demais chamadas saem
  da cota de 10.000 unidades por dia (1 unidade cada).
- `videoDuration=short` = menos de 4 minutos. Shorts têm até 3 minutos desde 15/10/2024.
- Não existe um campo "é Short". O formato é inferido pela duração e pela proporção
  do player: `videos.list` com `part=player` e `maxHeight` devolve
  `player.embedWidth`/`embedHeight`.
- Não estão disponíveis: ranking do feed de Shorts, compartilhamentos, retenção, áudio
  usado, transcrição de vídeos de terceiros (`captions.download` exige OAuth do dono)
  e download do vídeo.

## Página `/shorts`

Nova entrada "Shorts" no menu lateral, logo abaixo de "Tendências". A rota é protegida
pelo middleware, como as demais.

### Filtros

| Campo | Valores | Padrão |
|---|---|---|
| Tema | texto livre, opcional; traduzido para o idioma do país (fluxo `translateKeyword`) | vazio → `#shorts` |
| País | um dos 109 de `COUNTRIES` | Brasil |
| Buscar por | Mais vistos (`viewCount`), Mais recentes (`date`), Mais relevantes (`relevance`) | Mais vistos |
| Publicados em | 24 horas, 7 dias, 30 dias, 90 dias | 7 dias |

Botões **Buscar** e **Carregar mais** (a paginação usa `nextPageToken`).

### Busca no servidor (`searchShorts`)

1. `search.list`: `q` (tema traduzido ou `#shorts`), `type=video`, `videoDuration=short`,
   `regionCode`, `relevanceLanguage` (`getRelevanceLanguage`), `publishedAfter`,
   `order`, `maxResults=50`, `pageToken`.
2. `videos.list` com `part=snippet,contentDetails,statistics,player` e `maxHeight=640`,
   em lotes de 50 ids.
3. Mantém só os vídeos com duração entre 1 e 180 segundos e que sejam verticais
   (`embedHeight > embedWidth`). Se a proporção não vier, decide só pela duração.
4. `channels.list` (`part=statistics`, lotes de 50) para obter os inscritos.
5. Retorna a lista de `ShortVideo` e o `nextPageToken`.

`ShortVideo`: `id`, `title`, `channelTitle`, `channelId`, `subscribers` (nulo se oculto),
`thumbnail`, `durationSeconds`, `publishedAt`, `views`, `likes` (nulo se oculto),
`comments`, `country`, mais as métricas abaixo.

### Métricas (funções puras em `src/lib/shorts.ts`)

- **Viralização** = views ÷ inscritos. Nula se os inscritos estiverem ocultos ou forem
  zero. Destaque a partir de 10×.
- **Velocidade** = views ÷ horas desde a publicação × 24 (mínimo de 1 hora).
- **Views** = total.
- **Engajamento** = (likes + comentários) ÷ views, em %. Likes ocultos contam como 0.

Ordenação no cliente: Viralização, Velocidade, Views, Engajamento, Mais recentes.
Valores nulos ficam por último. A cada nova busca, a ordenação inicial acompanha o
"Buscar por": Mais recentes → Mais recentes; Mais vistos e Mais relevantes →
Viralização.

### Grade de cards

- 2 colunas no celular, até 6 em telas largas.
- Cada card tem: capa 9:16 (`object-cover`) com a duração; título (2 linhas); canal e
  inscritos; as quatro métricas; tempo desde a publicação; caixa de seleção; botões
  "Analisar comentários" e "Abrir no YouTube".
- Clicar na capa abre um diálogo com o player incorporado
  (`https://www.youtube.com/embed/{id}?autoplay=1`) em proporção 9:16.

## Análise de comentários (`analyzeShortsComments`)

Entrada: de 1 a 10 Shorts (`id`, `title`).

1. Busca os comentários com `commentThreads.list` (`order=relevance`, texto puro): 100
   quando há um Short, 50 por Short quando são vários. Os Shorts com comentários
   desativados são ignorados e informados no retorno.
2. Uma única chamada ao Gemini (`DEFAULT_MODEL`) com schema de saída fixo:
   - `painsAndDesires[]`: `{ insight, frequency: 'alta' | 'média' | 'baixa', videoIds[] }`
   - `audienceLanguage[]`: `{ quote (literal, idioma original), translation (pt-BR, se
     o original não for português), videoId }`
   - `adAngles[]` (5 a 8): `{ hook, angle, rationale, basedOnQuote, videoIds[] }`
3. Retorna o relatório, o número de comentários analisados e os Shorts sem comentários.

Toda a saída é em português do Brasil, exceto as citações literais.

Interface:
- botão por card (um Short) e "Analisar selecionados (N)" quando há de 2 a 10 marcados;
- o resultado abre num painel lateral (`Sheet`) com os três blocos e o botão
  "Copiar relatório", que copia em texto/markdown;
- as análises ficam em cache no estado da página, pela chave formada pelos ids
  ordenados; reabrir não chama de novo.

## Erros

| Situação | Comportamento |
|---|---|
| Sem chave do YouTube | Aviso com link para Configurações |
| Cota esgotada (`quotaExceeded`) | "Limite diário de buscas atingido. Renova à meia-noite, horário do Pacífico." |
| Nenhum Short após o filtro | Sugere trocar tema/período; mantém "Carregar mais" se houver token |
| Comentários desativados ou menos de 10 | Aviso no painel; analisa o que houver |
| Gemini sem chave ou com erro | Aviso no painel, sem quebrar a página |

## Arquivos

- `src/lib/shorts.ts`: `isShortVideo`, `computeShortMetrics`, `sortShorts`, tipos.
- `src/ai/flows/search-shorts.ts`
- `src/ai/flows/analyze-shorts-comments.ts`
- `src/app/shorts/page.tsx`
- `src/components/shorts/ShortCard.tsx`, `ShortPlayerDialog.tsx`, `CommentInsightsPanel.tsx`
- `src/components/youtube/Sidebar.tsx` (nova entrada), `src/middleware.ts` (rota protegida)

## Testes

1. APIs Explorer (com autorização do usuário): `q=#shorts` + `videoDuration=short` +
   `regionCode=BR` + `order=viewCount` retorna Shorts; `videos.list` com `part=player`
   e `maxHeight` retorna `embedWidth`/`embedHeight` para um Short. Planos alternativos:
   termo padrão `shorts`; identificar só pela duração.
2. `lib/shorts.ts`: casos conhecidos de duração/proporção, métricas com valores
   nulos e ordenação.
3. `searchShorts` com a API do YouTube simulada: filtro de formato, paginação e
   inscritos ocultos.
4. `tsc` e `next build`; conferência visual da página.
5. Teste real do usuário após o deploy.
