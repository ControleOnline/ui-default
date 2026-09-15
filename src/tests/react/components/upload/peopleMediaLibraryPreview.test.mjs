import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const require = createRequire(import.meta.url);
const lib = require(join(root, 'src/react/components/upload/defaultUploadLibrary.js'));

test('people_media path never requires peopleIri to avoid GET /files', async () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/defaultUploadLibrary.js'),
    'utf8',
  );
  assert.match(source, /if \(includesPeopleMedia\)/);
  assert.doesNotMatch(
    source,
    /if \(includesPeopleMedia && peopleIri\)/,
  );
  // Without peopleIri still returns stubs only
  const files = await lib.fetchLibraryFiles({
    fileActions: {
      getItems: async () => {
        throw new Error('should not call getItems');
      },
      get: async () => {
        throw new Error('should not call get');
      },
    },
    companyId: null,
    fileType: 'image',
    libraryContexts: ['people_media'],
    peopleActions: null,
    knownFileIds: [8469],
  });
  assert.equal(files.length, 1);
  assert.equal(files[0].id, 8469);
});

test('inline attachments list can hide star/trash', () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/DefaultUploadAttachmentsList.js'),
    'utf8',
  );
  assert.match(source, /showAttachmentActions/);
});

test('manager shows remove for attached library items', () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/DefaultUploadManagerModal.js'),
    'utf8',
  );
  assert.match(source, /trash-can-outline/);
  assert.match(source, /handleRemove/);
});
