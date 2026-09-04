#!/usr/bin/env node

/**
 * Organiza AI — Firebase Anonymous Users Cleanup
 *
 * Scans Firebase Authentication for orphan/anonymous accounts
 * (users without email or auth providers) and safely deletes them.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'organiza-ai-3416f';
const TEMP_EXPORT_FILE = '/tmp/organiza_auth_cleanup.json';

// Protected emails that must NEVER be deleted
const PROTECTED_EMAILS = new Set([
  'luiz.gmr.dev@gmail.com',
  'jessica.calm.dev@gmail.com',
  'admin@organiza-ai.com',
  'admin@salaomaria.com',
  'test-organizer@example.com',
]);

function getFirebaseAccessToken() {
  const configPath = join(homedir(), '.config/configstore/firebase-tools.json');
  if (existsSync(configPath)) {
    try {
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
      if (cfg.tokens?.access_token) {
        return cfg.tokens.access_token;
      }
    } catch {}
  }
  return null;
}

async function deleteUser(uid, accessToken) {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ localId: uid }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha ao deletar ${uid}: ${errorText}`);
  }
}

async function main() {
  console.log('🔍 Iniciando verificação de usuários anônimos no Firebase Auth...');

  const token = getFirebaseAccessToken();
  if (!token) {
    console.error(
      '❌ Erro: Token de acesso do Firebase CLI não encontrado em ~/.config/configstore/firebase-tools.json.',
    );
    console.error('Execute "npx firebase login" para autenticar.');
    process.exit(1);
  }

  // 1. Export accounts
  console.log('📥 Exportando contas do Firebase Auth...');
  try {
    execSync(`npx firebase auth:export ${TEMP_EXPORT_FILE} --project ${PROJECT_ID} --format json`, {
      stdio: 'pipe',
    });
  } catch (err) {
    console.error('❌ Erro ao exportar usuários do Firebase:', err.message);
    process.exit(1);
  }

  let accounts = [];
  try {
    const data = JSON.parse(readFileSync(TEMP_EXPORT_FILE, 'utf8'));
    accounts = data.users || [];
  } catch (err) {
    console.error('❌ Erro ao ler arquivo temporário de usuários:', err.message);
    process.exit(1);
  } finally {
    if (existsSync(TEMP_EXPORT_FILE)) {
      try {
        unlinkSync(TEMP_EXPORT_FILE);
      } catch {}
    }
  }

  console.log(`📊 Total de contas no Firebase Auth: ${accounts.length}`);

  // 2. Identify anonymous users
  const anonymousUsers = accounts.filter((u) => {
    if (u.email && PROTECTED_EMAILS.has(u.email.toLowerCase())) {
      return false;
    }
    const hasProvider = Array.isArray(u.providerUserInfo) && u.providerUserInfo.length > 0;
    const hasEmail = Boolean(u.email && u.email.trim().length > 0);
    const hasPhone = Boolean(u.phoneNumber && u.phoneNumber.trim().length > 0);
    return !hasProvider && !hasEmail && !hasPhone;
  });

  const legitimateUsers = accounts.length - anonymousUsers.length;
  console.log(`🛡️ Contas legítimas/protegidas identificadas: ${legitimateUsers}`);
  console.log(`🧹 Contas anônimas a serem removidas: ${anonymousUsers.length}`);

  if (anonymousUsers.length === 0) {
    console.log('✨ Nenhuma conta anônima encontrada. O Firebase Auth está limpo!');
    process.exit(0);
  }

  // 3. Delete in batches with concurrency
  const BATCH_SIZE = 10;
  let deletedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < anonymousUsers.length; i += BATCH_SIZE) {
    const batch = anonymousUsers.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (user) => {
      try {
        await deleteUser(user.localId, token);
        deletedCount++;
      } catch (err) {
        errorCount++;
        console.warn(`⚠️ Erro ao remover usuário ${user.localId}:`, err.message);
      }
    });

    await Promise.all(promises);
    process.stdout.write(
      `\r🚀 Removidos: ${deletedCount}/${anonymousUsers.length} contas anônimas...`,
    );
  }

  console.log('\n');
  if (errorCount === 0) {
    console.log(`✅ Sucesso! Todas as ${deletedCount} contas anônimas foram removidas.`);
  } else {
    console.log(`⚠️ Concluído com ressalvas: ${deletedCount} removidas, ${errorCount} falhas.`);
  }
}

main();
