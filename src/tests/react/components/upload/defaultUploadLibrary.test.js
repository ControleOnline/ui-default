/** @jest-environment node */

/** app-community#433 — library lists all people_media files for the person */
const {
  fetchLibraryFiles,
  filesFromPeopleMediaRelations,
  normalizeSeedLibraryFiles,
} = require('../../../../react/components/upload/defaultUploadLibrary');

describe('filesFromPeopleMediaRelations', () => {
  it('extracts embedded file objects with id', () => {
    const relations = [
      {id: 1, file: {id: 10, fileName: 'a.png', '@id': '/files/10'}},
      {id: 2, file: {id: 20, fileName: 'b.png'}},
      {id: 3, file: null},
      {id: 4},
    ];
    const files = filesFromPeopleMediaRelations(relations);
    expect(files).toHaveLength(2);
    expect(files.map(f => f.id)).toEqual([10, 20]);
  });
});

describe('normalizeSeedLibraryFiles', () => {
  it('accepts people_media rows and plain file objects', () => {
    const files = normalizeSeedLibraryFiles([
      {id: 1, file: {id: 10, fileName: 'a.png'}},
      {id: 20, fileName: 'b.png'},
      '/files/30',
    ]);
    expect(files.map(f => String(f.id)).sort()).toEqual(['10', '20', '30']);
  });
});

describe('fetchLibraryFiles', () => {
  it('returns empty when getItems is missing and no seed', async () => {
    const result = await fetchLibraryFiles({fileActions: {}});
    expect(result).toEqual([]);
  });

  it('returns seed files when getItems is missing', async () => {
    const result = await fetchLibraryFiles({
      fileActions: {},
      additionalLibraryFiles: [
        {id: 1, file: {id: 10, fileName: 'seed.png'}},
        {id: 11, fileName: 'seed2.png'},
      ],
    });
    expect(result.map(f => String(f.id)).sort()).toEqual(['10', '11']);
  });

  it('sends itemsPerPage and merges people_media relations + seed', async () => {
    const getItems = jest.fn().mockResolvedValue({
      member: [{id: 10, fileName: 'from-files.png', context: 'people_media'}],
    });
    const getPeopleMedia = jest.fn().mockResolvedValue([
      {id: 1, file: {id: 10, fileName: 'from-files.png'}},
      {id: 2, file: {id: 11, fileName: 'only-relation.png'}},
    ]);

    const files = await fetchLibraryFiles({
      fileActions: {getItems},
      companyId: 103446,
      fileType: 'image',
      libraryContexts: ['people_media'],
      peopleActions: {getPeopleMedia},
      additionalLibraryFiles: [{id: 3, file: {id: 12, fileName: 'seeded.png'}}],
    });

    expect(getItems).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'people_media',
        people: '/people/103446',
        itemsPerPage: 500,
        page: 1,
      }),
    );
    expect(getPeopleMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        people: '/people/103446',
        itemsPerPage: 100,
      }),
    );
    const ids = files.map(f => String(f.id)).sort();
    expect(ids).toEqual(['10', '11', '12']);
  });

  it('still returns /files results if people_media fetch fails', async () => {
    const getItems = jest.fn().mockResolvedValue({
      member: [{id: 5, fileName: 'ok.png'}],
    });
    const getPeopleMedia = jest.fn().mockRejectedValue(new Error('network'));

    const files = await fetchLibraryFiles({
      fileActions: {getItems},
      companyId: 1,
      libraryContexts: ['people_media'],
      peopleActions: {getPeopleMedia},
    });

    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(5);
  });
});
