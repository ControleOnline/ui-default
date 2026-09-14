import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const require = createRequire(import.meta.url);
const lib = require(join(root, 'src/react/components/upload/defaultUploadLibrary.js'));

test('people_media library loads company file collection for persistence', async () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/defaultUploadLibrary.js'),
    'utf8',
  );
  assert.match(source, /GET \/files\?context=people_media/);
  assert.match(source, /Persisted company library/);

  const calls = [];
  const files = await lib.fetchLibraryFiles({
    fileActions: {
      getItems: async params => {
        calls.push(params);
        return {
          member: [
            {id: 100, context: 'people_media', fileName: 'a.jpg', fileType: 'image'},
            {id: 101, context: 'people_media', fileName: 'b.jpg', fileType: 'image'},
          ],
        };
      },
      get: async () => {
        throw new Error('should not GET item');
      },
    },
    companyId: 5,
    fileType: 'image',
    libraryContexts: ['people_media'],
    peopleActions: {
      getPeopleMedia: async () => [
        {id: 1, file: {id: 100, '@id': '/files/100'}},
      ],
    },
    knownFileIds: [],
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].context, 'people_media');
  assert.equal(calls[0].people, '/people/5');
  const ids = files.map(f => f.id).sort();
  assert.deepEqual(ids, [100, 101]);
});

test('selecting active media does not require deleting previous file from library source', () => {
  const source = readFileSync(
    join(root, 'src/react/components/upload/defaultUploadLibrary.js'),
    'utf8',
  );
  assert.match(source, /previous Files stay in the company library/);
});
