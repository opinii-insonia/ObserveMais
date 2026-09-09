/**
 * Painel de publicação.
 *
 * Nenhuma senha, chave ou URL secreta existe neste arquivo. O que ele guarda é
 * um token de sessão assinado pelo servidor, com validade curta, mantido apenas
 * em memória — fechar a aba encerra a sessão.
 */

const api = '/api/blog-admin';

const login = document.querySelector('#admin-login');
const painel = document.querySelector('#admin-painel');
const formLogin = document.querySelector('#form-login');
const formArtigo = document.querySelector('#form-artigo');
const erroLogin = document.querySelector('#erro-login');
const erroArtigo = document.querySelector('#erro-artigo');
const okArtigo = document.querySelector('#ok-artigo');
const lista = document.querySelector('#lista-artigos');
const previa = document.querySelector('#admin-previa');
const previaCorpo = document.querySelector('#previa-corpo');

// Só em memória: nada de localStorage, para o token não sobreviver à aba.
let token = null;

function mostrar(elemento, texto) {
  elemento.textContent = texto;
  elemento.hidden = false;
}

async function chamar(corpo) {
  const resposta = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  const dados = await resposta.json().catch(() => ({ ok: false, erro: 'resposta_invalida' }));

  if (resposta.status === 401 && corpo.acao !== 'login') {
    token = null;
    painel.hidden = true;
    login.hidden = false;
    mostrar(erroLogin, 'Sua sessão expirou. Entre novamente.');
  }

  return dados;
}

const MENSAGENS = {
  senha_invalida: 'Senha incorreta.',
  painel_nao_configurado: 'O painel ainda não foi configurado na Vercel. Falta a variável BLOG_ADMIN_SENHA.',
  campos_obrigatorios: 'Preencha título, resumo e conteúdo.',
  falha_no_armazenamento: 'Não foi possível gravar. Verifique se o Blob Store está conectado na Vercel.',
  sessao_expirada: 'Sua sessão expirou. Entre novamente.',
};

const explicar = (erro) => MENSAGENS[erro] || 'Não foi possível concluir. Tente novamente.';

/* --------------------------------------------------------------- login */

formLogin?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  erroLogin.hidden = true;

  const senha = document.querySelector('#senha').value;
  if (!senha) return mostrar(erroLogin, 'Digite a senha.');

  const botao = formLogin.querySelector('button');
  botao.disabled = true;
  botao.textContent = 'Entrando…';

  const dados = await chamar({ acao: 'login', senha });

  botao.disabled = false;
  botao.textContent = 'Entrar';

  if (!dados.ok) return mostrar(erroLogin, explicar(dados.erro));

  token = dados.token;
  document.querySelector('#senha').value = '';
  login.hidden = true;
  painel.hidden = false;
  carregarLista();
});

document.querySelector('#sair')?.addEventListener('click', () => {
  token = null;
  painel.hidden = true;
  previa.hidden = true;
  login.hidden = false;
});

/* ------------------------------------------------------------ publicar */

formArtigo?.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  erroArtigo.hidden = true;
  okArtigo.hidden = true;

  const artigo = {
    acao: 'publicar',
    token,
    titulo: document.querySelector('#titulo').value.trim(),
    categoria: document.querySelector('#categoria').value.trim(),
    resumo: document.querySelector('#resumo').value.trim(),
    corpo: document.querySelector('#corpo').value.trim(),
  };

  if (!artigo.titulo || !artigo.resumo || !artigo.corpo) {
    return mostrar(erroArtigo, 'Preencha título, resumo e conteúdo.');
  }

  const botao = document.querySelector('#publicar');
  botao.disabled = true;
  botao.textContent = 'Publicando…';

  const dados = await chamar(artigo);

  botao.disabled = false;
  botao.textContent = 'Publicar';

  if (!dados.ok) return mostrar(erroArtigo, explicar(dados.erro));

  okArtigo.innerHTML = `Publicado. <a href="${dados.url}" target="_blank" rel="noopener">Abrir ${dados.url}</a>`;
  okArtigo.hidden = false;
  formArtigo.reset();
  carregarLista();
});

/* -------------------------------------------------------------- lista */

async function carregarLista() {
  const dados = await chamar({ acao: 'listar', token });

  if (!dados.ok) {
    lista.innerHTML = `<p class="admin-ajuda">${explicar(dados.erro)}</p>`;
    return;
  }

  if (!dados.artigos.length) {
    lista.innerHTML = '<p class="admin-ajuda">Nenhum artigo publicado pelo painel ainda.</p>';
    return;
  }

  lista.replaceChildren(
    ...dados.artigos.map((artigo) => {
      const linha = document.createElement('div');
      linha.className = 'admin-item';

      const info = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = artigo.titulo;
      const meta = document.createElement('span');
      meta.textContent = `${artigo.categoria} · ${artigo.data}`;
      info.append(titulo, meta);

      const abrir = document.createElement('a');
      abrir.href = `/blog/${artigo.slug}`;
      abrir.target = '_blank';
      abrir.rel = 'noopener';
      abrir.textContent = 'Abrir';

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'admin-remover';
      remover.textContent = 'Remover';
      remover.addEventListener('click', async () => {
        if (!window.confirm(`Remover "${artigo.titulo}" do blog? Isso tira a página do ar.`)) return;
        const r = await chamar({ acao: 'remover', token, slug: artigo.slug });
        if (r.ok) carregarLista();
      });

      linha.append(info, abrir, remover);
      return linha;
    }),
  );
}

/* -------------------------------------------------------------- prévia */

// Espelha a marcação aceita pelo servidor, para o autor ver antes de publicar.
document.querySelector('#previa')?.addEventListener('click', () => {
  const texto = document.querySelector('#corpo').value;
  previaCorpo.replaceChildren();

  let ul = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();

    if (!linha) {
      ul = null;
      continue;
    }

    if (linha.startsWith('## ')) {
      ul = null;
      const h = document.createElement('h2');
      h.textContent = linha.slice(3);
      previaCorpo.append(h);
    } else if (linha.startsWith('> ')) {
      ul = null;
      const q = document.createElement('blockquote');
      q.className = 'post-destaque';
      q.textContent = linha.slice(2);
      previaCorpo.append(q);
    } else if (linha.startsWith('- ')) {
      if (!ul) {
        ul = document.createElement('ul');
        ul.className = 'post-lista';
        previaCorpo.append(ul);
      }
      const li = document.createElement('li');
      li.textContent = linha.slice(2);
      ul.append(li);
    } else {
      ul = null;
      const p = document.createElement('p');
      p.textContent = linha;
      previaCorpo.append(p);
    }
  }

  previa.hidden = false;
  previa.scrollIntoView({ behavior: 'smooth' });
});
