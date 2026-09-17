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

test('filter button opens DefaultFiltersModal in table and cards modes (#811)', () => {
  assert.match(source, /DefaultFiltersModal/);
  assert.match(source, /hasFilterableColumns \? \(/);
  // must not gate the modal only on cards / must not toggle orphan flag
  assert.doesNotMatch(source, /tableFiltersVisible:\s*!tableFiltersVisible/);
  assert.doesNotMatch(source, /effectiveViewMode === 'cards' \? \([\s\S]*DefaultFiltersModal/);
});
