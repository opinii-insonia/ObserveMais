/**
 * Simulador interno de ROI.
 *
 * Ferramenta de apoio comercial, fora da landing pública. As premissas abaixo são
 * hipóteses arbitradas para dimensionar conversa — não são resultado medido.
 * A fórmula completa está descrita na própria página.
 */

const PREMISSAS = {
  observallVisitPrice: 300,
  couponGrowth: 0.1,
  ticketGrowth: 0.12,
};

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const roiForm = document.querySelector('#roi-form');
const erro = document.querySelector('#form-error');
const conferenciaReceita = document.querySelector('#revenue-check');

function lerNumero(valor) {
  const normalizado = String(valor || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  return Number(normalizado);
}

function campo(id) {
  return lerNumero(document.querySelector(`#${id}`)?.value);
}

function formatarPayback(meses) {
  if (!Number.isFinite(meses)) return 'não se paga no cenário informado';
  const arredondado = Math.max(1, Math.ceil(meses));
  return `${arredondado} ${arredondado === 1 ? 'mês' : 'meses'}`;
}

function lerEntrada() {
  return {
    stores: campo('stores'),
    coupons: campo('coupons'),
    ticket: campo('ticket'),
    margin: campo('margin'),
    visits: campo('visits'),
    revenue: campo('revenue'), // opcional: 0 ou NaN significa "não informado"
  };
}

function entradaValida(entrada) {
  const obrigatorios = ['stores', 'coupons', 'ticket', 'margin', 'visits'];
  return obrigatorios.every((chave) => Number.isFinite(entrada[chave]) && entrada[chave] > 0);
}

function calcular(entrada) {
  const investimentoMensal = entrada.stores * entrada.visits * PREMISSAS.observallVisitPrice;
  const investimentoAnual = investimentoMensal * 12;

  // O faturamento informado tem prioridade sobre a estimativa por cupons × ticket.
  const receitaPorCupons = entrada.coupons * entrada.ticket;
  const informouReceita = Number.isFinite(entrada.revenue) && entrada.revenue > 0;
  const receitaAtual = informouReceita ? entrada.revenue : receitaPorCupons;

  const fatorCrescimento = (1 + PREMISSAS.couponGrowth) * (1 + PREMISSAS.ticketGrowth);
  const receitaProjetada = receitaAtual * fatorCrescimento;
  const receitaExtra = receitaProjetada - receitaAtual;

  const lucroIncrementalMensal = receitaExtra * (entrada.margin / 100);
  const lucroIncrementalAnual = lucroIncrementalMensal * 12;
  const paybackMeses = lucroIncrementalMensal > 0 ? investimentoAnual / lucroIncrementalMensal : Infinity;
  const ganhoLiquidoAnual = lucroIncrementalAnual - investimentoAnual;
  const roiAnual = investimentoAnual > 0 ? (ganhoLiquidoAnual / investimentoAnual) * 100 : 0;

  return {
    investimentoMensal,
    investimentoAnual,
    receitaAtual,
    receitaPorCupons,
    informouReceita,
    receitaProjetada,
    receitaExtra,
    lucroIncrementalMensal,
    lucroIncrementalAnual,
    paybackMeses,
    ganhoLiquidoAnual,
    roiAnual,
  };
}

function mostrarConferencia(resultado) {
  if (!conferenciaReceita) return;

  if (!resultado.informouReceita) {
    conferenciaReceita.hidden = true;
    return;
  }

  const divergencia = resultado.receitaAtual - resultado.receitaPorCupons;
  const percentual = resultado.receitaPorCupons > 0
    ? Math.abs(divergencia / resultado.receitaPorCupons) * 100
    : 0;

  conferenciaReceita.hidden = false;
  conferenciaReceita.textContent = percentual < 5
    ? `Faturamento informado bate com cupons × ticket (${moeda.format(resultado.receitaPorCupons)}). Base consistente.`
    : `Atenção: cupons × ticket daria ${moeda.format(resultado.receitaPorCupons)}, ${inteiro.format(percentual)}% ${divergencia > 0 ? 'abaixo' : 'acima'} do faturamento informado. Confirme qual número está correto antes de usar.`;
}

function renderizar(resultado) {
  document.querySelector('#payback-value').textContent = `Payback estimado: ${formatarPayback(resultado.paybackMeses)}`;
  document.querySelector('#extra-revenue').textContent = moeda.format(resultado.receitaExtra);
  document.querySelector('#incremental-profit').textContent = moeda.format(resultado.lucroIncrementalMensal);
  document.querySelector('#monthly-investment').textContent = moeda.format(resultado.investimentoMensal);
  document.querySelector('#roi-value').textContent = `${inteiro.format(resultado.roiAnual)}%`;
  document.querySelector('#annual-net-gain').textContent = moeda.format(resultado.ganhoLiquidoAnual);

  mostrarConferencia(resultado);
}

roiForm?.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const entrada = lerEntrada();

  if (!entradaValida(entrada)) {
    erro.textContent = 'Preencha lojas, cupons, ticket, margem e visitas com números maiores que zero.';
    erro.hidden = false;
    return;
  }

  erro.hidden = true;
  renderizar(calcular(entrada));
});

document.querySelector('#roi-example')?.addEventListener('click', () => {
  document.querySelector('#stores').value = '12';
  document.querySelector('#coupons').value = '12.000';
  document.querySelector('#ticket').value = 'R$ 80';
  document.querySelector('#margin').value = '20%';
  document.querySelector('#visits').value = '1';
  document.querySelector('#revenue').value = '';
  erro.hidden = true;
  if (conferenciaReceita) conferenciaReceita.hidden = true;
  document.querySelector('#stores')?.focus();
});
