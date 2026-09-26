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
| Tema | texto livre, opcional; traduzido para o idioma do país (fluxo `translateKeyword`) | vazio → termos locais (abaixo) |
| País | um dos 109 de `COUNTRIES` | Brasil |
| Buscar por | Mais vistos (`viewCount`), Mais recentes (`date`), Mais relevantes (`relevance`) | Mais vistos |
| Publicados em | 24 horas, 7 dias, 30 dias, 90 dias | 7 dias |

Botões **Buscar** e **Carregar mais** (a paginação usa `nextPageToken`).

Termos locais usados sem tema (validado no APIs Explorer em 2026-09-22: `#shorts` trazia
Shorts globais em inglês mesmo com `regionCode=BR`, e os termos locais trouxeram Shorts
brasileiros): pt `dicas|"como fazer"|truque|"você sabia"`; es
`consejos|"cómo hacer"|truco|"sabías que"`; en `tips|"how to"|hack|"did you know"`. Nos
demais idiomas, a versão em inglês é traduzida pelo Gemini; se falhar, usa o inglês.

### Busca no servidor (`searchShorts`)

1. `search.list`: `q` (tema traduzido ou termos locais), `type=video`, `videoDuration=short`,
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

## Atualização: comentários antes da análise, transcrição e link

Pedidos do usuário depois do primeiro uso em produção.

### Ver os comentários antes de analisar
- O botão do card passa a ser **"Ver comentários"**. Ele abre o painel lateral com os
  100 comentários mais relevantes (`fetchTopComments`, 1 unidade de cota, sem Gemini):
  autor, texto e likes.
- O painel de um Short tem três abas: **Comentários**, **Análise** e **Transcrição**.
  Na aba Comentários, o botão **"Analisar com IA"** roda a análise sobre exatamente os
  comentários exibidos: `analyzeShortsComments` aceita os comentários já carregados de
  cada vídeo e, nesse caso, não os busca de novo.
- Comentários desativados: o painel avisa e a análise não é oferecida.
- "Analisar selecionados" (2 a 10 Shorts) continua indo direto para a análise, sem abas.
- Comentários, análises e transcrições ficam em cache no estado da página.

### Comentários no card e ordenação
- O card mostra **"Comentários"** entre as métricas.
- "Ordenar por" ganha **"Mais comentários"**. A API do YouTube não busca por número de
  comentários, então a ordenação vale para os Shorts já carregados.

### Transcrição
- A API do YouTube não entrega legendas de vídeos de terceiros (`captions.download` exige
  o OAuth do dono). O Gemini aceita o link público do YouTube como entrada de vídeo
  (recurso em preview, sem custo; limite de 8 h de vídeo por dia no plano gratuito).
- Aba **Transcrição** com o botão **"Transcrever"**: o fluxo `transcribeShort` envia
  `https://www.youtube.com/watch?v={id}` (id validado: 11 caracteres `[A-Za-z0-9_-]`) ao
  Gemini e recebe `{ language, segments: [{ start: 'm:ss', text }], onScreenText[] }`:
  fala literal no idioma original, com tempos, e os textos escritos na tela.
- Botão **"Copiar transcrição"** (texto/markdown).

### Link em vez de download
- Os termos do YouTube proíbem baixar vídeos fora dos recursos do próprio YouTube, e a API
  não entrega o arquivo. O card ganha um botão discreto **"Copiar link"**
  (`https://www.youtube.com/shorts/{id}`), ao lado de "Abrir no YouTube".

### Largura da página e tamanho dos cards
- A página ocupa toda a área ao lado do menu (sem o limite de 1.280px, que deixava
  ~450px em branco numa tela de 1920px).
- A grade usa colunas de no mínimo 260px (`repeat(auto-fill, minmax(min(260px, 100%), 1fr))`, sem passar da largura disponível): cerca
  de 5 cards por linha em 1920px, 4 em 1440px e 3 em 1280px. Antes, 6 colunas de ~189px
  cortavam o título, o canal e o ícone "Abrir no YouTube".
- Card: título com até 3 linhas; canal e inscritos em linhas separadas; métricas em 3
  colunas; "Ver comentários" na largura toda e, abaixo, "Copiar link" e "YouTube" com
  texto, não só ícone.

### País do canal
- A API do YouTube não informa o país de origem de um vídeo: `regionCode` só garante que ele
  pode ser assistido no país, e `relevanceLanguage` não distingue pt-PT de pt-BR. Numa busca
  com Portugal, a maioria dos resultados tende a ser brasileira.
- `fetchChannelStats` passa a pedir também `part=snippet` (mesmo custo de cota) e devolve
  `country`, o país informado pelo canal (campo opcional no YouTube). A busca de Shorts
  também guarda `snippet.defaultAudioLanguage` do vídeo.
- `ShortVideo` ganha `channelCountry` e `audioLanguage`. O card mostra a bandeira do canal
  antes do nome, quando o canal informa o país.
- Filtro **"Só canais de {país da busca}"**, aplicado na tela aos Shorts já carregados (sem
  gastar cota). Regra (`isFromCountry`): vale o país do canal; se o canal não informou,
  vale a região do idioma do áudio (`pt-PT` conta como Portugal; `pt` e `es-419` não
  contam). Shorts sem nenhuma das duas informações ficam de fora.
