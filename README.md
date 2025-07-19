# Catálogo Digital – Produção

## Sobre o Projeto

Catálogo digital moderno para pequenos negócios. Gerencie produtos, vendas e apresente sua loja online de forma profissional.

- **Frontend:** React + Vite + TypeScript + shadcn-ui + Tailwind CSS
- **Backend:** (API externa, configure a URL via variável de ambiente)
- **Deploy:** Vercel (HTTPS automático, cache headers otimizados)

---

## Como rodar em produção

### 1. Instale as dependências

```sh
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.production` na raiz do projeto com:

```
VITE_API_URL=https://catalofacil-backend.onrender.com
```

### 3. Gere a build de produção

```sh
npm run build
```

### 4. Faça o deploy (Vercel)

- O deploy no Vercel é automático ao fazer push na branch `main`.
- HTTPS é habilitado automaticamente.
- Cache headers já estão configurados em `vercel.json`.

---

## SEO e Acessibilidade

- **Meta tags essenciais** e Open Graph configurados em `index.html`
- **Favicon:** `public/favicon.ico`
- **robots.txt:** `public/robots.txt`
- **Responsivo e acessível:** navegação por teclado, contraste, imagens com `alt`
- **Lazy loading:** rotas principais carregadas sob demanda
- **Otimização de imagens:** automática no build via `vite-plugin-imagemin`

---

## Cache headers (Vercel)

Exemplo de configuração em `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/favicon.ico",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/robots.txt",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

---

## Redirecionamento SPA

Arquivo `public/_redirects` para garantir SPA no Vercel/Netlify:

```
/*    /index.html   200
```

---

## Segurança

- Nenhum segredo sensível exposto no frontend.
- Token JWT removido do localStorage no logout.
- Mensagens de erro amigáveis, sem vazar detalhes técnicos.

---

## Dicas finais

- Teste acessibilidade com Lighthouse ou axe.
- Adicione domínio customizado no Vercel para produção.
- Para monitoramento de erros, considere Sentry ou LogRocket.

---
