import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { scanUiContracts } from './validate-ui-contracts.mjs';

async function createFixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'organiza-ui-contracts-'));

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const filePath = join(root, relativePath);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, content, 'utf8');
    }),
  );

  return root;
}

test('rejects legacy UI directive consumers and feature-owned component appearance rules', async () => {
  const root = await createFixture({
    'src/app/features/demo/demo.component.ts': "import { OrgButtonDirective } from '../../shared/ui';",
    'src/app/features/demo/demo.component.html': '<button orgButton="primary">Salvar</button>',
    'src/app/features/demo/demo.component.scss': `
      .mat-mdc-button { color: pink; }
      .demo { --mdc-outlined-text-field-outline-color: pink; backdrop-filter: blur(8px); }
    `,
  });

  try {
    const violations = await scanUiContracts(root);
    const codes = violations.map((violation) => violation.code);

    assert.deepEqual(codes, [
      'legacy-directive-import',
      'legacy-directive-selector',
      'feature-material-selector',
      'feature-material-token',
      'feature-glass-rule',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('permits component-owned appearance rules and a clean feature consumer', async () => {
  const root = await createFixture({
    'src/app/shared/ui/actions/org-button.component.scss': `
      .org-button { --mdc-filled-button-container-color: var(--org-primary); }
    `,
    'src/app/features/demo/demo.component.ts': "import { OrgButtonComponent } from '../../shared/ui';",
    'src/app/features/demo/demo.component.html': '<org-button label="Salvar" />',
    'src/app/features/demo/demo.component.scss': '.demo { display: grid; gap: 16px; }',
  });

  try {
    assert.deepEqual(await scanUiContracts(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
