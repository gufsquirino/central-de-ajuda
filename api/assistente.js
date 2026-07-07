// Função serverless (Vercel) — Assistente da Central de Ajuda
// Requer a variável de ambiente ANTHROPIC_API_KEY configurada no projeto Vercel.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Use POST" });
  }

  const { pergunta, historico = [], contexto = [] } = req.body || {};
  if (!pergunta || typeof pergunta !== "string" || pergunta.length > 2000) {
    return res.status(400).json({ erro: "Pergunta inválida" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ erro: "ANTHROPIC_API_KEY não configurada" });
  }

  const contextoTexto = contexto
    .slice(0, 4)
    .map((a, i) => `<artigo n="${i + 1}" titulo="${a.titulo}">\n${(a.texto || "").slice(0, 7000)}\n</artigo>`)
    .join("\n\n");

  const system = `Você é o assistente da Central de Ajuda de uma escola de dropshipping para o mercado brasileiro (QUIRINO NEGÓCIOS DIGITAIS).

Regras:
- Responda SEMPRE em português do Brasil, com tom acolhedor, direto e didático. A maioria dos alunos está começando do zero, então evite jargão sem explicar.
- Baseie a resposta APENAS no conteúdo dos artigos fornecidos abaixo. Se a resposta não estiver nos artigos, diga com sinceridade que esse ponto não está na central e oriente a aluna a falar com o suporte humano.
- Nunca invente passos, telas, preços ou configurações que não estejam nos artigos.
- Prefira respostas curtas com passo a passo numerado quando fizer sentido.
- Nunca oriente práticas irregulares (documentos falsos, dados falsos em cadastros, burlar políticas de plataformas). Se perguntarem, explique o risco e indique o caminho correto.

Artigos disponíveis para esta pergunta:
${contextoTexto || "(nenhum artigo relevante encontrado)"}`;

  const mensagens = [
    ...historico
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content.slice(0, 3000) })),
    { role: "user", content: pergunta },
  ];

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: mensagens,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("Erro Anthropic:", data);
      return res.status(502).json({ erro: "Falha ao consultar o assistente" });
    }

    const resposta = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({ resposta: resposta || "Não consegui gerar uma resposta agora." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: "Erro interno" });
  }
}
