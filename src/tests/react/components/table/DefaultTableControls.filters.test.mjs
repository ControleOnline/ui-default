import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const source = readFileSync(
  join(root, 'src/react/components/table/DefaultTableControls.js'),
  'utf8',
);

test('table mode filter button opens DefaultFiltersModal', () => {
  assert.match(source, /effectiveViewMode === 'table'/);
  assert.match(source, /DefaultFiltersModal/);
  // table mode must not toggle orphan tableFiltersVisible flag only
  assert.doesNotMatch(source, /tableFiltersVisible:\s*!tableFiltersVisible/);
  assert.doesNotMatch(source, /const tableFiltersVisible = Boolean/);
});

test('cards mode filter modal remains', () => {
  assert.match(source, /effectiveViewMode === 'cards'/);
  // two modal usages: table + cards
  const matches = source.match(/<DefaultFiltersModal/g) || [];
  assert.ok(matches.length >= 2, `expected >=2 DefaultFiltersModal, got ${matches.length}`);
});
