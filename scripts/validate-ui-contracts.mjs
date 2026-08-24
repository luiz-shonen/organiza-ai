import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';

const LEGACY_DIRECTIVES = [
  'OrgButtonDirective',
  'OrgIconButtonDirective',
  'OrgChipDirective',
  'OrgSurfaceDirective',
  'OrgFormFieldDirective',
  'OrgFieldLabelDirective',
  'OrgFormGridDirective',
];

const LEGACY_SELECTOR = /\[(?:orgSurface|orgFormGrid)\]|\borg(?:Button|IconButton|Chip|FormField|FieldLabel)\b/;
const MATERIAL_SELECTOR = /\.(?:mat|mdc)-[\w-]+/;
const MATERIAL_TOKEN = /--(?:mdc|mat)-[\w-]+/;
const FEATURE_GLASS_RULE = /(?:-webkit-)?backdrop-filter\s*:/;
const CODE_PRIORITY = new Map([
  ['legacy-directive-import', 0],
  ['legacy-directive-selector', 1],
  ['feature-material-selector', 2],
  ['feature-material-token', 3],
  ['feature-glass-rule', 4],
]);

/** @typedef {{ code: string, file: string, line: number, message: string }} UiContractViolation */

async function listFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
      entries
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((entry) => {
          const filePath = join(directory, entry.name);
          return entry.isDirectory() ? listFiles(filePath) : [filePath];
        }),
    );

    return nested.flat();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function findLine(source, expression) {
  const match = source.match(expression);
  if (!match || match.index === undefined) {
    return 1;
  }

  return source.slice(0, match.index).split('\n').length;
}

function isSharedUi(filePath) {
  return filePath.split('/').includes('shared') && filePath.split('/').includes('ui');
}

function makeViolation(root, code, filePath, source, expression, message) {
  return {
    code,
    file: relative(root, filePath),
    line: findLine(source, expression),
    message,
  };
}

/**
 * Scans product consumers for contracts that bypass a closed Org component.
 * Reporting mode never fails the process; the CLI's --strict mode makes the
 * same findings a migration-completion gate.
 *
 * @param {string} root
 * @returns {Promise<UiContractViolation[]>}
 */
export async function scanUiContracts(root) {
  const appDirectory = resolve(root, 'src', 'app');
  const files = await listFiles(appDirectory);
  const violations = [];

  for (const filePath of files) {
    if (isSharedUi(filePath)) {
      continue;
    }

    const source = await readFile(filePath, 'utf8');

    if (filePath.endsWith('.ts')) {
      const legacyImport = new RegExp(`\\b(?:${LEGACY_DIRECTIVES.join('|')})\\b`);
      if (legacyImport.test(source)) {
        violations.push(
          makeViolation(
            root,
            'legacy-directive-import',
            filePath,
            source,
            legacyImport,
            'Importe o componente Org equivalente em vez de uma diretiva legada.',
          ),
        );
      }
    }

    if (filePath.endsWith('.html') && LEGACY_SELECTOR.test(source)) {
      violations.push(
        makeViolation(
          root,
          'legacy-directive-selector',
          filePath,
          source,
          LEGACY_SELECTOR,
          'Use um componente Org fechado em vez de um seletor de diretiva legada.',
        ),
      );
    }

    if (filePath.endsWith('.scss')) {
      if (MATERIAL_SELECTOR.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-material-selector',
            filePath,
            source,
            MATERIAL_SELECTOR,
            'Mova o seletor de aparência Angular Material para o componente Org proprietário.',
          ),
        );
      }

      if (MATERIAL_TOKEN.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-material-token',
            filePath,
            source,
            MATERIAL_TOKEN,
            'Mova o token Angular Material para o componente Org proprietário ou para tokens compartilhados.',
          ),
        );
      }

      if (FEATURE_GLASS_RULE.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-glass-rule',
            filePath,
            source,
            FEATURE_GLASS_RULE,
            'Use OrgSurface ou o componente Org proprietário para o tratamento de vidro.',
          ),
        );
      }
    }
  }

  return violations.sort((left, right) => {
    const priority = (CODE_PRIORITY.get(left.code) ?? 99) - (CODE_PRIORITY.get(right.code) ?? 99);
    return priority || left.file.localeCompare(right.file) || left.line - right.line;
  });
}

function parseArguments(args) {
  const options = { root: process.cwd(), strict: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--strict') {
      options.strict = true;
      continue;
    }

    if (argument === '--root') {
      const root = args[index + 1];
      if (!root) {
        throw new Error('O argumento --root exige um caminho.');
      }

      options.root = resolve(root);
      index += 1;
      continue;
    }

    throw new Error(`Argumento desconhecido: ${argument}`);
  }

  return options;
}

async function main() {
  const { root, strict } = parseArguments(process.argv.slice(2));
  const violations = await scanUiContracts(root);

  if (violations.length === 0) {
    console.log('validate-ui-contracts: 0 violation(s)');
    return;
  }

  for (const violation of violations) {
    console.log(`${violation.code}: ${violation.file}:${violation.line} — ${violation.message}`);
  }

  console.log(`validate-ui-contracts: ${violations.length} violation(s)`);
  if (strict) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`validate-ui-contracts: ${error.message}`);
    process.exitCode = 1;
  });
}
