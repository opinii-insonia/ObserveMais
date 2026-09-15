/**
 * Editor do blog, aberto pelo botão "Fazer uma postagem" em /blog.
 *
 * Nenhuma credencial existe neste arquivo. A senha é verificada no servidor e o
 * que fica aqui é um token de sessão assinado, guardado só em memória — fechar a
 * aba encerra a sessão. Todo o conteúdo digitado é escapado no servidor antes de
 * virar HTML.
 */

const API = '/api/blog-admin';

const modal = document.querySelector('#editor-modal');
if (modal) {
  const passoLogin = modal.querySelector('[data-editor-login]');
  const passoEditor = modal.querySelector('[data-editor-form]');
  const erroLogin = modal.querySelector('[data-erro-login]');
  const erroArtigo = modal.querySelector('[data-erro-artigo]');
  const okArtigo = modal.querySelector('[data-ok-artigo]');
  const capaPreview = modal.querySelector('[data-capa-preview]');
  const campoCorpo = modal.querySelector('#ed-corpo');

  let token = null;
  let capaUrl = '';

  const MENSAGENS = {
    senha_invalida: 'Senha incorreta.',
    painel_nao_configurado: 'O painel ainda não foi ligado na Vercel. Falta criar a variável de senha.',
    campos_obrigatorios: 'Preencha título, resumo e conteúdo.',
    falha_no_armazenamento: 'Não foi possível gravar. O Blob Store precisa estar conectado na Vercel.',
    sessao_expirada: 'Sua sessão expirou. Entre novamente.',
    formato_nao_suportado: 'Use JPG, PNG ou WebP. O arquivo enviado não é uma imagem válida.',
    imagem_grande: 'Imagem acima de 6 MB. Reduza antes de enviar.',
  };

  const explicar = (erro) => MENSAGENS[erro] || 'Não foi possível concluir. Tente novamente.';

  function mostrar(elemento, texto) {
    elemento.textContent = texto;
    elemento.hidden = false;
  }

  async function chamar(corpo) {
    const resposta = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });

    const dados = await resposta.json().catch(() => ({ ok: false, erro: 'resposta_invalida' }));

    if (resposta.status === 401 && corpo.acao !== 'login') {
      token = null;
      passoEditor.hidden = true;
      passoLogin.hidden = false;
      mostrar(erroLogin, MENSAGENS.sessao_expirada);
    }

    return dados;
  }

  function abrir() {
    modal.hidden = false;
    document.body.classList.add('menu-open');
    window.setTimeout(() => modal.querySelector('#ed-senha')?.focus(), 60);
  }

  function fechar() {
    modal.hidden = true;
    document.body.classList.remove('menu-open');
  }

  document.querySelectorAll('[data-abrir-editor]').forEach((b) => b.addEventListener('click', abrir));
  modal.querySelectorAll('[data-editor-fechar]').forEach((b) => b.addEventListener('click', fechar));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) fechar();
  });

  /* ------------------------------------------------------------- login */

  modal.querySelector('[data-form-login]')?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroLogin.hidden = true;

    const senha = modal.querySelector('#ed-senha').value;
    if (!senha) return mostrar(erroLogin, 'Digite a senha.');

    const botao = evento.target.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Entrando…';

    const dados = await chamar({ acao: 'login', senha });

    botao.disabled = false;
    botao.textContent = 'Entrar';

    if (!dados.ok) return mostrar(erroLogin, explicar(dados.erro));

    token = dados.token;
    modal.querySelector('#ed-senha').value = '';
    passoLogin.hidden = true;
    passoEditor.hidden = false;
  });

  /* ------------------------------------------------------------ imagem */

  function lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = reject;
      leitor.readAsDataURL(arquivo);
    });
  }

  async function enviarImagem(arquivo, aoConcluir) {
    if (!arquivo) return;
    erroArtigo.hidden = true;

    if (arquivo.size > 6 * 1024 * 1024) return mostrar(erroArtigo, MENSAGENS.imagem_grande);

    const dados = await chamar({ acao: 'imagem', token, arquivo: await lerArquivo(arquivo) });
    if (!dados.ok) return mostrar(erroArtigo, explicar(dados.erro));

    aoConcluir(dados.url);
  }

  modal.querySelector('#ed-capa')?.addEventListener('change', async (evento) => {
    const rotulo = modal.querySelector('[data-capa-status]');
    rotulo.textContent = 'Enviando…';

    await enviarImagem(evento.target.files[0], (url) => {
      capaUrl = url;
      capaPreview.src = url;
      capaPreview.hidden = false;
      rotulo.textContent = 'Capa carregada.';
    });

    if (!capaUrl) rotulo.textContent = '';
    evento.target.value = '';
  });

  modal.querySelector('#ed-imagem')?.addEventListener('change', async (evento) => {
    const rotulo = modal.querySelector('[data-imagem-status]');
    rotulo.textContent = 'Enviando…';

    await enviarImagem(evento.target.files[0], (url) => {
      // Insere no ponto onde o cursor estava.
      const posicao = campoCorpo.selectionStart ?? campoCorpo.value.length;
      const marcacao = `\n![descreva a imagem](${url})\n`;
      campoCorpo.value = campoCorpo.value.slice(0, posicao) + marcacao + campoCorpo.value.slice(posicao);
      rotulo.textContent = 'Imagem inserida no texto. Troque a descrição entre colchetes.';
      campoCorpo.focus();
    });

    evento.target.value = '';
  });

  /* ---------------------------------------------------------- publicar */

  modal.querySelector('[data-form-artigo]')?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroArtigo.hidden = true;
    okArtigo.hidden = true;

    const artigo = {
      acao: 'publicar',
      token,
      titulo: modal.querySelector('#ed-titulo').value.trim(),
      categoria: modal.querySelector('#ed-categoria').value.trim(),
      resumo: modal.querySelector('#ed-resumo').value.trim(),
      corpo: campoCorpo.value.trim(),
      capa: capaUrl,
      capaAlt: modal.querySelector('#ed-titulo').value.trim(),
    };

    if (!artigo.titulo || !artigo.resumo || !artigo.corpo) {
      return mostrar(erroArtigo, MENSAGENS.campos_obrigatorios);
    }

    const botao = modal.querySelector('[data-publicar]');
    botao.disabled = true;
    botao.textContent = 'Publicando…';

    const dados = await chamar(artigo);

    botao.disabled = false;
    botao.textContent = 'Publicar';

    if (!dados.ok) return mostrar(erroArtigo, explicar(dados.erro));

    okArtigo.innerHTML = `Publicado. <a href="${dados.url}" target="_blank" rel="noopener">Abrir o artigo</a> — a página do blog já mostra ele ao recarregar.`;
    okArtigo.hidden = false;

    evento.target.reset();
    capaUrl = '';
    capaPreview.hidden = true;
    modal.querySelector('[data-capa-status]').textContent = '';
    modal.querySelector('[data-imagem-status]').textContent = '';
  });
}
