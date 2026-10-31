import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  findRelevantSpec,
  buildSystemPrompt,
  buildUserPrompt,
  REVIEW_COMMENT_MARKER,
  NOTICE_COMMENT_MARKER,
  NOTICE_COMMENT_BODY,
  FALLBACK_MODELS,
  ARCHITECTURAL_GUIDELINES,
  TAXONOMY_GUIDELINES,
  OUT_OF_SCOPE_SPEC_GUIDELINES,
  parseIssueProposal,
} from './gemini-pr-review.mjs';

async function createTempSpecsDir(specs) {
  const root = await mkdtemp(join(tmpdir(), 'organiza-specs-'));
  for (const [featureName, specContent] of Object.entries(specs)) {
    const featureDir = join(root, featureName);
    await mkdir(featureDir, { recursive: true });
    await writeFile(join(featureDir, 'spec.md'), specContent, 'utf8');
  }
  return root;
}

test('gemini-pr-review: constants and markers are properly defined', () => {
  assert.equal(REVIEW_COMMENT_MARKER, '<!-- organiza-ai-gemini-review -->');
  assert.equal(NOTICE_COMMENT_MARKER, '<!-- organiza-ai-gemini-review-notice -->');
  assert.ok(NOTICE_COMMENT_BODY.includes(NOTICE_COMMENT_MARKER));
  assert.ok(NOTICE_COMMENT_BODY.includes('/review'));
  assert.ok(FALLBACK_MODELS.includes('gemini-3.8-flash'));
  assert.ok(FALLBACK_MODELS.includes('gemini-3.5-flash'));
  assert.ok(ARCHITECTURAL_GUIDELINES.includes('OnPush'));
  assert.ok(TAXONOMY_GUIDELINES.includes('P1 (Crítico / Bloqueante)'));
  assert.ok(OUT_OF_SCOPE_SPEC_GUIDELINES.includes('EARS'));
});

test('gemini-pr-review: findRelevantSpec detects spec from diff path', async () => {
  const specsDir = await createTempSpecsDir({
    '01-home-theming': '# Spec 01: Home Theming',
    '02-auth-guards': '# Spec 02: Auth Guards',
  });

  try {
    const diff =
      'diff --git a/.specs/features/01-home-theming/spec.md b/.specs/features/01-home-theming/spec.md';
    const result = findRelevantSpec(diff, 'feat/unrelated', 'Some Title', 'Some Body', specsDir);

    assert.ok(result);
    assert.equal(result.id, '01-home-theming');
    assert.equal(result.content, '# Spec 01: Home Theming');
  } finally {
    await rm(specsDir, { recursive: true, force: true });
  }
});

test('gemini-pr-review: findRelevantSpec detects spec from branch name or PR title', async () => {
  const specsDir = await createTempSpecsDir({
    '03-event-lifecycle': '# Spec 03: Event Lifecycle',
  });

  try {
    const matchByBranch = findRelevantSpec('', 'feature/03-event-lifecycle', '', '', specsDir);
    assert.ok(matchByBranch);
    assert.equal(matchByBranch.id, '03-event-lifecycle');

    const matchByTitle = findRelevantSpec(
      '',
      'feat/xyz',
      'feat(core): implement spec 03 criteria',
      '',
      specsDir,
    );
    assert.ok(matchByTitle);
    assert.equal(matchByTitle.id, '03-event-lifecycle');

    const noMatch = findRelevantSpec(
      '',
      'feat/unrelated',
      'refactor: minor cleanups',
      '',
      specsDir,
    );
    assert.equal(noMatch, null);
  } finally {
    await rm(specsDir, { recursive: true, force: true });
  }
});

test('gemini-pr-review: buildSystemPrompt includes architectural rules, priority taxonomy, and spec section', () => {
  const promptWithoutSpec = buildSystemPrompt(null);
  assert.ok(promptWithoutSpec.includes(REVIEW_COMMENT_MARKER));
  assert.ok(promptWithoutSpec.includes('P1 (Crítico / Bloqueante)'));
  assert.ok(promptWithoutSpec.includes('P2 (Importante / Débito Técnico)'));
  assert.ok(promptWithoutSpec.includes('P3 (Sugestão / Menor / Nitpick)'));
  assert.ok(promptWithoutSpec.includes('Proposta para Nova Issue (TLC Spec-Driven)'));
  assert.ok(!promptWithoutSpec.includes('Conformidade com a Spec:'));

  const promptWithSpec = buildSystemPrompt({ id: '04-guest-rsvp' });
  assert.ok(promptWithSpec.includes('Conformidade com a Spec: `04-guest-rsvp`'));
});

test('gemini-pr-review: buildUserPrompt embeds diff and spec content', () => {
  const diffSnippet = '+ const isReady = signal(true);';
  const userPromptNoSpec = buildUserPrompt(diffSnippet, null);
  assert.ok(userPromptNoSpec.includes(diffSnippet));
  assert.ok(!userPromptNoSpec.includes('Abaixo está o conteúdo da especificação'));

  const userPromptWithSpec = buildUserPrompt(diffSnippet, {
    id: '04-guest-rsvp',
    content: '### User Story 1\nAcceptance criteria in EARS format.',
  });
  assert.ok(userPromptWithSpec.includes(diffSnippet));
  assert.ok(userPromptWithSpec.includes('.specs/features/04-guest-rsvp/spec.md'));
  assert.ok(userPromptWithSpec.includes('Acceptance criteria in EARS format.'));
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
