import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMMENT_MARKER,
  buildComment,
  flattenReport,
  parseArgs,
  parseChangedLines,
  parseNameStatus,
  selectTests,
  slugify,
  videoName,
} from './e2e-changed-videos.mjs';

test('e2e-videos: parseArgs reads the command, flags and files', () => {
  assert.deepEqual(parseArgs([]), {
    command: 'record',
    base: 'origin/main',
    mobile: false,
    max: 25,
    files: [],
  });
  const options = parseArgs([
    'record',
    '--base',
    'origin/dev',
    '--mobile',
    '--max',
    '3',
    'e2e\\tests\\a.spec.ts',
  ]);
  assert.equal(options.base, 'origin/dev');
  assert.equal(options.mobile, true);
  assert.equal(options.max, 3);
  assert.deepEqual(options.files, ['e2e/tests/a.spec.ts']);
  assert.equal(parseArgs(['comment']).command, 'comment');
});

test('e2e-videos: parseChangedLines reads the new-file side of each hunk', () => {
  const diff = [
    '@@ -10,2 +10,3 @@ test(',
    '+a',
    '@@ -40 +41 @@',
    '-b',
    '+c',
    '@@ -60,4 +61,0 @@',
    '-gone',
  ].join('\n');
  assert.deepEqual(parseChangedLines(diff), [
    [10, 12],
    [41, 41],
    [61, 61],
  ]);
});

test('e2e-videos: parseNameStatus splits added from modified and drops deletions', () => {
  const output =
    'A\te2e/tests/new.spec.ts\nM\te2e/tests/old.spec.ts\nD\te2e/tests/gone.spec.ts\nR090\te2e/tests/a.spec.ts\te2e/tests/b.spec.ts\n';
  assert.deepEqual(parseNameStatus(output), {
    added: ['e2e/tests/new.spec.ts'],
    modified: ['e2e/tests/old.spec.ts', 'e2e/tests/b.spec.ts'],
  });
});

const listReport = {
  suites: [
    {
      title: 'invites/x.spec.ts',
      file: 'invites/x.spec.ts',
      specs: [],
      suites: [
        {
          title: 'Invites',
          file: 'invites/x.spec.ts',
          specs: [
            {
              title: 'first',
              file: 'invites/x.spec.ts',
              line: 10,
              tests: [{ projectName: 'demo', status: 'skipped', results: [] }],
            },
            {
              title: 'second',
              file: 'invites/x.spec.ts',
              line: 20,
              tests: [
                {
                  projectName: 'demo',
                  results: [
                    {
                      status: 'passed',
                      duration: 900,
                      attachments: [{ name: 'video', path: '/tmp/v.webm' }],
                    },
                  ],
                },
              ],
            },
            {
              title: 'third',
              file: 'invites/x.spec.ts',
              line: 30,
              tests: [{ projectName: 'demo', status: 'skipped', results: [] }],
            },
          ],
        },
      ],
    },
  ],
};

test('e2e-videos: flattenReport keeps the describe path, status and video', () => {
  const tests = flattenReport(listReport);
  assert.equal(tests.length, 3);
  assert.deepEqual(tests[1], {
    file: 'invites/x.spec.ts',
    line: 20,
    title: 'second',
    describe: ['Invites'],
    project: 'demo',
    status: 'passed',
    duration: 900,
    video: '/tmp/v.webm',
  });
});

test('e2e-videos: selectTests keeps the tests whose lines changed', () => {
  const tests = flattenReport(listReport);
  const titles = (changes) =>
    selectTests(tests, new Map([['invites/x.spec.ts', changes]])).map((t) => t.title);
  assert.deepEqual(titles([[22, 23]]), ['second']);
  assert.deepEqual(titles([[19, 20]]), ['first', 'second']);
  assert.deepEqual(titles([[35, 35]]), ['third']);
  assert.deepEqual(
    titles([[3, 3]]),
    ['first', 'second', 'third'],
    'a change above the first test touches all',
  );
  assert.deepEqual(titles('all'), ['first', 'second', 'third']);
  assert.deepEqual(selectTests(tests, new Map()), []);
});

test('e2e-videos: videoName is <area>-<title>, readable and unique', () => {
  const taken = new Set();
  const test1 = {
    file: 'invites/x.spec.ts',
    title: 'Início filter chips start on "Todos"',
    project: 'demo',
  };
  assert.equal(videoName(test1, taken), 'invites-inicio-filter-chips-start-on-todos');
  assert.equal(videoName(test1, taken), 'invites-inicio-filter-chips-start-on-todos-2');
  assert.equal(
    videoName({ ...test1, project: 'demo-mobile' }, taken),
    'invites-inicio-filter-chips-start-on-todos-mobile',
  );
  assert.equal(
    videoName({ file: 'smoke.spec.ts', title: 'Home renders', project: 'demo' }),
    'smoke-home-renders',
  );
  assert.ok(slugify('x'.repeat(200)).length <= 80);
});

test('e2e-videos: buildComment embeds the GIF and links the MP4 and artifact', () => {
  const manifest = {
    slowMo: 500,
    selected: 1,
    truncated: false,
    videos: [
      {
        file: 'invites/x.spec.ts',
        line: 20,
        title: 'second <b>',
        describe: ['Invites'],
        project: 'demo',
        status: 'passed',
        webm: 'invites-second-b.webm',
        mp4: 'invites-second-b.mp4',
        gif: 'invites-second-b.gif',
      },
    ],
  };
  const body = buildComment(manifest, {
    mediaBaseUrl: 'https://raw.example/pr-1/abc/',
    artifactUrl: 'https://github.com/a/b/actions/runs/1/artifacts/2',
    sha: 'abcdef1234',
  });
  assert.ok(body.startsWith(COMMENT_MARKER));
  assert.match(
    body,
    /✅ <b>Invites › second &lt;b&gt;<\/b> — `e2e\/tests\/invites\/x\.spec\.ts:20`/,
  );
  assert.match(body, /<img src="https:\/\/raw\.example\/pr-1\/abc\/invites-second-b\.gif"/);
  assert.match(body, /\(https:\/\/raw\.example\/pr-1\/abc\/invites-second-b\.mp4\)/);
  assert.match(body, /artifacts\/2\)/);
  assert.match(body, /at abcdef1\./);
});

test('e2e-videos: buildComment says so when no test changed', () => {
  const body = buildComment({ slowMo: 500, selected: 0, truncated: false, videos: [] });
  assert.match(body, /No test in `e2e\/tests\/` was added or changed/);
});
