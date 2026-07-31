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

const clientCarouselViewport = document.querySelector('.client-carousel-viewport');
const clientCarouselTrack = document.querySelector('.client-track');
let carouselResumeTimer;

function moveClientCarousel(direction) {
  if (!clientCarouselViewport || !clientCarouselTrack) return;

  window.clearTimeout(carouselResumeTimer);
  clientCarouselTrack.classList.add('is-paused');
  clientCarouselViewport.scrollBy({
    left: direction * Math.min(clientCarouselViewport.clientWidth * 0.72, 620),
    behavior: reducedMotion ? 'auto' : 'smooth',
  });

  carouselResumeTimer = window.setTimeout(() => {
    clientCarouselTrack.classList.remove('is-paused');
  }, 1600);
}

document.querySelectorAll('[data-carousel-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    moveClientCarousel(button.dataset.carouselDirection === 'next' ? 1 : -1);
  });
});

const roiForm = document.querySelector('#roi-form');
const errorMessage = document.querySelector('#form-error');
const leadModal = document.querySelector('#lead-modal');
const leadForm = document.querySelector('#lead-form');
const leadError = document.querySelector('#lead-error');
const calculatorLayout = document.querySelector('.calculator-layout');
const roiTitle = document.querySelector('#results-title');
const roiSubtitle = document.querySelector('#roi-subtitle');
const roiFormTitle = document.querySelector('#roi-form-title');
const roiOutputKicker = document.querySelector('#roi-output-kicker');
const roiOutputTitle = document.querySelector('#roi-output-title');
const roiPrimaryAction = document.querySelector('#roi-primary-action');
const roiPreviewList = document.querySelector('#roi-preview-list');
const roiResultPanel = document.querySelector('#roi-result-panel');
const roiResultActions = document.querySelector('#roi-result-actions');
const roiCommercialCopy = document.querySelector('#roi-commercial-copy');
const roiImpactQuote = document.querySelector('#roi-impact-quote');
const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const ROI_ASSUMPTIONS = {
  observallVisitPrice: 300,
  couponGrowth: 0.1,
  ticketGrowth: 0.12,
};
let pendingSimulation = null;
let latestSimulation = null;

function parseBrazilianNumber(value) {
  const normalized = String(value || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  return Number(normalized);
}

function valueOf(id) {
  return parseBrazilianNumber(document.querySelector(`#${id}`)?.value);
}

function formatPayback(months) {
  const roundedMonths = Math.max(1, Math.ceil(months));
  return `${roundedMonths} ${roundedMonths === 1 ? 'mês' : 'meses'}`;
}

function getSimulationInput() {
  return {
    stores: valueOf('stores'),
    coupons: valueOf('coupons'),
    ticket: valueOf('ticket'),
    margin: valueOf('margin'),
    visits: valueOf('visits'),
  };
}

function validateSimulation(input) {
  return Object.values(input).every((value) => Number.isFinite(value) && value > 0);
}

function calculateSimulation(input) {
  const monthlyInvestment = input.stores * input.visits * ROI_ASSUMPTIONS.observallVisitPrice;
  const annualInvestment = monthlyInvestment * 12;
  const currentMonthlyRevenue = input.coupons * input.ticket;
  const projectedCoupons = input.coupons * (1 + ROI_ASSUMPTIONS.couponGrowth);
  const projectedTicket = input.ticket * (1 + ROI_ASSUMPTIONS.ticketGrowth);
  const projectedMonthlyRevenue = projectedCoupons * projectedTicket;
  const extraMonthlyRevenue = projectedMonthlyRevenue - currentMonthlyRevenue;
  const incrementalMonthlyProfit = extraMonthlyRevenue * (input.margin / 100);
  const incrementalAnnualProfit = incrementalMonthlyProfit * 12;
  const paybackMonths = incrementalMonthlyProfit > 0 ? annualInvestment / incrementalMonthlyProfit : Infinity;
  const annualNetGain = incrementalAnnualProfit - annualInvestment;
  const annualRoi = annualInvestment > 0 ? (annualNetGain / annualInvestment) * 100 : 0;

  return {
    monthlyInvestment,
    annualInvestment,
    currentMonthlyRevenue,
    projectedCoupons,
    projectedTicket,
    projectedMonthlyRevenue,
    extraMonthlyRevenue,
    incrementalMonthlyProfit,
    incrementalAnnualProfit,
    paybackMonths,
    annualNetGain,
    annualRoi,
    paybackLabel: formatPayback(paybackMonths),
  };
}

function buildLeadPayload(lead, input, result) {
  return {
    source: 'observall-site-roi',
    createdAt: new Date().toISOString(),
    lead,
    simulation: {
      quantidadeDeLojas: input.stores,
      cuponsPorMes: input.coupons,
      ticketMedio: input.ticket,
      margemDeLucro: input.margin,
      visitasOcultasPorLojaMes: input.visits,
      investimentoMensalObservall: result.monthlyInvestment,
      investimentoAnualObservall: result.annualInvestment,
      receitaAtualMensal: result.currentMonthlyRevenue,
      receitaProjetadaMensal: result.projectedMonthlyRevenue,
      receitaExtraMensal: result.extraMonthlyRevenue,
      lucroIncrementalMensal: result.incrementalMonthlyProfit,
      lucroIncrementalAnual: result.incrementalAnnualProfit,
      paybackEstimadoMeses: result.paybackMonths,
      roiAnual: result.annualRoi,
      ganhoLiquidoAnual: result.annualNetGain,
    },
  };
}

function setError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function clearError(element) {
  if (!element) return;
  element.hidden = true;
  element.textContent = '';
}

function saveLeadFallback(payload) {
  const key = 'observall-roi-leads';
  const saved = JSON.parse(window.localStorage.getItem(key) || '[]');
  saved.push(payload);
  window.localStorage.setItem(key, JSON.stringify(saved));
}

async function persistLead(payload) {
  try {
    const response = await fetch('/api/lead-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Lead endpoint returned ${response.status}`);
    const data = await response.json().catch(() => ({ ok: true }));
    if (data.ok === false) throw new Error('Lead endpoint rejected the payload');
    return true;
  } catch (error) {
    if (window.location.protocol === 'file:') {
      saveLeadFallback(payload);
      return true;
    }
  }

  return false;
}

function setFormReadOnly(isReadOnly) {
  roiForm?.querySelectorAll('input').forEach((input) => {
    input.readOnly = isReadOnly;
  });
}

function showLeadModal() {
  if (!leadModal) return;
  leadModal.hidden = false;
  document.body.classList.add('menu-open');
  window.setTimeout(() => document.querySelector('#lead-name')?.focus(), 0);
}

function hideLeadModal() {
  if (!leadModal) return;
  leadModal.hidden = true;
  document.body.classList.remove('menu-open');
  clearError(leadError);
}

function renderResult(input, result) {
  latestSimulation = { input, result };
  calculatorLayout?.setAttribute('data-roi-state', 'result');
  setFormReadOnly(true);

  if (roiTitle) roiTitle.innerHTML = `Sua perda silenciosa pode exigir <span>diagnóstico antes de promessa.</span>`;
  if (roiSubtitle) {
    roiSubtitle.textContent = 'Com base nos dados informados, este cenário ilustrativo ajuda a dimensionar a conversa. A validação real depende de visita, roteiro e evidências da loja.';
  }
  if (roiFormTitle) roiFormTitle.textContent = 'Resumo do seu supermercado';
  if (roiOutputKicker) roiOutputKicker.textContent = 'Resultado estimado';
  if (roiOutputTitle) roiOutputTitle.textContent = 'Este é o tamanho possível da perda que merece investigação';
  if (roiPrimaryAction) {
    roiPrimaryAction.textContent = 'Refazer simulação';
    roiPrimaryAction.type = 'button';
  }
  if (roiPreviewList) roiPreviewList.hidden = true;
  if (roiResultPanel) roiResultPanel.hidden = false;
  if (roiResultActions) roiResultActions.hidden = false;

  document.querySelector('#payback-value').textContent = `Payback estimado: ${result.paybackLabel}`;
  document.querySelector('#extra-revenue').textContent = currency.format(result.extraMonthlyRevenue);
  document.querySelector('#incremental-profit').textContent = currency.format(result.incrementalMonthlyProfit);
  document.querySelector('#monthly-investment').textContent = currency.format(result.monthlyInvestment);
  document.querySelector('#roi-value').textContent = `${integer.format(result.annualRoi)}%`;
  document.querySelector('#annual-net-gain').textContent = currency.format(result.annualNetGain);

  if (roiCommercialCopy) {
    roiCommercialCopy.textContent = 'A simulação não garante resultado. Ela mostra por que fila, ruptura percebida, preço ausente, validade, limpeza e atendimento precisam ser medidos antes de virar plano de ação.';
  }
  if (roiImpactQuote) {
    roiImpactQuote.innerHTML = 'O próximo passo é validar a loja real. <strong>Cliente oculto transforma hipótese em evidência operacional.</strong>';
  }
}

function resetResults() {
  pendingSimulation = null;
  calculatorLayout?.setAttribute('data-roi-state', 'form');
  setFormReadOnly(false);

  if (roiTitle) roiTitle.innerHTML = 'Simule o tamanho da <span>perda silenciosa da sua loja.</span>';
  if (roiSubtitle) {
    roiSubtitle.textContent = 'Use um cenário ilustrativo para estimar quanto pequenos atritos de loja podem representar na recorrência do supermercado.';
  }
  if (roiFormTitle) roiFormTitle.textContent = 'Preencha os dados do seu supermercado';
  if (roiOutputKicker) roiOutputKicker.textContent = 'O que você vai estimar';
  if (roiOutputTitle) roiOutputTitle.textContent = 'Entenda o tamanho financeiro possível das falhas que ninguém está medindo';
  if (roiPrimaryAction) {
    roiPrimaryAction.textContent = 'Simular perda silenciosa';
    roiPrimaryAction.type = 'submit';
  }
  if (roiPreviewList) roiPreviewList.hidden = false;
  if (roiResultPanel) roiResultPanel.hidden = true;
  if (roiResultActions) roiResultActions.hidden = true;
  if (roiCommercialCopy) {
    roiCommercialCopy.textContent = 'Pequenas falhas em atendimento, fila, ruptura, exposição e padrão de loja podem derrubar recorrência. A Observe Mais ajuda a transformar essas perdas invisíveis em diagnóstico e plano de ação.';
  }
  if (roiImpactQuote) {
    roiImpactQuote.innerHTML = 'Antes de prometer ganho, é preciso medir. <strong>O diagnóstico mostra onde a loja está deixando dinheiro escapar.</strong>';
  }
  clearError(errorMessage);
}

function calculateROI(event) {
  event?.preventDefault();

  const input = getSimulationInput();

  if (!validateSimulation(input)) {
    resetResults();
    setError(errorMessage, 'Preencha todos os campos para calcular seu potencial de ganho.');
    return;
  }

  pendingSimulation = { input, result: calculateSimulation(input) };
  clearError(errorMessage);
  showLeadModal();
}

roiForm?.addEventListener('submit', calculateROI);

roiPrimaryAction?.addEventListener('click', () => {
  if (calculatorLayout?.dataset.roiState === 'result') resetResults();
});

document.querySelector('#roi-example')?.addEventListener('click', () => {
  document.querySelector('#stores').value = '12';
  document.querySelector('#coupons').value = '12.000';
  document.querySelector('#ticket').value = 'R$ 80';
  document.querySelector('#margin').value = '20%';
  document.querySelector('#visits').value = '1';
  resetResults();
  document.querySelector('#stores')?.focus();
});

roiForm?.addEventListener('reset', () => window.setTimeout(resetResults));

leadModal?.querySelectorAll('[data-modal-close]').forEach((item) => {
  item.addEventListener('click', hideLeadModal);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && leadModal && !leadModal.hidden) hideLeadModal();
});

leadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!pendingSimulation) return;

  const formData = new FormData(leadForm);
  const lead = {
    nome: String(formData.get('name') || '').trim(),
    empresa: String(formData.get('company') || '').trim(),
    whatsapp: String(formData.get('whatsapp') || '').trim(),
    email: String(formData.get('email') || '').trim(),
  };

  if (!lead.nome || !lead.empresa || !lead.whatsapp || !lead.email) {
    setError(leadError, 'Preencha todos os campos para visualizar o resultado.');
    return;
  }

  const submitButton = leadForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  const payload = buildLeadPayload(lead, pendingSimulation.input, pendingSimulation.result);
  const saved = await persistLead(payload);
  submitButton.disabled = false;

  if (!saved) {
    setError(leadError, 'Não foi possível salvar seus dados agora. Tente novamente em alguns instantes.');
    return;
  }

  hideLeadModal();
  renderResult(pendingSimulation.input, pendingSimulation.result);
});

const currentYear = document.querySelector('#current-year');
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
