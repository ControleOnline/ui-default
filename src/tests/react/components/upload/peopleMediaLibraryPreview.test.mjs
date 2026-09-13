import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const require = createRequire(import.meta.url);
const lib = require(join(root, 'src/react/components/upload/defaultUploadLibrary.js'));

test('people_media relation files get image metadata for manager thumbs', () => {
  const files = lib.filesFromPeopleMediaRelations([
    { id: 1, file: '/files/8469' },
    { id: 2, file: { id: 9001 } },
  ]);
  assert.equal(files.length, 2);
  assert.equal(files[0].id, 8469);
  assert.equal(files[0].fileType, 'image');
  assert.equal(files[0].context, 'people_media');
});

test('people_media library path does not call GET /files collection', () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/defaultUploadLibrary.js'),
    'utf8',
  );
  assert.match(source, /people_media is company-scoped/);
  assert.match(source, /synthesizeKnownImageFiles/);
});

test('synthesizeKnownImageFiles builds downloadable stubs without GET item', () => {
  const files = lib.synthesizeKnownImageFiles([8469, '/files/9001'], 'image', 'people_media');
  assert.equal(files.length, 2);
  assert.equal(files[0].id, 8469);
  assert.equal(files[0].fileType, 'image');
  assert.equal(files[1].id, 9001);
});
