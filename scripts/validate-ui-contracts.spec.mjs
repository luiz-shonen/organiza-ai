import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { scanDocumentationContract, scanUiContracts } from './validate-ui-contracts.mjs';

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

test('rejects legacy UI directive consumers, raw material usages, and feature-owned component appearance rules', async () => {
  const root = await createFixture({
    'src/app/features/demo/demo.component.ts':
      "import { OrgButtonDirective } from '../../shared/ui';\nimport { MatIconModule } from '@angular/material/icon';",
    'src/app/features/demo/demo.component.html':
      '<button orgButton="primary">Salvar</button>\n<mat-icon>star</mat-icon>\n<button mat-button>Clique</button>',
    'src/app/features/demo/demo.component.scss': `
      .mat-mdc-button { color: pink; }
      .demo {
        --mdc-outlined-text-field-outline-color: pink;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 9999px;
      }
    `,
  });

  try {
    const violations = await scanUiContracts(root);
    const codes = violations.map((violation) => violation.code);

    assert.deepEqual(codes, [
      'legacy-directive-import',
      'legacy-directive-selector',
      'feature-raw-material-tag',
      'feature-raw-material-button-attr',
      'feature-raw-material-module-import',
      'feature-material-selector',
      'feature-material-token',
      'feature-glass-rule',
      'feature-raw-box-shadow',
      'feature-raw-border-radius',
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

test('requires every closed public component to have recommended documentation and marks directives as legacy', async () => {
  const root = await createFixture({
    'src/app/shared/ui/index.ts': `
      export { OrgButtonComponent } from './actions/org-button.component';
      export { OrgButtonDirective } from './actions/org-button.directive';
    `,
    'DESIGN.md': '## Componentes\n### OrgButtonComponent\nUso recomendado: `<org-button />`',
  });

  try {
    assert.deepEqual(await scanDocumentationContract(root), [
      {
        code: 'documentation-legacy-directive',
        file: 'DESIGN.md',
        line: 1,
        message: 'Documente diretivas de compatibilidade como legadas e direcione novos usos ao componente fechado.',
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
