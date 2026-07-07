# Central de Ajuda — QUIRINO NEGÓCIOS DIGITAIS

Site estático + função serverless (assistente IA) pronto para a Vercel.

## Estrutura

```
central-ajuda/
├── index.html          → site inteiro (SPA: home, categorias, artigos, busca, chat)
├── artigos.json        → 68 artigos em 9 categorias (gerado a partir do BASE_DE_DADOS_AGUIA)
└── api/
    └── assistente.js   → função serverless que chama a API da Anthropic
```

## Deploy na Vercel (pela interface)

1. Suba esta pasta num repositório do GitHub (pode ser privado).
2. Na Vercel: **Add New → Project → Import** o repositório.
3. Framework Preset: **Other**. Não precisa de build command nem output directory.
4. Em **Settings → Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave da Anthropic (console.anthropic.com)
5. Deploy. O assistente responde em `/api/assistente` automaticamente.
6. Depois, em **Settings → Domains**, aponte por ex. `ajuda.alynnegustavo.com.br`.

> Sem a env var configurada, o site funciona 100% (busca, artigos, categorias) —
> só o chat do assistente mostra mensagem de indisponível.

## Personalização (bloco CONFIG no topo do `<script>` em index.html)

- `logoUrl` → caminho do logo (ex.: `logo.png` na raiz do projeto)
- `whatsappSuporte` → link wa.me do suporte (aparece no topo e no rodapé dos artigos)
- `emailSuporte` → alternativa ao WhatsApp
- `trilha` → os 6 passos da home (slug dos artigos)

Cores e fontes: variáveis CSS no início do `<style>` (`--brand`, `--accent` etc.).
As cores atuais são provisórias — trocar pelos hex da marca.

## Como o assistente funciona

O front busca os 3 artigos mais relevantes para a pergunta e envia junto com ela
para `/api/assistente`. A função monta um prompt que instrui o Claude a responder
**apenas com base nesses artigos** e a encaminhar pro suporte humano quando o
assunto não estiver na central. Modelo: `claude-sonnet-4-6` (barato e rápido;
dá pra trocar na função).

## Atualizando o conteúdo

O `artigos.json` tem o formato:

```json
{
  "categorias": { "id": { "nome", "icone", "desc" } },
  "artigos": [ { "slug", "titulo", "categoria", "keywords", "html", "texto" } ]
}
```

Para adicionar/editar artigos, basta editar esse JSON (o campo `texto` é a versão
sem HTML, usada pela busca e pelo assistente — mantenha os dois em sincronia).
