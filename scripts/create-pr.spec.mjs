import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isProtectedBranch,
  parseEnvContent,
  buildPrArgs,
  buildCompareUrl,
  PROTECTED_BRANCHES,
  DEFAULT_REPO_URL,
} from './create-pr.mjs';

test('create-pr: isProtectedBranch detects main and master', () => {
  assert.equal(isProtectedBranch('main'), true);
  assert.equal(isProtectedBranch('master'), true);
  assert.equal(isProtectedBranch('feat/login'), false);
  assert.equal(isProtectedBranch('test/ai-code-review-flow'), false);
  assert.deepEqual(PROTECTED_BRANCHES, ['main', 'master']);
});

test('create-pr: parseEnvContent handles key-values, quotes and comments', () => {
  const sampleEnv = `
# Comment line
GH_TOKEN=ghp_secretToken123
FIREBASE_KEY="quoted-key-value"
APP_NAME='Organiza AI'
# Another comment
EMPTY_KEY=
`;

  const parsed = parseEnvContent(sampleEnv);
  assert.equal(parsed.GH_TOKEN, 'ghp_secretToken123');
  assert.equal(parsed.FIREBASE_KEY, 'quoted-key-value');
  assert.equal(parsed.APP_NAME, 'Organiza AI');
  assert.equal(parsed.EMPTY_KEY, undefined);
  assert.equal(parsed['# Comment line'], undefined);
});

test('create-pr: buildPrArgs filters dry-run and appends custom arguments', () => {
  assert.deepEqual(buildPrArgs([]), ['pr', 'create', '--fill']);
  assert.deepEqual(buildPrArgs(['--dry-run']), ['pr', 'create', '--fill']);
  assert.deepEqual(buildPrArgs(['--dry-run', '--title', 'My PR', '--draft']), [
    'pr',
    'create',
    '--fill',
    '--title',
    'My PR',
    '--draft',
  ]);
});

test('create-pr: buildCompareUrl builds URL with encoded branch name', () => {
  const url1 = buildCompareUrl(DEFAULT_REPO_URL, 'feat/new-button');
  assert.equal(
    url1,
    'https://github.com/luiz-shonen/organiza-ai/compare/main...feat%2Fnew-button?expand=1',
  );

  const url2 = buildCompareUrl('https://github.com/custom/repo', 'simple-branch');
  assert.equal(url2, 'https://github.com/custom/repo/compare/main...simple-branch?expand=1');
});
