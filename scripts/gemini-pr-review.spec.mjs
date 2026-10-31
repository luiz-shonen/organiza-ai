import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSystemPrompt,
  buildUserPrompt,
  REVIEW_COMMENT_MARKER,
  NOTICE_COMMENT_MARKER,
  NOTICE_COMMENT_BODY,
  FALLBACK_MODELS,
  GENERATION_CONFIG,
  ARCHITECTURAL_GUIDELINES,
  TAXONOMY_GUIDELINES,
  OUT_OF_SCOPE_SPEC_GUIDELINES,
  parseIssueProposal,
} from './gemini-pr-review.mjs';

test('gemini-pr-review: constants and markers are properly defined', () => {
  assert.equal(REVIEW_COMMENT_MARKER, '<!-- organiza-ai-gemini-review -->');
  assert.equal(NOTICE_COMMENT_MARKER, '<!-- organiza-ai-gemini-review-notice -->');
  assert.ok(NOTICE_COMMENT_BODY.includes(NOTICE_COMMENT_MARKER));
  assert.ok(NOTICE_COMMENT_BODY.includes('/review'));
  assert.deepEqual(FALLBACK_MODELS, ['gemini-3.8-flash', 'gemini-flash-latest']);
  assert.deepEqual(GENERATION_CONFIG, { thinkingConfig: { thinkingLevel: 'high' } });
  assert.ok(ARCHITECTURAL_GUIDELINES.includes('OnPush'));
  assert.ok(TAXONOMY_GUIDELINES.includes('P1 (Crítico / Bloqueante)'));
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('EARS'));
});

test('gemini-pr-review: buildSystemPrompt includes architectural rules and priority taxonomy', () => {
  const prompt = buildSystemPrompt();
  assert.ok(prompt.includes(REVIEW_COMMENT_MARKER));
  assert.ok(prompt.includes('P1 (Crítico / Bloqueante)'));
  assert.ok(prompt.includes('P2 (Importante / Débito Técnico)'));
  assert.ok(prompt.includes('P3 (Sugestão / Menor / Nitpick)'));
  assert.ok(prompt.includes('Proposta para Nova Issue (TLC Spec-Driven)'));
  assert.ok(!prompt.includes('Conformidade com a Spec:'));
});

test('gemini-pr-review: buildUserPrompt embeds the PR goal and the diff', () => {
  const diffSnippet = '+ const isReady = signal(true);';
  const prompt = buildUserPrompt(diffSnippet, {
    title: 'feat(rsvp): confirm family members in one tap',
    body: 'Acceptance: selecting "Selecionar Todos" confirms every member.',
  });
  assert.ok(prompt.includes(diffSnippet));
  assert.ok(prompt.includes('feat(rsvp): confirm family members in one tap'));
  assert.ok(prompt.includes('Selecionar Todos'));

  const withoutMetadata = buildUserPrompt(diffSnippet);
  assert.ok(withoutMetadata.includes('(sem descrição)'));
});

test('gemini-pr-review: parseIssueProposal parses structured TLC proposals', () => {
  const reviewWithH5 = `
### 🤖 Organiza AI — Code Review pelo Gemini
#### 🎯 Veredito
🟢 **Aprovado**

#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)
##### feat(event-editor): exportar lista de convidados em PDF

- **Visão Geral e Importância (Valor & Motivação)**:
  Organizadores precisam imprimir a lista de convidados para controle na portaria.

- **Limites de Escopo**:
  - **No Escopo**: Botão de exportação para PDF.
  - **Fora do Escopo**: Envio automático por WhatsApp.

- **Critérios de Aceitação (EARS)**:
  * QUANDO o usuário clicar em "Exportar PDF", o sistema DEVE baixar o documento formatado.

- **Prompt Pronto para Antigravity Agent (TLC Spec-Driven)**:
\`\`\`text
Atue como Senior Angular Architect e execute a skill tlc-spec-driven...
\`\`\`
`;

  const parsed = parseIssueProposal(reviewWithH5);
  assert.ok(parsed);
  assert.equal(parsed.title, 'feat(event-editor): exportar lista de convidados em PDF');
  assert.ok(parsed.body.includes('Visão Geral e Importância'));
  assert.ok(parsed.body.includes('QUANDO o usuário clicar em "Exportar PDF"'));

  const reviewWithField = `
#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)
**Título Sugerido**: refactor(signals): migrar formulário para signal-forms
- Conteúdo da proposta
`;
  const parsedField = parseIssueProposal(reviewWithField);
  assert.ok(parsedField);
  assert.equal(parsedField.title, 'refactor(signals): migrar formulário para signal-forms');
});

test('gemini-pr-review: parseIssueProposal returns null when section is absent or empty', () => {
  assert.equal(parseIssueProposal(null), null);
  assert.equal(parseIssueProposal(''), null);
  assert.equal(parseIssueProposal('### Review sem propostas fora do escopo'), null);
  assert.equal(
    parseIssueProposal('#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)\n   \n'),
    null,
  );
});

test('gemini-pr-review: OUT_OF_SCOPE_SPEC_GUIDELINES includes TLC EARS, reference files and prompt instructions', () => {
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('Visão Geral e Importância'));
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('Arquivos de Referência'));
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('Limites de Escopo'));
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('Critérios de Aceitação (Notação EARS'));
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('Prompt Pronto para o Agente'));
  assert.ok(
    OUT_OF_SCOPE_SPEC_GUIDELINES.includes('Quero apenas a fase Specify da skill tlc-spec-driven'),
  );
});
