document.documentElement.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

function closeMenu() {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuToggle?.addEventListener('click', () => {
  const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(willOpen));
  menuToggle.setAttribute('aria-label', willOpen ? 'Fechar menu' : 'Abrir menu');
  navigation?.classList.toggle('is-open', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

window.addEventListener('resize', () => {
  if (window.innerWidth > 860) closeMenu();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px' },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll('.faq-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-list details[open]').forEach((openItem) => {
      if (openItem !== item) openItem.removeAttribute('open');
    });
  });
});

/* Formulário inteligente: uma pergunta por vez. */

const leadFlow = document.querySelector('#lead-flow');
const leadFlowForm = document.querySelector('#lead-flow-form');
const leadFlowDone = document.querySelector('#lead-flow-done');
const leadFlowError = document.querySelector('#lead-flow-error');
const leadFlowBar = document.querySelector('[data-flow-bar]');
const leadFlowBack = document.querySelector('[data-flow-back]');
const leadFlowNext = document.querySelector('[data-flow-next]');
const leadSteps = leadFlow ? [...leadFlow.querySelectorAll('.lead-step')] : [];

const LEAD_RULES = {
  email: {
    valida: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    erro: 'Digite um e-mail válido, como voce@empresa.com.br.',
  },
  whatsapp: {
    // Aceita 10 ou 11 dígitos (fixo ou celular), com ou sem máscara.
    valida: (v) => /^\d{10,13}$/.test(v.replace(/\D/g, '')),
    erro: 'Digite um WhatsApp com DDD, como (61) 99999-9999.',
  },
  nome: { valida: (v) => v.trim().length >= 2, erro: 'Digite seu nome.' },
  empresa: { valida: (v) => v.trim().length >= 2, erro: 'Digite o nome da empresa.' },
  cargo: { valida: (v) => v.trim().length >= 2, erro: 'Digite seu cargo.' },
};

let leadStepIndex = 0;
let leadOrigem = '';

function mascararWhatsapp(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mostrarEtapa(indice) {
  leadStepIndex = Math.max(0, Math.min(indice, leadSteps.length - 1));

  leadSteps.forEach((etapa, i) => etapa.classList.toggle('is-active', i === leadStepIndex));
  leadFlowError.hidden = true;

  const progresso = ((leadStepIndex + 1) / leadSteps.length) * 100;
  if (leadFlowBar) leadFlowBar.style.width = `${progresso}%`;
  leadFlow.querySelector('.lead-flow__progress')?.setAttribute('aria-valuenow', String(leadStepIndex + 1));

  leadFlowBack.hidden = leadStepIndex === 0;
  leadFlowNext.textContent = leadStepIndex === leadSteps.length - 1 ? 'Enviar →' : 'Confirmar →';

  const campo = leadSteps[leadStepIndex].querySelector('input');
  window.setTimeout(() => campo?.focus(), 60);
}

function abrirLeadFlow(origem) {
  if (!leadFlow) return;
  leadOrigem = origem || 'cta';
  leadFlow.hidden = false;
  document.body.classList.add('menu-open');
  leadFlowForm.hidden = false;
  leadFlowDone.hidden = true;
  mostrarEtapa(0);
}

function fecharLeadFlow() {
  if (!leadFlow) return;
  leadFlow.hidden = true;
  document.body.classList.remove('menu-open');
}

function coletarRespostas() {
  const dados = {};
  for (const etapa of leadSteps) {
    const campo = etapa.querySelector('input');
    dados[campo.name] = campo.value.trim();
  }
  return dados;
}

/**
 * URL do Catch Hook do Zapier. Cole aqui e o lead vai direto para a planilha,
 * sem nenhuma configuração na Vercel.
 *
 * Fica visível no código da página — é inevitável para uma chamada feita pelo
 * navegador. Quem achar a URL consegue inserir linhas na planilha, então vale
 * um passo de Filter no Zap. Deixar vazio faz o envio usar só /api/lead-capture.
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
    if (!resposta.ok) throw new Error(`lead-capture respondeu ${resposta.status}`);
    const dados = await resposta.json().catch(() => ({ ok: true }));
    if (dados.ok === false) throw new Error('lead-capture recusou o envio');
    return true;
  } catch (erro) {
    return false;
  }
}

async function enviarLead() {
  const lead = coletarRespostas();
  const payload = {
    source: 'observe-mais-site-formulario',
    createdAt: new Date().toISOString(),
    origem: leadOrigem,
    // Campos no primeiro nível para o Zapier mapear direto, sem passo extra.
    nome: lead.nome,
    empresa: lead.empresa,
    cargo: lead.cargo,
    email: lead.email,
    whatsapp: lead.whatsapp,
    lead: {
      nome: lead.nome,
      empresa: lead.empresa,
      whatsapp: lead.whatsapp,
      email: lead.email,
      cargo: lead.cargo,
    },
  };

  // Em file:// não há rede nem API; guarda localmente para não perder o preenchimento.
  if (window.location.protocol === 'file:') {
    const chave = 'observe-mais-leads';
    const salvos = JSON.parse(window.localStorage.getItem(chave) || '[]');
    salvos.push(payload);
    window.localStorage.setItem(chave, JSON.stringify(salvos));
    return true;
  }

  const [zapier, api] = await Promise.all([enviarParaZapier(payload), enviarParaApi(payload)]);

  // Basta um destino ter aceitado: o lead não se perde se um dos dois cair.
  return zapier === true || api === true;
}

document.querySelectorAll('[data-lead-flow]').forEach((gatilho) => {
  gatilho.addEventListener('click', () => {
    abrirLeadFlow(gatilho.textContent.trim().slice(0, 60));
  });
});

leadFlow?.querySelectorAll('[data-flow-close]').forEach((item) => {
  item.addEventListener('click', fecharLeadFlow);
});

leadFlowBack?.addEventListener('click', () => mostrarEtapa(leadStepIndex - 1));

document.querySelector('#flow-whatsapp')?.addEventListener('input', (evento) => {
  evento.target.value = mascararWhatsapp(evento.target.value);
});

leadFlowForm?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const etapa = leadSteps[leadStepIndex];
  const campo = etapa.querySelector('input');
  const regra = LEAD_RULES[etapa.dataset.step];

  if (regra && !regra.valida(campo.value)) {
    leadFlowError.textContent = regra.erro;
    leadFlowError.hidden = false;
    campo.focus();
    return;
  }

  if (leadStepIndex < leadSteps.length - 1) {
    mostrarEtapa(leadStepIndex + 1);
    return;
  }

  leadFlowNext.disabled = true;
  leadFlowNext.textContent = 'Enviando…';
  const enviado = await enviarLead();
  leadFlowNext.disabled = false;
  leadFlowNext.textContent = 'Enviar →';

  if (!enviado) {
    leadFlowError.textContent = 'Não foi possível enviar agora. Tente novamente em alguns instantes.';
    leadFlowError.hidden = false;
    return;
  }

  leadFlowForm.hidden = true;
  leadFlowDone.hidden = false;
  if (leadFlowBar) leadFlowBar.style.width = '100%';
});

window.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && leadFlow && !leadFlow.hidden) fecharLeadFlow();
});

const currentYear = document.querySelector('#current-year');
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

/* Busca do blog: filtra os cartões já renderizados, sem ida ao servidor. */

const blogBusca = document.querySelector('[data-blog-busca]');
const blogLista = document.querySelector('[data-blog-lista]');
const blogVazio = document.querySelector('[data-blog-vazio]');

blogBusca?.addEventListener('input', () => {
  const termo = blogBusca.value.trim().toLowerCase();
  let visiveis = 0;

  for (const cartao of blogLista.querySelectorAll('.post-card')) {
    const combina = !termo || (cartao.dataset.busca || '').includes(termo);
    cartao.hidden = !combina;
    if (combina) visiveis += 1;
  }

  if (blogVazio) blogVazio.hidden = visiveis > 0;
});
