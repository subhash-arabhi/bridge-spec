// node --test tests/run.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { route, parseTasks, renderAgents } from '../skills/bridge/bin/bridge.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'skills/bridge/bin/bridge.mjs');
const ENV = { ...process.env, PATH: `${os.homedir()}/.local/bin:${process.env.PATH}` };

// ---- route table: [description, slot frame, expected tier]
const CASES = [
  ['fix typo in footer', { trivial: true }, 'T0'],
  ['change button color', { trivial: true }, 'T0'],
  ['bump config timeout value', { trivial: true, est_files: 1 }, 'T0'],
  ['simple UI change: reorder form fields', { existing_behavior: true, est_files: 2 }, 'T1'],
  ['backend bugfix: off-by-one in pagination', { existing_behavior: true }, 'T1'],
  ['add loading spinner to existing page', { existing_behavior: true }, 'T1'],
  ['refactor helper in one module', { est_files: 3 }, 'T1'],
  ['unflagged frame defaults to T1, never T0', {}, 'T1'],
  ['new API endpoint (single file still T2)', { new_capability: true, public_api_change: true, est_files: 1 }, 'T2'],
  ['add DB column', { schema_change: true }, 'T2'],
  ['user pastes a requirement/ticket', { explicit_requirement: true, existing_behavior: true }, 'T2'],
  ['cross-module change', { cross_module: true, existing_behavior: true }, 'T2'],
  ['vague feature request', { ambiguity: 'high' }, 'T2'],
  ['redesign workflow engine', { architecture: true }, 'T3'],
  ['multi-service feature with new capability', { multi_capability: true, new_capability: true }, 'T3'],
  ['"just do it" overrides a schema change', { schema_change: true, user_override: 'light' }, 'T1'],
  ['"spec it" upgrades a small change', { existing_behavior: true, user_override: 'full' }, 'T2'],
  ['"epic" override', { user_override: 'epic' }, 'T3'],
];
for (const [name, frame, want] of CASES) test(`route: ${name} → ${want}`, () => assert.equal(route(frame).tier, want));

test('route: active change resumes and never downgrades', () => {
  const r = route({ trivial: true, active_change: 'add-auth' });
  assert.equal(r.tier, 'resume'); assert.equal(r.change, 'add-auth');
});
test('route: T1 touching a specced requirement asks for a delta', () => {
  assert.equal(route({ existing_behavior: true, touches_specced_requirement: true }).spec_delta, true);
});
test('route: T0 loads nothing (zero extra tokens)', () => assert.equal(route({ trivial: true }).load, null));

// ---- tasks parser
const TASKS = `## 1. Core
- [x] 1.1 Add greet()
  - Files: \`src/greet.js\`
  - Test: \`test/greet.test.js\`
  - Size: mechanical
- [ ] 1.2 Wire CLI
  - Files: \`bin/cli.js\`
  - Test: \`test/cli.test.js\`

  - Steps: test → impl
## 2. Docs
- [ ] 2.1 README
  - Files: README.md
  - Test: n/a
`;
test('parseTasks: ids, status, size, block extent', () => {
  const t = parseTasks(TASKS);
  assert.deepEqual(t.map((x) => [x.id, x.done, x.size]), [['1.1', true, 'mechanical'], ['1.2', false, null], ['2.1', false, null]]);
  assert.ok(t[1].lines.join('\n').includes('Steps'));
  assert.equal(t[2].group, '2. Docs');
});

test('renderAgents: every template placeholder resolves for both tools', () => {
  const r = renderAgents(ROOT);
  for (const tool of ['claude', 'cursor']) for (const [f, txt] of Object.entries(r[tool])) {
    assert.ok(!/\{\{model:/.test(txt), `${tool}/${f} has unresolved placeholder`);
    assert.match(txt, /^---\nname: bridge-[a-z-]+\n/m, `${tool}/${f} frontmatter`);
  }
});

// ---- end-to-end fixture: open → plan → build artifacts → verify → archive
const run = (cwd, ...args) => spawnSync('node', [CLI, ...args], { cwd, encoding: 'utf8', env: ENV });
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', env: ENV });
const hasOpenspec = spawnSync('openspec', ['--version'], { env: ENV }).status === 0;

test('fixture: full T2 lifecycle with OpenSpec', { skip: !hasOpenspec && 'openspec CLI not installed' }, () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-fx-'));
  git(d, 'init', '-q'); git(d, 'config', 'user.email', 't@t'); git(d, 'config', 'user.name', 't');
  execFileSync('openspec', ['init', '--tools', 'none', '--no-animation'], { cwd: d, env: ENV, stdio: 'ignore' });
  execFileSync('openspec', ['new', 'change', 'add-greeting'], { cwd: d, env: ENV, stdio: 'ignore' });
  const c = path.join(d, 'openspec/changes/add-greeting');
  assert.equal(run(d, 'guard', 'open', 'add-greeting').status, 1, 'open guard must fail on empty change');

  fs.writeFileSync(path.join(c, 'proposal.md'), '## Why\nUsers need a greeting.\n\n## What Changes\n- Add greet(name).\n\nOut of scope: i18n.\n');
  fs.mkdirSync(path.join(c, 'specs/greeting'), { recursive: true });
  fs.writeFileSync(path.join(c, 'specs/greeting/spec.md'), '## ADDED Requirements\n\n### Requirement: Greet by name\nThe system SHALL return "Hello, <name>!" for a given name.\n\n#### Scenario: Named greeting\n- **WHEN** greet("Ada") is called\n- **THEN** it returns "Hello, Ada!"\n');
  const open = run(d, 'guard', 'open', 'add-greeting');
  assert.equal(open.status, 0, open.stdout + open.stderr);

  fs.writeFileSync(path.join(c, 'design.md'), '## Context\n' + 'A tiny pure function that formats a greeting string for a given name. '.repeat(5) + '\n## Decisions\nPure function, no I/O.\n');
  fs.writeFileSync(path.join(c, 'tasks.md'), '## 1. Core\n- [ ] 1.1 Add greet()\n  - Files: `greet.js`\n  - Test: `greet.test.js` — Named greeting\n  - Size: mechanical\n');
  const plan = run(d, 'guard', 'plan', 'add-greeting');
  assert.equal(plan.status, 0, plan.stdout + plan.stderr);

  fs.writeFileSync(path.join(d, 'README.md'), 'x\n'); git(d, 'add', '-A'); git(d, 'commit', '-qm', 'base');
  const base = git(d, 'rev-parse', 'HEAD').trim();
  assert.equal(run(d, 'state', 'add-greeting', '--set', `base=${base}`, 'tier=T2').status, 0);
  const brief = JSON.parse(run(d, 'brief', 'add-greeting', '1.1').stdout);
  assert.equal(brief.agent, 'bridge-mechanic');
  const btxt = fs.readFileSync(path.join(d, brief.brief), 'utf8');
  assert.match(btxt, /specs\/greeting\/spec\.md/); assert.match(btxt, /Add greet\(\)/);

  fs.writeFileSync(path.join(d, 'greet.js'), 'export const greet = (n) => `Hello, ${n}!`;\n');
  git(d, 'add', 'greet.js'); git(d, 'commit', '-qm', 'greet');
  const pkg = JSON.parse(run(d, 'review-pkg', 'add-greeting', base).stdout);
  assert.equal(pkg.commits, 1); assert.match(fs.readFileSync(path.join(d, pkg.package), 'utf8'), /Hello/);
  assert.equal(run(d, 'review-pkg', 'add-greeting', 'HEAD').status, 3, 'empty range rejected');

  assert.equal(run(d, 'guard', 'verify', 'add-greeting').status, 1, 'unchecked task blocks verify');
  fs.writeFileSync(path.join(c, 'tasks.md'), fs.readFileSync(path.join(c, 'tasks.md'), 'utf8').replace('- [ ]', '- [x]'));
  run(d, 'state', 'add-greeting', '--set', 'test_cmd=false');
  assert.equal(run(d, 'guard', 'verify', 'add-greeting').status, 1, 'failing tests block verify');
  run(d, 'state', 'add-greeting', '--set', 'test_cmd=true');
  const v = run(d, 'guard', 'verify', 'add-greeting');
  assert.equal(v.status, 0, v.stdout + v.stderr);

  execFileSync('openspec', ['archive', 'add-greeting', '-y'], { cwd: d, env: ENV, stdio: 'ignore' });
  const spec = fs.readFileSync(path.join(d, 'openspec/specs/greeting/spec.md'), 'utf8');
  assert.match(spec, /Greet by name/);
  fs.rmSync(d, { recursive: true, force: true });
});

test('state keys: dotted task ids nest as one id', async () => {
  const { setDeep } = await import('../skills/bridge/bin/bridge.mjs');
  const s = {};
  setDeep(s, 'task.1.1', 'done'); setDeep(s, 'task.1.1.base', 'abc'); setDeep(s, 'task.2.1.round', 2); setDeep(s, 'base', 'x');
  assert.deepEqual(s, { task: { '1.1': { status: 'done', base: 'abc' }, '2.1': { round: 2 } }, base: 'x' });
});
