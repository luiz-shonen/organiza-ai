#!/usr/bin/env node

/**
 * Organiza AI — Gemini PR Code Reviewer
 *
 * Automates pull request code reviews using Google Gemini.
 * Evaluates compliance with AGENTS.md, DESIGN.md, CONTEXT.md,
 * and relevant feature specifications in .specs/features/.
 *
 * Rules:
 * - Automatic review runs only once per PR (on initial creation or first run).
 * - Subsequent updates require explicit '/review' in PR comments.
 * - Notice about '/review' is posted at most once to prevent comment spam.
 * - Categorizes findings with industry standard priority: P1, P2, P3.
 * - Formats out-of-scope improvements as structured TLC Spec-Driven issue drafts (EARS).
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

export const REVIEW_COMMENT_MARKER = '<!-- organiza-ai-gemini-review -->';
export const NOTICE_COMMENT_MARKER = '<!-- organiza-ai-gemini-review-notice -->';

export const DEFAULT_REPOSITORY = 'luiz-shonen/organiza-ai';
export const DEFAULT_BASE_SHA = 'origin/main';
export const DEFAULT_HEAD_SHA = 'HEAD';

export const MAX_DIFF_CHAR_LIMIT = 250_000;
export const MAX_SPEC_CHAR_LIMIT = 40_000;

export const DIFF_EXCLUDES = [
  ':!package-lock.json',
  ':!*.png',
  ':!*.jpg',
  ':!*.jpeg',
  ':!*.svg',
  ':!*.webp',
  ':!*.ico',
  ':!e2e/screenshots',
];

export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
];

export const NOTICE_COMMENT_BODY = `${NOTICE_COMMENT_MARKER}
> ℹ️ **Este PR já possui uma revisão inicial do Gemini.**
> Para reavaliar novos commits ou alterações, envie \`/review\` nos comentários do PR.`;

export const ARCHITECTURAL_GUIDELINES = `
DIRETRIZES TÉCNICAS E ARQUITETURAIS MANDATÓRIAS (AGENTS.md & DESIGN.md):
1. Standalone Components Only — NgModules são terminantemente proibidos (AD-001).
2. OnPush Change Detection — Obrigatório em 100% dos componentes, sem exceção (AD-002).
3. Modern Control Flow — Usar exclusivamente @if, @for, @switch. Proibido *ngIf e *ngFor.
4. Angular Signals — Estado local com signal(), computed(), effect(), input(), output(), model(). RxJS apenas onde estritamente necessário (ex: Firestore streams convertidas com toSignal) (AD-003).
5. Design System Fechado — Features consomem exclusivamente os 32 componentes Org* de @shared/ui. ZERO tags brutas do Angular Material (<mat-icon>, <mat-button>, <mat-chip>, etc.) em templates de features (AD-039, AD-041, AD-044).
6. SCSS + BEM + Design Tokens — Proibido Tailwind, proibido !important, proibido cores hexadecimais literais (usar sempre var(--org-*)). Proibido box-shadow e border-radius hardcoded (usar var(--org-shadow-*) e var(--org-radius-*)).
7. Acessibilidade (WCAG 2.1 AA) — HTML semântico, atributos ARIA, alvos de toque primários >= 48px.
8. TypeScript Estrito — Proibido uso de "any". Tipos e interfaces explícitos.
9. Smart/Dumb Pattern — *.container.ts para estado e Firebase; *.component.ts para apresentação pura (inputs/outputs, zero business logic) (AD-011).
`;

export const DOMAIN_RULES = `
DOMÍNIO E REGRAS DE NEGÓCIO (CONTEXT.md):
- Verified RSVP: Presença exige identidade Google ou usuário autenticado; zero convidados anônimos no Firestore.
- Personal Family Roster: Convidados primários gerenciam membros da família com vínculo e cancelamento em cascata.
- Smart Rachadinha: Rateio transparente de custos por convidado com cópia de chave Pix em 1 clique.
- Co-Hosting & RBAC: Proprietário do evento vs colaboradores (gerenciamento compartilhado).
- Celebração & Atmosfera: Cores vibrantes (#ff4d94, #ff8c42, #ffc837), confetes e temas sazonais automáticos por categoria de evento.
`;

export const TAXONOMY_GUIDELINES = `
TAXONOMIA DE PRIORIDADES DA INDÚSTRIA PARA ACHADOS (P1 / P2 / P3):
Classifique todos os apontamentos ou débitos encontrados rigorosamente de acordo com os níveis:
- 🔴 **P1 (Crítico / Bloqueante)**: Violações diretas de regras arquiteturais inegociáveis de AGENTS.md (falta de OnPush, uso de "any", tags brutas de Angular Material em features, bypass de segurança/auth, quebra de contratos de UI, regressão funcional). O PR NÃO deve ser mergeado sem corrigir estes itens.
- 🟡 **P2 (Importante / Débito Técnico)**: Violações de acessibilidade (WCAG 2.1 AA, touch targets < 48px, ARIA incompleto), desvios de convenção BEM, uso imperfeito de Signals, otimização de performance, cobertura de testes ausente em fluxo crítico.
- 🔵 **P3 (Sugestão / Menor / Nitpick)**: Melhorias cosméticas, legibilidade de código, nomenclatura de variáveis, sugestão de refatoração pontual ou documentação.
`;

export const OUT_OF_SCOPE_SPEC_GUIDELINES = `
PROPOSTAS FORA DO ESCOPO (TLC SPEC-DRIVEN):
Se você identificar um problema, oportunidade ou melhoria válida que esteja FORA do escopo do PR ou da especificação atual:
NÃO bloqueie o PR por causa disso. Em vez disso, adicione a seção exata:
#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)
Com uma especificação estruturada pronta para abertura de Issue no GitHub e para o desenvolvedor copiar o prompt para o seu agente:

Estrutura obrigatória da proposta:
##### [Título Sugerido no formato Conventional Commits, ex: feat(dashboard): permitir ordenação de convidados por presença]

- **Arquivos de Referência**:
  [Listar 1 a 3 caminhos de arquivos do PR onde a oportunidade foi identificada, ex: \`src/app/features/organizer/...\`]

- **Visão Geral e Importância (Valor & Motivação)**:
  [Explicação clara do problema ou oportunidade, e por que é importante implementar — valor de negócio, confiabilidade técnica ou UX.]

- **Limites de Escopo**:
  - **No Escopo**: [O que deve ser contemplado nesta issue]
  - **Fora do Escopo**: [O que NÃO deve ser incluído para evitar scope creep]

- **Critérios de Aceitação (Notação EARS - Easy Approach to Requirements Syntax)**:
  Cada critério DEVE conter a palavra "DEVE" ou "SHALL":
  * **Ubíquo (Invariante)**: O sistema DEVE [comportamento contínuo/invariante].
  * **Orientado a Evento**: QUANDO [gatilho/evento], o sistema DEVE [ação esperada].
  * **Condicional / Unwanted-behavior**: SE [condição de erro/limite], o sistema DEVE [resposta/fallback esperado].

- **Prompt Pronto para o Agente**:
\`\`\`text
Quero implementar a melhoria: [Título da Issue].
Contexto: Durante o review de [Arquivos de Referência], identificamos que [explicação objetiva do problema/necessidade]. Precisamos dessa melhoria para [o que deve ser feito e o benefício gerado].
Siga os critérios de aceitação:
- [Critério 1]
- [Critério 2]
- [Critério 3]
Quero apenas a fase Specify da skill tlc-spec-driven.
\`\`\`

Se não houver propostas fora do escopo com real relevância, omita completamente a seção "#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)".
`;

// ==========================================
// ENVIRONMENT & GIT HELPERS
// ==========================================

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        const val = rest
          .join('=')
          .trim()
          .replace(/^['"]|['"]$/g, '');
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadLocalEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY;
const PR_NUMBER = process.env.PR_NUMBER;
const BASE_SHA = process.env.BASE_SHA || DEFAULT_BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA || DEFAULT_HEAD_SHA;
const IS_ON_DEMAND = process.env.IS_ON_DEMAND === 'true';
const isDryRun = process.argv.includes('--dry-run') || !PR_NUMBER;

const CANDIDATE_MODELS = [process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean);

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch (err) {
    console.error(`Erro ao executar "${cmd}":`, err.message);
    return '';
  }
}

function getPRMetadata() {
  let prTitle = process.env.PR_TITLE || '';
  let prBody = process.env.PR_BODY || '';
  let headBranch = '';

  if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
    try {
      const eventData = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      prTitle = eventData.pull_request?.title || eventData.issue?.title || prTitle;
      prBody = eventData.pull_request?.body || eventData.comment?.body || prBody;
      headBranch = eventData.pull_request?.head?.ref || '';
    } catch {
      // Ignore JSON parse errors in event payload
    }
  }

  if (!headBranch) {
    headBranch = runGit('git rev-parse --abbrev-ref HEAD');
  }

  return { prTitle, prBody, headBranch };
}

function getGitDiff() {
  console.log(`🔍 Obtendo diff entre ${BASE_SHA} e ${HEAD_SHA}...`);
  const excludeArgs = DIFF_EXCLUDES.map((pattern) => `'${pattern}'`).join(' ');

  let diff = runGit(`git diff ${BASE_SHA}...${HEAD_SHA} -- . ${excludeArgs}`);
  if (!diff || diff.trim().length === 0) {
    diff = runGit(`git diff ${BASE_SHA}..${HEAD_SHA} -- . ${excludeArgs}`);
  }

  if (!diff || diff.trim().length === 0) {
    return null;
  }

  if (diff.length > MAX_DIFF_CHAR_LIMIT) {
    console.warn(
      `⚠️ Diff muito extenso. Truncando para os primeiros ${MAX_DIFF_CHAR_LIMIT} caracteres.`,
    );
    diff = `${diff.slice(0, MAX_DIFF_CHAR_LIMIT)}\n\n... [diff truncado por tamanho] ...`;
  }

  return diff;
}

export function findRelevantSpec(diffContent, branch, title, body, customSpecsDir = null) {
  const specsDir = customSpecsDir || resolve(process.cwd(), '.specs/features');
  if (!existsSync(specsDir)) return null;

  const features = readdirSync(specsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // A. Check if diff explicitly touches files in a spec directory
  for (const feature of features) {
    if (diffContent.includes(`.specs/features/${feature}`)) {
      const specPath = resolve(specsDir, feature, 'spec.md');
      if (existsSync(specPath)) {
        return { id: feature, path: specPath, content: readFileSync(specPath, 'utf8') };
      }
    }
  }

  // B. Check branch name, PR title, and PR body against spec names/numbers
  const combined = [branch, title, body].filter(Boolean).join(' ').toLowerCase();
  for (const feature of features) {
    const num = feature.match(/^(\d+)/)?.[1];
    const cleanName = feature.replace(/^\d+-/, '').toLowerCase();

    const isMatch =
      (num &&
        (combined.includes(`spec ${num}`) ||
          combined.includes(`spec #${num}`) ||
          combined.includes(`feature/${num}`) ||
          combined.includes(`feat/${num}`) ||
          combined.includes(`feat-${num}`) ||
          combined.includes(`feature-${num}`))) ||
      combined.includes(feature.toLowerCase()) ||
      (cleanName.length > 6 && combined.includes(cleanName));

    if (isMatch) {
      const specPath = resolve(specsDir, feature, 'spec.md');
      if (existsSync(specPath)) {
        return { id: feature, path: specPath, content: readFileSync(specPath, 'utf8') };
      }
    }
  }

  return null;
}
// ==========================================
// PROMPT BUILDERS
// ==========================================

export function buildSystemPrompt(relevantSpec) {
  const specSection = relevantSpec
    ? `#### 📑 Conformidade com a Spec: \`${relevantSpec.id}\`
- [ ] / [x] Critérios de Aceitação da Spec atendidos pelo diff
[Comentário objetivo sobre o alinhamento com a especificação]`
    : '';

  return `
Você é o Senior Angular Architect e Tech Lead do projeto Organiza AI (Angular 22+, Firebase Modular SDK, SCSS BEM, Glassmorphism).
Sua missão é realizar um Code Review minucioso e rigoroso do Pull Request, avaliando tanto a integridade técnica/arquitetural quanto o alinhamento com as regras de negócio e especificações de produto.

${ARCHITECTURAL_GUIDELINES}

${DOMAIN_RULES}

${TAXONOMY_GUIDELINES}

${OUT_OF_SCOPE_SPEC_GUIDELINES}

FORMATO MANDATÓRIO DA SUA RESPOSTA (em Português pt-BR):
${REVIEW_COMMENT_MARKER}
### 🤖 Organiza AI — Code Review pelo Gemini

#### 🎯 Veredito
[Escolha exatamente um: 🟢 **Aprovado** | 🟡 **Aprovado com Sugestões** | 🔴 **Atenção Requerida (Mudanças Necessárias)**]

#### 📋 Checklist Arquitetural
- [ ] / [x] **Standalone & OnPush**: Componentes standalone com ChangeDetectionStrategy.OnPush
- [ ] / [x] **Signals & Control Flow**: Signals e modern control flow (@if, @for)
- [ ] / [x] **Design System Primitives**: Apenas componentes Org* de @shared/ui (zero raw Material tags)
- [ ] / [x] **CSS Tokens & BEM**: Uso de tokens var(--org-*), sem hex cru e sem !important
- [ ] / [x] **Acessibilidade (WCAG 2.1 AA)**: Touch targets >= 48px, ARIA e semântica
- [ ] / [x] **TypeScript Strict**: Tipagem estrita com zero "any"

${specSection}

#### 🔍 Resumo das Alterações
[Resumo conciso do que foi implementado/alterado no PR e seu impacto no sistema]

#### 💡 Análise Detalhada e Feedback
[Agrupe os apontamentos por prioridade se houver achados:
- Se houver problemas críticos: 🔴 **[P1]** [Título do problema]: [Arquivo:Linha], explicação do risco e código corrigido sugerido.
- Se houver débitos técnicos: 🟡 **[P2]** [Título]: [Arquivo:Linha], explicação e recomendação.
- Se houver sugestões menores: 🔵 **[P3]** [Título]: sugestão.
Se não houver problemas em uma dada prioridade, não liste aquela categoria.
Destaque também pontos fortes e boas práticas adotadas.]

[Se aplicável, adicione a seção: #### 🚀 Proposta para Nova Issue (TLC Spec-Driven)]
`;
}

export function buildUserPrompt(diff, relevantSpec) {
  let prompt = `
Aqui está o git diff do Pull Request para análise:

\`\`\`diff
${diff}
\`\`\`
`;

  if (relevantSpec) {
    prompt += `
Abaixo está o conteúdo da especificação da feature (.specs/features/${relevantSpec.id}/spec.md) para você validar se os critérios de aceitação foram atendidos:

\`\`\`markdown
${relevantSpec.content.slice(0, MAX_SPEC_CHAR_LIMIT)}
\`\`\`
`;
  }

  prompt += `
Por favor, realize o code review completo e rigoroso, aplicando a taxonomia P1/P2/P3 e estruturando propostas fora do escopo no formato TLC Spec-Driven quando oportuno.
`;

  return prompt;
}

// ==========================================
// GEMINI API CALLER
// ==========================================

async function callGemini(systemInstruction, userPrompt) {
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`🤖 Tentando modelo ${model}...`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `⚠️ Modelo ${model} falhou com status ${response.status}: ${errorText.slice(0, 100)}`,
        );
        lastError = new Error(`Status ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const reviewMarkdown = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reviewMarkdown) {
        console.log(`✨ Review gerado com sucesso pelo modelo ${model}!`);
        return reviewMarkdown;
      }
    } catch (err) {
      console.warn(`⚠️ Erro de conexão com ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Nenhum modelo Gemini respondeu.');
}

// ==========================================
// GITHUB PR API CLIENT
// ==========================================

async function fetchPRComments(headers, repo, prNumber) {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Falha ao buscar comentários do PR: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function createPRComment(headers, repo, prNumber, body) {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao criar comentário: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function updatePRComment(headers, repo, commentId, body) {
  const url = `https://api.github.com/repos/${repo}/issues/comments/${commentId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao atualizar comentário: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function deletePRComment(headers, repo, commentId) {
  const url = `https://api.github.com/repos/${repo}/issues/comments/${commentId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok && res.status !== 404) {
    console.warn(`⚠️ Não foi possível remover comentário ${commentId}: ${res.status}`);
  }
}

// ==========================================
// TLC SPEC-DRIVEN ISSUE BUILDER
// ==========================================

export function parseIssueProposal(reviewMarkdown) {
  if (!reviewMarkdown || typeof reviewMarkdown !== 'string') return null;

  const marker = '#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)';
  const markerIdx = reviewMarkdown.indexOf(marker);
  if (markerIdx === -1) return null;

  const sectionContent = reviewMarkdown.slice(markerIdx + marker.length).trim();
  if (!sectionContent) return null;

  // Title can be in `##### <title>` or `**Título Sugerido**: <title>` or `**Título**: <title>`
  const titleMatch =
    sectionContent.match(/^#####\s+(.+)$/m) ||
    sectionContent.match(/\*\*Título(?:\s+Sugerido)?\*\*:\s*(.+)$/m);

  const rawTitle = titleMatch ? titleMatch[1].trim() : 'Melhoria fora do escopo (TLC Spec-Driven)';
  const title = rawTitle.replace(/^[`'"]|[`'"]$/g, '').trim();

  return {
    title,
    body: sectionContent,
  };
}

export async function createGitHubIssue(headers, repo, proposal, prNumber) {
  try {
    // Check for existing open or closed issues with the exact title to prevent duplicates
    const listUrl = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100`;
    const listRes = await fetch(listUrl, { headers });
    if (listRes.ok) {
      const existingIssues = await listRes.json();
      const existing = existingIssues.find(
        (issue) =>
          !issue.pull_request &&
          issue.title.trim().toLowerCase() === proposal.title.trim().toLowerCase(),
      );
      if (existing) {
        console.log(
          `ℹ️ Issue já existente para esta proposta (#${existing.number}): ${existing.html_url}`,
        );
        return { number: existing.number, url: existing.html_url, created: false };
      }
    }

    // Create the new issue
    const createUrl = `https://api.github.com/repos/${repo}/issues`;
    const bodyWithFooter = `${proposal.body}\n\n---\n*Criada automaticamente a partir da revisão do PR #${prNumber}*`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: proposal.title,
        body: bodyWithFooter,
        labels: ['enhancement', 'tlc-spec-driven', 'status: needs-spec'],
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.warn(`⚠️ Não foi possível criar issue no GitHub (${createRes.status}):`, errorText);
      return null;
    }

    const created = await createRes.json();
    console.log(`🚀 Issue criada com sucesso no GitHub (#${created.number}): ${created.html_url}`);
    return { number: created.number, url: created.html_url, created: true };
  } catch (err) {
    console.warn('⚠️ Erro ao criar issue no GitHub:', err.message);
    return null;
  }
}

// ==========================================
// MAIN ENTRYPOINT
// ==========================================

async function main() {
  try {
    if (!GEMINI_API_KEY) {
      console.error('❌ Erro: GEMINI_API_KEY não foi configurada.');
      process.exit(1);
    }

    const { prTitle, prBody, headBranch } = getPRMetadata();
    const diff = getGitDiff();

    if (!diff) {
      console.log('ℹ️ Nenhuma alteração de código encontrada no diff.');
      process.exit(0);
    }

    const relevantSpec = findRelevantSpec(diff, headBranch, prTitle, prBody);
    if (relevantSpec) {
      console.log(`📑 Especificação relevante detectada: \x1b[36m${relevantSpec.id}\x1b[0m`);
    } else {
      console.log('ℹ️ Nenhuma especificação de feature específica vinculada identificada.');
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'organiza-ai-gemini-reviewer',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    let existingReviewComment = null;
    let existingNoticeComment = null;

    if (!isDryRun && PR_NUMBER && GITHUB_TOKEN) {
      try {
        const comments = await fetchPRComments(headers, GITHUB_REPOSITORY, PR_NUMBER);
        existingReviewComment = comments.find((c) => c.body?.includes(REVIEW_COMMENT_MARKER));
        existingNoticeComment = comments.find((c) => c.body?.includes(NOTICE_COMMENT_MARKER));
      } catch (err) {
        console.warn('⚠️ Não foi possível verificar comentários existentes no PR:', err.message);
      }

      // Review Cadence Logic
      if (!IS_ON_DEMAND) {
        if (existingReviewComment) {
          if (existingNoticeComment) {
            console.log(
              `ℹ️ O PR #${PR_NUMBER} já possui revisão inicial e o aviso já foi postado. Aguardando comando /review.`,
            );
            process.exit(0);
          } else {
            console.log(
              `ℹ️ O PR #${PR_NUMBER} já possui revisão inicial. Postando aviso para uso do /review.`,
            );
            await createPRComment(headers, GITHUB_REPOSITORY, PR_NUMBER, NOTICE_COMMENT_BODY);
            console.log('✅ Aviso publicado no PR com sucesso.');
            process.exit(0);
          }
        }
      } else {
        // On-demand review: remove existing notice comment if present to keep conversation clean
        if (existingNoticeComment) {
          console.log(
            `🧹 Removendo aviso de /review anterior (ID: ${existingNoticeComment.id})...`,
          );
          await deletePRComment(headers, GITHUB_REPOSITORY, existingNoticeComment.id);
        }
      }
    }

    // Call Gemini API to generate the code review
    const systemPrompt = buildSystemPrompt(relevantSpec);
    const userPrompt = buildUserPrompt(diff, relevantSpec);
    let reviewMarkdown = await callGemini(systemPrompt, userPrompt);

    // Process out-of-scope TLC Spec-Driven issue proposal if suggested by Gemini
    const issueProposal = parseIssueProposal(reviewMarkdown);
    if (issueProposal) {
      if (isDryRun) {
        console.log(`\n💡 [Dry-run] Proposta de Issue detectada: "${issueProposal.title}"`);
      } else if (PR_NUMBER && GITHUB_TOKEN) {
        console.log(
          `💡 Proposta de Issue detectada: "${issueProposal.title}". Verificando / criando no GitHub...`,
        );
        const issueResult = await createGitHubIssue(
          headers,
          GITHUB_REPOSITORY,
          issueProposal,
          PR_NUMBER,
        );
        if (issueResult) {
          const statusText = issueResult.created
            ? 'Issue criada automaticamente no GitHub'
            : 'Issue vinculada no GitHub';
          const issueRefBadge = `\n\n> 📌 **${statusText}**: [#${issueResult.number} — ${issueProposal.title}](${issueResult.url})\n`;
          reviewMarkdown = reviewMarkdown.replace(
            '#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)',
            `#### 🚀 Proposta para Nova Issue (TLC Spec-Driven)${issueRefBadge}`,
          );
        }
      }
    }

    const reviewFooter = `\n\n---\n💡 *Dica: Esta revisão automática ocorre na criação do PR. Para reavaliar novos commits, comente \`/review\` no PR.*`;
    if (!reviewMarkdown.includes('💡 *Dica: Esta revisão automática ocorre')) {
      reviewMarkdown += reviewFooter;
    }

    // Output or publish to GitHub
    if (isDryRun) {
      console.log('\n--- REVIEW GERADO PELO GEMINI (MODO LOCAL / DRY-RUN) ---\n');
      console.log(reviewMarkdown);
      console.log('\n--------------------------------------------------------\n');
      return;
    }

    if (existingReviewComment) {
      console.log(
        `🔄 Atualizando comentário de review existente (ID: ${existingReviewComment.id})...`,
      );
      await updatePRComment(headers, GITHUB_REPOSITORY, existingReviewComment.id, reviewMarkdown);
      console.log('✅ Review do Gemini atualizado com sucesso no PR!');
    } else {
      console.log(`➕ Publicando novo comentário de review no PR #${PR_NUMBER}...`);
      await createPRComment(headers, GITHUB_REPOSITORY, PR_NUMBER, reviewMarkdown);
      console.log('✅ Review do Gemini publicado com sucesso no PR!');
    }
  } catch (err) {
    console.error('❌ Falha na execução do Gemini PR Review:');
    console.error(err);
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
