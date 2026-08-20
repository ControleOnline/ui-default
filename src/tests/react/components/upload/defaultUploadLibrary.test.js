/**
 * @jest-environment node
 */
const {fetchLibraryFiles} = require('../../../../src/react/components/upload/defaultUploadLibrary');

describe('fetchLibraryFiles (app-community#433)', () => {
  it('sends itemsPerPage so the API does not default to a tiny page', async () => {
    const getItems = jest.fn().mockResolvedValue({
      'hydra:member': [
        {id: 1, fileName: 'a.png'},
        {id: 2, fileName: 'b.png'},
      ],
    });

    const files = await fetchLibraryFiles({
      fileActions: {getItems},
      companyId: 103446,
      fileType: 'image',
      libraryContexts: ['people_media'],
    });

    expect(getItems).toHaveBeenCalled();
    const params = getItems.mock.calls[0][0];
    expect(params.itemsPerPage).toBe(500);
    expect(params.page).toBe(1);
    expect(params.context).toBe('people_media');
    expect(params.people).toBe('/people/103446');
    expect(params.fileType).toBe('image');
    expect(files).toHaveLength(2);
  });

  it('paginates until a short page is returned', async () => {
    const page1 = Array.from({length: 500}, (_, i) => ({id: i + 1, fileName: `f${i}.png`}));
    const page2 = [{id: 501, fileName: 'last.png'}];
    const getItems = jest
      .fn()
      .mockResolvedValueOnce({'hydra:member': page1})
      .mockResolvedValueOnce({'hydra:member': page2});

    const files = await fetchLibraryFiles({
      fileActions: {getItems},
      companyId: 1,
      libraryContexts: ['people_media'],
    });

    expect(getItems).toHaveBeenCalledTimes(2);
    expect(getItems.mock.calls[0][0].itemsPerPage).toBe(500);
    expect(getItems.mock.calls[1][0].page).toBe(2);
    expect(files.length).toBe(501);
  });
});
