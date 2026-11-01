import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const LEGACY_DIRECTIVES = [
  'OrgButtonDirective',
  'OrgIconButtonDirective',
  'OrgChipDirective',
  'OrgSurfaceDirective',
  'OrgFormFieldDirective',
  'OrgFieldLabelDirective',
  'OrgFormGridDirective',
];

const LEGACY_SELECTOR =
  /\[(?:orgSurface|orgFormGrid)\]|\borg(?:Button|IconButton|Chip|FormField|FieldLabel)\b/;
const RAW_MATERIAL_TAG = /<mat-[a-z]/;
const RAW_MATERIAL_BUTTON_ATTR =
  /\bmat-(?:raised-button|flat-button|stroked-button|icon-button|fab|mini-fab|button|dialog-(?:title|content|actions|close))\b/;
// Any Angular Material import in a feature means a missing closed Org primitive (AD-041).
const RAW_MATERIAL_MODULE = /from\s+['"]@angular\/material(?:\/[\w-]+)?['"]/;
const MATERIAL_SELECTOR = /\.(?:mat|mdc)-[\w-]+/;
// Reading a Material semantic variable is not an ownership violation. Declaring
const MATERIAL_TOKEN = /(?:^|[;{]\s*)--(?:mdc|mat)-[\w-]+\s*:/m;
const FEATURE_GLASS_RULE = /(?:-webkit-)?backdrop-filter\s*:/;
const FEATURE_RAW_BOX_SHADOW =
  /box-shadow\s*:\s*(?!\s*(?:none|inherit|initial|unset|var\(--org-shadow|var\(--org-glass-shadow))\s*[^;]+;/;
const FEATURE_RAW_BORDER_RADIUS =
  /border-radius\s*:\s*(?!\s*(?:none|inherit|initial|unset|0|var\(--org-radius-|var\(--mat-))\s*[^;]+;/;
const COMPONENT_EXPORT = /export\s+\{\s*(Org\w+Component)\s*\}/g;
const DIRECTIVE_EXPORT = /export\s+\{\s*(Org\w+Directive)\s*\}/g;
const CODE_PRIORITY = new Map([
  ['legacy-directive-import', 0],
  ['legacy-directive-selector', 1],
  ['feature-raw-material-tag', 2],
  ['feature-raw-material-button-attr', 3],
  ['feature-raw-material-module-import', 4],
  ['feature-material-selector', 5],
  ['feature-material-token', 6],
  ['feature-glass-rule', 7],
  ['feature-raw-box-shadow', 8],
  ['feature-raw-border-radius', 9],
  ['undefined-token', 10],
  ['raw-typography', 11],
  ['raw-motion', 12],
  ['dark-mode-selector', 13],
  ['dead-mdc-token', 14],
  ['malformed-token-reference', 15],
]);

const TOKEN_REFERENCE = /var\(\s*(--org-[\w-]+)\s*([,)])/g;
const TOKEN_DECLARATION = /(--org-[\w-]+)\s*:/g;
const TOKEN_BINDING = /(?:style\.|['"`])(--org-[\w-]+)/g;
const SAFE_VALUE = String.raw`(?:inherit|initial|unset|normal|0|var\(|calc\(var\()`;
const RAW_TYPOGRAPHY = new RegExp(
  String.raw`(?:^|[;{\s])(?:font-size|font-weight|line-height|letter-spacing)\s*:\s*(?!\s*${SAFE_VALUE})[^;]+;`,
  'm',
);
const RAW_FONT_SHORTHAND = /(?:^|[;{\s])font\s*:\s*(?!\s*(?:inherit|initial|unset|var\())[^;]+;/m;
const RAW_MOTION = /(?:^|[;{\s])transition(?:-duration)?\s*:[^;]*?\b\d*\.?\d+m?s\b[^;]*;/m;
// Angular Material 19+ only reads --mat-* tokens; --mdc-* declarations are silently ignored.
const DEAD_MDC_TOKEN = /--mdc-[\w-]+\s*:/;
// A token name glued to another call, e.g. var(--org-motion-var(--org-motion-ease)), is invalid
// CSS that the undefined-token check cannot see because the name is never closed.
const MALFORMED_TOKEN_REFERENCE = /var\(\s*--org-[\w-]*\(/;
const DARK_MODE_SELECTOR = /\.dark\s*&|:host-context\(\s*\.dark\s*\)|html\.dark\b/;

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

function pathSegments(filePath) {
  return filePath.split(/[\\/]/);
}

/** The Design System and the app shell (src/app/app.*) are the only Material owners. */
function isSharedUi(filePath) {
  const segments = pathSegments(filePath);
  const isAppShell = segments.at(-2) === 'app' && segments.at(-1).startsWith('app.');
  return isAppShell || (segments.includes('shared') && segments.includes('ui'));
}

/** Token sources own every literal and every theme selector; nothing else may. */
function isTokenSource(filePath) {
  const segments = pathSegments(filePath);
  return segments.includes('ui') && segments.includes('tokens');
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

      // Specs may reach into Material internals (harnesses, directive queries).
      if (RAW_MATERIAL_MODULE.test(source) && !filePath.endsWith('.spec.ts')) {
        violations.push(
          makeViolation(
            root,
            'feature-raw-material-module-import',
            filePath,
            source,
            RAW_MATERIAL_MODULE,
            'Importe o componente fechado `@shared/ui` equivalente em vez do módulo Angular Material.',
          ),
        );
      }
    }

    if (filePath.endsWith('.html')) {
      if (LEGACY_SELECTOR.test(source)) {
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

      if (RAW_MATERIAL_TAG.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-raw-material-tag',
            filePath,
            source,
            RAW_MATERIAL_TAG,
            'Use um componente fechado Org (`<org-icon>`, `<org-chip>`, `<org-button>`, etc.) em vez de tags brutas do Angular Material.',
          ),
        );
      }

      if (RAW_MATERIAL_BUTTON_ATTR.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-raw-material-button-attr',
            filePath,
            source,
            RAW_MATERIAL_BUTTON_ATTR,
            'Use `<org-button>` ou `<org-icon-button>` em vez de diretivas de botão Material em `<button>`.',
          ),
        );
      }
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

      if (FEATURE_RAW_BOX_SHADOW.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-raw-box-shadow',
            filePath,
            source,
            FEATURE_RAW_BOX_SHADOW,
            'Use tokens padronizados (`var(--org-shadow-*)` ou `var(--org-glass-shadow)`) em vez de box-shadow manual.',
          ),
        );
      }

      if (FEATURE_RAW_BORDER_RADIUS.test(source)) {
        violations.push(
          makeViolation(
            root,
            'feature-raw-border-radius',
            filePath,
            source,
            FEATURE_RAW_BORDER_RADIUS,
            'Use tokens padronizados (`var(--org-radius-*)`) em vez de border-radius manual.',
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

/**
 * Scans every stylesheet and template under `src/` (Design System included)
 * for consistency rules: referenced tokens must exist, typography and motion
 * come from tokens, and dark mode is a token swap, never a selector.
 *
 * @param {string} root
 * @returns {Promise<UiContractViolation[]>}
 */
export async function scanStyleConsistency(root) {
  const files = (await listFiles(resolve(root, 'src'))).filter((filePath) =>
    /\.(?:scss|html|ts)$/.test(filePath),
  );
  const sources = new Map(
    await Promise.all(files.map(async (filePath) => [filePath, await readFile(filePath, 'utf8')])),
  );
  const declared = new Set();

  for (const [filePath, source] of sources) {
    const declaration = filePath.endsWith('.scss') ? TOKEN_DECLARATION : TOKEN_BINDING;
    for (const match of source.matchAll(declaration)) {
      declared.add(match[1]);
    }
  }

  const violations = [];
  for (const [filePath, source] of sources) {
    if (filePath.endsWith('.spec.ts')) {
      continue;
    }

    const reported = new Set();
    for (const [, token, terminator] of source.matchAll(TOKEN_REFERENCE)) {
      // A reference with a fallback is an optional component hook, not a missing token.
      if (terminator === ')' && !declared.has(token) && !reported.has(token)) {
        reported.add(token);
        violations.push(
          makeViolation(
            root,
            'undefined-token',
            filePath,
            source,
            new RegExp(String.raw`var\(\s*${token}\s*\)`),
            `O token ${token} não está definido em shared/ui/tokens.`,
          ),
        );
      }
    }

    if (MALFORMED_TOKEN_REFERENCE.test(source)) {
      violations.push(
        makeViolation(
          root,
          'malformed-token-reference',
          filePath,
          source,
          MALFORMED_TOKEN_REFERENCE,
          'Referência de token malformada: o nome do token não pode conter outra chamada.',
        ),
      );
    }

    if (filePath.endsWith('.scss') && DEAD_MDC_TOKEN.test(source)) {
      violations.push(
        makeViolation(
          root,
          'dead-mdc-token',
          filePath,
          source,
          DEAD_MDC_TOKEN,
          'O Angular Material atual ignora --mdc-*; use o token --mat-* equivalente.',
        ),
      );
    }

    if (!filePath.endsWith('.scss') || isTokenSource(filePath)) {
      continue;
    }

    for (const [code, expression, message] of [
      [
        'raw-typography',
        RAW_TYPOGRAPHY,
        'Use os tokens --org-font-size-*, --org-font-weight-*, --org-line-height-* e --org-letter-spacing-*.',
      ],
      [
        'raw-typography',
        RAW_FONT_SHORTHAND,
        'Use `font: inherit` ou um token --org-text-* no atalho `font`.',
      ],
      ['raw-motion', RAW_MOTION, 'Use os tokens --org-motion-* nas durações de transição.'],
      [
        'dark-mode-selector',
        DARK_MODE_SELECTOR,
        'Tema escuro é troca de tokens em shared/ui/tokens; não use seletores .dark em componentes.',
      ],
    ]) {
      if (expression.test(source)) {
        violations.push(makeViolation(root, code, filePath, source, expression, message));
      }
    }
  }

  return violations.sort((left, right) => {
    const priority = (CODE_PRIORITY.get(left.code) ?? 99) - (CODE_PRIORITY.get(right.code) ?? 99);
    return priority || left.file.localeCompare(right.file) || left.line - right.line;
  });
}

/**
 * Confirms the public barrel has a corresponding recommended-usage entry in
 * DESIGN.md and that compatibility directives are never presented as a new
 * authoring option.
 *
 * @param {string} root
 * @returns {Promise<UiContractViolation[]>}
 */
export async function scanDocumentationContract(root) {
  const indexPath = resolve(root, 'src', 'app', 'shared', 'ui', 'index.ts');
  const designPath = resolve(root, 'DESIGN.md');
  const [indexSource, designSource] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readFile(designPath, 'utf8'),
  ]);
  const componentExports = [...indexSource.matchAll(COMPONENT_EXPORT)].map((match) => match[1]);
  const directiveExports = [...indexSource.matchAll(DIRECTIVE_EXPORT)].map((match) => match[1]);
  const violations = [];

  for (const component of componentExports) {
    const section = designSource.match(new RegExp(`### ${component}\\b([\\s\\S]*?)(?=\\n### |$)`));
    if (!section || !section[1].includes('Uso recomendado')) {
      violations.push({
        code: 'documentation-component-usage',
        file: 'DESIGN.md',
        line: 1,
        message: `Documente ${component} com uma seção e "Uso recomendado".`,
      });
    }
  }

  const legacySection = designSource.match(
    /## APIs legadas de compatibilidade([\s\S]*?)(?=\n## |$)/,
  );
  const documentsLegacy = legacySection && legacySection[1].includes('Não usar em novo');
  if (
    !documentsLegacy ||
    directiveExports.some((directive) => !legacySection?.[1].includes(directive))
  ) {
    violations.push({
      code: 'documentation-legacy-directive',
      file: 'DESIGN.md',
      line: 1,
      message:
        'Documente diretivas de compatibilidade como legadas e direcione novos usos ao componente fechado.',
    });
  }

  return violations;
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
  const [uiViolations, styleViolations, documentationViolations] = await Promise.all([
    scanUiContracts(root),
    scanStyleConsistency(root),
    scanDocumentationContract(root),
  ]);
  const violations = [...uiViolations, ...styleViolations, ...documentationViolations];

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

// pathToFileURL keeps the entry check working with Windows paths too.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`validate-ui-contracts: ${error.message}`);
    process.exitCode = 1;
  });
}
