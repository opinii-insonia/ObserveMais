/**
 * Cifra e decifra o conteúdo dos leads.
 *
 * POR QUE ISTO EXISTE
 *
 * O armazenamento privado da Vercel exige um Blob store criado como privado. O
 * store do projeto é público, e criar um segundo store só para leads obrigaria a
 * gerenciar dois tokens.
 *
 * A saída é gravar no store público com o conteúdo cifrado. O endereço já nasce
 * imprevisível, mas endereço difícil de adivinhar não é privacidade: basta uma
 * URL vazar em um log para o lead ficar exposto. Cifrado, o arquivo é inútil sem
 * a chave — que vive apenas em variável de ambiente.
 *
 * AES-256-GCM: além de cifrar, autentica. Um arquivo adulterado falha ao abrir
 * em vez de devolver dado corrompido silenciosamente.
 */
import crypto from 'node:crypto';

const MARCA = 'omv1'; // versão do formato, para permitir troca de esquema depois

function chave() {
  // Chave dedicada quando existir; senão deriva do segredo já configurado, para
  // não exigir mais uma variável antes de a proteção começar a valer.
  const base = process.env.LEADS_CHAVE || process.env.BLOG_ADMIN_SEGREDO || process.env.BLOG_ADMIN_SENHA;
  if (!base) return null;
  return crypto.createHash('sha256').update(`lead-cofre:${base}`).digest();
}

export function cofreAtivo() {
  return chave() !== null;
}

export function cifrar(objeto) {
  const segredo = chave();
  const texto = JSON.stringify(objeto);

  // Sem chave configurada, grava em claro em vez de perder o lead. A resposta da
  // API avisa disso para o problema não passar despercebido.
  if (!segredo) return { conteudo: texto, cifrado: false };

  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv('aes-256-gcm', segredo, iv);
  const dados = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);

  return {
    conteudo: [MARCA, iv.toString('base64'), cifra.getAuthTag().toString('base64'), dados.toString('base64')].join('.'),
    cifrado: true,
  };
}

export function decifrar(conteudo) {
  const bruto = String(conteudo || '').trim();

  // Leads gravados antes da cifragem continuam legíveis.
  if (!bruto.startsWith(`${MARCA}.`)) return JSON.parse(bruto);

  const segredo = chave();
  if (!segredo) throw new Error('chave_ausente');

  const [, iv, tag, dados] = bruto.split('.');
  const decifra = crypto.createDecipheriv('aes-256-gcm', segredo, Buffer.from(iv, 'base64'));
  decifra.setAuthTag(Buffer.from(tag, 'base64'));

  const texto = Buffer.concat([decifra.update(Buffer.from(dados, 'base64')), decifra.final()]).toString('utf8');
  return JSON.parse(texto);
}
