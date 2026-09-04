#!/usr/bin/env node

/**
 * Organiza AI — Create PR CLI
 *
 * Pushes the current branch and opens a Pull Request using the personal
 * GitHub CLI token (GH_TOKEN) without conflicting with corporate credentials.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

export const PROTECTED_BRANCHES = ['main', 'master'];
export const DEFAULT_REPO_URL = 'https://github.com/luiz-shonen/organiza-ai';

export function isProtectedBranch(branch) {
  return PROTECTED_BRANCHES.includes(branch);
}

export function parseEnvContent(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    const val = rest
      .join('=')
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (key && val) {
      result[key.trim()] = val;
    }
  }
  return result;
}

export function buildPrArgs(argv = []) {
  const prArgs = ['pr', 'create', '--fill'];
  const extraArgs = argv.filter((arg) => arg !== '--dry-run');
  if (extraArgs.length > 0) {
    prArgs.push(...extraArgs);
  }
  return prArgs;
}

export function buildCompareUrl(repoUrl = DEFAULT_REPO_URL, branch = 'HEAD') {
  return `${repoUrl}/compare/main...${encodeURIComponent(branch)}?expand=1`;
}

// 1. Load .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const parsed = parseEnvContent(readFileSync(fullPath, 'utf8'));
      for (const [key, val] of Object.entries(parsed)) {
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const personalToken = process.env.GH_TOKEN || process.env.GH_PERSONAL_TOKEN;
const isDryRun = process.argv.includes('--dry-run');

function run(cmd, envOverrides = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...envOverrides },
  }).trim();
}

export function main() {
  try {
    // 2. Validate current branch
    const currentBranch = run('git rev-parse --abbrev-ref HEAD');
    if (isProtectedBranch(currentBranch)) {
      console.error('❌ Erro: Você está na branch principal (' + currentBranch + ').');
      console.error(
        'Crie uma feature branch antes de abrir um PR (ex: git checkout -b feat/minha-feature).',
      );
      process.exit(1);
    }

    console.log(`📌 Branch atual: \x1b[36m${currentBranch}\x1b[0m`);

    // 3. Push branch to origin
    console.log('🚀 Enviando branch para o origin...');
    if (!isDryRun) {
      execSync(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });
    } else {
      console.log(`[dry-run] git push -u origin ${currentBranch}`);
    }

    // 4. Prepare GitHub CLI environment
    const ghEnv = personalToken ? { GH_TOKEN: personalToken } : {};

    // Check if gh is installed
    let hasGh = false;
    try {
      run('gh --version');
      hasGh = true;
    } catch {
      hasGh = false;
    }

    if (hasGh) {
      // Check if PR already exists
      try {
        const existingPr = run(`gh pr view ${currentBranch} --json url,title,state`, ghEnv);
        const prData = JSON.parse(existingPr);
        if (prData.state === 'OPEN') {
          console.log(`\n✅ PR já existente e aberto para esta branch:`);
          console.log(`🔗 \x1b[32m${prData.url}\x1b[0m\n`);
          process.exit(0);
        }
      } catch {
        // PR does not exist yet, proceed
      }

      console.log('📝 Criando Pull Request via GitHub CLI...');
      if (!isDryRun) {
        const prArgs = buildPrArgs(process.argv.slice(2));
        const prUrl = run(`gh ${prArgs.join(' ')}`, ghEnv);
        console.log(`\n🎉 Pull Request criado com sucesso!`);
        console.log(`🔗 \x1b[32m${prUrl}\x1b[0m\n`);
      } else {
        console.log(`[dry-run] gh pr create --fill`);
      }
    } else {
      // Fallback if gh is not installed
      const compareUrl = buildCompareUrl(DEFAULT_REPO_URL, currentBranch);
      console.log(`\nℹ️ GitHub CLI não encontrado. Você pode abrir o PR pelo link abaixo:`);
      console.log(`🔗 \x1b[34m${compareUrl}\x1b[0m\n`);
    }
  } catch (err) {
    console.error('\n❌ Falha ao criar Pull Request:');
    console.error(err.message || err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
