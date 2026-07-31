# Decisões

## ADR-003 — Score único como narrativa editorial

**Status:** Aceito
**Data:** 2026-07-17

### Decisão

Organizar a landing em torno de um Score da Loja formado por três visões canônicas: Auditor Profissional, Cliente Real e Operação Interna. A IA é apresentada depois do Score, como camada de interpretação e priorização.

### Motivo

O posicionamento aprovado privilegia proteção da marca, identificação de riscos e ação priorizada, em vez de vender módulos independentes.

### Trade-offs

- Fórmula, pesos e disponibilidade operacional não são declarados sem confirmação comercial.
- O dashboard exibido é explicitamente ilustrativo e não representa acesso a dados em tempo real.

## ADR-001 — Site estático para HostGator

**Status:** Aceito  
**Data:** 2026-06-19

### Decisão

Usar HTML, CSS e JavaScript sem framework ou backend.

### Motivo

O escopo é institucional e precisa funcionar com baixo risco em hospedagem compartilhada. A solução reduz dependências, custo operacional e complexidade de deploy.

### Trade-offs

- Conteúdo editorial exige alteração em arquivo e novo upload.
- Não há CMS nesta fase.
- Integrações futuras que exigirem segredo deverão usar backend separado.

## ADR-002 — Adaptação inspirada, não clone literal

**Status:** Aceito  
**Data:** 2026-06-19

### Decisão

Replicar hierarquia, ritmo, composição e qualidade percebida da referência, mas usar apenas conteúdo, identidade e assets próprios da Observe Mais.

### Motivo

A referência é um site comercial de terceiro. Esta abordagem atende ao objetivo visual sem copiar logo, textos, personagem, cores ou arquivos proprietários.
