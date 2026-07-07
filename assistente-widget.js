/* ============================================================
   Assistente da Central de Ajuda — Widget de embed
   QUIRINO NEGÓCIOS DIGITAIS

   Uso (em qualquer página/plataforma):

   <script
     src="https://SEU-DOMINIO-DA-CENTRAL/assistente-widget.js"
     data-endpoint="https://SEU-DOMINIO-DA-CENTRAL/api/assistente"
     data-artigos="https://SEU-DOMINIO-DA-CENTRAL/artigos.json"
     data-central="https://SEU-DOMINIO-DA-CENTRAL"
     data-theme="dark"
     defer></script>

   Atributos:
   - data-endpoint : URL da função serverless (obrigatório)
   - data-artigos  : URL do artigos.json (obrigatório)
   - data-central  : URL da central, para os links "artigos consultados" (opcional)
   - data-theme    : "dark" (padrão) ou "light"
   ============================================================ */
(function () {
  "use strict";

  var script = document.currentScript;
  var CFG = {
    endpoint: script.getAttribute("data-endpoint") || "/api/assistente",
    artigosUrl: script.getAttribute("data-artigos") || "/artigos.json",
    central: (script.getAttribute("data-central") || "").replace(/\/$/, ""),
    theme: script.getAttribute("data-theme") || "dark",
  };

  var DB = null;       // base de artigos (carrega no primeiro clique)
  var carregando = null;
  var historico = [];

  /* ---------- utilidades ---------- */
  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function pontuar(a, q) {
    var toks = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!toks.length) return 0;
    var s = 0;
    toks.forEach(function (t) {
      if (a._t.indexOf(t) !== -1) s += 8;
      if (a._k.indexOf(t) !== -1) s += 4;
      var i = -1, c = 0;
      while ((i = a._b.indexOf(t, i + 1)) !== -1 && c < 12) c++;
      s += c;
    });
    return s;
  }
  function buscar(q, n) {
    return DB.artigos
      .map(function (a) { return [pontuar(a, q), a]; })
      .filter(function (x) { return x[0] > 0; })
      .sort(function (x, y) { return y[0] - x[0]; })
      .slice(0, n)
      .map(function (x) { return x[1]; });
  }
  function carregarBase() {
    if (DB) return Promise.resolve(DB);
    if (!carregando) {
      carregando = fetch(CFG.artigosUrl)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          d.artigos.forEach(function (a) {
            a._t = norm(a.titulo); a._k = norm(a.keywords); a._b = norm(a.texto);
          });
          DB = d;
          return d;
        });
    }
    return carregando;
  }

  /* ---------- estilos (Shadow DOM: não conflita com a plataforma) ---------- */
  var css = "\
:host{all:initial}\
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif}\
:host{--accent:#22C55E;--glow:#4ADE80;--dark:#0A0F0C;--dark2:#111814;\
--painel:#FFFFFF;--painel-msgs:#F4F7F5;--borda:#E3EAE5;--texto:#101512;--texto-2:#5D6B62;--bolha-ia:#FFFFFF}\
:host([theme=dark]){--painel:#111814;--painel-msgs:#0A0F0C;--borda:rgba(255,255,255,.1);\
--texto:#EDF2EF;--texto-2:#9DAAA1;--bolha-ia:#1A231D}\
.fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:58px;height:58px;border-radius:50%;\
background:var(--accent);color:#06130B;border:0;display:flex;align-items:center;justify-content:center;\
box-shadow:0 8px 28px rgba(0,0,0,.35);cursor:pointer;transition:transform .15s,background .15s}\
.fab:hover{background:var(--glow);transform:scale(1.05)}\
.fab svg{width:26px;height:26px}\
.chat{position:fixed;right:20px;bottom:92px;z-index:2147483000;width:min(400px,calc(100vw - 24px));\
height:min(600px,calc(100vh - 120px));background:var(--painel);border:1px solid var(--borda);border-radius:18px;\
box-shadow:0 12px 48px rgba(0,0,0,.4);display:none;flex-direction:column;overflow:hidden}\
.chat.aberto{display:flex}\
.head{background:var(--dark);color:#fff;padding:14px 18px;border-bottom:2px solid var(--accent)}\
.head .t{font-weight:600;font-size:.98rem}\
.head .s{font-size:.74rem;color:var(--glow)}\
.msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--painel-msgs)}\
.msg{max-width:86%;padding:10px 14px;border-radius:14px;font-size:.9rem;line-height:1.55;white-space:pre-wrap;color:var(--texto)}\
.msg.eu{align-self:flex-end;background:#15803D;color:#fff;border-bottom-right-radius:4px}\
.msg.ia{align-self:flex-start;background:var(--bolha-ia);border:1px solid var(--borda);border-bottom-left-radius:4px}\
.fontes{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}\
.fontes a{font-size:.75rem;background:rgba(34,197,94,.14);border-radius:999px;padding:3px 10px;\
color:var(--glow);text-decoration:none}\
:host([theme=light]) .fontes a{color:#15803D}\
.fontes a:hover{text-decoration:underline}\
.digitando{font-size:.8rem;color:var(--texto-2);padding:0 18px 8px;background:var(--painel-msgs)}\
.input{display:flex;gap:8px;padding:12px;border-top:1px solid var(--borda);background:var(--painel)}\
.input textarea{flex:1;border:1px solid var(--borda);background:var(--painel-msgs);color:var(--texto);\
border-radius:12px;padding:10px 12px;font-size:.9rem;resize:none;height:44px;outline:none}\
.input textarea:focus{border-color:var(--accent)}\
.input button{background:var(--accent);color:#06130B;border:0;border-radius:12px;padding:0 16px;\
font-weight:600;cursor:pointer}\
.input button:disabled{opacity:.5;cursor:default}";

  /* ---------- markup ---------- */
  var host = document.createElement("div");
  host.id = "assistente-central-ajuda";
  var root = host.attachShadow({ mode: "open" });
  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<style>' + css + '</style>' +
    '<button class="fab" aria-label="Abrir assistente" aria-expanded="false">' +
      '<svg class="i-abrir" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C7.03 3 3 6.58 3 11c0 2.05.87 3.92 2.3 5.33-.13 1.05-.53 2.18-1.3 3.17a.5.5 0 0 0 .46.8c1.96-.22 3.5-.98 4.56-1.7.94.26 1.94.4 2.98.4 4.97 0 9-3.58 9-8s-4.03-8-9-8Zm-4 9.25c.9.95 2.34 1.75 4 1.75s3.1-.8 4-1.75" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '<svg class="i-fechar" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:none">' +
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M18.601 8.39897C18.269 8.06702 17.7309 8.06702 17.3989 8.39897L12 13.7979L6.60099 8.39897C6.26904 8.06702 5.73086 8.06702 5.39891 8.39897C5.06696 8.73091 5.06696 9.2691 5.39891 9.60105L11.3989 15.601C11.7309 15.933 12.269 15.933 12.601 15.601L18.601 9.60105C18.9329 9.2691 18.9329 8.73091 18.601 8.39897Z" fill="currentColor"></path>' +
      '</svg>' +
    '</button>' +
    '<div class="chat" role="dialog" aria-label="Assistente da central de ajuda">' +
      '<div class="head"><div class="t">Assistente da Central</div><div class="s">Responde com base nas aulas e materiais</div></div>' +
      '<div class="msgs"></div>' +
      '<div class="digitando" hidden>Assistente escrevendo\u2026</div>' +
      '<div class="input"><textarea rows="1" placeholder="Escreva sua d\u00favida\u2026" aria-label="Sua pergunta"></textarea><button type="button">Enviar</button></div>' +
    '</div>';
  root.appendChild(wrap);
  host.setAttribute("theme", CFG.theme);

  var $fab = root.querySelector(".fab");
  var $chat = root.querySelector(".chat");
  var $msgs = root.querySelector(".msgs");
  var $dig = root.querySelector(".digitando");
  var $inp = root.querySelector("textarea");
  var $env = root.querySelector(".input button");
  var $iA = root.querySelector(".i-abrir");
  var $iF = root.querySelector(".i-fechar");

  function addMsg(texto, quem, fontes) {
    var div = document.createElement("div");
    div.className = "msg " + quem;
    div.textContent = texto;
    if (fontes && fontes.length && CFG.central) {
      var f = document.createElement("div");
      f.className = "fontes";
      fontes.forEach(function (x) {
        var a = document.createElement("a");
        a.href = CFG.central + "/#/a/" + x.slug;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "\uD83D\uDCC4 " + x.titulo;
        f.appendChild(a);
      });
      div.appendChild(f);
    }
    $msgs.appendChild(div);
    $msgs.scrollTop = $msgs.scrollHeight;
  }

  function abrir() {
    $chat.classList.add("aberto");
    $iA.style.display = "none";
    $iF.style.display = "block";
    $fab.setAttribute("aria-expanded", "true");
    if (!$msgs.children.length) {
      addMsg("Oi! \uD83D\uDC4B Sou o assistente da central de ajuda. Me conta sua d\u00favida \u2014 pode ser sobre a loja, checkout, produtos, tr\u00e1fego, o que precisar.", "ia");
    }
    carregarBase(); // pré-carrega a base em segundo plano
    $inp.focus();
  }
  function fechar() {
    $chat.classList.remove("aberto");
    $iA.style.display = "block";
    $iF.style.display = "none";
    $fab.setAttribute("aria-expanded", "false");
  }
  $fab.addEventListener("click", function () {
    $chat.classList.contains("aberto") ? fechar() : abrir();
  });

  function enviar() {
    var pergunta = $inp.value.trim();
    if (!pergunta || $env.disabled) return;
    $inp.value = "";
    addMsg(pergunta, "eu");
    $dig.hidden = false;
    $env.disabled = true;

    carregarBase()
      .then(function () {
        var rel = buscar(pergunta, 3);
        var contexto = rel.map(function (a) {
          return { titulo: a.titulo, slug: a.slug, texto: a.texto.slice(0, 6000) };
        });
        return fetch(CFG.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pergunta: pergunta, historico: historico.slice(-6), contexto: contexto }),
        }).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json().then(function (d) { return { d: d, rel: rel }; });
        });
      })
      .then(function (x) {
        addMsg(x.d.resposta, "ia", x.rel.map(function (a) { return { slug: a.slug, titulo: a.titulo }; }));
        historico.push({ role: "user", content: pergunta }, { role: "assistant", content: x.d.resposta });
      })
      .catch(function () {
        addMsg("N\u00e3o consegui responder agora. \uD83D\uDE15 Tenta de novo em instantes ou fala com o suporte.", "ia");
      })
      .finally(function () {
        $dig.hidden = true;
        $env.disabled = false;
      });
  }
  $env.addEventListener("click", enviar);
  $inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  });

  if (document.body) document.body.appendChild(host);
  else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(host); });
})();
