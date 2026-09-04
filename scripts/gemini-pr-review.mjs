#!/usr/bin/env node

/**
 * Organiza AI — Gemini PR Code Reviewer
 *
 * Runs code review on the Pull Request diff using Google Gemini,
 * strictly verifying compliance with AGENTS.md, DESIGN.md, and Angular 22 architecture.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 1. Load local env if available
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'luiz-shonen/organiza-ai';
const PR_NUMBER = process.env.PR_NUMBER;
const BASE_SHA = process.env.BASE_SHA || 'origin/main';
const HEAD_SHA = process.env.HEAD_SHA || 'HEAD';
const isDryRun = process.argv.includes('--dry-run') || !PR_NUMBER;

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash'
].filter(Boolean);

if (!GEMINI_API_KEY) {
  console.error('❌ Erro: GEMINI_API_KEY não foi configurada.');
  process.exit(1);
}

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch (err) {
    console.error(`Erro ao executar "${cmd}":`, err.message);
    return '';
  }
}

// 2. Obtain Git Diff
console.log(`🔍 Obtendo diff entre ${BASE_SHA} e ${HEAD_SHA}...`);
let diff = runGit(
  `git diff ${BASE_SHA}...${HEAD_SHA} -- . ':!package-lock.json' ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.svg' ':!*.webp' ':!*.ico' ':!e2e/screenshots'`
);

if (!diff || diff.trim().length === 0) {
  // Fallback to direct diff
  diff = runGit(
    `git diff ${BASE_SHA}..${HEAD_SHA} -- . ':!package-lock.json' ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.svg' ':!*.webp' ':!*.ico' ':!e2e/screenshots'`
  );
}

if (!diff || diff.trim().length === 0) {
  console.log('ℹ️ Nenhuma alteração de código encontrada no diff.');
  process.exit(0);
}

// Truncate if diff is colossal (> 250k chars)
if (diff.length > 250000) {
  console.warn('⚠️ Diff muito extenso. Truncando para os primeiros 250k caracteres.');
  diff = diff.slice(0, 250000) + '\n\n... [diff truncado por tamanho] ...';
}

// 3. Read AGENTS.md and DESIGN.md guidelines
let agentsMd = '';
let designMd = '';
try {
  if (existsSync('AGENTS.md')) agentsMd = readFileSync('AGENTS.md', 'utf8');
  if (existsSync('DESIGN.md')) designMd = readFileSync('DESIGN.md', 'utf8');
} catch (e) {
  console.warn('Aviso: Não foi possível ler arquivos de documentação:', e.message);
}

// 4. Construct Prompt
const systemInstruction = `
Você é o Senior Angular Architect do projeto Organiza AI (Angular 22+, Firebase Modular SDK, SCSS BEM, Glassmorphism).
Sua missão é realizar um Code Review minucioso e rigoroso do Pull Request, garantindo que NENHUMA regra arquitetural ou de acessibilidade seja violada.

REGRAS MANDATÓRIAS DO PROJETO (AGENTS.md e DESIGN.md):
1. Standalone Components Only — NgModules são terminantemente proibidos (AD-001).
2. OnPush Change Detection — Obrigatório em 100% dos componentes, sem exceção (AD-002).
3. Modern Control Flow — Usar exclusivamente @if, @for, @switch. Proibido *ngIf e *ngFor.
4. Angular Signals — Estado local com signal(), computed(), effect(), input(), output(), model(). RxJS apenas onde estritamente necessário (ex: Firestore streams convertidas com toSignal) (AD-003).
5. Design System Fechado — Features consomem exclusivamente os 32 componentes Org* de @shared/ui. ZERO tags brutas do Angular Material (<mat-icon>, <mat-button>, <mat-chip>, etc.) em templates de features (AD-039, AD-041, AD-044).
6. SCSS + BEM + Design Tokens — Proibido Tailwind, proibido !important, proibido cores hexadecimais literais (usar sempre var(--org-*)). Proibido box-shadow e border-radius hardcoded (usar var(--org-shadow-*) e var(--org-radius-*)).
7. Acessibilidade (WCAG 2.1 AA) — HTML semântico, atributos ARIA, alvos de toque primários >= 48px.
8. TypeScript Estrito — Proibido uso de "any". Tipos e interfaces explícitos.
9. Smart/Dumb Pattern — *.container.ts para estado e Firebase; *.component.ts para apresentação pura (inputs/outputs, zero business logic) (AD-011).

FORMATO DA SUA RESPOSTA (em Português pt-BR):
<!-- organiza-ai-gemini-review -->
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

#### 🔍 Resumo das Alterações
[Resumo conciso do que foi implementado/alterado no PR]

#### 💡 Análise Detalhada e Feedback
[Pontos fortes e, se houver violações ou sugestões de melhoria, aponte o arquivo, trecho de código e sugestão corrigida]
`;

const userPrompt = `
Aqui está o git diff do Pull Request para análise:

\`\`\`diff
${diff}
\`\`\`

Por favor, faça o code review completo seguindo estritamente as instruções acima.
`;

// 5. Call Gemini API with Fallback
async function callGemini() {
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
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Modelo ${model} falhou com status ${response.status}: ${errorText.slice(0, 100)}`);
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

// 6. Post Review to GitHub PR
async function postToGitHub(reviewContent) {
  if (isDryRun) {
    console.log('\n--- REVIEW GERADO PELO GEMINI (MODO LOCAL / DRY-RUN) ---\n');
    console.log(reviewContent);
    console.log('\n--------------------------------------------------------\n');
    return;
  }

  console.log(`📤 Enviando review para o PR #${PR_NUMBER} em ${GITHUB_REPOSITORY}...`);
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'organiza-ai-gemini-reviewer',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  const commentsUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments`;

  // Fetch existing comments to see if we should update or create
  let existingCommentId = null;
  try {
    const listRes = await fetch(commentsUrl, { headers });
    if (listRes.ok) {
      const comments = await listRes.json();
      const botComment = comments.find(
        (c) => c.body && c.body.includes('<!-- organiza-ai-gemini-review -->')
      );
      if (botComment) existingCommentId = botComment.id;
    }
  } catch (err) {
    console.warn('Não foi possível listar comentários existentes:', err.message);
  }

  if (existingCommentId) {
    console.log(`🔄 Atualizando comentário anterior (ID: ${existingCommentId})...`);
    const updateUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/comments/${existingCommentId}`;
    const patchRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body: reviewContent })
    });
    if (!patchRes.ok) {
      throw new Error(`Falha ao atualizar comentário: ${await patchRes.text()}`);
    }
  } else {
    console.log('➕ Criando novo comentário no PR...');
    const postRes = await fetch(commentsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: reviewContent })
    });
    if (!postRes.ok) {
      throw new Error(`Falha ao criar comentário: ${await postRes.text()}`);
    }
  }

  console.log('✅ Review do Gemini publicado com sucesso no PR!');
}

async function main() {
  try {
    const review = await callGemini();
    await postToGitHub(review);
  } catch (err) {
    console.error('❌ Falha na execução do Gemini PR Review:');
    console.error(err);
    process.exit(0);
  }
}

main();
