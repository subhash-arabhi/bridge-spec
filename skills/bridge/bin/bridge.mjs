#!/usr/bin/env node
// bridge — zero-dependency helper CLI for the bridge skill (OpenSpec WHAT + Superpowers HOW + EGM).
// brief/review-pkg are re-implementations of ideas from obra/superpowers
// (skills/subagent-driven-development/scripts/task-brief, review-package; MIT).
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fs.realpathSync(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(path.dirname(SELF), '..');
const REPO_DIR = path.resolve(SKILL_DIR, '..', '..');
const HOME = process.env.BRIDGE_HOME || os.homedir();

const die = (msg, code = 1) => { process.stderr.write(`bridge: ${msg}\n`); process.exit(code); };
const out = (o) => process.stdout.write((typeof o === 'string' ? o : JSON.stringify(o, null, 2)) + '\n');
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const tryRun = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

function repoRoot() {
  try { return sh('git', ['rev-parse', '--show-toplevel']); } catch { return process.cwd(); }
}
function changeDir(id) { return path.join(repoRoot(), 'openspec', 'changes', id); }
function workDir(id, ...sub) {
  const d = path.join(repoRoot(), '.bridge', 'changes', id, ...sub);
  fs.mkdirSync(d, { recursive: true });
  return d;
}
const validId = (id) => { if (!id || !/^[a-z0-9][a-z0-9._-]*$/i.test(id)) die(`invalid change id: ${id ?? '(missing)'}`, 2); return id; };

// ---------------------------------------------------------------- route
// The agent proposes a slot frame; this function decides. Small file counts never waive steps.
export function route(f = {}) {
  const reasons = [];
  const ov = (f.user_override || '').toLowerCase();
  const map = { none: 0, trivial: 0, light: 1, small: 1, full: 2, spec: 2, epic: 3, design: 3 };
  if (f.active_change) {
    return { tier: 'resume', change: f.active_change, reasons: ['active change in progress: resume it, never downgrade'], load: 'reference/recovery.md' };
  }
  let tier;
  if (ov in map) { tier = map[ov]; reasons.push(`user override: ${ov}`); }
  else {
    const amb = f.ambiguity || 'low';
    const t3 = f.architecture || (f.multi_capability && (amb === 'high' || f.new_capability));
    const t2 = f.explicit_requirement || f.new_capability || f.public_api_change || f.schema_change || f.cross_module || f.multi_capability || amb === 'high';
    const t1 = f.existing_behavior || amb === 'medium' || (f.est_files ?? 1) > 1 || !f.trivial;
    if (t3) { tier = 3; reasons.push(f.architecture ? 'architecture/workflow design' : 'multiple capabilities with new capability or high ambiguity'); }
    else if (t2) {
      tier = 2;
      for (const k of ['explicit_requirement', 'new_capability', 'public_api_change', 'schema_change', 'cross_module', 'multi_capability']) if (f[k]) reasons.push(k);
      if (amb === 'high') reasons.push('high ambiguity');
    } else if (t1) { tier = 1; reasons.push(f.existing_behavior ? 'changes existing behavior' : 'small change'); }
    else { tier = 0; reasons.push('trivial edit'); }
  }
  const load = ['reference/tier-0-1-light.md', 'reference/tier-0-1-light.md', 'reference/tier-2-requirement.md', 'reference/tier-3-epic.md'][tier];
  const res = { tier: `T${tier}`, reasons, load };
  if (tier <= 1 && f.touches_specced_requirement) { res.spec_delta = true; reasons.push('alters an existing spec requirement: add a minimal OpenSpec delta + archive'); }
  if (tier === 0) res.load = null;
  return res;
}

// ---------------------------------------------------------------- state
function statePath(id) { return path.join(workDir(id), 'state.json'); }
export function readState(id) {
  const p = statePath(id);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { change: id, created: new Date().toISOString() };
}
// Keys like task.1.1, task.1.1.base, ruling.2.3 → { task: { "1.1": { status, base } } }.
// A run of numeric segments after the first segment is one id (task ids contain dots).
export function splitKey(key) {
  const p = key.split('.');
  const parts = [p[0]];
  let i = 1;
  if (/^\d+$/.test(p[1] ?? '')) { let id = p[1]; i = 2; while (/^\d+$/.test(p[i] ?? '')) id += '.' + p[i++]; parts.push(id); }
  return parts.concat(p.slice(i));
}
export function setDeep(obj, key, val) {
  const parts = splitKey(key);
  const idKey = parts.length === 2 && /^\d/.test(parts[1]);
  let o = obj;
  for (const k of parts.slice(0, -1)) {
    if (o[k] !== undefined && (typeof o[k] !== 'object' || o[k] === null)) o[k] = { status: o[k] };
    o = (o[k] ??= {});
  }
  const last = parts.at(-1);
  if (idKey && o[last] && typeof o[last] === 'object') o[last].status = val;
  else o[last] = val;
}
function parseVal(v) { try { return JSON.parse(v); } catch { return v; } }
function cmdState([id, ...rest]) {
  validId(id);
  const s = readState(id);
  const sets = rest.filter((a) => a !== '--set');
  if (sets.length) {
    for (const kv of sets) {
      const i = kv.indexOf('=');
      if (i < 1) die(`expected key=value, got ${kv}`, 2);
      setDeep(s, kv.slice(0, i), parseVal(kv.slice(i + 1)));
    }
    s.updated = new Date().toISOString();
    fs.writeFileSync(statePath(id), JSON.stringify(s, null, 2) + '\n');
  }
  out(s);
}

// ---------------------------------------------------------------- tasks
export function parseTasks(text) {
  const lines = text.split('\n');
  const tasks = [];
  let group = null, cur = null, inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const g = !inFence && line.match(/^##\s+(.*)/);
    const t = !inFence && line.match(/^(\s*)- \[([ xX])\]\s+(\d+(?:\.\d+)*)\b\s*(.*)$/);
    if (g) { group = g[1].trim(); cur = null; continue; }
    if (t) {
      cur = { id: t[3], done: t[2] !== ' ', title: t[4].trim(), group, indent: t[1].length, lines: [line] };
      tasks.push(cur);
      continue;
    }
    if (cur) {
      const ind = line.match(/^(\s*)/)[1].length;
      if (line.trim() === '' || ind > cur.indent) cur.lines.push(line);
      else cur = null;
    }
  }
  for (const t of tasks) {
    while (t.lines.length && t.lines.at(-1).trim() === '') t.lines.pop();
    const body = t.lines.join('\n');
    t.size = (body.match(/Size:\s*(mechanical|standard|complex)/i) || [])[1]?.toLowerCase() || null;
    t.hasFiles = /Files:/i.test(body);
    t.hasTest = /Test:/i.test(body);
  }
  return tasks;
}
function loadTasks(id) {
  const p = path.join(changeDir(id), 'tasks.md');
  if (!fs.existsSync(p)) die(`no tasks.md at ${p}`, 2);
  return parseTasks(fs.readFileSync(p, 'utf8'));
}
function listSpecs(id) {
  const dir = path.join(changeDir(id), 'specs');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.md')).map((f) => path.join('openspec/changes', id, 'specs', f));
}

function cmdBrief([id, taskId]) {
  validId(id);
  if (!taskId) die('usage: bridge brief <change-id> <task-id>', 2);
  const tasks = loadTasks(id);
  const t = tasks.find((x) => x.id === taskId);
  if (!t) die(`task ${taskId} not found in tasks.md; ids: ${tasks.map((x) => x.id).join(', ') || '(none)'}`, 3);
  const rel = (p) => path.relative(repoRoot(), p);
  const report = path.join(workDir(id, 'reports'), `task-${taskId}.md`);
  const read = ['proposal.md', 'design.md'].map((f) => path.join('openspec/changes', id, f)).filter((f) => fs.existsSync(path.join(repoRoot(), f)));
  const body = [
    `# Task ${t.id}: ${t.title}`,
    '',
    `Change: \`${id}\` — group: ${t.group ?? '(none)'}`,
    `Size: ${t.size ?? 'standard'}`,
    '',
    '## Read first (only these)',
    ...[...read, ...listSpecs(id)].map((f) => `- \`${f}\``),
    '',
    '## Task',
    t.lines.join('\n'),
    '',
    '## Report',
    `Write your report to \`${rel(report)}\` (Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED).`,
    'Do not tick tasks.md. Do not spawn subagents. Stay inside this task.',
    '',
  ].join('\n');
  const p = path.join(workDir(id, 'briefs'), `task-${taskId}.md`);
  fs.writeFileSync(p, body);
  out({ brief: rel(p), report: rel(report), size: t.size ?? 'standard', agent: t.size === 'mechanical' ? 'bridge-mechanic' : 'bridge-implementer' });
}

// ---------------------------------------------------------------- review package
function cmdReviewPkg([id, base, head = 'HEAD']) {
  validId(id);
  if (!base) die('usage: bridge review-pkg <change-id> <base> [head]', 2);
  const git = (...a) => sh('git', a);
  for (const r of [base, head]) if (tryRun('git', ['rev-parse', '--verify', '--quiet', `${r}^{commit}`]).status !== 0) die(`bad revision: ${r}`, 2);
  if (tryRun('git', ['merge-base', '--is-ancestor', base, head]).status !== 0) die(`${head} is not a descendant of ${base}`, 3);
  const n = Number(git('rev-list', '--count', `${base}..${head}`));
  if (!n) die(`empty commit range ${base}..${head}`, 3);
  const b7 = git('rev-parse', '--short=7', base), h7 = git('rev-parse', '--short=7', head);
  const text = [
    `# Review package ${b7}..${h7} (${id})`, '',
    '## Commits', git('log', '--oneline', `${base}..${head}`), '',
    '## Files changed', git('diff', '--stat', `${base}..${head}`), '',
    '## Diff', execFileSync('git', ['diff', '-U10', `${base}..${head}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }),
  ].join('\n');
  const p = path.join(workDir(id, 'reviews'), `${b7}..${h7}.diff`);
  fs.writeFileSync(p, text);
  out({ package: path.relative(repoRoot(), p), commits: n, bytes: Buffer.byteLength(text) });
}

// ---------------------------------------------------------------- guards
function openspecValidate(id) {
  const r = tryRun('openspec', ['validate', id, '--strict', '--no-interactive'], { cwd: repoRoot() });
  if (r.error) return 'openspec CLI not found (npm i -g --prefix ~/.local @fission-ai/openspec)';
  if (r.status !== 0) return `openspec validate ${id} --strict failed:\n${(r.stdout + r.stderr).trim()}`;
  return null;
}
function detectTestCmd(root) {
  const cfg = path.join(root, '.bridge', 'config.json');
  if (fs.existsSync(cfg)) { const c = JSON.parse(fs.readFileSync(cfg, 'utf8')); if (c.test_cmd) return c.test_cmd; }
  const pkg = path.join(root, 'package.json');
  if (fs.existsSync(pkg)) {
    const p = JSON.parse(fs.readFileSync(pkg, 'utf8'));
    if (p.scripts?.test && !/no test specified/.test(p.scripts.test)) return 'npm test --silent';
  }
  if (['pyproject.toml', 'pytest.ini', 'setup.cfg'].some((f) => fs.existsSync(path.join(root, f)))) return 'pytest -q';
  if (fs.existsSync(path.join(root, 'go.mod'))) return 'go test ./...';
  if (fs.existsSync(path.join(root, 'Cargo.toml'))) return 'cargo test';
  return null;
}
export function guard(phase, id) {
  const fails = [], warns = [];
  const dir = changeDir(id);
  const rd = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null);
  if (!fs.existsSync(dir)) return { ok: false, fails: [`no change dir openspec/changes/${id}`], warns };
  if (phase === 'open') {
    const prop = rd('proposal.md');
    if (!prop) fails.push('proposal.md missing');
    else for (const h of ['## Why', '## What Changes']) if (!prop.includes(h)) fails.push(`proposal.md lacks "${h}"`);
    const meta = rd('.openspec.yaml') || '';
    if (!listSpecs(id).length && !/skip_specs:\s*true/.test(meta)) fails.push('no delta specs (add specs/<capability>/spec.md or set skip_specs: true)');
    const v = openspecValidate(id); if (v) fails.push(v);
  } else if (phase === 'plan') {
    const design = rd('design.md');
    if (!design || design.trim().length < 200) fails.push('design.md missing or too thin (brainstorm output goes here)');
    if (!rd('tasks.md')) fails.push('tasks.md missing');
    else {
      const tasks = loadTasks(id);
      if (!tasks.length) fails.push('tasks.md has no "- [ ] N.N" tasks');
      for (const t of tasks) {
        if (!t.hasFiles) fails.push(`task ${t.id} lacks a Files: line`);
        if (!t.hasTest) fails.push(`task ${t.id} lacks a Test: line`);
        if (!t.size) warns.push(`task ${t.id} lacks Size: (defaults to standard)`);
      }
    }
  } else if (phase === 'verify') {
    const tasks = rd('tasks.md') ? loadTasks(id) : [];
    const open = tasks.filter((t) => !t.done);
    if (!tasks.length) fails.push('no tasks found');
    if (open.length) fails.push(`unchecked tasks: ${open.map((t) => t.id).join(', ')}`);
    const v = openspecValidate(id); if (v) fails.push(v);
    const st = readState(id);
    const cmd = st.test_cmd || detectTestCmd(repoRoot());
    if (!cmd) fails.push(`no test command found: bridge state ${id} --set test_cmd="..."`);
    else {
      const r = tryRun('sh', ['-c', cmd], { cwd: repoRoot(), maxBuffer: 64 * 1024 * 1024 });
      if (r.status !== 0) fails.push(`tests failed (${cmd}):\n${(r.stdout + r.stderr).trim().split('\n').slice(-40).join('\n')}`);
    }
  } else return { ok: false, fails: [`unknown phase ${phase} (open|plan|verify)`], warns };
  return { ok: fails.length === 0, fails, warns };
}
function cmdGuard([phase, id]) {
  validId(id);
  const r = guard(phase, id);
  if (r.ok) {
    const s = readState(id); s.phase_passed = { ...(s.phase_passed || {}), [phase]: new Date().toISOString() };
    fs.writeFileSync(statePath(id), JSON.stringify(s, null, 2) + '\n');
  }
  out({ phase, change: id, ...r });
  process.exit(r.ok ? 0 : 1);
}

// ---------------------------------------------------------------- build / install / doctor
const MARK_BEGIN = '<!-- bridge:begin (managed by `bridge install`) -->';
const MARK_END = '<!-- bridge:end -->';
const AGENT_TARGETS = { claude: () => path.join(HOME, '.claude', 'agents'), cursor: () => path.join(HOME, '.cursor', 'agents') };

export function renderAgents(repo = REPO_DIR) {
  const models = JSON.parse(fs.readFileSync(path.join(repo, 'config', 'models.json'), 'utf8')).roles;
  const tdir = path.join(repo, 'agents', 'templates');
  const res = { claude: {}, cursor: {} };
  for (const f of fs.readdirSync(tdir).filter((x) => x.endsWith('.md'))) {
    const src = fs.readFileSync(path.join(tdir, f), 'utf8');
    for (const tool of ['claude', 'cursor']) {
      res[tool][f] = src.replace(/\{\{model:([a-z_]+)\}\}/g, (_, role) => {
        if (!models[role]?.[tool]) die(`config/models.json lacks roles.${role}.${tool} (used by ${f})`);
        return models[role][tool];
      });
    }
  }
  return res;
}
function cmdBuild() {
  const r = renderAgents();
  for (const tool of ['claude', 'cursor']) {
    const d = path.join(REPO_DIR, 'agents', tool);
    fs.mkdirSync(d, { recursive: true });
    for (const [f, txt] of Object.entries(r[tool])) fs.writeFileSync(path.join(d, f), txt);
  }
  out({ built: Object.keys(r.claude) });
}
function link(target, linkPath, force) {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  let st = null; try { st = fs.lstatSync(linkPath); } catch {}
  if (st) {
    if (st.isSymbolicLink() && fs.realpathSync(linkPath) === fs.realpathSync(target)) return 'ok';
    if (!force) die(`${linkPath} exists and is not this bridge; rerun with --force to replace`);
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  fs.symlinkSync(target, linkPath);
  return 'linked';
}
function upsertBlock(file, body) {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const block = `${MARK_BEGIN}\n${body.trim()}\n${MARK_END}`;
  const re = new RegExp(`${MARK_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${MARK_END}`);
  const next = re.test(cur) ? cur.replace(re, block) : (cur.trimEnd() + (cur.trim() ? '\n\n' : '') + block + '\n');
  if (next !== cur) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, next); return 'updated'; }
  return 'ok';
}
function cmdInstall(args) {
  const force = args.includes('--force');
  const noCursorLink = args.includes('--no-cursor-skill-link');
  const report = {};
  cmdBuildQuiet();
  report.skill_claude = link(SKILL_DIR, path.join(HOME, '.claude', 'skills', 'bridge'), force);
  if (!noCursorLink) report.skill_cursor = link(SKILL_DIR, path.join(HOME, '.cursor', 'skills', 'bridge'), force);
  const r = renderAgents();
  for (const tool of ['claude', 'cursor']) {
    const d = AGENT_TARGETS[tool]();
    fs.mkdirSync(d, { recursive: true });
    for (const [f, txt] of Object.entries(r[tool])) fs.writeFileSync(path.join(d, f), txt);
    report[`agents_${tool}`] = `${Object.keys(r[tool]).length} → ${d}`;
  }
  fs.chmodSync(SELF, 0o755);
  report.cli = link(SELF, path.join(HOME, '.local', 'bin', 'bridge'), force);
  const rubric = fs.readFileSync(path.join(REPO_DIR, 'templates', 'rubric.md'), 'utf8');
  report.claude_md = upsertBlock(path.join(HOME, '.claude', 'CLAUDE.md'), rubric);
  out(report);
  out('\nCursor: paste this into Settings → Rules → User Rules (one time):\n\n' + rubric);
}
function cmdBuildQuiet() { const r = renderAgents(); for (const tool of ['claude', 'cursor']) { const d = path.join(REPO_DIR, 'agents', tool); fs.mkdirSync(d, { recursive: true }); for (const [f, t] of Object.entries(r[tool])) fs.writeFileSync(path.join(d, f), t); } }
function cmdDoctor() {
  const checks = [];
  const add = (name, ok, detail = '') => checks.push({ name, ok, detail });
  const [maj, min] = process.versions.node.split('.').map(Number);
  add('node >= 22.12 (OpenSpec 2)', maj > 22 || (maj === 22 && min >= 12), process.versions.node);
  const lock = JSON.parse(fs.readFileSync(path.join(REPO_DIR, 'upstream.lock.json'), 'utf8'));
  const want = lock.upstreams.openspec.version.replace(/^v/, '');
  const v = tryRun('openspec', ['--version']);
  const have = v.error ? null : (v.stdout.match(/\d+\.\d+\.\d+/) || [])[0];
  add(`openspec CLI == ${want}`, have === want, have ? `found ${have}${have !== want ? ` → npm i -g --prefix ~/.local @fission-ai/openspec@${want}` : ''}` : `missing → npm i -g --prefix ~/.local @fission-ai/openspec@${want}`);
  for (const p of [path.join(HOME, '.claude', 'skills', 'bridge'), path.join(HOME, '.cursor', 'skills', 'bridge'), path.join(HOME, '.local', 'bin', 'bridge')]) {
    let ok = false; try { ok = fs.realpathSync(p).startsWith(REPO_DIR); } catch {}
    add(`link ${p.replace(HOME, '~')}`, ok);
  }
  const r = renderAgents();
  for (const tool of ['claude', 'cursor']) {
    const d = AGENT_TARGETS[tool]();
    const stale = Object.entries(r[tool]).filter(([f, t]) => !fs.existsSync(path.join(d, f)) || fs.readFileSync(path.join(d, f), 'utf8') !== t).map(([f]) => f);
    add(`${tool} agents current`, stale.length === 0, stale.length ? `stale/missing: ${stale.join(', ')} → bridge install` : `${Object.keys(r[tool]).length} files`);
  }
  const cm = path.join(HOME, '.claude', 'CLAUDE.md');
  add('~/.claude/CLAUDE.md rubric block', fs.existsSync(cm) && fs.readFileSync(cm, 'utf8').includes(MARK_BEGIN));
  add('Cursor model ids verified', false, 'manual: confirm config/models.json cursor ids exist in Cursor model picker (Cursor may silently substitute)');
  out(checks.map((c) => `${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`).join('\n'));
  process.exit(checks.slice(0, -1).every((c) => c.ok) ? 0 : 1);
}

// ---------------------------------------------------------------- upstream check (monthly sync)
async function gh(pathname) {
  const headers = { 'User-Agent': 'bridge-sync', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let r = await fetch(`https://api.github.com/${pathname}`, { headers });
  if (r.status === 401 && headers.Authorization) {
    // A sandbox may hand out a token the public API rejects; public repos work unauthenticated.
    delete headers.Authorization; delete process.env.GITHUB_TOKEN;
    r = await fetch(`https://api.github.com/${pathname}`, { headers });
  }
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GET ${pathname}: ${r.status}`);
  return r.json();
}
// Local clone of an upstream (cloud routines clone each upstream next to this repo).
function findClone(repoSlug) {
  const base = repoSlug.split('/')[1].toLowerCase();
  const roots = [process.env.BRIDGE_UPSTREAM_DIR, path.resolve(REPO_DIR, '..')].filter(Boolean);
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const hit = fs.readdirSync(root).find((d) => d.toLowerCase() === base);
    if (hit && fs.existsSync(path.join(root, hit, '.git'))) return path.join(root, hit);
  }
  return null;
}
function gitProbe(dir, u) {
  const g = (...a) => { const r = tryRun('git', ['-C', dir, ...a]); return r.status === 0 ? r.stdout.trim() : null; };
  const sha = g('rev-parse', 'HEAD');
  if (u.vendored_from && sha !== u.sha && !g('cat-file', '-e', `${u.sha}^{commit}`)) {
    g('fetch', '--quiet', '--unshallow') ?? g('fetch', '--quiet', 'origin', u.sha);
  }
  g('fetch', '--quiet', '--tags');
  const latest = (g('tag', '--sort=-v:refname') || '').split('\n').find((t) => /^v?\d+\.\d+\.\d+$/.test(t)) || null;
  let files = null;
  if (u.vendored_from && sha !== u.sha) {
    const d = g('diff', '--name-only', u.sha, sha);
    files = d === null ? ['(unknown: pinned commit not available in clone)'] : d.split('\n').filter(Boolean);
  }
  return { sha, latest, files, source: `git:${dir}` };
}
async function apiProbe(u) {
  const rel = await gh(`repos/${u.repo}/releases/latest`);
  const repo = await gh(`repos/${u.repo}`);
  const head = await gh(`repos/${u.repo}/commits/${repo.default_branch}`);
  let files = null;
  if (u.vendored_from && head.sha !== u.sha) {
    const cmp = await gh(`repos/${u.repo}/compare/${u.sha}...${head.sha}`);
    files = (cmp?.files || []).map((f) => f.filename);
  }
  return { sha: head.sha, latest: rel?.tag_name ?? null, files, source: 'api' };
}
async function cmdUpstreamCheck() {
  const lock = JSON.parse(fs.readFileSync(path.join(REPO_DIR, 'upstream.lock.json'), 'utf8'));
  const res = [];
  for (const [name, u] of Object.entries(lock.upstreams)) {
    const clone = findClone(u.repo);
    let p;
    try { p = clone ? gitProbe(clone, u) : await apiProbe(u); }
    catch (e) { die(`${name}: ${e.message}. No local clone found either; clone ${u.repo} next to this repo or set BRIDGE_UPSTREAM_DIR.`); }
    const { sha, latest } = p;
    const versionChanged = Boolean(u.version && latest && latest.replace(/^v/, '') !== u.version.replace(/^v/, ''));
    const vendoredChanged = (p.files || []).filter((f) => f.startsWith('(unknown') || u.vendored_from.some((v) => (v.endsWith('/') ? f.startsWith(v) : f === v)));
    const [lm, lmi] = (u.version || 'v0.0').replace(/^v/, '').split('.').map(Number);
    const [nm, nmi] = (latest || u.version || 'v0.0').replace(/^v/, '').split('.').map(Number);
    res.push({
      name, repo: u.repo, source: p.source, pinned: u.version ?? null, latest, pinned_sha: u.sha, head_sha: sha,
      version_changed: versionChanged,
      severity: u.use?.startsWith('ideas-only') ? (sha !== u.sha ? 'ideas' : 'none')
        : !versionChanged && !vendoredChanged.length ? 'none' : nm > lm ? 'major' : nmi > lmi ? 'minor' : 'patch',
      vendored_files_changed: vendoredChanged,
      ideas_only: u.use?.startsWith('ideas-only') || false,
      moved_since_pin: sha !== u.sha,
    });
  }
  const actionable = res.filter((r) => r.severity !== 'none' && !r.ideas_only);
  const ideas = res.filter((r) => r.severity === "ideas").map((r) => r.name);
  out({ checked: new Date().toISOString().slice(0, 10), actionable: actionable.map((r) => r.name), ideas, upstreams: res });
}

// ---------------------------------------------------------------- main
const HELP = `bridge <command>
  route '<slot-json>'             decide tier (T0..T3 | resume)
  state <id> [--set k=v ...]      read/update .bridge/changes/<id>/state.json
  brief <id> <task-id>            write a task brief for an implementer subagent
  review-pkg <id> <base> [head]   write a diff package for a reviewer subagent
  guard <open|plan|verify> <id>   scripted phase gate (exit 0 = advance)
  tasks <id>                      list tasks with status/size
  upstream-check                  compare upstream.lock.json with GitHub (monthly sync)
  build | install [--force] | doctor`;

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === SELF;
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case 'route': {
      let frame = {};
      const raw = args[0] === '-' || !args.length ? (process.stdin.isTTY ? '{}' : fs.readFileSync(0, 'utf8')) : args[0];
      try { frame = JSON.parse(raw || '{}'); } catch (e) { die(`slot json: ${e.message}`, 2); }
      out(route(frame)); break;
    }
    case 'state': cmdState(args); break;
    case 'brief': cmdBrief(args); break;
    case 'review-pkg': cmdReviewPkg(args); break;
    case 'guard': cmdGuard(args); break;
    case 'tasks': { validId(args[0]); out(loadTasks(args[0]).map(({ id, done, title, size }) => ({ id, done, title, size }))); break; }
    case 'build': cmdBuild(); break;
    case 'install': cmdInstall(args); break;
    case 'doctor': cmdDoctor(); break;
    case 'upstream-check': cmdUpstreamCheck().catch((e) => die(e.message)); break;
    default: out(HELP); process.exit(cmd ? 2 : 0);
  }
}
