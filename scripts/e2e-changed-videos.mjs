#!/usr/bin/env node

/**
 * Organiza AI — videos of the E2E tests a branch adds or changes
 *
 *   node scripts/e2e-changed-videos.mjs [record] [--base origin/main] [--mobile] [--max 25] [files...]
 *   node scripts/e2e-changed-videos.mjs comment
 *
 * `record` (default) diffs e2e/tests against the merge base with --base (committed and
 * uncommitted changes, plus untracked spec files), keeps the tests whose lines changed (every
 * test of a new file, or of a file whose shared code above the first test changed), runs them in
 * the slowed-down, recorded `demo` project (E2E_DEMO=1, see playwright.config.ts) and copies each
 * video to e2e-videos/<area>-<test-title>.webm, with e2e-videos/manifest.json describing them.
 * When ffmpeg is on the PATH it also writes an .mp4 and a small .gif of each video.
 *
 * `comment` posts or updates one PR comment listing those tests, with the GIFs inline and links
 * to the MP4 and the workflow artifact. It reads GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER,
 * HEAD_SHA, MEDIA_BASE_URL (where the media were published) and ARTIFACT_URL.
 *
 * See docs/knowledge/decisions/testing.md.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const TESTS_DIR = 'e2e/tests';
export const OUT_DIR = 'e2e-videos';
export const COMMENT_MARKER = '<!-- organiza-ai:e2e-videos -->';
export const DEFAULT_MAX_TESTS = 25;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLAYWRIGHT_CLI = join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');

// ==========================================
// PURE HELPERS (unit tested)
// ==========================================

export function parseArgs(argv) {
  const options = {
    command: 'record',
    base: 'origin/main',
    mobile: false,
    max: DEFAULT_MAX_TESTS,
    files: [],
  };
  const args = [...argv];
  if (args[0] === 'record' || args[0] === 'comment') options.command = args.shift();
  while (args.length) {
    const arg = args.shift();
    if (arg === '--base') options.base = args.shift();
    else if (arg === '--mobile') options.mobile = true;
    else if (arg === '--max') options.max = Number(args.shift());
    else options.files.push(arg.replaceAll('\\', '/'));
  }
  return options;
}

/** Line ranges of the new file touched by a `git diff -U0` of one file. */
export function parseChangedLines(diff) {
  const ranges = [];
  for (const match of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    // A pure deletion (count 0) sits between lines: it touches the line after it.
    ranges.push(
      count === 0 ? [Math.max(start, 1), Math.max(start, 1)] : [start, start + count - 1],
    );
  }
  return ranges;
}

/** `git diff --name-status` lines → { added, modified } spec paths (deletions dropped). */
export function parseNameStatus(output) {
  const added = [];
  const modified = [];
  for (const line of output.split('\n')) {
    const [status, ...paths] = line.trim().split('\t');
    if (!status) continue;
    const path = paths.at(-1);
    if (status.startsWith('D')) continue;
    if (status.startsWith('A') || status.startsWith('C')) added.push(path);
    else modified.push(path);
  }
  return { added, modified };
}

/** Flattens a Playwright JSON report (list or run) into one entry per test and project. */
export function flattenReport(report) {
  const tests = [];
  const walk = (suite, titles) => {
    const path = suite.title && !suite.title.endsWith('.ts') ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.at(-1);
        tests.push({
          file: spec.file.replaceAll('\\', '/'),
          line: spec.line,
          title: spec.title,
          describe: path,
          project: test.projectName,
          status: result?.status ?? test.status,
          duration: result?.duration ?? 0,
          video: result?.attachments?.find((a) => a.name === 'video')?.path,
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child, path);
  };
  for (const suite of report.suites ?? []) walk(suite, []);
  return tests;
}

/**
 * Keeps the tests a change touches. A test spans from its line to the line before the next test
 * of the same file; a change above the first test (imports, helpers) touches every test.
 */
export function selectTests(tests, changes) {
  const selected = [];
  const byFile = Map.groupBy(tests, (test) => test.file);
  for (const [file, fileTests] of byFile) {
    const change = changes.get(file);
    if (!change) continue;
    if (change === 'all') {
      selected.push(...fileTests);
      continue;
    }
    const starts = [...new Set(fileTests.map((test) => test.line))].sort((a, b) => a - b);
    if (change.some(([from]) => from < starts[0])) {
      selected.push(...fileTests);
      continue;
    }
    for (const test of fileTests) {
      const next = starts.find((start) => start > test.line) ?? Infinity;
      if (change.some(([from, to]) => from < next && to >= test.line)) selected.push(test);
    }
  }
  return selected;
}

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

/** `<area>-<test-title>[-mobile]`, unique within `taken`. */
export function videoName(test, taken = new Set()) {
  const parts = test.file.split('/');
  const area = parts.length > 1 ? parts[0] : basename(parts[0]).replace(/\.spec\.ts$/, '');
  const suffix = test.project === 'demo-mobile' ? '-mobile' : '';
  const stem = `${slugify(area)}-${slugify(test.title)}${suffix}`;
  let name = stem;
  for (let n = 2; taken.has(name); n++) name = `${stem}-${n}`;
  taken.add(name);
  return name;
}

const STATUS_ICON = {
  passed: '✅',
  failed: '❌',
  timedOut: '⏱️',
  skipped: '⏭️',
  interrupted: '⚠️',
};

export function buildComment(manifest, { mediaBaseUrl, artifactUrl, sha } = {}) {
  const lines = [COMMENT_MARKER, '## 🎬 E2E videos of the tests this PR adds or changes', ''];
  if (!manifest.videos.length) {
    lines.push('No test in `e2e/tests/` was added or changed in this PR.');
    return lines.join('\n');
  }
  lines.push(
    `Recorded in the \`demo\` Playwright project (slowMo ${manifest.slowMo} ms, so each click can be followed)` +
      (sha ? ` at ${sha.slice(0, 7)}.` : '.'),
    '',
  );
  if (manifest.truncated) {
    lines.push(
      `> Only the first ${manifest.videos.length} of ${manifest.selected} changed tests were recorded.`,
      '',
    );
  }
  const url = (file) =>
    mediaBaseUrl && file ? `${mediaBaseUrl.replace(/\/$/, '')}/${file}` : undefined;
  for (const video of manifest.videos) {
    const title = [...video.describe, video.title].join(' › ');
    const where = `\`${TESTS_DIR}/${video.file}:${video.line}\`${video.project === 'demo-mobile' ? ' · Pixel 5' : ''}`;
    const icon = STATUS_ICON[video.status] ?? '❔';
    const mp4 = url(video.mp4);
    const gif = url(video.gif);
    lines.push(`<details><summary>${icon} <b>${escapeHtml(title)}</b> — ${where}</summary>`, '');
    if (gif)
      lines.push(
        `<img src="${gif}" alt="${escapeHtml(video.title)}" width="${video.project === 'demo-mobile' ? 320 : 640}">`,
        '',
      );
    if (mp4) lines.push(`[▶️ Full-quality MP4](${mp4})`, '');
    else if (!gif) lines.push(`Video \`${video.webm}\` is in the workflow artifact.`, '');
    lines.push('</details>');
  }
  if (artifactUrl)
    lines.push('', `📦 All original \`.webm\` videos: [workflow artifact](${artifactUrl})`);
  return lines.join('\n');
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// ==========================================
// GIT, PLAYWRIGHT AND FFMPEG
// ==========================================

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

/** Map of spec path (relative to e2e/tests) → 'all' | changed line ranges. */
function findChanges(base) {
  const mergeBase = git('merge-base', base, 'HEAD').trim();
  const { added, modified } = parseNameStatus(
    git('diff', '--name-status', mergeBase, '--', TESTS_DIR),
  );
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', TESTS_DIR)
    .split('\n')
    .filter(Boolean);
  const changes = new Map();
  const rel = (path) => posix.relative(TESTS_DIR, path);
  for (const path of [...added, ...untracked]) changes.set(rel(path), 'all');
  for (const path of modified) {
    changes.set(rel(path), parseChangedLines(git('diff', '-U0', mergeBase, '--', path)));
  }
  // A changed helper inside e2e/tests (e.g. visual-scenarios.ts) touches every spec importing it.
  for (const helper of [...changes.keys()].filter((path) => !path.endsWith('.spec.ts'))) {
    changes.delete(helper);
    const name = basename(helper).replace(/\.ts$/, '');
    let importers = [];
    try {
      importers = git(
        'grep',
        '-l',
        '-E',
        `from '.*/${name}'`,
        '--',
        `${TESTS_DIR}/*.spec.ts`,
      ).split('\n');
    } catch {
      // git grep exits 1 when nothing imports the helper.
    }
    for (const path of importers.filter(Boolean)) changes.set(rel(path), 'all');
  }
  return changes;
}

function playwright(args, reportFile, { quiet = false } = {}) {
  const result = spawnSync(process.execPath, [PLAYWRIGHT_CLI, 'test', ...args], {
    cwd: ROOT,
    stdio: quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit',
    env: { ...process.env, E2E_DEMO: '1', PLAYWRIGHT_JSON_OUTPUT_FILE: reportFile },
  });
  if (!existsSync(reportFile))
    throw new Error(`Playwright wrote no report (exit ${result.status}).`);
  return { status: result.status, report: JSON.parse(readFileSync(reportFile, 'utf8')) };
}

function hasFfmpeg() {
  return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}

function convert(webm, stem, width) {
  const ffmpeg = (...args) =>
    spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }).status === 0;
  const mp4 = `${stem}.mp4`;
  const gif = `${stem}.gif`;
  const okMp4 = ffmpeg(
    '-i',
    webm,
    // H.264 needs even dimensions; Pixel 5 is 393x851.
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '28',
    '-movflags',
    '+faststart',
    '-an',
    mp4,
  );
  const okGif = ffmpeg(
    '-i',
    webm,
    '-vf',
    `fps=6,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer`,
    gif,
  );
  return { mp4: okMp4 ? basename(mp4) : undefined, gif: okGif ? basename(gif) : undefined };
}

// ==========================================
// COMMANDS
// ==========================================

function record(options) {
  const outDir = join(ROOT, OUT_DIR);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const changes = options.files.length
    ? new Map(
        options.files.map((file) => [
          posix.relative(TESTS_DIR, file.replace(/^\.\//, '')) || file,
          'all',
        ]),
      )
    : findChanges(options.base);
  const projects = ['--project=demo', ...(options.mobile ? ['--project=demo-mobile'] : [])];
  const slowMo = Number(process.env['E2E_DEMO_SLOWMO'] ?? 500);
  const manifest = { slowMo, selected: 0, truncated: false, videos: [] };

  const specs = [...changes.keys()].filter((path) => path.endsWith('.spec.ts'));
  if (specs.length) {
    const list = playwright(
      ['--list', '--reporter=json', ...projects, ...specs.map((s) => `${TESTS_DIR}/${s}`)],
      join(outDir, 'list.json'),
      { quiet: true },
    );
    const desktop = flattenReport(list.report).filter((test) => test.project === 'demo');
    const selected = selectTests(desktop, changes);
    manifest.selected = selected.length;
    const chosen = selected.slice(0, options.max);
    manifest.truncated = chosen.length < selected.length;

    if (chosen.length) {
      const targets = [...new Set(chosen.map((test) => `${TESTS_DIR}/${test.file}:${test.line}`))];
      const run = playwright(
        ['--reporter=list,json', ...projects, ...targets],
        join(outDir, 'report.json'),
      );
      const ffmpeg = hasFfmpeg();
      if (!ffmpeg) console.log('ℹ️ ffmpeg not found: only the .webm videos are written.');
      const wanted = new Set(chosen.map((test) => `${test.file}:${test.line}`));
      const taken = new Set();
      for (const test of flattenReport(run.report)) {
        if (!wanted.has(`${test.file}:${test.line}`) || !test.video || !existsSync(test.video))
          continue;
        const name = videoName(test, taken);
        const webm = `${name}.webm`;
        copyFileSync(test.video, join(outDir, webm));
        const media = ffmpeg
          ? convert(
              join(outDir, webm),
              join(outDir, name),
              test.project === 'demo-mobile' ? 320 : 640,
            )
          : {};
        const { video: _video, ...entry } = test;
        manifest.videos.push({ ...entry, webm, ...media });
      }
      if (run.status !== 0) console.log('⚠️ Some recorded tests failed; their videos show where.');
    }
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`🎬 ${manifest.videos.length} video(s) in ${OUT_DIR}/`);
  for (const video of manifest.videos) console.log(`   ${video.webm}`);
}

async function comment() {
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA, MEDIA_BASE_URL, ARTIFACT_URL } =
    process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER)
    throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY and PR_NUMBER are required.');
  const manifest = JSON.parse(readFileSync(join(ROOT, OUT_DIR, 'manifest.json'), 'utf8'));
  const body = buildComment(manifest, {
    mediaBaseUrl: MEDIA_BASE_URL,
    artifactUrl: ARTIFACT_URL,
    sha: HEAD_SHA,
  });
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  const api = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
  const listed = await fetch(`${api}/issues/${PR_NUMBER}/comments?per_page=100`, { headers });
  if (!listed.ok)
    throw new Error(`Could not list PR comments: ${listed.status} ${await listed.text()}`);
  const existing = (await listed.json()).find((c) => c.body?.includes(COMMENT_MARKER));
  if (!existing && !manifest.videos.length) {
    console.log('No changed E2E tests and no previous comment: nothing to post.');
    return;
  }
  const res = existing
    ? await fetch(`${api}/issues/comments/${existing.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ body }),
      })
    : await fetch(`${api}/issues/${PR_NUMBER}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body }),
      });
  if (!res.ok) throw new Error(`Could not post the PR comment: ${res.status} ${await res.text()}`);
  console.log(`💬 ${existing ? 'Updated' : 'Posted'} ${(await res.json()).html_url}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  Promise.resolve(options.command === 'comment' ? comment() : record(options)).catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  });
}
