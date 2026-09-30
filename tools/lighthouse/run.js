#!/usr/bin/env node
/**
 * Runs Lighthouse against a deployed URL (preview or live) and prints the
 * category scores. Reports are written to /reports (gitignored) as both
 * JSON and HTML.
 *
 * Usage:
 *   node tools/lighthouse/run.js [url] [--mobile|--desktop]
 *
 * Defaults to the project's aem.live URL and mobile form factor.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://main--hp-ai-pcs-eds--harishreddyct.aem.live/';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) || DEFAULT_URL;
const desktop = args.includes('--desktop');

const reportsDir = path.join(__dirname, '..', '..', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
const outPath = path.join(reportsDir, 'lighthouse');

const lighthouseBin = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'lighthouse');

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chromePath = chromeCandidates.find((p) => fs.existsSync(p));

const cliArgs = [
  url,
  '--output=json',
  '--output=html',
  `--output-path=${outPath}`,
  '--chrome-flags=--headless=new --no-sandbox',
  '--only-categories=performance,accessibility,best-practices,seo',
  desktop ? '--preset=desktop' : '',
].filter(Boolean);

console.log(`Running Lighthouse against ${url} (${desktop ? 'desktop' : 'mobile'})…`);

const result = spawnSync(lighthouseBin, cliArgs, {
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) },
});

if (result.status !== 0) {
  console.error('Lighthouse run failed.');
  process.exit(result.status || 1);
}

const jsonPath = `${outPath}.report.json`;
const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const scores = Object.fromEntries(
  Object.entries(report.categories).map(([key, cat]) => [key, Math.round(cat.score * 100)]),
);

console.log('\nScores:');
Object.entries(scores).forEach(([key, score]) => console.log(`  ${key}: ${score}`));
console.log(`\nFull reports: ${outPath}.report.json / ${outPath}.report.html`);
