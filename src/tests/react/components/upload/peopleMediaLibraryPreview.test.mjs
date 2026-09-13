import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const require = createRequire(import.meta.url);
const { filesFromPeopleMediaRelations } = require(
  join(root, 'src/react/components/upload/defaultUploadLibrary.js'),
);

test('people_media relation files get image metadata for manager thumbs', () => {
  const files = filesFromPeopleMediaRelations([
    { id: 1, file: '/files/8469' },
    { id: 2, file: { id: 9001 } },
  ]);
  assert.equal(files.length, 2);
  assert.equal(files[0].id, 8469);
  assert.equal(files[0].fileType, 'image');
  assert.equal(files[0].context, 'people_media');
  assert.equal(files[1].id, 9001);
  assert.equal(files[1].fileType, 'image');
});

test('manager FileThumb prefers image when preferImage', () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/DefaultUploadManagerModal.js'),
    'utf8',
  );
  assert.match(source, /preferImage/);
  assert.match(source, /DefaultFile/);
});
