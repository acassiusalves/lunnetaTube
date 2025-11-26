# 🚀 Configuração do Analisador de Mercado YouTube

## Chaves de API Necessárias

### 1. **Chave API do YouTube** (Obrigatório)
Para buscar vídeos e dados do YouTube.

**Como obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **YouTube Data API v3**
4. Crie credenciais > Chave de API
5. Cole a chave na página **Configurações** do app

### 2. **Chave API do Google Gemini** (Obrigatório para IA)
Para usar recursos de Inteligência Artificial e análise de conteúdo.

**Como obter:**
1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada

**Como configurar:**

#### Opção A: Variável de Ambiente (Recomendado)
1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione sua chave:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```
3. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev -- -p 4000
   ```

#### Opção B: Interface de Configurações
1. Acesse http://localhost:4000/settings
2. Cole a chave no campo "API do Google Gemini"
3. Clique em "Salvar Tudo"
4. **⚠️ IMPORTANTE:** Também adicione no `.env.local` e reinicie o servidor

### 3. **Token de Acesso do Facebook** (Opcional)
Para acessar a biblioteca de anúncios do Facebook.

**Como obter:**
1. Acesse [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Gere um token de acesso de longa duração
3. Cole na página **Configurações** do app

---

## 📋 Checklist de Configuração

- [ ] Chave API do YouTube adicionada
- [ ] Chave API do Gemini no `.env.local`
- [ ] Servidor reiniciado após adicionar as chaves
- [ ] Token do Facebook (se usar FB Library)

---

## 🎨 Tema do Sistema

O sistema usa um tema laranja criativo e quente:
- **Primária:** `#FF6B00`
- **Hover:** `#E65A00`
- **Destaque:** `#FFE9D6`
- **Fonte:** Roboto

---

## 🔥 Recursos Principais

### Página: Buscador YouTube
- Busca por palavra-chave
- Filtros avançados (país, visualizações, data, ordenação)
- Análise de comentários com IA
- Score de potencial de infoproduto (0-100)
- Identificação de vídeos "Ouro" (score 80+)

### Página: Tendências
- Vídeos em alta por país
- Suporte multi-país (LATAM)
- Análise por categoria
- Análise completa com IA

### Página: Biblioteca FB
- Busca de anúncios do Facebook
- Análise de concorrência

---

## 🔒 Configuração do Firestore (Armazenamento de Credenciais)

Para que as credenciais sejam salvas permanentemente no Firestore, você precisa configurar as regras de segurança:

**Como configurar:**
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **market-miner-buqzl**
3. Vá em **Firestore Database** > **Regras**
4. Cole as seguintes regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir que usuários autenticados leiam e escrevam apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Subcoleções do usuário (como settings/credentials)
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

5. Clique em **Publicar**

Essas regras garantem que:
- Apenas usuários autenticados podem acessar seus dados
- Cada usuário só pode ler/escrever seus próprios dados
- As credenciais ficam criptografadas e seguras

---

## 🐛 Solução de Problemas

### Erro: "Please pass in the API key or set the GEMINI_API_KEY"
**Solução:**
1. Verifique se a chave está no arquivo `.env.local`
2. Certifique-se de que o formato está correto: `GEMINI_API_KEY=sua_chave`
3. Reinicie o servidor: `Ctrl+C` e depois `npm run dev -- -p 4000`

### Erro: "Chave de API do YouTube não encontrada"
**Solução:**
1. Acesse http://localhost:4000/settings
2. Cole sua chave do YouTube
3. Clique em "Salvar Tudo"

### Erro: "Missing or insufficient permissions" (Firestore)
**Solução:**
1. Verifique se você configurou as regras do Firestore (veja seção acima)
2. Certifique-se de que está logado no sistema
3. Se o problema persistir, verifique se as regras foram publicadas corretamente no Firebase Console

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique o arquivo `.env.example` para referência
2. Consulte a documentação das APIs:
   - [YouTube Data API](https://developers.google.com/youtube/v3)
   - [Google AI Studio](https://ai.google.dev/)
   - [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
