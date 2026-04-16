/**
 * fetch-injuries.mjs
 *
 * Scrapes the hockey-reference injury report and writes injuries.json
 * to both public/ (picked up by the Vite build) and the live served
 * directory (../../nhl2026/) for immediate effect without a rebuild.
 *
 * Run manually:  node scripts/fetch-injuries.mjs
 * Cron (2×/day): 0 8,20 * * * /path/to/node /path/to/scripts/fetch-injuries.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function normalize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const URL = 'https://www.hockey-reference.com/friv/injuries.cgi';

console.log(`Fetching ${URL} …`);
const res = await fetch(URL, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}

const html = await res.text();

const players = {};
for (const [, row] of html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)) {
  const cells = {};
  for (const [, stat, val] of row.matchAll(
    /data-stat="([^"]+)"[^>]*>(.*?)<\/(?:td|th)>/gs
  )) {
    cells[stat] = val.replace(/<[^>]+>/g, '').trim();
  }
  if (cells.player && cells.player !== 'Player') {
    players[normalize(cells.player)] = {
      name: cells.player,
      team: cells.team_name   || '',
      type: cells.injury_type || '',
      note: cells.injury_note || '',
      date: cells.date_injury || '',
    };
  }
}

const output = JSON.stringify(
  { updatedAt: new Date().toISOString(), players },
  null,
  2
);

// 1. Write to public/ so Vite build → dist → nhl2026 picks it up
const publicDir = join(__dirname, '../public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'injuries.json'), output);

// 2. Write directly to the served directory for immediate effect
const servedDir = join(__dirname, '../../nhl2026');
try {
  mkdirSync(servedDir, { recursive: true });
  writeFileSync(join(servedDir, 'injuries.json'), output);
} catch (e) {
  console.warn('Could not write to served dir:', e.message);
}

console.log(
  `✓ ${Object.keys(players).length} injuries written at ${new Date().toLocaleTimeString()}`
);
