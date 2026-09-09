/**
 * Conversão do texto do painel em blocos de conteúdo.
 *
 * Módulo puro, sem dependência de armazenamento: é o que permite testar a
 * proteção contra injeção sem precisar do Blob.
 */
/**
 * Converte o texto do painel em blocos de conteúdo.
 *
 * Todo HTML digitado é escapado antes: o painel aceita apenas a marcação
 * simples abaixo, o que elimina a possibilidade de injetar script pela edição.
 *
 *   ## título          -> subtítulo
 *   - item             -> lista
 *   > texto            -> destaque
 *   linha em branco    -> novo parágrafo
 *   **negrito**        -> ênfase
 */
export function textoParaBlocos(texto) {
  const escapar = (t) =>
    String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const negrito = (t) => escapar(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  const blocos = [];
  let lista = null;

  const fecharLista = () => {
    if (lista?.length) blocos.push({ tipo: 'lista', itens: lista });
    lista = null;
  };

  for (const linhaBruta of String(texto || '').split(/\r?\n/)) {
    const linha = linhaBruta.trim();

    if (!linha) {
      fecharLista();
      continue;
    }

    if (linha.startsWith('## ')) {
      fecharLista();
      blocos.push({ tipo: 'h2', texto: negrito(linha.slice(3)) });
    } else if (linha.startsWith('> ')) {
      fecharLista();
      blocos.push({ tipo: 'destaque', texto: negrito(linha.slice(2)) });
    } else if (linha.startsWith('- ')) {
      lista = lista || [];
      lista.push(negrito(linha.slice(2)));
    } else {
      fecharLista();
      blocos.push({ tipo: 'p', texto: negrito(linha) });
    }
  }

  fecharLista();
  return blocos;
}
