import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const styles = fs.readFileSync(
  new URL('../../../react/components/inputs/DefaultFeatherIconPicker.styles.js', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n');

const block = key => {
  const match = new RegExp(`^  ${key}: \\{\\n([\\s\\S]*?)^  \\},`, 'm').exec(styles);
  assert.ok(match, `style ${key} exists`);
  return match[1];
};

// The icon picker follows the app control height of 32px, border included (app-community#1711).
test('the icon picker field, search, close button and option rows are 32px high', () => {
  assert.match(block('field'), /minHeight: 32,/);
  assert.match(block('searchInput'), /minHeight: 32,/);
  assert.match(block('optionRow'), /minHeight: 32,/);
  assert.match(block('closeButton'), /height: 32,/);
  assert.match(block('closeButton'), /width: 32,/);
  for (const key of ['field', 'searchInput', 'optionRow', 'closeButton']) {
    assert.doesNotMatch(block(key), /(?:minHeight|height|width): (?:3[3-9]|4\d),/, key);
  }
});

// 24px glyph + 3px padding + 1px border on each side = 32px.
test('option rows fit the 24px glyph inside 32px', () => {
  assert.match(block('optionGlyph'), /height: 24,/);
  assert.match(block('optionRow'), /paddingVertical: 3,/);
});
