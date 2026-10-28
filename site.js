/* Observe+ — interações das landing pages (home, /restaurantes e /diagnostico-gratuito).
   O contato da home e de /restaurantes é o formulário da Kommo, carregado pelo próprio script dela. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // ---------- Header ----------
  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Menu mobile ----------
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const setMenu = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', (mq) => { if (mq.matches) setMenu(false); });

  // ---------- Reveal ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // ---------- Carrossel de cases ----------
  const track = document.querySelector('.carousel-track');
  if (track) {
    const slides = track.querySelectorAll('.case');
    const dots = document.querySelectorAll('.carousel-dots button');
    let current = 0;

    const goTo = (i) => {
      current = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };
    const syncDots = () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      current = Math.max(0, Math.min(slides.length - 1, i));
      dots.forEach((d, k) => {
        if (k === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    };

    document.querySelector('[data-carousel="prev"]')?.addEventListener('click', () => goTo(current - 1));
    document.querySelector('[data-carousel="next"]')?.addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => goTo(k)));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });

    let t;
    track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(syncDots, 60); }, { passive: true });
  }

  // ---------- Dúvidas: uma aberta por vez ----------
  document.querySelectorAll('.faq-list details').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('.faq-list details[open]').forEach((o) => { if (o !== item) o.removeAttribute('open'); });
    });
  });

  // ---------- Ano ----------
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // =========================================================
  // Envio do diagnóstico gratuito: Zapier (planilha) + /api/lead-capture
  // =========================================================

  /**
   * URL do Catch Hook do Zapier que alimenta a planilha.
   *
   * Fica visível no código da página — é inevitável para uma chamada feita pelo
   * navegador. Quem achar a URL consegue inserir linhas, então vale um passo de
   * Filter no Zap. Deixar vazio faz o envio usar só /api/lead-capture.
   */
  const ZAPIER_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/24294345/46jihq9/';

  async function enviarParaZapier(payload) {
    if (!ZAPIER_WEBHOOK) return null;
    try {
      // no-cors evita o bloqueio de CORS do Zapier. Em troca a resposta é opaca:
      // dá para saber que saiu, não que chegou. Por isso o envio à API continua.
      await fetch(ZAPIER_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (erro) {
      return false;
    }
  }

  async function enviarParaApi(payload) {
    try {
      const resposta = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const dados = await resposta.json().catch(() => null);
      // Recusa declarada (ex.: e-mail pessoal) não é falha de rede: o lead
      // não deve seguir para a planilha, e o visitante precisa saber o motivo.
      if (resposta.status === 422 && dados?.error) return dados;
      if (!resposta.ok) throw new Error(`lead-capture respondeu ${resposta.status}`);
      if (dados?.ok === false) throw new Error('lead-capture recusou o envio');
      return dados || { ok: true };
    } catch (erro) {
      return null;
    }
  }

  async function enviarLead(payload) {
    // Em file:// não há rede nem API; guarda localmente para não perder o preenchimento.
    if (window.location.protocol === 'file:') {
      const chave = 'observe-mais-leads';
      const salvos = JSON.parse(window.localStorage.getItem(chave) || '[]');
      salvos.push(payload);
      window.localStorage.setItem(chave, JSON.stringify(salvos));
      return { ok: true };
    }

    // A API vem primeiro porque é ela que decide o perfil: o resultado segue
    // junto para a planilha, em vez de ser calculado aqui no navegador.
    const api = await enviarParaApi(payload);
    if (api && api.ok === false) return { ok: false, erro: api.error };

    const paraPlanilha = typeof api?.qualificado === 'boolean'
      ? { ...payload, qualificado: api.qualificado ? 'sim' : 'não' }
      : payload;
    const zapier = await enviarParaZapier(paraPlanilha);

    // Basta um destino ter aceitado: o lead não se perde se um dos dois cair.
    return { ok: api !== null || zapier === true, qualificado: api?.qualificado };
  }

  const LEAD_RULES = {
    email: {
      valida: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      erro: 'Digite um e-mail válido, como voce@empresa.com.br.',
    },
    whatsapp: {
      // Aceita 10 a 13 dígitos (fixo ou celular, com ou sem DDI), com ou sem máscara.
      valida: (v) => /^\d{10,13}$/.test(v.replace(/\D/g, '')),
      erro: 'Digite um WhatsApp com DDD, como (61) 99999-9999.',
    },
    nome: { valida: (v) => v.trim().length >= 2, erro: 'Digite seu nome.' },
    empresa: { valida: (v) => v.trim().length >= 2, erro: 'Digite o nome da empresa.' },
  };

  function mascararWhatsapp(valor) {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  document.querySelectorAll('input[name="whatsapp"]').forEach((campo) => {
    campo.addEventListener('input', () => { campo.value = mascararWhatsapp(campo.value); });
  });

  let travas = 0;
  const travarRolagem = (sim) => {
    travas = Math.max(0, travas + (sim ? 1 : -1));
    document.body.classList.toggle('is-locked', travas > 0);
  };

  // =========================================================
  // Vídeo institucional em modal
  // =========================================================
  const videoModal = document.querySelector('#video-modal');
  const videoFrame = videoModal?.querySelector('.video-modal__frame');
  let videoGatilho = null;

  function abrirVideo(id, gatilho) {
    if (!videoModal) return;
    videoGatilho = gatilho;
    const iframe = document.createElement('iframe');
    const origin = encodeURIComponent(window.location.origin);
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&origin=${origin}`;
    iframe.title = 'Vídeo do Observe+';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    videoFrame.querySelector('iframe')?.remove();
    videoFrame.append(iframe);
    videoModal.hidden = false;
    travarRolagem(true);
    videoModal.querySelector('.video-modal__close')?.focus();
  }

  function fecharVideo() {
    if (!videoModal || videoModal.hidden) return;
    videoFrame.querySelector('iframe')?.remove();
    videoModal.hidden = true;
    travarRolagem(false);
    videoGatilho?.focus();
  }

  document.querySelectorAll('[data-video]').forEach((gatilho) => {
    gatilho.addEventListener('click', (evento) => {
      // Sem o modal (ou em file://, onde o YouTube recusa a origem) o link segue para a seção.
      if (!videoModal || window.location.protocol === 'file:') return;
      evento.preventDefault();
      abrirVideo(gatilho.dataset.video, gatilho);
    });
  });
  videoModal?.querySelectorAll('[data-video-close]').forEach((el) => el.addEventListener('click', fecharVideo));

  // ---------- Esc fecha menu, formulário e vídeo ----------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (videoModal && !videoModal.hidden) { fecharVideo(); return; }
    if (document.body.classList.contains('nav-open')) { setMenu(false); toggle?.focus(); }
  });

  // =========================================================
  // Formulário Kommo: confirmação depois do envio
  // =========================================================

  // O formulário roda num iframe de forms.kommo.com e avisa a página com
  // {"func":"amoformsSuccessSubmit"} quando o lead foi aceito.
  const kommoBox = document.querySelector('.kommo-form');
  const kommoSucesso = document.querySelector('#kommo-sucesso');
  if (kommoBox && kommoSucesso) {
    window.addEventListener('message', (evento) => {
      if (evento.origin !== 'https://forms.kommo.com') return;
      let dados;
      try { dados = typeof evento.data === 'string' ? JSON.parse(evento.data) : evento.data; } catch (erro) { return; }
      if (!dados || dados.func !== 'amoformsSuccessSubmit') return;
      kommoBox.classList.add('is-enviado');
      kommoSucesso.hidden = false;
      kommoSucesso.focus();
    });
  }

  // =========================================================
  // Barra de ação fixa (celular)
  // =========================================================

  // Some enquanto o visitante está no topo ou com o formulário na tela:
  // nesses dois momentos ela só atrapalharia.
  const barraCta = document.querySelector('[data-barra-cta]');
  if (barraCta) {
    const alvo = document.querySelector('#formulario') || document.querySelector('#diagnostico');
    let formularioNaTela = false;

    const atualizarBarra = () => {
      const passouDoTopo = window.scrollY > window.innerHeight * 0.6;
      barraCta.classList.toggle('is-on', passouDoTopo && !formularioNaTela);
      // Com o formulário aberto, o botão do WhatsApp sai da frente dos campos.
      document.body.classList.toggle('is-no-form', formularioNaTela);
    };

    if (alvo && 'IntersectionObserver' in window) {
      new IntersectionObserver((entradas) => {
        formularioNaTela = entradas[0].isIntersecting;
        atualizarBarra();
      }, { rootMargin: '-10% 0px -25% 0px' }).observe(alvo);
    }

    barraCta.hidden = false;
    window.addEventListener('scroll', atualizarBarra, { passive: true });
    window.addEventListener('resize', atualizarBarra);
    atualizarBarra();
  }

  // =========================================================
  // Diagnóstico gratuito: cadastra todos e mostra o painel que a API indicar
  // =========================================================

  /**
   * O cadastro é para operações, então só aceita e-mail corporativo. A lista
   * espelha a de api/lead-capture.js, que é quem recusa de verdade; aqui ela
   * serve para avisar antes do envio.
   */
  const DOMINIOS_PESSOAIS = new Set([
    'gmail.com', 'googlemail.com',
    'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'live.com', 'live.com.br', 'msn.com',
    'yahoo.com', 'yahoo.com.br', 'ymail.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com',
    'proton.me', 'protonmail.com', 'tutanota.com', 'gmx.com', 'mail.com', 'yandex.com', 'zoho.com', 'hey.com',
    'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'globomail.com', 'r7.com',
    'zipmail.com.br', 'oi.com.br', 'superig.com.br', 'pop.com.br', 'click21.com.br', 'itelefonica.com.br',
  ]);

  const ERRO_EMAIL_CORPORATIVO = 'Use o e-mail corporativo da sua empresa. Não aceitamos Gmail, Hotmail e similares.';

  function emailCorporativo(email) {
    const dominio = String(email || '').trim().toLowerCase().split('@')[1];
    if (!dominio || !dominio.includes('.')) return false;
    return !DOMINIOS_PESSOAIS.has(dominio);
  }

  const dxForm = document.querySelector('#diagnostico-form');
  if (dxForm) {
    const erro = dxForm.querySelector('#diagnostico-erro');
    const enviar = dxForm.querySelector('[data-dx-submit]');
    const cidadeCampo = dxForm.querySelector('[data-cidade]');
    const f = dxForm.elements;

    const regras = {
      nome: LEAD_RULES.nome,
      whatsapp: LEAD_RULES.whatsapp,
      email: {
        valida: (v) => LEAD_RULES.email.valida(v) && emailCorporativo(v),
        erro: (v) => (LEAD_RULES.email.valida(v) ? ERRO_EMAIL_CORPORATIVO : LEAD_RULES.email.erro),
      },
      empresa: LEAD_RULES.empresa,
      segmento: { valida: (v) => v !== '', erro: 'Escolha o segmento da sua operação.' },
      localizacao: { valida: (v) => v !== '', erro: 'Diga onde ficam suas unidades.' },
      unidades: {
        valida: (v) => /^\d+$/.test(v.trim()) && Number(v) >= 1 && Number(v) <= 5000,
        erro: 'Informe quantas unidades a operação tem (número inteiro).',
      },
      cidade: { valida: (v) => f.localizacao.value !== 'outra' || v.trim().length >= 2, erro: 'Informe a cidade e o estado.' },
    };

    f.localizacao.addEventListener('change', () => {
      cidadeCampo.hidden = f.localizacao.value !== 'outra';
      if (!cidadeCampo.hidden) f.cidade.focus();
    });

    // Valida na ordem visual e para no primeiro erro, com o foco no campo.
    const validar = () => {
      for (const [nome, regra] of Object.entries(regras)) {
        const campo = f[nome];
        if (campo.closest('[hidden]')) continue;
        const ok = regra.valida(campo.value);
        campo.setAttribute('aria-invalid', String(!ok));
        if (!ok) {
          erro.textContent = typeof regra.erro === 'function' ? regra.erro(campo.value) : regra.erro;
          erro.hidden = false;
          campo.focus();
          return false;
        }
      }
      erro.hidden = true;
      return true;
    };

    dxForm.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      if (!validar()) return;

      const qualificacao = {
        segmento: f.segmento.value,
        localizacao: f.localizacao.value,
        cidade: f.localizacao.value === 'outra' ? f.cidade.value.trim() : f.localizacao.selectedOptions[0].textContent.trim(),
        unidades: Number(f.unidades.value),
      };
      const lead = {
        nome: f.nome.value.trim(),
        empresa: f.empresa.value.trim(),
        email: f.email.value.trim(),
        whatsapp: f.whatsapp.value.trim(),
      };
      const payload = {
        source: 'observe-mais-diagnostico-gratuito',
        tipo: 'diagnostico-gratuito',
        createdAt: new Date().toISOString(),
        origem: 'formulario-diagnostico-gratuito',
        pagina: window.location.pathname + window.location.search,
        // Primeiro nível para o Zapier mapear direto.
        ...lead,
        segmento: qualificacao.segmento,
        localizacao: qualificacao.localizacao,
        cidade: qualificacao.cidade,
        unidades: qualificacao.unidades,
        lead,
        qualificacao,
      };

      enviar.disabled = true;
      enviar.firstChild.textContent = 'Enviando… ';
      const envio = await enviarLead(payload);
      enviar.disabled = false;
      enviar.firstChild.textContent = 'Quero meu diagnóstico ';

      if (!envio.ok) {
        const pessoal = envio.erro === 'email_nao_corporativo';
        erro.textContent = pessoal ? ERRO_EMAIL_CORPORATIVO : 'Não foi possível enviar agora. Tente novamente em alguns instantes.';
        erro.hidden = false;
        if (pessoal) { f.email.setAttribute('aria-invalid', 'true'); f.email.focus(); }
        return;
      }

      // Sem resposta da API (rede instável), o painel neutro serve aos dois casos.
      dxForm.hidden = true;
      const resultado = document.querySelector(envio.qualificado === true ? '#diagnostico-aprovado' : '#diagnostico-cadastrado');
      resultado.querySelectorAll('[data-nome]').forEach((el) => { el.textContent = lead.nome.split(' ')[0]; });
      resultado.hidden = false;
      resultado.setAttribute('tabindex', '-1');
      resultado.focus();
    });
  }
})();
