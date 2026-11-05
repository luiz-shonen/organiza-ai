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
  ISSUE_PROPOSAL_MARKER,
  OUT_OF_SCOPE_ISSUE_GUIDELINES,
  parseIssueProposal,
  REQUEST_TIMEOUT_MS,
  ROUND_DELAYS_MS,
  callGemini,
} from './gemini-pr-review.mjs';

test('gemini-pr-review: constants and markers are properly defined', () => {
  assert.equal(REVIEW_COMMENT_MARKER, '<!-- organiza-ai-gemini-review -->');
  assert.equal(NOTICE_COMMENT_MARKER, '<!-- organiza-ai-gemini-review-notice -->');
  assert.ok(NOTICE_COMMENT_BODY.includes(NOTICE_COMMENT_MARKER));
  assert.ok(NOTICE_COMMENT_BODY.includes('/review'));
  assert.deepEqual(FALLBACK_MODELS, [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-flash-lite-latest',
  ]);
  assert.deepEqual(GENERATION_CONFIG, { thinkingConfig: { thinkingLevel: 'high' } });
  assert.ok(ARCHITECTURAL_GUIDELINES.includes('OnPush'));
  assert.ok(TAXONOMY_GUIDELINES.includes('P1 (Crítico / Bloqueante)'));
  assert.equal(ISSUE_PROPOSAL_MARKER, '#### 🚀 Proposta para Nova Issue');
});

test('gemini-pr-review: a hung call is cut off well inside the 25 min job', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 240_000);
  // Worst case: GEMINI_MODEL plus every fallback hangs once until the cap (a hung model is
  // dropped), on top of every round's wait.
  const waits = ROUND_DELAYS_MS.reduce((total, delay) => total + delay, 0);
  const worstCaseMs = (FALLBACK_MODELS.length + 1) * REQUEST_TIMEOUT_MS + waits;
  assert.ok(worstCaseMs < 23 * 60_000);
});

const fakeGemini = (answers) => {
  const calls = [];
  const request = async (model) => {
    calls.push(model);
    const next = answers[model]?.shift();
    return next ?? { error: new Error(`503 ${model}`), retryable: true };
  };
  return { calls, request };
};
const noWait = { delays: [30_000, 60_000], wait: async () => {} };

test('gemini-pr-review: callGemini falls back to the next model when one is overloaded', async () => {
  const { calls, request } = fakeGemini({ b: [{ review: 'ok from b' }] });
  assert.equal(await callGemini(['a', 'b', 'c'], request, noWait), 'ok from b');
  assert.deepEqual(calls, ['a', 'b']);
});

test('gemini-pr-review: callGemini retries overloaded models in rounds and drops the rest', async () => {
  const waits = [];
  const { calls, request } = fakeGemini({
    b: [{ error: new Error('404 b'), retryable: false }],
    a: [{ error: new Error('503 a'), retryable: true }, { review: 'ok from a' }],
  });
  const review = await callGemini(['a', 'b', 'c'], request, {
    delays: [30_000, 60_000],
    wait: async (ms) => waits.push(ms),
  });
  assert.equal(review, 'ok from a');
  assert.deepEqual(calls, ['a', 'b', 'c', 'a']);
  assert.deepEqual(waits, [30_000]);
});

test('gemini-pr-review: callGemini throws the last error when every round fails', async () => {
  const { calls, request } = fakeGemini({});
  await assert.rejects(callGemini(['a', 'b'], request, noWait), /503 b/);
  assert.deepEqual(calls, ['a', 'b', 'a', 'b', 'a', 'b']);
});

test('gemini-pr-review: buildSystemPrompt includes architectural rules and priority taxonomy', () => {
  const prompt = buildSystemPrompt();
  assert.ok(prompt.includes(REVIEW_COMMENT_MARKER));
  assert.ok(prompt.includes('P1 (Crítico / Bloqueante)'));
  assert.ok(prompt.includes('P2 (Importante / Débito Técnico)'));
  assert.ok(prompt.includes('P3 (Sugestão / Menor / Nitpick)'));
  assert.ok(prompt.includes(ISSUE_PROPOSAL_MARKER));
  assert.ok(!/TLC|Spec-Driven|EARS/.test(prompt));
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

test('gemini-pr-review: parseIssueProposal parses a test-first issue proposal', () => {
  const reviewWithH5 = `
### 🤖 Organiza AI — Code Review pelo Gemini
#### 🎯 Veredito
🟢 **Aprovado**

#### 🚀 Proposta para Nova Issue
##### feat(event-editor): exportar lista de convidados em PDF

- **Arquivos de referência**: \`src/app/features/organizer/event-editor/components/event-guests-card\`
- **Problema**: Organizadores precisam imprimir a lista de convidados para a portaria.
- **Objetivo**: Baixar a lista confirmada em PDF.
- **Critério de aceite**: Ao clicar em "Exportar PDF", o arquivo baixado lista todos os confirmados.
- **Teste que prova**: E2E que clica em "Exportar PDF" e verifica o download.
`;

  const parsed = parseIssueProposal(reviewWithH5);
  assert.ok(parsed);
  assert.equal(parsed.title, 'feat(event-editor): exportar lista de convidados em PDF');
  assert.ok(parsed.body.includes('Teste que prova'));
  assert.ok(parsed.body.includes('Ao clicar em "Exportar PDF"'));

  const reviewWithField = `
#### 🚀 Proposta para Nova Issue
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
  assert.equal(parseIssueProposal('#### 🚀 Proposta para Nova Issue\n   \n'), null);
});

test('gemini-pr-review: OUT_OF_SCOPE_ISSUE_GUIDELINES asks for a goal, an acceptance check and its test', () => {
  for (const field of [
    'Arquivos de referência',
    'Problema',
    'Objetivo',
    'Critério de aceite',
    'Teste que prova',
    'Prompt para o agente',
  ]) {
    assert.ok(OUT_OF_SCOPE_ISSUE_GUIDELINES.includes(field), field);
  }
  assert.ok(OUT_OF_SCOPE_ISSUE_GUIDELINES.includes('Comece pelo teste que prova o critério'));
  assert.ok(!/TLC|Spec-Driven|EARS|tlc-spec/.test(OUT_OF_SCOPE_ISSUE_GUIDELINES));
});
