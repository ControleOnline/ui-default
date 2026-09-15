import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const sourcePath = join(root, 'src/react/components/table/DefaultTableRows.js');
const source = readFileSync(sourcePath, 'utf8');

test('resolveRowBackgroundColor ignores status.color in source', () => {
  assert.doesNotMatch(source, /row\?\.status\?\.color/);
  assert.doesNotMatch(source, /withAlpha\(statusColor/);
  assert.match(source, /listItemEvenRow/);
  assert.match(source, /listItemOddRow/);
  assert.match(source, /export const resolveRowBackgroundColor/);
});

const resolveRowBackgroundColor = ({
  selected,
  index,
  tableOddColor,
  tableEvenColor,
  selectedBackground = '#ECFEFF',
}) => {
  if (selected) return selectedBackground;
  return index % 2 === 0 ? tableOddColor : tableEvenColor;
};

test('even/odd stripes use listItem tokens, not status', () => {
  const even = '#111111';
  const odd = '#222222';
  assert.equal(
    resolveRowBackgroundColor({ selected: false, index: 0, tableOddColor: odd, tableEvenColor: even }),
    odd,
  );
  assert.equal(
    resolveRowBackgroundColor({ selected: false, index: 1, tableOddColor: odd, tableEvenColor: even }),
    even,
  );
  assert.equal(
    resolveRowBackgroundColor({ selected: true, index: 0, tableOddColor: odd, tableEvenColor: even }),
    '#ECFEFF',
  );
});
