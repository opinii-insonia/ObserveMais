// Lista arquivos de public/assets que a landing não referencia.
// Diagnóstico apenas: não apaga nada.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const used = new Set(
  [...html.matchAll(/(?:src|href|content)="[^"]*?(public\/assets\/[^"]+)"/g)].map((m) => m[1]),
);

const all = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name).split('\\').join('/');
    if (entry.isDirectory()) walk(full);
    else all.push(full);
  }
})('public/assets');

const unused = all.filter((f) => !used.has(f));
const bytes = unused.reduce((sum, f) => sum + statSync(f).size, 0);

console.log(`referenciados : ${used.size}`);
console.log(`sem uso       : ${unused.length}  (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
for (const f of unused.sort((a, b) => statSync(b).size - statSync(a).size).slice(0, 12)) {
  console.log(`  ${String(Math.round(statSync(f).size / 1024)).padStart(5)}KB  ${f}`);
}
